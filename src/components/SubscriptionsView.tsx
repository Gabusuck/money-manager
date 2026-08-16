import React, { useState } from 'react';
import { Calendar, Plus, Trash2, Repeat, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp, DollarSign, X } from 'lucide-react';
import type { RecurringTransaction, RecurringInterval, TransactionCategory, Bank } from '../types';

interface SubscriptionsViewProps {
  recurringTxs: RecurringTransaction[];
  banks: Bank[];
  onAddRecurring: (template: Omit<RecurringTransaction, 'id' | 'isActive'>) => void;
  onDeleteRecurring: (id: string) => void;
}

const CATEGORIES: { label: string; value: TransactionCategory; color: string; icon: any }[] = [
  { label: 'Despesas Fixas',  value: 'Fixos',        color: '#EF4444', icon: Shield },
  { label: 'Transportes',     value: 'Transportes',  color: '#F97316', icon: Car },
  { label: 'Lazer',           value: 'Lazer',        color: '#F59E0B', icon: Smile },
  { label: 'Poupança',        value: 'Poupança',     color: '#8B5CF6', icon: PiggyBank },
  { label: 'Investimento',    value: 'Investimento', color: '#16C784', icon: TrendingUp },
  { label: 'Salário',         value: 'Salário',      color: '#16C784', icon: DollarSign },
  { label: 'Outros',          value: 'Outros',       color: '#94A3B8', icon: HelpCircle },
];

