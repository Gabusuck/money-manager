import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { 
  DollarSign, 
  Car, 
  Smile, 
  HelpCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';
import type { Transaction, BudgetAllocation } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  budget: BudgetAllocation;
  onEditBudget: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  budget, 
  onEditBudget 
}) => {
  // Filtrar transações do mês atual (ou simplesmente todas as transações de teste no mock)
  const currentMonthTransactions = transactions; 

  // Soma de gastos por categoria
  const getSumByCategory = (category: string) => {
    return currentMonthTransactions
      .filter(tx => tx.category === category && tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const spentFixos = getSumByCategory('Fixos');
  const savedPoupanca = getSumByCategory('Poupança');
  const investedInvestimento = getSumByCategory('Investimento');
  
  // Plafond Real (gastos variáveis)
  const spentTransportes = getSumByCategory('Transportes');
  const spentLazer = getSumByCategory('Lazer');
  const spentOutros = getSumByCategory('Outros');
  
  const spentPlafondReal = spentTransportes + spentLazer + spentOutros;
  
  // Plafond Real Alocado é o salário menos o que foi para Fixos, Poupança e Investimento
  const allocatedPlafondReal = Math.max(0, budget.salary - spentFixos - savedPoupanca - investedInvestimento);
  const remainingPlafondReal = allocatedPlafondReal - spentPlafondReal;

  // Percentagens das barras em relação ao salário (Fixas/Poup/Inv) ou em relação ao plafond alocado (Plafond Real)
  const pctFixos = budget.salary > 0 ? Math.min((spentFixos / budget.salary) * 100, 100) : 0;
  const pctPoupanca = budget.salary > 0 ? Math.min((savedPoupanca / budget.salary) * 100, 100) : 0;
  const pctInvestimento = budget.salary > 0 ? Math.min((investedInvestimento / budget.salary) * 100, 100) : 0;
  const pctPlafondReal = allocatedPlafondReal > 0 ? Math.min((spentPlafondReal / allocatedPlafondReal) * 100, 100) : 0;

  // Formato Monetário
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Dados para o Gráfico Circular (Donut) - APENAS categorias do Plafond Real (Transportes, Lazer, Outros)
  const donutData = [
    { name: 'Transportes / Gasóleo', value: spentTransportes, color: '#f97316', icon: Car },
    { name: 'Lazer', value: spentLazer, color: '#eab308', icon: Smile },
    { name: 'Outros', value: spentOutros, color: '#64748b', icon: HelpCircle }
  ];

  const totalDonutSpent = spentTransportes + spentLazer + spentOutros;

  // Filtrar dados para não enviar valores zerados para o gráfico (evita crashes do Recharts)
  const activeDonutData = donutData.filter(item => item.value > 0);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-6">
      
      {/* Secção "O Teu Mês num Relance" ou Banner de Boas-vindas */}
      {budget.salary === 0 ? (
        <div className="bg-white rounded-2xl border border-brand-border p-6 mt-2 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-brand-gray border border-brand-border text-brand-dark flex items-center justify-center mx-auto">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">Bem-vindo ao GerePoup</h3>
            <p className="text-xxs text-gray-400 max-w-[280px] mx-auto leading-relaxed">
              Para começar a gerir as tuas finanças, introduz o teu salário líquido de referência.
            </p>
          </div>
          <button
            onClick={onEditBudget}
            className="w-full py-3 bg-brand-dark text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-custom"
          >
            Definir Salário Inicial
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-brand-border p-5 mt-2 space-y-6 shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">O Teu Mês num Relance</h2>
              <p className="text-2xl font-bold mt-1 text-brand-dark">
                {formatEuro(remainingPlafondReal)}
                <span className="text-xs font-normal text-gray-500 block mt-0.5">
                  restantes no Plafond Real
                </span>
              </p>
            </div>
            
            <button 
              onClick={onEditBudget}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-dark bg-brand-gray rounded-full border border-brand-border hover:bg-gray-100 transition-custom"
            >
              <DollarSign className="w-3 h-3 text-brand-dark" />
              Salário: {budget.salary}€
            </button>
          </div>

          {/* 4 Barras de Progresso Horizontais */}
          <div className="space-y-4 pt-2">
            
            {/* Barra 1: Fixos */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Despesas Fixas</span>
                <span className="text-brand-dark">{formatEuro(spentFixos)} / {formatEuro(budget.salary)} ({pctFixos.toFixed(0)}%)</span>
              </div>
              <div className="h-2 w-full bg-brand-gray rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cat-red rounded-full transition-all duration-500" 
                  style={{ width: `${pctFixos}%` }} 
                />
              </div>
            </div>

            {/* Barra 2: Poupança */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Poupança (TV/Câmara)</span>
                <span className="text-brand-dark">{formatEuro(savedPoupanca)} / {formatEuro(budget.salary)} ({pctPoupanca.toFixed(0)}%)</span>
              </div>
              <div className="h-2 w-full bg-brand-gray rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cat-purple rounded-full transition-all duration-500" 
                  style={{ width: `${pctPoupanca}%` }} 
                />
              </div>
            </div>

            {/* Barra 3: Investimento */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Investimento (Trading 212)</span>
                <span className="text-brand-dark">{formatEuro(investedInvestimento)} / {formatEuro(budget.salary)} ({pctInvestimento.toFixed(0)}%)</span>
              </div>
              <div className="h-2 w-full bg-brand-gray rounded-full overflow-hidden">
                <div 
                  className="h-full bg-cat-green rounded-full transition-all duration-500" 
                  style={{ width: `${pctInvestimento}%` }} 
                />
              </div>
            </div>

            {/* Barra 4: Plafond Real */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-gray-500">Plafond Real (Gasto Variável)</span>
                <span className={`font-semibold ${remainingPlafondReal < 0 ? 'text-cat-red' : 'text-brand-dark'}`}>
                  {formatEuro(spentPlafondReal)} / {formatEuro(allocatedPlafondReal)} ({pctPlafondReal.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-brand-gray rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${remainingPlafondReal < 0 ? 'bg-cat-red' : 'bg-brand-orange'}`} 
                  style={{ width: `${pctPlafondReal}%` }} 
                />
              </div>
            </div>

          </div>

          {remainingPlafondReal < 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-cat-red font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Excedeste o teu Plafond Real planeado para este mês!</span>
            </div>
          )}
        </div>
      )}

      {/* Secção Gráfico Circular "Divisão do Plafond" */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-xs">
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Divisão do Plafond Real</h2>
          <p className="text-sm font-medium text-gray-500 mt-0.5">Analisa onde estás a gastar o teu dinheiro diário</p>
        </div>

        {/* Gráfico Donut */}
        <div className="relative h-48 flex items-center justify-center">
          {activeDonutData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [formatEuro(Number(value)), 'Gasto']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '6px 10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-brand-gray border border-brand-border flex items-center justify-center mb-2">
                <Info className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 max-w-[200px]">Sem despesas registadas no Plafond Real este mês.</p>
            </div>
          )}

          {activeDonutData.length > 0 && (
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xxs font-semibold uppercase tracking-wider text-gray-400">Total Gasto</span>
              <span className="text-lg font-bold text-brand-dark">{formatEuro(totalDonutSpent)}</span>
            </div>
          )}
        </div>

        {/* Legenda Detalhada */}
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-brand-border">
          {donutData.map((item, idx) => {
            const IconComponent = item.icon;
            const percentage = totalDonutSpent > 0 ? (item.value / totalDonutSpent) * 100 : 0;
            return (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-brand-gray/50 transition-custom"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center border"
                    style={{ borderColor: `${item.color}22`, backgroundColor: `${item.color}08` }}
                  >
                    <IconComponent className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-dark">{item.name}</p>
                    <p className="text-xxs text-gray-400">{percentage.toFixed(1)}% do Plafond</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-brand-dark">{formatEuro(item.value)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acesso rápido às transações recentes */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Últimos Movimentos</h2>
          </div>
          <span className="text-xxs text-gray-400">Atualizado offline</span>
        </div>

        <div className="space-y-3">
          {currentMonthTransactions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">Nenhuma transação registada.</p>
          ) : (
            currentMonthTransactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center py-1">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full bg-cat-${
                    tx.category === 'Transportes' ? 'orange' :
                    tx.category === 'Lazer' ? 'yellow' :
                    tx.category === 'Poupança' ? 'purple' :
                    tx.category === 'Investimento' ? 'green' :
                    tx.category === 'Fixos' ? 'red' : 'gray'
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-brand-dark">{tx.description}</p>
                    <p className="text-xxs text-gray-400">{tx.category} • {tx.date}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-brand-dark">
                  -{formatEuro(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
