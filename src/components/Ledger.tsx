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

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Filtrar transações por pesquisa e categoria
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || tx.category === selectedCategory;
    return matchesSearch && matchesCategory;
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

  // Função para formatar o título da data de forma nativa
  const formatDateTitle = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateString === today) return 'Hoje';
    if (dateString === yesterday) return 'Ontem';

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-PT', options);
  };

  // Categoria badge details
  const getCategoryDetails = (cat: TransactionCategory) => {
    switch (cat) {
      case 'Transportes':
        return { color: 'text-cat-orange', bg: 'bg-cat-orange/10', icon: Car };
      case 'Lazer':
        return { color: 'text-cat-yellow', bg: 'bg-cat-yellow/10', icon: Smile };
      case 'Outros':
        return { color: 'text-cat-gray', bg: 'bg-cat-gray/10', icon: HelpCircle };
      case 'Fixos':
        return { color: 'text-cat-red', bg: 'bg-cat-red/10', icon: Shield };
      case 'Poupança':
        return { color: 'text-cat-purple', bg: 'bg-cat-purple/10', icon: PiggyBank };
      case 'Investimento':
        return { color: 'text-cat-green', bg: 'bg-cat-green/10', icon: TrendingUp };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-24 space-y-4">
      {/* Topo com barra de pesquisa e filtros */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 mt-2 space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar movimentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark placeholder-gray-400"
          />
        </div>

        {/* Filtros de Categoria */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {['Todas', 'Transportes', 'Lazer', 'Outros', 'Fixos', 'Poupança', 'Investimento'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as any)}
                className={`px-3 py-1.5 text-xxs font-semibold rounded-full border transition-custom whitespace-nowrap ${
                  isSelected
                    ? 'bg-brand-dark border-brand-dark text-white'
                    : 'bg-white border-brand-border text-gray-500 hover:bg-brand-gray'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Transações Agrupadas */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-8 text-center shadow-xs">
            <p className="text-xs text-gray-400">Nenhum movimento encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          sortedDates.map((dateStr) => (
            <div key={dateStr} className="space-y-2">
              {/* Título do Grupo de Data */}
              <h3 className="text-xxs font-bold text-gray-400 uppercase tracking-wider px-1">
                {formatDateTitle(dateStr)}
              </h3>

              {/* Lista do Dia */}
              <div className="bg-white rounded-2xl border border-brand-border overflow-hidden divide-y divide-brand-border shadow-xs">
                {groupedTransactions[dateStr].map((tx) => {
                  const catDetails = getCategoryDetails(tx.category);
                  const Icon = catDetails.icon;

                  return (
                    <div
                      key={tx.id}
                      className="flex justify-between items-center p-3.5 hover:bg-brand-gray/30 transition-custom group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${catDetails.bg}`}>
                          <Icon className={`w-4 h-4 ${catDetails.color}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-brand-dark">{tx.description}</p>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {tx.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-brand-dark">
                          -{formatEuro(tx.amount)}
                        </span>
                        
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-cat-red opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-custom"
                          title="Eliminar movimento"
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
