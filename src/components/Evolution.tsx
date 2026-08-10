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
import { TrendingUp, BarChart2 } from 'lucide-react';
import type { Transaction } from '../types';

interface EvolutionProps {
  transactions: Transaction[];
}

export const Evolution: React.FC<EvolutionProps> = ({ transactions }) => {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Gerar os últimos 6 meses de forma dinâmica
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

  // Calcular o histórico acumulado antes do período exibido
  const getSavingsBefore = (limitDate: Date) => {
    return transactions
      .filter(tx => {
        const txDate = new Date(tx.date);
        return (tx.category === 'Poupança' || tx.category === 'Investimento') && txDate < limitDate;
      })
      .reduce((sum, tx) => sum + tx.amount, 0);
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
    const poupanca = txsInMonth.filter(tx => ['Poupança', 'Investimento'].includes(tx.category)).reduce((sum, tx) => sum + tx.amount, 0);
    
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
            Regista transações no teu extrato ou reforça as tuas metas para começar a ver gráficos de evolução patrimonial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 space-y-6">
      
      {/* Resumo de Evolução em Cartão Premium */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 mt-2 space-y-4 shadow-premium">
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
          <li>Podes alterar o teu salário líquido de referência a qualquer momento tocando em "Alterar Salário" no topo do ecrã de início.</li>
        </ul>
      </div>

    </div>
  );
};