const P = {
  brand: '#4F6EF7',
  brandDark: '#3A58E0',
  brandLight: '#EEF1FE',
  success: '#16C784',
  danger: '#EF4444',
  ink: '#111827',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
  border: '#E5E8F8',
  surface: '#FFFFFF',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `1.5px solid ${P.border}`,
  background: P.surface,
  color: P.ink,
  fontSize: 13,
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: P.inkSubtle,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  display: 'block',
  marginBottom: 6,
};

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  recurringTxs,
  banks,
  onAddRecurring,
  onDeleteRecurring,
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
    onAddRecurring({ description: description.trim(), amount: parsedAmount, type, category, frequency, startDate, bankId: selectedBankId });
    setDescription(''); setAmount(''); setType('expense'); setCategory('Fixos');
    setFrequency('monthly'); setStartDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(false);
  };

  const formatEuro = (value: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  const translateFrequency = (freq: RecurringInterval) =>
    ({ weekly: 'Semanal', monthly: 'Mensal', yearly: 'Anual' }[freq] ?? freq);

  const monthlyCost = recurringTxs
    .filter(i => i.isActive && i.type === 'expense')
    .reduce((s, i) => s + (i.frequency === 'monthly' ? i.amount : i.frequency === 'weekly' ? (i.amount * 52) / 12 : i.amount / 12), 0);

  const monthlyIncome = recurringTxs
    .filter(i => i.isActive && i.type === 'income')
    .reduce((s, i) => s + (i.frequency === 'monthly' ? i.amount : i.frequency === 'weekly' ? (i.amount * 52) / 12 : i.amount / 12), 0);

  const expenses = recurringTxs.filter(i => i.type === 'expense');
  const incomes  = recurringTxs.filter(i => i.type === 'income');

  return (
    <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Hero Summary */}
      <div style={{
        background: 'linear-gradient(135deg,#4F6EF7 0%,#7C5CFC 100%)',
        borderRadius: 24,
        padding: '20px 20px',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(79,110,247,0.30)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{position:'absolute',top:-24,right:-24,width:120,height:120,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}} />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
          <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.7}}>
            Resumo de Assinaturas
          </p>
          <span style={{fontSize:11,fontWeight:800,background:'rgba(255,255,255,0.18)',borderRadius:999,padding:'4px 12px'}}>
            {recurringTxs.length} Ativas
          </span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div>
            <span style={{fontSize:9,fontWeight:700,opacity:0.65,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Custo Mensal</span>
            <span style={{fontSize:22,fontWeight:900,letterSpacing:'-0.02em'}}>-{formatEuro(monthlyCost)}</span>
          </div>
          <div style={{textAlign:'right'}}>
            <span style={{fontSize:9,fontWeight:700,opacity:0.65,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:4}}>Receitas Mensais</span>
            <span style={{fontSize:22,fontWeight:900,letterSpacing:'-0.02em'}}>+{formatEuro(monthlyIncome)}</span>
          </div>
        </div>
      </div>

      {/* Botão Adicionar */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            width:'100%',
            padding:'14px',
            borderRadius:16,
            background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',
            color:'#fff',
            fontSize:12,
            fontWeight:800,
            letterSpacing:'0.05em',
            border:'none',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            gap:8,
            cursor:'pointer',
            boxShadow:'0 4px 16px rgba(79,110,247,0.30)',
          }}
        >
          <Plus style={{width:16,height:16}} />
          Adicionar Nova Assinatura
        </button>
      )}

      {/* Formulário */}
      {showAddForm && (
        <form onSubmit={handleSubmit} style={{background:P.surface,borderRadius:20,border:`1px solid ${P.border}`,padding:20,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 4px 20px rgba(79,110,247,0.08)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${P.border}`,paddingBottom:12}}>
            <span style={{fontSize:12,fontWeight:900,color:P.ink}}>Novo Agendamento</span>
            <button type="button" onClick={() => setShowAddForm(false)} style={{width:28,height:28,borderRadius:8,background:P.brandLight,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <X style={{width:12,height:12,color:P.brand}} />
            </button>
          </div>

          {/* Tipo */}
          <div style={{display:'flex',background:'#F7F8FF',border:`1px solid ${P.border}`,borderRadius:14,padding:4,gap:4}}>
            {(['expense','income'] as const).map(t => {
              const labels = { expense:'Despesa / Assinatura', income:'Receita Recorrente' };
              const colors = { expense:'#EF4444', income:'#16C784' };
              const active = type === t;
              return (
                <button key={t} type="button" onClick={() => setType(t)}
                  style={{flex:1,padding:'9px 4px',borderRadius:10,border:'none',cursor:'pointer',fontSize:10,fontWeight:800,textTransform:'uppercase' as const,letterSpacing:'0.05em',transition:'all 0.2s',background:active?P.surface:'transparent',color:active?colors[t]:'#9CA3AF',boxShadow:active?'0 1px 6px rgba(0,0,0,0.08)':'none'}}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          {/* Banco */}
          <div>
            <label style={labelStyle}>Banco Associado</label>
            <select value={selectedBankId} onChange={e => setSelectedBankId(e.target.value)} style={inputStyle} required>
              <option value="" disabled>Seleciona um banco</option>
              {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <input type="text" placeholder="Netflix, Spotify, Renda, Salário…" value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} required />
          </div>

          {/* Valor + Frequência */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={labelStyle}>Valor (€)</label>
              <input type="number" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>Frequência</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value as RecurringInterval)} style={inputStyle}>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          {/* Categoria + Início */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value as TransactionCategory)} style={inputStyle}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{...labelStyle,display:'flex',alignItems:'center',gap:4}}>
                <Calendar style={{width:10,height:10}} /> Início
              </label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} required />
            </div>
          </div>

          {/* Submit */}
          <button type="submit" style={{width:'100%',padding:'14px',borderRadius:14,background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',color:'#fff',fontSize:12,fontWeight:900,letterSpacing:'0.07em',border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(79,110,247,0.35)',textTransform:'uppercase' as const}}>
            Criar Assinatura
          </button>
        </form>
      )}

      {/* Lista de Despesas */}
      {expenses.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 2px'}}>
            <span style={{fontSize:11,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em'}}>Despesas</span>
            <span style={{fontSize:10,fontWeight:700,color:'#EF4444'}}>-{formatEuro(monthlyCost)}/mês</span>
          </div>
          {expenses.map(item => <SubscriptionCard key={item.id} item={item} banks={banks} formatEuro={formatEuro} translateFrequency={translateFrequency} onDelete={onDeleteRecurring} />)}
        </div>
      )}

      {/* Lista de Receitas */}
      {incomes.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 2px'}}>
            <span style={{fontSize:11,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em'}}>Receitas</span>
            <span style={{fontSize:10,fontWeight:700,color:'#16C784'}}>+{formatEuro(monthlyIncome)}/mês</span>
          </div>
          {incomes.map(item => <SubscriptionCard key={item.id} item={item} banks={banks} formatEuro={formatEuro} translateFrequency={translateFrequency} onDelete={onDeleteRecurring} />)}
        </div>
      )}

      {/* Estado vazio */}
      {recurringTxs.length === 0 && !showAddForm && (
        <div style={{background:P.surface,borderRadius:20,border:`1px solid ${P.border}`,padding:'40px 20px',textAlign:'center',boxShadow:'0 2px 12px rgba(79,110,247,0.06)'}}>
          <div style={{width:48,height:48,borderRadius:'50%',background:P.brandLight,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px'}}>
            <Repeat style={{width:20,height:20,color:P.brand}} />
          </div>
          <p style={{fontSize:13,fontWeight:700,color:P.ink,marginBottom:6}}>Sem assinaturas ainda</p>
          <p style={{fontSize:11,color:P.inkSubtle}}>Adiciona a tua primeira despesa agendada para acompanhar os teus custos recorrentes.</p>
        </div>
      )}
    </div>
  );
};

// Funções auxiliares para datas na hora local
const parseLocalDate = (dateStr: string | undefined | null): Date => {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date();
  }
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return new Date();
  }
  return new Date(year, month - 1, day);
};

const getLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getNextPaymentDate = (startDateStr: string | undefined | null, frequency: RecurringInterval): Date => {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const today = parseLocalDate(todayStr);
  const start = parseLocalDate(startDateStr);
  
  if (start >= today) {
    return start;
  }

  const next = new Date(start);
  if (frequency === 'weekly') {
    while (next < today) {
      next.setDate(next.getDate() + 7);
    }
  } else if (frequency === 'monthly') {
    const startDay = start.getDate();
    let year = start.getFullYear();
    let month = start.getMonth();
    while (next < today) {
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      next.setFullYear(year);
      next.setMonth(month);
      next.setDate(startDay);
      if (next.getMonth() !== month) {
        next.setDate(0);
      }
    }
  } else if (frequency === 'yearly') {
    const startDay = start.getDate();
    const startMonth = start.getMonth();
    let year = start.getFullYear();
    while (next < today) {
      year++;
      next.setFullYear(year);
      next.setMonth(startMonth);
      next.setDate(startDay);
      if (next.getMonth() !== startMonth) {
        next.setDate(0);
      }
    }
  }
  return next;
};

// Card individual de assinatura
function SubscriptionCard({ item, banks, formatEuro, translateFrequency, onDelete }: {
  item: RecurringTransaction;
  banks: Bank[];
  formatEuro: (v: number) => string;
  translateFrequency: (f: RecurringInterval) => string;
  onDelete: (id: string) => void;
}) {
  const catObj = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[6];
  const CatIcon = catObj.icon;
  const bankName = banks.find(b => b.id === item.bankId)?.name ?? 'Desconhecido';
  const isExpense = item.type === 'expense';

  const P2 = { brand:'#4F6EF7', brandLight:'#EEF1FE', ink:'#111827', inkSubtle:'#9CA3AF', border:'#E5E8F8', surface:'#FFFFFF' };

  // Calcular dias em falta
  const nextDate = getNextPaymentDate(item.startDate, item.frequency);
  const todayLocalDate = parseLocalDate(getLocalDateString(new Date()));
  const diffTime = nextDate.getTime() - todayLocalDate.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let timeString = '';
  if (daysUntil === 0) {
    timeString = 'Hoje';
  } else if (daysUntil === 1) {
    timeString = 'Amanhã';
  } else {
    timeString = `Em ${daysUntil} dias`;
  }

  const isUrgent = daysUntil <= 3 && isExpense;

  return (
    <div style={{background:P2.surface,borderRadius:18,border:`1px solid ${P2.border}`,padding:'13px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 8px rgba(79,110,247,0.04)',position:'relative',overflow:'hidden'}}>
      {/* Color bar */}
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:catObj.color,borderRadius:'18px 0 0 18px'}} />

      <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:8,flex:1,minWidth:0}}>
        <div style={{width:36,height:36,borderRadius:'50%',background:`${catObj.color}15`,border:`1px solid ${catObj.color}25`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <CatIcon style={{width:15,height:15,color:catObj.color}} />
        </div>
        <div style={{minWidth:0}}>
          <p style={{fontSize:12,fontWeight:700,color:P2.ink,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.description}</p>
          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
            <span style={{fontSize:10,color:P2.inkSubtle}}>{translateFrequency(item.frequency)}</span>
            <span style={{fontSize:9,fontWeight:700,background:P2.brandLight,color:P2.brand,borderRadius:999,padding:'1px 7px'}}>{bankName}</span>
          </div>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,paddingLeft:8}}>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:13,fontWeight:900,color: isExpense ? '#EF4444' : '#16C784'}}>
            {isExpense ? '-' : '+'}{formatEuro(item.amount)}
          </p>
          <span style={{
            fontSize:9,
            color: isUrgent ? '#EF4444' : P2.inkSubtle,
            fontWeight: isUrgent ? 800 : 600,
            background: isUrgent ? '#FEF2F2' : 'transparent',
            padding: isUrgent ? '2px 6px' : '0',
            borderRadius: isUrgent ? '6px' : '0',
            border: isUrgent ? '1px solid #FECACA' : 'none',
            display: 'inline-block',
            marginTop: 2
          }}>
            {timeString}
          </span>
        </div>
        <button
          onClick={() => { if (window.confirm(`Cancelar "${item.description}"?`)) onDelete(item.id); }}
          style={{width:30,height:30,borderRadius:10,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
          title="Apagar"
        >
          <Trash2 style={{width:13,height:13,color:'#EF4444'}} />
        </button>
      </div>
    </div>
  );
}

