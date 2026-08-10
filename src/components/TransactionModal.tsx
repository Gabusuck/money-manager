import React, { useState, useEffect } from 'react';
import { X, Calendar, Edit3, Tag, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp, DollarSign, ChevronDown } from 'lucide-react';
import type { TransactionCategory, Transaction, TransactionType } from '../types';

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
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Resetar a categoria selecionada quando o tipo muda (deixa vazio/null)
  useEffect(() => {
    setCategory(null);
    setShowCategorySelector(false);
  }, [type]);

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
    if (!category) {
      alert('Por favor, seleciona uma categoria para este lançamento.');
      setShowCategorySelector(true); // Abre a lista para facilitar a escolha
      return;
    }

    onAddTransaction({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      date,
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setType('expense');
    setCategory(null);
    setShowCategorySelector(false);
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const categoriesList: { name: TransactionCategory; label: string; color: string; bg: string; border: string; icon: any }[] = [
    { name: 'Transportes', label: 'Transportes / Gasóleo', color: '#f97316', bg: 'bg-cat-orange/10', border: 'border-cat-orange/20', icon: Car },
    { name: 'Lazer', label: 'Lazer / Café', color: '#eab308', bg: 'bg-cat-yellow/10', border: 'border-cat-yellow/20', icon: Smile },
    { name: 'Outros', label: 'Outros Custos / Rendimentos', color: '#64748b', bg: 'bg-cat-gray/10', border: 'border-cat-gray/20', icon: HelpCircle },
    { name: 'Fixos', label: 'Despesas Fixas', color: '#ef4444', bg: 'bg-cat-red/10', border: 'border-cat-red/20', icon: Shield },
    { name: 'Poupança', label: 'Poupança (TV/Câmara)', color: '#a855f7', bg: 'bg-cat-purple/10', border: 'border-cat-purple/20', icon: PiggyBank },
    { name: 'Investimento', label: 'Investimento (T212)', color: '#10b981', bg: 'bg-cat-green/10', border: 'border-cat-green/20', icon: TrendingUp },
    { name: 'Salário', label: 'Salário Principal', color: '#10b981', bg: 'bg-cat-green/10', border: 'border-cat-green/20', icon: DollarSign },
  ];

  // Filtrar as categorias exibidas com base no Tipo de Lançamento
  const filteredCategories = categoriesList.filter(cat => {
    if (type === 'expense') {
      return ['Transportes', 'Lazer', 'Outros', 'Fixos'].includes(cat.name);
    } else if (type === 'transfer') {
      return ['Poupança', 'Investimento'].includes(cat.name);
    } else { // income
      return ['Salário', 'Outros'].includes(cat.name);
    }
  });

  const selectedCatDetails = category ? categoriesList.find(c => c.name === category) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs overflow-hidden select-none">
      <div 
        className="w-full max-w-md bg-slate-50 rounded-t-[32px] border-t border-slate-100 p-6 space-y-6 max-h-[92vh] overflow-y-auto overflow-x-hidden no-scrollbar safe-pb shadow-2xl animate-in slide-in-from-bottom duration-300"
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest">Novo Lançamento</h3>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 text-slate-400 hover:text-brand-dark transition-custom shadow-sm"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Segmented Control para selecionar o Tipo de Movimento */}
        <div className="bg-slate-100 p-1 rounded-2xl flex w-full border border-slate-200/50">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-2 text-center text-[10px] font-extrabold rounded-xl transition-custom ${
              type === 'expense' 
                ? 'bg-white text-brand-dark shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex-1 py-2 text-center text-[10px] font-extrabold rounded-xl transition-custom ${
              type === 'transfer' 
                ? 'bg-white text-brand-dark shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Transferência
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-2 text-center text-[10px] font-extrabold rounded-xl transition-custom ${
              type === 'income' 
                ? 'bg-white text-brand-dark shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Renda
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Campo Valor Grande */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-premium relative text-center py-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Valor do Lançamento</span>
            <div className="relative inline-block w-full max-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-center text-4xl font-black focus:outline-none placeholder-slate-200 text-brand-dark pr-3 pl-8 bg-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Campo Descrição */}
          <div className="space-y-1.5">
            <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <Edit3 className="w-3.5 h-3.5" /> Descrição
            </label>
            <input
              type="text"
              placeholder={
                type === 'expense' ? 'Donativo, Pingo Doce, Jantar...' :
                type === 'transfer' ? 'Reforço poupança, Enviar para a T212...' :
                'Salário de referência, Freelance, Reembolso...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 text-xs bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark placeholder-slate-300 shadow-premium"
            />
          </div>

          {/* Seleção de Categoria Dinâmica e Expansível */}
          <div className="space-y-2">
            <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <Tag className="w-3.5 h-3.5" /> Categoria
            </label>
            
            <div className="space-y-2">
              {/* Botão Gatilho (Mostra Selecionado ou Placeholder) */}
              {!category ? (
                <button
                  type="button"
                  onClick={() => setShowCategorySelector(!showCategorySelector)}
                  className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between shadow-premium hover:translate-y-[-1px] transition-custom text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-full flex items-center justify-center border border-dashed border-slate-200 bg-slate-50 text-slate-300">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">Escolher categoria...</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${showCategorySelector ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCategorySelector(!showCategorySelector)}
                  className="w-full bg-white rounded-2xl border border-brand-purple p-4 flex items-center justify-between shadow-premium transition-custom relative overflow-hidden text-left"
                >
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-lg"
                    style={{ backgroundColor: selectedCatDetails?.color }}
                  />
                  <div className="flex items-center gap-3 pl-1.5">
                    <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border ${selectedCatDetails?.border} ${selectedCatDetails?.bg} shadow-sm shrink-0`}>
                      {selectedCatDetails && React.createElement(selectedCatDetails.icon, { className: "w-4 h-4", style: { color: selectedCatDetails.color } })}
                    </div>
                    <span className="text-xs font-bold text-brand-dark">{selectedCatDetails?.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showCategorySelector ? 'rotate-180' : ''}`} />
                </button>
              )}

              {/* Lista Desdobrável das Categorias */}
              {showCategorySelector && (
                <div className="space-y-2 max-h-60 overflow-y-auto overflow-x-hidden no-scrollbar pr-0.5 py-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setCategory(cat.name);
                          setShowCategorySelector(false);
                        }}
                        className={`w-full bg-white rounded-2xl border p-3.5 flex items-center justify-between shadow-premium transition-custom relative overflow-hidden text-left ${
                          isSelected ? 'border-brand-purple bg-purple-50/5' : 'border-slate-100 hover:translate-y-[-1px]'
                        }`}
                      >
                        {/* Barra Vertical de Categoria */}
                        <div 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-lg"
                          style={{ backgroundColor: cat.color }}
                        />

                        <div className="flex items-center gap-3 pl-1.5">
                          {/* Círculo com Ícone */}
                          <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center border ${cat.border} ${cat.bg} shadow-sm shrink-0`}>
                            <Icon className="w-4 h-4" style={{ color: cat.color }} />
                          </div>
                          <span className="text-xs font-bold text-brand-dark">{cat.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Campo Data */}
          <div className="space-y-1.5">
            <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
              <Calendar className="w-3.5 h-3.5" /> Data do Movimento
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3.5 text-xs bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark shadow-premium"
            />
          </div>

          {/* Botão de Gravar Pill-Shape */}
          <button
            type="submit"
            className="w-full py-4 mt-3 bg-gradient-to-tr from-brand-purple to-brand-purple-dark text-white rounded-full text-xs font-black uppercase tracking-widest shadow-purple-glow hover:scale-[1.01] active:scale-99 transition-transform"
          >
            Confirmar Lançamento
          </button>
        </form>
      </div>
    </div>
  );
};
