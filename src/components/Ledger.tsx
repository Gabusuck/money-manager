import React, { useState } from 'react';
import { Search, Trash2, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp } from 'lucide-react';
import type { Transaction, TransactionCategory } from '../types';

interface LedgerProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

export const Ledger: React.FC<LedgerProps> = ({ transactions, onDeleteTransaction }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'Todas'>('Todas');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | 'Todas'>('Todas');

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Gerar os últimos 7 dias para o seletor de datas horizontal (Estilo iOS da Imagem)
  const getLast7Days = () => {
    const days = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateString: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()]
      });
    }
    return days;
  };

  const calendarDays = getLast7Days();

  // Filtrar transações por pesquisa, categoria e seletor de data
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || tx.category === selectedCategory;
    const matchesDate = selectedDateFilter === 'Todas' || tx.date === selectedDateFilter;
    return matchesSearch && matchesCategory && matchesDate;
  });

  // Agrupar transações por Data
  const groupedTransactions = filteredTransactions.reduce<Record<string, Transaction[]>>((groups, tx) => {
    const dateStr = tx.date;
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(tx);
    return groups;
  }, {});

  // Ordenar as datas de forma decrescente
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const formatDateTitle = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateString === today) return 'Hoje';
    if (dateString === yesterday) return 'Ontem';

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-PT', options);
  };

  const getCategoryDetails = (cat: TransactionCategory) => {
    switch (cat) {
      case 'Transportes': return { color: '#f97316', border: 'border-cat-orange/20', bg: 'bg-cat-orange/10', icon: Car };
      case 'Lazer': return { color: '#eab308', border: 'border-cat-yellow/20', bg: 'bg-cat-yellow/10', icon: Smile };
      case 'Fixos': return { color: '#ef4444', border: 'border-cat-red/20', bg: 'bg-cat-red/10', icon: Shield };
      case 'Poupança': return { color: '#a855f7', border: 'border-cat-purple/20', bg: 'bg-cat-purple/10', icon: PiggyBank };
      case 'Investimento': return { color: '#10b981', border: 'border-cat-green/20', bg: 'bg-cat-green/10', icon: TrendingUp };
      default: return { color: '#64748b', border: 'border-cat-gray/20', bg: 'bg-cat-gray/10', icon: HelpCircle };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 space-y-5">
      
      {/* Barra de Pesquisa e Filtros de Categoria */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 mt-2 space-y-3.5 shadow-premium">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar movimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark placeholder-slate-300 shadow-inner-soft"
          />
        </div>

        {/* Categorias Pills horizontais */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {['Todas', 'Transportes', 'Lazer', 'Outros', 'Fixos', 'Poupança', 'Investimento'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-3.5 py-1.5 text-[10px] font-bold rounded-full border transition-custom whitespace-nowrap ${
                  isSelected
                    ? 'bg-brand-purple border-brand-purple text-white shadow-purple-glow'
                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seletor de Datas Horizontal (Estilo iOS da Imagem) */}
      <div className="space-y-2">
        <h4 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Selecione o Dia</h4>
        
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
          {/* Card 'Todos' */}
          <button
            onClick={() => setSelectedDateFilter('Todas')}
            className={`flex flex-col items-center justify-center px-4.5 py-3 rounded-2xl border min-w-14 h-16 transition-custom shadow-premium cursor-pointer ${
              selectedDateFilter === 'Todas'
                ? 'bg-brand-purple border-brand-purple text-white shadow-purple-glow'
                : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider">Todos</span>
          </button>

          {/* Cards dos Dias */}
          {calendarDays.map((day) => {
            const isSelected = selectedDateFilter === day.dateString;
            return (
              <button
                key={day.dateString}
                onClick={() => setSelectedDateFilter(day.dateString)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border w-14 h-16 transition-custom shadow-premium cursor-pointer ${
                  isSelected
                    ? 'bg-brand-purple border-brand-purple text-white shadow-purple-glow'
                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <span className="text-base font-black leading-none">{day.dayNum}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-80">{day.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Transações Agrupadas */}
      <div className="space-y-5">
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-premium">
            <p className="text-xxs text-slate-400">Nenhum movimento encontrado.</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-2.5">
              {/* Título do Grupo de Data */}
              <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">
                {formatDateTitle(dateStr)}
              </h3>

              {/* Lista do Dia em Cartões Flutuantes Individuais */}
              <div className="space-y-2.5">
                {groupedTransactions[dateStr].map((tx) => {
                  const catDetails = getCategoryDetails(tx.category);
                  const Icon = catDetails.icon;

                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-[24px] border border-slate-100 p-3.5 shadow-premium flex items-center justify-between transition-custom hover:translate-y-[-2px] relative overflow-hidden group"
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
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pr-1">
                        <span className="text-xs font-black text-brand-dark">
                          -{formatEuro(tx.amount)}
                        </span>
                        
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="w-8 h-8 rounded-full bg-red-50 text-cat-red opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-custom"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
