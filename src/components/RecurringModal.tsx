import React, { useState, useRef } from 'react';
import { X, Calendar, Plus, Trash2, Repeat, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp, DollarSign } from 'lucide-react';
import type { RecurringTransaction, RecurringInterval, TransactionCategory, Bank } from '../types';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  bank: Bank | null;
  recurringTxs: RecurringTransaction[];
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

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  bank,
  recurringTxs,
  onAddRecurring,
  onDeleteRecurring
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<TransactionCategory>('Fixos');
  const [frequency, setFrequency] = useState<RecurringInterval>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Pull-to-close gesture logic (iOS style)
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen || !bank) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY;
    if (diffY > 0) {
      setCurrentTranslateY(diffY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentTranslateY > 100) {
      onClose();
    }
    setCurrentTranslateY(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
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
      bankId: bank.id
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

  // Filtrar as recorrências por este banco específico
  const bankRecs = recurringTxs.filter(item => item.bankId === bank.id);

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

  return (
    <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(15,23,42,0.45)',backdropFilter:'blur(8px)'}}>
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${currentTranslateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          maxHeight: '85vh',
          background: '#FFFFFF',
          borderRadius: '28px 28px 0 0',
          padding: '20px 20px 32px',
          boxShadow: '0 -8px 40px rgba(79,110,247,0.15)',
        }}
        className="relative w-full max-w-md flex flex-col overflow-y-auto no-scrollbar"
      >
        {/* Pull handle */}
        <div style={{width:40,height:4,borderRadius:999,background:'#E5E8F8',margin:'0 auto 18px'}} />

        {/* Title & Close */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div>
            <h3 style={{fontSize:14,fontWeight:900,color:'#111827',display:'flex',alignItems:'center',gap:6}}>
              <Repeat style={{width:16,height:16,color:'#4F6EF7'}} />
              Recorrências &amp; Assinaturas
            </h3>
            <span style={{fontSize:10,fontWeight:700,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginTop:2}}>
              Conta: {bank.name}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{width:32,height:32,borderRadius:10,background:'#EEF1FE',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
          >
            <X style={{width:14,height:14,color:'#4F6EF7'}} />
          </button>
        </div>

        {/* Action Bar */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{width:'100%',marginBottom:16,padding:'13px',borderRadius:16,background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',color:'#fff',fontSize:12,fontWeight:800,letterSpacing:'0.05em',border:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',boxShadow:'0 4px 16px rgba(79,110,247,0.30)'}}
          >
            <Plus style={{width:16,height:16}} />
            Adicionar Nova Assinatura
          </button>
        )}

        {/* Form Container */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-slate-50/50 border border-slate-100 rounded-3xl p-4 mb-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nova Recorrência</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-[10px] font-bold text-slate-850 uppercase hover:underline"
              >
                Cancelar
              </button>
            </div>

            {/* Type Selector (Despesa / Receita) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white text-cat-red shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Despesa / Assinatura
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-white text-cat-green shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Receita Recorrente
              </button>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Netflix, Renda, Salário Base"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>

            {/* Amount & Frequency */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequência</label>
                <select
                  value={frequency}
                  onChange={e => setFrequency(e.target.value as RecurringInterval)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black transition-colors"
                >
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>

            {/* Category & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as TransactionCategory)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black transition-colors"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              style={{width:'100%',padding:'14px',borderRadius:14,background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',color:'#fff',fontSize:12,fontWeight:900,letterSpacing:'0.07em',border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(79,110,247,0.35)',textTransform:'uppercase' as const}}
            >
              Criar Agendamento
            </button>
          </form>
        )}

        {/* Active List */}
        <div className="space-y-3 flex-1 min-h-0">
          <h4 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">
            Assinaturas Ativas ({bankRecs.length})
          </h4>

          {bankRecs.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-dashed border-slate-200">
              <Repeat className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">Sem assinaturas ativas</p>
              <p className="text-[10px] text-slate-400 mt-1">Regista a tua primeira recorrência acima para automatizar despesas mensais.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
              {bankRecs.map(item => {
                const catObj = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[6];
                const CatIcon = catObj.icon;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-100 rounded-2xl p-3 flex justify-between items-center shadow-sm relative group hover:border-slate-200 transition-colors"
                  >
                    {/* Left Category Bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                      style={{ backgroundColor: catObj.color }}
                    />

                    {/* Details */}
                    <div className="flex items-center gap-3 pl-3">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0">
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-brand-dark truncate max-w-[150px]">{item.description}</p>
                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                          {translateFrequency(item.frequency)} • {item.startDate}
                        </span>
                      </div>
                    </div>

                    {/* Right Action & Value */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xs font-black ${item.type === 'expense' ? 'text-cat-red' : 'text-cat-green'}`}>
                          {item.type === 'expense' ? '-' : '+'}{formatEuro(item.amount)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Tens a certeza que desejas cancelar a recorrência "${item.description}"?`)) {
                            onDeleteRecurring(item.id);
                          }
                        }}
                        className="w-7 h-7 rounded-full bg-slate-50 hover:bg-red-50 border border-slate-100 hover:border-red-100 flex items-center justify-center text-slate-400 hover:text-cat-red transition-all cursor-pointer"
                        title="Cancelar Assinatura"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
