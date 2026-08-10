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
import { MOCK_HISTORY } from '../mockData';

export const Evolution: React.FC = () => {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Calcular estatísticas com base no mock de histórico
  const latestMonth = MOCK_HISTORY[MOCK_HISTORY.length - 1];
  const firstMonth = MOCK_HISTORY[0];
  const totalGrowth = latestMonth.poupancaAcumulada - firstMonth.poupancaAcumulada;

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-6">
      
      {/* Resumo de Evolução */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 mt-2 space-y-4 shadow-xs">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Evolução do Património</h3>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-2xl font-bold text-brand-dark">
              {formatEuro(latestMonth.poupancaAcumulada)}
            </p>
            <p className="text-xxs text-gray-400 mt-0.5">Total Poupado & Investido</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xxs font-bold text-cat-green bg-cat-green/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> +{formatEuro(totalGrowth)}
            </span>
            <p className="text-[9px] text-gray-400 mt-1">nos últimos 6 meses</p>
          </div>
        </div>

        {/* Gráfico de Área: Poupança Acumulada */}
        <div className="h-44 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_HISTORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAcumulada" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748B' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748B' }}
              />
              <Tooltip 
                formatter={(value: any) => [formatEuro(Number(value)), 'Património']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '6px 10px' }}
              />
              <Area 
                type="monotone" 
                dataKey="poupancaAcumulada" 
                stroke="#a855f7" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorAcumulada)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Comparativo Mensal */}
      <div className="bg-white rounded-2xl border border-brand-border p-5 space-y-4 shadow-xs">
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Despesas vs Poupanças</h3>
          <p className="text-xxs text-gray-400 mt-0.5">Distribuição mensal dos teus recursos</p>
        </div>

        {/* Gráfico de Barras */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_HISTORY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748B' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748B' }}
              />
              <Tooltip 
                formatter={(value: any) => [formatEuro(Number(value))]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '6px 10px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, paddingTop: 10 }}
              />
              <Bar dataKey="fixos" name="Fixos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="plafond" name="Plafond" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="poupanca" name="Poupança/Inv" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dicas Financeiras Minimalistas */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-brand-dark" /> Observações do Mês
        </h4>
        <ul className="text-xxs text-gray-500 space-y-2 list-disc pl-4">
          <li>As tuas despesas fixas mantiveram-se estáveis nos 400€. Bom trabalho a negociar as faturas.</li>
          <li>A tua taxa de poupança atual é de **28%**, o que está acima da recomendação tradicional de 20%.</li>
          <li>Se mantiveres o ritmo atual do Plafond Real, vais completar a meta da "Smart TV" no próximo mês!</li>
        </ul>
      </div>

    </div>
  );
};
