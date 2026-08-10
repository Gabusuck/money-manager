import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { TrendingUp, BarChart2, AlertTriangle } from 'lucide-react';
import type { Transaction, BudgetAllocation, Bank } from '../types';

interface EvolutionProps {
  transactions: Transaction[];
  budget: BudgetAllocation;
  onEditBudget: () => void;
  banks: Bank[];
}

export const Evolution: React.FC<EvolutionProps> = ({ 
  transactions, 
  budget, 
  onEditBudget,
  banks
}) => {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // 1. Filtrar transações para o mês corrente para a Distribuição Mensal
  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const now = new Date();
    return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
  });

  const getSumByCategoryAndType = (category: string, type: 'expense' | 'transfer' | 'income') => {
    return currentMonthTransactions
      .filter(tx => tx.category === category && tx.type === type)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const spentFixos = getSumByCategoryAndType('Fixos', 'expense');
  const savedPoupanca = getSumByCategoryAndType('Poupança', 'transfer');
  const investedInvestimento = getSumByCategoryAndType('Investimento', 'transfer');
  const spentTransportes = getSumByCategoryAndType('Transportes', 'expense');
  const spentLazer = getSumByCategoryAndType('Lazer', 'expense');
  const spentOutrosExpense = getSumByCategoryAndType('Outros', 'expense');
  
  const spentPlafondReal = spentTransportes + spentLazer + spentOutrosExpense;

  const totalIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const effectiveSalary = budget.salary + totalIncome;
  const allocatedPlafondReal = Math.max(0, effectiveSalary - spentFixos - savedPoupanca - investedInvestimento);
  const remainingPlafondReal = allocatedPlafondReal - spentPlafondReal;

  const pctFixos = effectiveSalary > 0 ? Math.min((spentFixos / effectiveSalary) * 100, 100) : 0;
  const pctPoupanca = effectiveSalary > 0 ? Math.min((savedPoupanca / effectiveSalary) * 100, 100) : 0;
  const pctInvestimento = effectiveSalary > 0 ? Math.min((investedInvestimento / effectiveSalary) * 100, 100) : 0;
  const pctPlafondReal = allocatedPlafondReal > 0 ? Math.min((spentPlafondReal / allocatedPlafondReal) * 100, 100) : 0;

  // 2. Gerar os últimos 6 meses de forma dinâmica para os gráficos
  const getLast6Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        name: monthNames[d.getMonth()]
      });
    }
    return months;
  };

  const last6Months = getLast6Months();

  const getSavingsBefore = (limitDate: Date) => {
    return transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return (tx.category === 'Poupança' || tx.category === 'Investimento') && txDate < limitDate;
      })
      .reduce((sum, tx) => {
        return tx.type === 'expense' ? sum - tx.amount : sum + tx.amount;
      }, 0);
  };

  const firstMonthDate = new Date(last6Months[0].year, last6Months[0].monthIndex, 1);
  let accumulatedSavings = getSavingsBefore(firstMonthDate);

  const historyData = last6Months.map(m => {
    const txsInMonth = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === m.year && txDate.getMonth() === m.monthIndex;
    });

    const fixos = txsInMonth.filter(tx => tx.category === 'Fixos').reduce((sum, tx) => sum + tx.amount, 0);
    const plafond = txsInMonth.filter(tx => ['Transportes', 'Lazer', 'Outros'].includes(tx.category)).reduce((sum, tx) => sum + tx.amount, 0);
    const poupanca = txsInMonth
      .filter(tx => ['Poupança', 'Investimento'].includes(tx.category))
      .reduce((sum, tx) => {
        return tx.type === 'expense' ? sum - tx.amount : sum + tx.amount;
      }, 0);
    
    accumulatedSavings += poupanca;

    return {
      name: m.name,
      fixos,
      plafond,
      poupanca,
      poupancaAcumulada: accumulatedSavings
    };
  });

  const latestMonth = historyData[historyData.length - 1];
  const firstMonth = historyData[0];
  const totalGrowth = latestMonth.poupancaAcumulada - firstMonth.poupancaAcumulada;

  // Encontrar bancos de investimento
  const investmentBanks = banks.filter(bank => {
    const nameLower = bank.name.toLowerCase();
    return nameLower.includes('trading') || nameLower.includes('invest') || nameLower.includes('ações') || nameLower.includes('acoes') || nameLower.includes('bolsa');
  });

  const getDailyBalanceHistory = (bankId: string) => {
    const dataPoints = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Calcular o saldo acumulado até esta data
      const balance = transactions.reduce((sum, tx) => {
        if (tx.date <= dateStr) {
          if (tx.type === 'income' && tx.bankId === bankId) return sum + tx.amount;
          if ((tx.type === 'expense' || tx.type === 'transfer') && tx.bankId === bankId) return sum - tx.amount;
          if (tx.fromBankId === bankId) return sum - tx.amount;
          if (tx.toBankId === bankId) return sum + tx.amount;
        }
        return sum;
      }, 0);
      
      // Formatar label do dia (Ex: "10 Ago")
      const label = d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }).replace('.', '');
      dataPoints.push({ date: label, Saldo: balance });
    }
    return dataPoints;
  };

  const hasData = transactions.length > 0;

  if (!hasData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 shadow-premium">
          <TrendingUp className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-brand-dark">Sem Histórico de Evolução</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Regista transações no teu extrato ou define o teu salário para veres a distribuição de orçamento e evolução patrimonial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 space-y-6">
      
      {/* 3. Barras de Progresso Horizontais da Distribuição Mensal (Movidas para aqui!) */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 mt-2 space-y-4 shadow-premium">
        <div className="flex justify-between items-center">
          <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Distribuição Mensal</h3>
          <button
            onClick={onEditBudget}
            className="text-[9px] font-bold text-brand-purple hover:underline uppercase tracking-wider transition-custom"
          >
            Salário Base: {budget.salary}€
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Barra 1: Fixos */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Despesas Fixas</span>
              <span className="text-brand-dark">{formatEuro(spentFixos)} / {formatEuro(effectiveSalary)} ({pctFixos.toFixed(0)}%)</span>
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
              <span className="text-brand-dark">{formatEuro(savedPoupanca)} / {formatEuro(effectiveSalary)} ({pctPoupanca.toFixed(0)}%)</span>
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
              <span className="text-brand-dark">{formatEuro(investedInvestimento)} / {formatEuro(effectiveSalary)} ({pctInvestimento.toFixed(0)}%)</span>
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
      
      {/* Resumo de Evolução em Cartão Premium */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-premium">
        <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Evolução do Património</h3>
        
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-black text-brand-dark">
              {formatEuro(latestMonth.poupancaAcumulada)}
            </p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Total Poupado & Investido</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-cat-green bg-cat-green/10 border border-cat-green/10 px-3 py-1 rounded-full shadow-sm">
              <TrendingUp className="w-3 h-3" /> +{formatEuro(totalGrowth)}
            </span>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">últimos 6 meses</p>
          </div>
        </div>

        {/* Gráfico de Área: Poupança Acumulada */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAcumulada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
              />
              <Tooltip 
                formatter={(value: any) => [formatEuro(Number(value)), 'Património']}
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', padding: '6px 10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="poupancaAcumulada" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAcumulada)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráficos de Evolução por Carteiras de Investimento */}
      {investmentBanks.map(bank => {
        const dailyHistory = getDailyBalanceHistory(bank.id);
        const currentBalance = dailyHistory[dailyHistory.length - 1].Saldo;
        const startBalance = dailyHistory[0].Saldo;
        const diff = currentBalance - startBalance;
        
        return (
          <div key={bank.id} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-premium animate-in fade-in duration-300">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Evolução: {bank.name}</h3>
                <p className="text-2xl font-black text-brand-dark mt-1">
                  {formatEuro(currentBalance)}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full shadow-sm ${
                  diff >= 0 ? 'text-cat-green bg-cat-green/10 border border-cat-green/10' : 'text-cat-red bg-cat-red/10 border border-cat-red/10'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${diff < 0 ? 'rotate-180' : ''}`} /> {diff >= 0 ? '+' : ''}{formatEuro(diff)}
                </span>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">últimos 30 dias</p>
              </div>
            </div>

            {/* Gráfico de Linha do Portefólio */}
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`colorBank-${bank.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={diff >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.18}/>
                      <stop offset="95%" stopColor={diff >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 8, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 8, fill: '#94A3B8', fontWeight: 600 }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatEuro(Number(value)), 'Saldo']}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', padding: '6px 10px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Saldo" 
                    stroke={diff >= 0 ? "#10b981" : "#ef4444"} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill={`url(#colorBank-${bank.id})`} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}

      {/* Gráfico Comparativo Mensal */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-premium">
        <div>
          <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Despesas vs Poupanças</h3>
          <p className="text-xxs text-slate-400 mt-0.5">Distribuição mensal dos teus recursos</p>
        </div>

        {/* Gráfico de Barras */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94A3B8', fontWeight: 600 }}
              />
              <Tooltip 
                formatter={(value: any) => [formatEuro(Number(value))]}
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', padding: '6px 10px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 9, fontWeight: 700, paddingTop: 10, color: '#64748B' }}
              />
              <Bar dataKey="fixos" name="Fixos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="plafond" name="Plafond" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="poupanca" name="Poupança/Inv" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dicas Financeiras Premium */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-premium space-y-3.5">
        <h4 className="text-xs font-black text-brand-dark flex items-center gap-1.5">
          <BarChart2 className="w-4.5 h-4.5 text-brand-purple" /> Observações do Mês
        </h4>
        <ul className="text-xxs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
          <li>As dicas e observações serão atualizadas à medida que registares dados de despesas e poupanças.</li>
          <li>Podes alterar o teu salário líquido de referência a qualquer momento tocando em "Salário Base" no topo da área de Evolução.</li>
        </ul>
      </div>

    </div>
  );
};
