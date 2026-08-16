import React, { useState } from 'react';
import { Search, Trash2, HelpCircle, Car, Smile, Shield, PiggyBank, TrendingUp, DollarSign } from 'lucide-react';
import type { Transaction, TransactionCategory, Bank } from '../types';

interface LedgerProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  banks: Bank[];
}

const P = {
  brand: '#4F6EF7',
  brandLight: '#EEF1FE',
  success: '#16C784',
  danger: '#EF4444',
  ink: '#111827',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
  border: '#E5E8F8',
  surface: '#FFFFFF',
  bg: '#EFF1FB',
};

export const Ledger: React.FC<LedgerProps> = ({ transactions, onDeleteTransaction, banks }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory | 'Todas'>('Todas');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | 'Todas'>('Todas');

  const formatEuro = (value: number) =>
    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);

  const getLast7Days = () => {
    const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        dateString: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
        monthName: monthNames[d.getMonth()],
        isToday: i === 6,
      };
    });
  };

  const calendarDays = getLast7Days();

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || tx.category === selectedCategory;
    const matchesDate = selectedDateFilter === 'Todas' || tx.date === selectedDateFilter;
    return matchesSearch && matchesCategory && matchesDate;
  });

  const groupedTransactions = filteredTransactions.reduce<Record<string, Transaction[]>>((groups, tx) => {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const formatDateTitle = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateString === today) return 'Hoje';
    if (dateString === yesterday) return 'Ontem';
    return new Date(dateString).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getCategoryDetails = (cat: TransactionCategory) => {
    switch (cat) {
      case 'Transportes':  return { color: '#F97316', bg: '#FFF7ED', border: '#FEDD9A', icon: Car };
      case 'Lazer':        return { color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', icon: Smile };
      case 'Fixos':        return { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: Shield };
      case 'Poupança':     return { color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: PiggyBank };
      case 'Investimento': return { color: '#16C784', bg: '#ECFDF5', border: '#A7F3D0', icon: TrendingUp };
      case 'Salário':      return { color: '#16C784', bg: '#ECFDF5', border: '#A7F3D0', icon: DollarSign };
      default:             return { color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0', icon: HelpCircle };
    }
  };

  const categories = ['Todas','Transportes','Lazer','Outros','Fixos','Poupança','Investimento'];

  return (
    <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Pesquisa */}
      <div style={{position:'relative'}}>
        <Search style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:P.inkSubtle}} />
        <input
          type="text"
          placeholder="Pesquisar movimentos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width:'100%',
            paddingLeft:40,
            paddingRight:16,
            paddingTop:12,
            paddingBottom:12,
            borderRadius:14,
            border:`1.5px solid ${P.border}`,
            background:P.surface,
            color:P.ink,
            fontSize:13,
            fontWeight:600,
            outline:'none',
            boxSizing:'border-box',
          }}
        />
      </div>

      {/* Filtros de Categoria */}
      <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}} className="no-scrollbar">
        {categories.map(cat => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              style={{
                flexShrink:0,
                padding:'7px 14px',
                borderRadius:999,
                border: active ? `1.5px solid ${P.brand}` : `1.5px solid ${P.border}`,
                background: active ? P.brand : P.surface,
                color: active ? '#fff' : P.inkMuted,
                fontSize:11,
                fontWeight:700,
                cursor:'pointer',
                transition:'all 0.18s',
                whiteSpace:'nowrap' as const,
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Seletor de Dias */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        <span style={{fontSize:10,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',padding:'0 2px'}}>
          Selecione o Dia
        </span>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}} className="no-scrollbar">
          {/* Todos */}
          <button
            onClick={() => setSelectedDateFilter('Todas')}
            style={{
              flexShrink:0,
              width:56,
              height:64,
              borderRadius:16,
              border: selectedDateFilter === 'Todas' ? `1.5px solid ${P.brand}` : `1.5px solid ${P.border}`,
              background: selectedDateFilter === 'Todas' ? P.brand : P.surface,
              color: selectedDateFilter === 'Todas' ? '#fff' : P.inkMuted,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              fontSize:10,
              fontWeight:800,
              cursor:'pointer',
              transition:'all 0.18s',
              boxShadow: selectedDateFilter === 'Todas' ? '0 4px 14px rgba(79,110,247,0.30)' : '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            Todos
          </button>

          {calendarDays.map(day => {
            const active = selectedDateFilter === day.dateString;
            return (
              <button
                key={day.dateString}
                onClick={() => setSelectedDateFilter(day.dateString)}
                style={{
                  flexShrink:0,
                  width:56,
                  height:64,
                  borderRadius:16,
                  border: active ? `1.5px solid ${P.brand}` : `1.5px solid ${P.border}`,
                  background: active ? P.brand : day.isToday ? P.brandLight : P.surface,
                  color: active ? '#fff' : day.isToday ? P.brand : P.inkMuted,
                  display:'flex',
                  flexDirection:'column' as const,
                  alignItems:'center',
                  justifyContent:'center',
                  gap:2,
                  cursor:'pointer',
                  transition:'all 0.18s',
                  boxShadow: active ? '0 4px 14px rgba(79,110,247,0.30)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{fontSize:18,fontWeight:900,lineHeight:1}}>{day.dayNum}</span>
                <span style={{fontSize:8,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',opacity:0.8}}>{day.monthName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Transações */}
      <div style={{display:'flex',flexDirection:'column',gap:20}}>
        {sortedDates.length === 0 ? (
          <div style={{background:P.surface,borderRadius:20,border:`1px solid ${P.border}`,padding:'40px 20px',textAlign:'center',boxShadow:'0 2px 12px rgba(79,110,247,0.06)'}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:P.brandLight,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
              <Search style={{width:18,height:18,color:P.brand}} />
            </div>
            <p style={{fontSize:13,fontWeight:700,color:P.ink}}>Nenhum movimento encontrado</p>
            <p style={{fontSize:11,color:P.inkSubtle,marginTop:4}}>Tenta ajustar os filtros ou a pesquisa.</p>
          </div>
        ) : (
          sortedDates.map(dateStr => (
            <div key={dateStr} style={{display:'flex',flexDirection:'column',gap:8}}>
              {/* Data label */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 2px'}}>
                <span style={{fontSize:11,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em'}}>
                  {formatDateTitle(dateStr)}
                </span>
                <span style={{fontSize:10,fontWeight:600,color:P.inkSubtle}}>
                  {groupedTransactions[dateStr].length} mov.
                </span>
              </div>

              {/* Transações do dia */}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {groupedTransactions[dateStr].map(tx => {
                  const catD = getCategoryDetails(tx.category);
                  const Icon = catD.icon;
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const amountColor = isIncome ? '#16C784' : isTransfer ? '#8B5CF6' : '#EF4444';
                  const amountPrefix = isIncome ? '+' : '-';

                  return (
                    <div
                      key={tx.id}
                      style={{
                        background: P.surface,
                        borderRadius: 18,
                        border: `1px solid ${P.border}`,
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 8px rgba(79,110,247,0.04)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Color bar */}
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:catD.color,borderRadius:'18px 0 0 18px'}} />

                      <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:8,flex:1,minWidth:0}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:catD.bg,border:`1px solid ${catD.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Icon style={{width:15,height:15,color:catD.color}} />
                        </div>
                        <div style={{minWidth:0}}>
                          <p style={{fontSize:12,fontWeight:700,color:P.ink,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</p>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3,flexWrap:'wrap'}}>
                            <span style={{fontSize:10,color:P.inkSubtle}}>{tx.category}</span>
                            {tx.fromBankId && tx.toBankId ? (
                              <span style={{fontSize:9,fontWeight:700,background:'#F5F3FF',color:'#8B5CF6',borderRadius:999,padding:'1px 7px',border:'1px solid #DDD6FE'}}>
                                {banks.find(b => b.id === tx.fromBankId)?.name} → {banks.find(b => b.id === tx.toBankId)?.name}
                              </span>
                            ) : tx.bankId && (
                              <span style={{fontSize:9,fontWeight:700,background:P.brandLight,color:P.brand,borderRadius:999,padding:'1px 7px',border:`1px solid #C7D2FE`}}>
                                {banks.find(b => b.id === tx.bankId)?.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0,paddingLeft:8}}>
                        <span style={{fontSize:13,fontWeight:900,color:amountColor}}>
                          {amountPrefix}{formatEuro(tx.amount)}
                        </span>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          style={{width:30,height:30,borderRadius:10,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all 0.18s'}}
                          title="Eliminar"
                        >
                          <Trash2 style={{width:13,height:13,color:'#EF4444'}} />
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
