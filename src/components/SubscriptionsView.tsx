import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Repeat, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp, DollarSign } from 'lucide-react';
import type { RecurringTransaction, RecurringInterval, TransactionCategory, Bank } from '../types';

interface SubscriptionsViewProps {
  recurringTxs: RecurringTransaction[];
  banks: Bank[];
  onAddRecurring: (template: Omit<RecurringTransaction, 'id' | 'isActive'>) => void;
  onDeleteRecurring: (id: string) => void;
}

const CATEGORIES: { label: string; value: TransactionCategory; color: string; icon: any }[] = [
  { label: 'Despesas Fixas', value: 'Fixos', color: '#6366f1', icon: Shield },
  { label: 'Transportes', value: 'Transportes', color: '#f97316', icon: Car },
  { label: 'Lazer', value: 'Lazer', color: '#eab308', icon: Smile },
  { label: 'Poupança', value: 'Poupança', color: '#a855f7', icon: PiggyBank },
  { label: 'Investimento', value: 'Investimento', color: '#10b981', icon: TrendingUp },
  { label: 'Salário', value: 'Salário', color: '#10b981', icon: DollarSign },
  { label: 'Outros', value: 'Outros', color: '#64748b', icon: HelpCircle },
];

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  recurringTxs,
  banks,
  onAddRecurring,
  onDeleteRecurring
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Fixos');
  const [frequency, setFrequency] = useState<RecurringInterval>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBankId, setSelectedBankId] = useState(banks.length > 0 ? banks[0].id : '');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !selectedBankId) {
      alert('Preenche todos os campos corretamente.');
      return;
    }

    onAddRecurring({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      frequency,
      startDate,
      bankId: selectedBankId
    });

    // Reset form
    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('Fixos');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
  };

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const translateFrequency = (freq: RecurringInterval) => {
    switch (freq) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return freq;
    }
  };

  // Calcular o custo mensal estimado de todas as despesas fixas (despesa)
  const monthlyCostEstimate = recurringTxs
    .filter(item => item.isActive && item.type === 'expense')
    .reduce((sum, item) => {
      if (item.frequency === 'monthly') return sum + item.amount;
      if (item.frequency === 'weekly') return sum + (item.amount * 52) / 12;
      if (item.frequency === 'yearly') return sum + item.amount / 12;
      return sum;
    }, 0);

  // Calcular receita mensal estimada
  const monthlyIncomeEstimate = recurringTxs
    .filter(item => item.isActive && item.type === 'income')
    .reduce((sum, item) => {
      if (item.frequency === 'monthly') return sum + item.amount;
      if (item.frequency === 'weekly') return sum + (item.amount * 52) / 12;
      if (item.frequency === 'yearly') return sum + item.amount / 12;
      return sum;
    }, 0);

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-2 pb-6 space-y-5">
      {/* Top Banner "Resumo Financeiro de Recorrências" */}
      <div className="bg-[#e5e6eb] text-black rounded-[28px] p-5 shadow-premium space-y-4 border border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Resumo de Assinaturas</span>
          <span className="text-[10px] font-extrabold bg-[#1c1d22] px-2.5 py-1 rounded-full text-white">
            {recurringTxs.length} Ativas
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Custo Mensal Estimado</span>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {formatEuro(monthlyCostEstimate)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Receitas Mensais</span>
            <p className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {formatEuro(monthlyIncomeEstimate)}
            </p>
          </div>
        </div>
      </div>

      {/* Button to show form */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 bg-[#1c1d22] hover:bg-[#282a30] text-white text-xs font-black rounded-2xl shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nova Assinatura
        </button>
      )}

      {/* Form Container */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-[#e5e6eb] rounded-3xl p-5 shadow-premium space-y-4 border border-slate-200 text-black">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Novo Agendamento</span>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[10px] font-bold text-slate-800 uppercase hover:underline cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* Type Selector (Despesa / Receita) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-[#1c1d22] text-cat-red shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Despesa / Assinatura
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-[#1c1d22] text-cat-green shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Receita Recorrente
            </button>
          </div>

          {/* Bank Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Banco Associado</label>
            <select
              value={selectedBankId}
              onChange={e => setSelectedBankId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black text-black transition-colors shadow-inner-soft"
              required
            >
              <option value="" disabled className="bg-white text-slate-400">Seleciona um banco</option>
              {banks.map(b => (
                <option key={b.id} value={b.id} className="bg-white text-black">{b.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Netflix, Spotify, Renda, Salário"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black text-black transition-colors shadow-inner-soft"
              required
            />
          </div>

          {/* Amount & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Valor (€)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black text-black transition-colors shadow-inner-soft"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Frequência</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as RecurringInterval)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black text-black transition-colors shadow-inner-soft"
              >
                <option value="weekly" className="bg-white text-black">Semanal</option>
                <option value="monthly" className="bg-white text-black">Mensal</option>
                <option value="yearly" className="bg-white text-black">Anual</option>
              </select>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Categoria</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TransactionCategory)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black text-black transition-colors shadow-inner-soft"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value} className="bg-white text-black">{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black text-black transition-colors shadow-inner-soft"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#1c1d22] hover:bg-[#282a30] text-white text-xs font-bold rounded-2xl shadow-premium hover:scale-[1.01] active:scale-99 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Criar Assinatura
          </button>
        </form>
      )}

      {/* List of Subscriptions */}
      <div className="space-y-3">
        <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Todas as Assinaturas</h3>

        {recurringTxs.length === 0 ? (
          <div className="bg-[#e5e6eb] rounded-3xl p-8 text-center shadow-premium border border-slate-200 text-slate-600">
            <Repeat className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold">Sem assinaturas ou recorrências</p>
            <p className="text-[10px] text-slate-500 mt-1">Cria a tua primeira despesa mensal agendada para acompanhar os teus custos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurringTxs.map(item => {
              const catObj = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[6];
              const CatIcon = catObj.icon;
              const associatedBank = banks.find(b => b.id === item.bankId);
              const bankName = associatedBank ? associatedBank.name : 'Desconhecido';

              return (
                <div
                  key={item.id}
                  className="bg-[#e5e6eb] rounded-2xl p-4 flex justify-between items-center shadow-premium relative transition-colors border border-slate-200 text-black"
                >
                  {/* Left Category Indicator Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                    style={{ backgroundColor: catObj.color }}
                  />

                  {/* Details */}
                  <div className="flex items-center gap-3.5 pl-2">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/50 shadow-sm">
                      <CatIcon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{item.description}</p>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                        {translateFrequency(item.frequency)} • {bankName}
                      </span>
                    </div>
                  </div>

                  {/* Value and Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-xs font-black ${item.type === 'expense' ? 'text-cat-red' : 'text-cat-green'}`}>
                        {item.type === 'expense' ? '-' : '+'}{formatEuro(item.amount)}
                      </p>
                      <span className="text-[9px] font-bold text-slate-500 block mt-0.5">Desde: {item.startDate}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (window.confirm(`Tens a certeza que desejas cancelar a assinatura "${item.description}"?`)) {
                          onDeleteRecurring(item.id);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-cat-red hover:border-red-150 flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Apagar Assinatura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
