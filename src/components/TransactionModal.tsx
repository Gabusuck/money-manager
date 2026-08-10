import React, { useState } from 'react';
import { X, Calendar, Edit3, Tag, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp } from 'lucide-react';
import type { TransactionCategory, Transaction } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('Outros');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor, introduz um valor válido superior a 0.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, introduz uma descrição.');
      return;
    }

    onAddTransaction({
      description: description.trim(),
      amount: parsedAmount,
      type: 'expense', // Focado em despesas / saídas de carteira conforme o modelo do app
      category,
      date,
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setCategory('Outros');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  // Ícones e cores para seleção de categoria
  const categoriesList: { name: TransactionCategory; label: string; color: string; bg: string; icon: any }[] = [
    { name: 'Transportes', label: 'Transportes', color: 'text-cat-orange border-cat-orange', bg: 'bg-cat-orange/10', icon: Car },
    { name: 'Lazer', label: 'Lazer / Café', color: 'text-cat-yellow border-cat-yellow', bg: 'bg-cat-yellow/10', icon: Smile },
    { name: 'Outros', label: 'Outros', color: 'text-cat-gray border-cat-gray', bg: 'bg-cat-gray/10', icon: HelpCircle },
    { name: 'Fixos', label: 'Fixos / Renda', color: 'text-cat-red border-cat-red', bg: 'bg-cat-red/10', icon: Shield },
    { name: 'Poupança', label: 'Poupança TV', color: 'text-cat-purple border-cat-purple', bg: 'bg-cat-purple/10', icon: PiggyBank },
    { name: 'Investimento', label: 'Trading 212', color: 'text-cat-green border-cat-green', bg: 'bg-cat-green/10', icon: TrendingUp },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-300">
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl border-t border-brand-border p-6 space-y-6 safe-pb shadow-xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Topo do Modal */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-brand-dark uppercase tracking-wider">Novo Lançamento</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-brand-gray flex items-center justify-center border border-brand-border text-gray-500 hover:text-brand-dark transition-custom"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input de Valor Grande */}
          <div className="relative text-center py-2">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">€</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-center text-4xl font-extrabold focus:outline-none placeholder-gray-200 text-brand-dark"
              autoFocus
            />
          </div>

          {/* Campo Descrição */}
          <div className="space-y-1">
            <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Edit3 className="w-3 h-3 text-gray-400" /> Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Supermercado, Almoço, Jantar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark placeholder-gray-400"
            />
          </div>

          {/* Seleção de Categoria (Grid) */}
          <div className="space-y-1.5">
            <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-gray-400" /> Categoria
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categoriesList.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-custom ${
                      isSelected 
                        ? `${cat.color} ${cat.bg} border-current font-semibold scale-98` 
                        : 'bg-white border-brand-border text-gray-500 hover:bg-brand-gray'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo Data */}
          <div className="space-y-1">
            <label className="text-xxs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-gray-400" /> Data do Registo
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 text-xs bg-brand-gray border border-brand-border rounded-xl focus:outline-none focus:border-brand-dark text-brand-dark"
            />
          </div>

          {/* Botão de Gravar */}
          <button
            type="submit"
            className="w-full py-3.5 mt-2 bg-brand-dark text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-98 transition-custom"
          >
            Confirmar Registo
          </button>
        </form>
      </div>
    </div>
  );
};
