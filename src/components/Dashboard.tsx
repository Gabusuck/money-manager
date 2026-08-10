import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { 
  DollarSign, 
  Car, 
  Smile, 
  HelpCircle, 
  AlertTriangle,
  Info,
  Shield,
  PiggyBank,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight
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

  // Gasto total do mês (Fixos + Poupança + Investimento + Plafond Real)
  const totalSpent = spentFixos + savedPoupanca + investedInvestimento + spentPlafondReal;

  // Percentagens das barras em relação ao salário (Fixas/Poup/Inv) ou em relação ao plafond alocado (Plafond Real)
  const pctFixos = budget.salary > 0 ? Math.min((spentFixos / budget.salary) * 100, 100) : 0;
  const pctPoupanca = budget.salary > 0 ? Math.min((savedPoupanca / budget.salary) * 100, 100) : 0;
  const pctInvestimento = budget.salary > 0 ? Math.min((investedInvestimento / budget.salary) * 100, 100) : 0;
  const pctPlafondReal = allocatedPlafondReal > 0 ? Math.min((spentPlafondReal / allocatedPlafondReal) * 100, 100) : 0;

  // Formato Monetário
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Dados para o Gráfico Circular (Donut)
  const donutData = [
    { name: 'Transportes / Gasóleo', value: spentTransportes, color: '#f97316', icon: Car },
    { name: 'Lazer', value: spentLazer, color: '#eab308', icon: Smile },
    { name: 'Outros', value: spentOutros, color: '#64748b', icon: HelpCircle }
  ];

  const totalDonutSpent = spentTransportes + spentLazer + spentOutros;
  const activeDonutData = donutData.filter(item => item.value > 0);

  // Icon mapping para as transações recentes
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transportes': return { icon: Car, color: '#f97316', border: 'border-cat-orange/20', bg: 'bg-cat-orange/10' };
      case 'Lazer': return { icon: Smile, color: '#eab308', border: 'border-cat-yellow/20', bg: 'bg-cat-yellow/10' };
      case 'Fixos': return { icon: Shield, color: '#ef4444', border: 'border-cat-red/20', bg: 'bg-cat-red/10' };
      case 'Poupança': return { icon: PiggyBank, color: '#a855f7', border: 'border-cat-purple/20', bg: 'bg-cat-purple/10' };
      case 'Investimento': return { icon: TrendingUp, color: '#10b981', border: 'border-cat-green/20', bg: 'bg-cat-green/10' };
      default: return { icon: HelpCircle, color: '#64748b', border: 'border-cat-gray/20', bg: 'bg-cat-gray/10' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 space-y-5">
      
      {/* 1. Onboarding inicial caso o salário seja 0 */}
      {budget.salary === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 mt-2 text-center space-y-4 shadow-premium animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-100 text-brand-purple flex items-center justify-center mx-auto shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-brand-dark">Bem-vindo ao GerePoup</h3>
            <p className="text-xs text-gray-400 max-w-[280px] mx-auto leading-relaxed">
              Vamos começar a organizar o teu dinheiro. Introduz o teu salário líquido mensal de referência para ativar o teu painel.
            </p>
          </div>
          <button
            onClick={onEditBudget}
            className="w-full py-3.5 bg-gradient-to-tr from-brand-purple to-brand-purple-dark text-white text-xs font-bold rounded-full shadow-purple-glow hover:scale-[1.02] active:scale-98 transition-transform"
          >
            Definir Salário Inicial
          </button>
        </div>
      ) : (
        <>
          {/* 2. Topo Premium "O Teu Mês num Relance" (Inspirado no ecrã do meio da imagem) */}
          <div className="bg-gradient-to-br from-brand-purple-dark to-brand-purple rounded-[32px] p-5 mt-2 relative overflow-hidden shadow-premium">
            {/* Decorações em degradê de fundo */}
            <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
            
            <div className="relative space-y-4">
              {/* Título e Ação de Editar */}
              <div className="flex justify-between items-center text-white/90">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">Saldo Disponível</span>
                <button 
                  onClick={onEditBudget}
                  className="text-[10px] font-semibold bg-white/15 border border-white/20 hover:bg-white/25 px-3 py-1 rounded-full transition-custom"
                >
                  Alterar Salário
                </button>
              </div>

              {/* Saldo Principal */}
              <p className="text-3xl font-black text-white tracking-tight">
                {formatEuro(remainingPlafondReal)}
              </p>

              {/* Cartão de Overlay Branco (Conforme ecrã do meio da imagem) */}
              <div className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center text-brand-dark">
                {/* Salário Líquido (Start Income) */}
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Salário (In)</span>
                  <div className="flex items-center gap-1 text-xs font-extrabold text-cat-green">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatEuro(budget.salary)}</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-100" />

                {/* Despesas Totais (Your Expenses) */}
                <div className="space-y-0.5 text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Despesas Totais</span>
                  <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-cat-red">
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                    <span>-{formatEuro(totalSpent)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Barras de Progresso Horizontais em Cartão Flutuante */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-premium">
            <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Distribuição Mensal</h3>
            
            <div className="space-y-4">
              {/* Barra 1: Fixos */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Despesas Fixas</span>
                  <span className="text-brand-dark">{formatEuro(spentFixos)} / {formatEuro(budget.salary)} ({pctFixos.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className="h-full bg-cat-red rounded-full transition-all duration-500" 
                    style={{ width: `${pctFixos}%` }} 
                  />
                </div>
              </div>

              {/* Barra 2: Poupança */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Poupança (TV/Câmara)</span>
                  <span className="text-brand-dark">{formatEuro(savedPoupanca)} / {formatEuro(budget.salary)} ({pctPoupanca.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className="h-full bg-cat-purple rounded-full transition-all duration-500" 
                    style={{ width: `${pctPoupanca}%` }} 
                  />
                </div>
              </div>

              {/* Barra 3: Investimento */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Investimento (Trading 212)</span>
                  <span className="text-brand-dark">{formatEuro(investedInvestimento)} / {formatEuro(budget.salary)} ({pctInvestimento.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className="h-full bg-cat-green rounded-full transition-all duration-500" 
                    style={{ width: `${pctInvestimento}%` }} 
                  />
                </div>
              </div>

              {/* Barra 4: Plafond Real */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Plafond Real (Gasto Variável)</span>
                  <span className={`font-semibold ${remainingPlafondReal < 0 ? 'text-cat-red' : 'text-brand-dark'}`}>
                    {formatEuro(spentPlafondReal)} / {formatEuro(allocatedPlafondReal)} ({pctPlafondReal.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${remainingPlafondReal < 0 ? 'bg-cat-red' : 'bg-brand-purple'}`} 
                    style={{ width: `${pctPlafondReal}%` }} 
                  />
                </div>
              </div>
            </div>

            {remainingPlafondReal < 0 && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50/50 border border-red-100 rounded-2xl text-xxs text-cat-red font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Excedeste o Plafond Real planeado!</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 4. Secção Gráfico Circular "Divisão do Plafond" */}
      {budget.salary > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-premium">
          <div>
            <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Divisão do Plafond</h3>
            <p className="text-xxs text-slate-400 mt-0.5">Foco apenas em despesas variáveis</p>
          </div>

          {/* Gráfico Donut */}
          <div className="relative h-44 flex items-center justify-center">
            {activeDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatEuro(Number(value)), 'Gasto']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', padding: '6px 10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2">
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xxs text-slate-400 max-w-[200px]">Sem despesas do Plafond este mês.</p>
              </div>
            )}

            {activeDonutData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Total Gasto</span>
                <span className="text-base font-black text-brand-dark">{formatEuro(totalDonutSpent)}</span>
              </div>
            )}
          </div>

          {/* Legenda Detalhada */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-50">
            {donutData.map((item, idx) => {
              const IconComponent = item.icon;
              const percentage = totalDonutSpent > 0 ? (item.value / totalDonutSpent) * 100 : 0;
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-custom"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center border"
                      style={{ borderColor: `${item.color}22`, backgroundColor: `${item.color}08` }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-dark">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{percentage.toFixed(0)}% do Plafond</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-brand-dark">{formatEuro(item.value)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Acesso rápido às transações recentes (Cartões Flutuantes como na imagem) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Últimos Movimentos</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Histórico Recente</span>
        </div>

        <div className="space-y-2.5">
          {currentMonthTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-premium">
              <p className="text-xxs text-slate-400">Nenhuma transação registada.</p>
            </div>
          ) : (
            currentMonthTransactions.slice(0, 3).map((tx) => {
              const catDetails = getCategoryIcon(tx.category);
              const Icon = catDetails.icon;

              return (
                <div 
                  key={tx.id} 
                  className="bg-white rounded-[24px] border border-slate-100 p-3.5 shadow-premium flex items-center justify-between transition-custom hover:translate-y-[-2px] relative overflow-hidden"
                >
                  {/* Barra Vertical de Categoria à esquerda */}
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 rounded-r-lg" 
                    style={{ backgroundColor: catDetails.color }}
                  />

                  <div className="flex items-center gap-3 pl-1.5">
                    {/* Círculo com Ícone */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${catDetails.border} ${catDetails.bg} shadow-sm shrink-0`}>
                      <Icon className="w-4 h-4" style={{ color: catDetails.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-dark leading-tight">{tx.description}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{tx.category} • {tx.date}</p>
                    </div>
                  </div>
                  
                  <div className="text-right pr-1">
                    <span className="text-xs font-black text-cat-red">
                      -{formatEuro(tx.amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
