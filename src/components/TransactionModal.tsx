import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Edit3, Tag, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp, DollarSign, ChevronDown } from 'lucide-react';
import type { TransactionCategory, Transaction, TransactionType, Bank } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  banks: Bank[];
  defaultType?: TransactionType;
  defaultBankId?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  banks,
  defaultType,
  defaultBankId
}) => {
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory | null>(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Estados dos Bancos
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [targetBankId, setTargetBankId] = useState<string>('');
  const [transferType, setTransferType] = useState<'goal' | 'bank'>('goal');

  // Gestão de Gesto Pull-Down to Close (Estilo iOS)
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState(0);
  const [currentTranslateY, setCurrentTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Só permitir puxar se o modal estiver no topo do scroll interno
    if (containerRef.current && containerRef.current.scrollTop > 0) return;
    setTouchStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - touchStartY;
    
    // Apenas permitir puxar para baixo
    if (diffY > 0) {
      setCurrentTranslateY(diffY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Se puxar mais de 100px para baixo, fecha o modal
    if (currentTranslateY > 100) {
      onClose();
    }
    setCurrentTranslateY(0);
  };

  // Inicializar bancos e tipo selecionados ao abrir
  useEffect(() => {
    if (isOpen) {
      setType(defaultType || 'expense');
      
      const initialBankId = defaultBankId || (banks.length > 0 ? banks[0].id : '');
      setSelectedBankId(initialBankId);

      if (banks.length > 1) {
        const nextBank = banks.find(b => b.id !== initialBankId);
        setTargetBankId(nextBank ? nextBank.id : banks[1].id);
      } else {
        setTargetBankId('');
      }
    }
  }, [isOpen, defaultType, defaultBankId, banks]);

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

    if (type === 'transfer' && transferType === 'bank') {
      if (selectedBankId === targetBankId) {
        alert('A conta de origem e destino não podem ser iguais!');
        return;
      }

      onAddTransaction({
        description: description.trim(),
        amount: parsedAmount,
        type,
        category: 'Transferência Interna',
        date,
        isRecurring,
        fromBankId: selectedBankId,
        toBankId: targetBankId
      });
    } else {
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
        isRecurring,
        bankId: selectedBankId
      });
    }

    // Reset Form
    setAmount('');
    setDescription('');
    setType('expense');
    setCategory(null);
    setShowCategorySelector(false);
    setIsRecurring(false);
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

  // Filtrar categorias com base no tipo selecionado
  const filteredCategories = categoriesList.filter((cat) => {
    if (type === 'expense') {
      return ['Transportes', 'Lazer', 'Fixos', 'Outros'].includes(cat.name);
    }
    if (type === 'transfer') {
      return ['Poupança', 'Investimento'].includes(cat.name);
    }
    if (type === 'income') {
      return ['Salário', 'Outros'].includes(cat.name);
    }
    return true;
  });

  const selectedCatDetails = categoriesList.find((cat) => cat.name === category);

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,0.50)',backdropFilter:'blur(8px)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
      {/* Container */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${currentTranslateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
          background: '#FFFFFF',
          width: '100%',
          maxWidth: 480,
          borderRadius: '28px 28px 0 0',
          padding: '20px 20px 32px',
          boxShadow: '0 -8px 40px rgba(79,110,247,0.15)',
          maxHeight: '92dvh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
        className="no-scrollbar"
      >
        {/* Pull handle */}
        <div style={{width:40,height:4,borderRadius:999,background:'#E5E8F8',margin:'0 auto 18px'}} />

        {/* Cabeçalho */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h2 style={{fontSize:12,fontWeight:900,color:'#111827',textTransform:'uppercase',letterSpacing:'0.1em'}}>Novo Lançamento</h2>
          <button
            onClick={onClose}
            style={{width:32,height:32,borderRadius:10,background:'#EEF1FE',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}
          >
            <X style={{width:14,height:14,color:'#4F6EF7'}} />
          </button>
        </div>

        {/* Tipo Seletor */}
        <div style={{display:'flex',background:'#F7F8FF',border:'1px solid #E5E8F8',borderRadius:16,padding:4,gap:4,marginBottom:20}}>
          {(['expense','transfer','income'] as TransactionType[]).map(t => {
            const labels: Record<TransactionType,string> = {expense:'Despesa',transfer:'Transferência',income:'Receita'};
            const activeColors: Record<TransactionType,string> = {expense:'#EF4444',transfer:'#4F6EF7',income:'#16C784'};
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex:1,
                  padding:'9px 4px',
                  borderRadius:12,
                  border:'none',
                  cursor:'pointer',
                  fontSize:10,
                  fontWeight:800,
                  textTransform:'uppercase' as const,
                  letterSpacing:'0.05em',
                  transition:'all 0.2s',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? activeColors[t] : '#9CA3AF',
                  boxShadow: active ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>

          {/* Campo Valor */}
          <div style={{background:'#F7F8FF',borderRadius:20,padding:'18px 16px',textAlign:'center',border:'1.5px solid #E5E8F8'}}>
            <span style={{fontSize:10,fontWeight:800,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.1em',display:'block',marginBottom:8}}>Valor do Lançamento</span>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
              <span style={{fontSize:24,fontWeight:900,color:'#C7D2FE'}}>€</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{fontSize:36,fontWeight:900,border:'none',background:'transparent',outline:'none',textAlign:'center',color:'#111827',width:'100%',maxWidth:200}}
                autoFocus
              />
            </div>
          </div>

          {/* Campo Descrição */}
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            <label style={{fontSize:10,fontWeight:800,color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'0.08em',display:'flex',alignItems:'center',gap:5}}>
              <Edit3 style={{width:12,height:12}} /> Descrição
            </label>
            <input
              type="text"
              placeholder={
                type === 'expense' ? 'Donativo, Pingo Doce, Jantar…' :
                type === 'transfer' ? 'Reforço poupança, T212…' :
                'Salário, Freelance, Reembolso…'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{width:'100%',padding:'13px 14px',fontSize:13,borderRadius:14,border:'1.5px solid #E5E8F8',background:'#FFFFFF',color:'#111827',outline:'none',fontWeight:600}}
            />
          </div>

          {/* SUB-TABS SE FOR TRANSFERÊNCIA */}
          {type === 'transfer' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Destino da Transferência</label>
              <div className="flex bg-slate-200/60 border border-slate-100 p-1 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setTransferType('goal')}
                  className={`flex-1 py-1.5 text-center text-[9px] font-extrabold rounded-xl transition-custom ${
                    transferType === 'goal' 
                      ? 'bg-white text-brand-dark shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Para um Objetivo (Poupança/Inv)
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('bank')}
                  className={`flex-1 py-1.5 text-center text-[9px] font-extrabold rounded-xl transition-custom ${
                    transferType === 'bank' 
                      ? 'bg-white text-brand-dark shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Entre Bancos / Contas
                </button>
              </div>
            </div>
          )}

          {/* DROPDOWN(S) SELEÇÃO DE BANCO(S) */}
          {banks.length > 0 && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              {type === 'transfer' && transferType === 'bank' ? (
                // Transferência entre Bancos (Origem e Destino)
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">De (Origem)</label>
                    <select
                      value={selectedBankId}
                      onChange={(e) => {
                        setSelectedBankId(e.target.value);
                        if (e.target.value === targetBankId) {
                          const other = banks.find(b => b.id !== e.target.value);
                          if (other) setTargetBankId(other.id);
                        }
                      }}
                      className="w-full p-3.5 text-xs bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark shadow-premium"
                    >
                      {banks.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Para (Destino)</label>
                    <select
                      value={targetBankId}
                      onChange={(e) => setTargetBankId(e.target.value)}
                      className="w-full p-3.5 text-xs bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark shadow-premium"
                    >
                      {banks.filter(b => b.id !== selectedBankId).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                // Lançamento normal de Despesa/Renda/Meta
                <div className="space-y-1.5">
                  <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">
                    {type === 'income' ? 'Depositar em (Conta)' : 'Retirar de (Conta)'}
                  </label>
                  <select
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full p-3.5 text-xs bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark shadow-premium"
                  >
                    {banks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Seleção de Categoria (Ocultar se for transferência direta entre bancos) */}
          {!(type === 'transfer' && transferType === 'bank') && (
            <div className="space-y-2">
              <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                <Tag className="w-3.5 h-3.5" /> Categoria
              </label>
              
              <div className="space-y-2">
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
                    className="w-full bg-white rounded-2xl border border-black p-4 flex items-center justify-between shadow-premium transition-custom relative overflow-hidden text-left"
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
                            isSelected ? 'border-black bg-slate-50' : 'border-slate-100 hover:translate-y-[-1px]'
                          }`}
                        >
                          <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-lg"
                            style={{ backgroundColor: cat.color }}
                          />

                          <div className="flex items-center gap-3 pl-1.5">
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
          )}

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

          {/* Interruptor Recorrente (Sliding Toggle Switch) */}
          <div className="bg-white rounded-[24px] border border-slate-100 p-4 flex items-center justify-between shadow-premium">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-brand-dark block">Lançamento Recorrente</span>
              <span className="text-[10px] text-slate-400 font-semibold block">Repetir automaticamente todos os meses</span>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-11 h-6 rounded-full p-1 transition-custom duration-300 focus:outline-none shrink-0 ${
                isRecurring ? 'bg-brand-purple' : 'bg-slate-200'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-custom duration-300 ${
                  isRecurring ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Botão Submit */}
          <button
            type="submit"
            style={{width:'100%',padding:'16px',borderRadius:16,background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',color:'#fff',fontSize:12,fontWeight:900,letterSpacing:'0.07em',border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(79,110,247,0.35)',textTransform:'uppercase' as const,marginTop:4}}
          >
            Confirmar Lançamento
          </button>
        </form>
      </div>
    </div>
  );
};
