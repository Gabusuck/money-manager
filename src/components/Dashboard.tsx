import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  DollarSign, 
  Car, 
  Smile, 
  HelpCircle, 
  Info, 
  Shield, 
  PiggyBank, 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight,
  X,
  Plus,
  Trash2,
  Edit3,
  Repeat,
  Bell,
} from 'lucide-react';
import type { Transaction, BudgetAllocation, Bank, TransactionType } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  budget: BudgetAllocation;
  onEditBudget: () => void;
  banks: Bank[];
  onAddBank: (name: string, initialBalance: number) => void;
  onDeleteBank: (bankId: string) => void;
  onEditBank: (bankId: string, name: string, balance: number) => void;
  onOpenPrefilledTxModal: (type: TransactionType, bankId: string) => void;
  onOpenRecurringModal: (bank: Bank) => void;
}

// Paleta interna
const P = {
  brand: '#4F6EF7',
  brandDark: '#3A58E0',
  brandLight: '#EEF1FE',
  success: '#16C784',
  danger: '#EF4444',
  surface: '#FFFFFF',
  bg: '#EFF1FB',
  border: '#E5E8F8',
  ink: '#111827',
  inkMuted: '#6B7280',
  inkSubtle: '#9CA3AF',
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  budget, 
  onEditBudget,
  banks,
  onAddBank,
  onDeleteBank,
  onEditBank,
  onOpenPrefilledTxModal,
  onOpenRecurringModal
}) => {
  const [longPressTimeout, setLongPressTimeout] = useState<any>(null);
  const [pressedBankId, setPressedBankId] = useState<string | null>(null);
  const [activeContextMenuBank, setActiveContextMenuBank] = useState<Bank | null>(null);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankBalance, setNewBankBalance] = useState('');
  const currentMonthTransactions = transactions; 

  const getSumByCategoryAndType = (category: string, type: 'expense' | 'transfer' | 'income') => {
    return currentMonthTransactions
      .filter(tx => tx.category === category && tx.type === type)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const spentFixos = getSumByCategoryAndType('Fixos', 'expense');
  const savedPoupanca = getSumByCategoryAndType('Poupança', 'transfer');
  const investedInvestimento = getSumByCategoryAndType('Investimento', 'transfer');
  const spentTransportes = getSumByCategoryAndType('Transportes', 'expense');
  const spentLazer = getSumByCategoryAndType('Lazer', 'expense');
  const spentOutrosExpense = getSumByCategoryAndType('Outros', 'expense');
  const spentPlafondReal = spentTransportes + spentLazer + spentOutrosExpense;
  
  const totalIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const effectiveSalary = budget.salary + totalIncome;
  const allocatedPlafondReal = Math.max(0, effectiveSalary - spentFixos - savedPoupanca - investedInvestimento);
  const remainingPlafondReal = allocatedPlafondReal - spentPlafondReal;

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const donutData = [
    { name: 'Transportes', value: spentTransportes, color: '#F97316', icon: Car },
    { name: 'Lazer', value: spentLazer, color: '#F59E0B', icon: Smile },
    { name: 'Poupança', value: savedPoupanca, color: '#8B5CF6', icon: PiggyBank },
    { name: 'Investimento', value: investedInvestimento, color: '#16C784', icon: TrendingUp },
    { name: 'Outros', value: spentOutrosExpense, color: '#94A3B8', icon: HelpCircle },
  ];

  const totalDonutSpent = donutData.reduce((s, d) => s + d.value, 0);
  const activeDonutData = donutData.filter(item => item.value > 0);

  const getBankBalance = (bankId: string) => {
    return transactions.reduce((balance, tx) => {
      if (tx.type === 'income' && tx.bankId === bankId) return balance + tx.amount;
      if ((tx.type === 'expense' || tx.type === 'transfer') && tx.bankId === bankId) return balance - tx.amount;
      if (tx.fromBankId === bankId) return balance - tx.amount;
      if (tx.toBankId === bankId) return balance + tx.amount;
      return balance;
    }, 0);
  };

  const patrimonioTotal = banks.reduce((sum, bank) => sum + getBankBalance(bank.id), 0);

  const handleAddBankClick = () => {
    setNewBankName('');
    setNewBankBalance('0');
    setIsAddingBank(true);
  };

  const startPress = (bank: Bank) => {
    setPressedBankId(bank.id);
    const timer = setTimeout(() => {
      handleEditBankPrompt(bank);
      setPressedBankId(null);
    }, 600);
    setLongPressTimeout(timer);
  };

  const cancelPress = () => {
    setPressedBankId(null);
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleEditBankPrompt = (bank: Bank) => {
    setActiveContextMenuBank(bank);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transportes': return { icon: Car,        color: '#F97316', bg: '#FFF7ED', border: '#FEDD9A' };
      case 'Lazer':       return { icon: Smile,      color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' };
      case 'Fixos':       return { icon: Shield,     color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
      case 'Poupança':    return { icon: PiggyBank,  color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' };
      case 'Investimento':return { icon: TrendingUp, color: '#16C784', bg: '#ECFDF5', border: '#A7F3D0' };
      case 'Salário':     return { icon: DollarSign, color: '#16C784', bg: '#ECFDF5', border: '#A7F3D0' };
      default:            return { icon: HelpCircle, color: '#94A3B8', bg: '#F8FAFC', border: '#E2E8F0' };
    }
  };

  // Bank card colors (cycling)
  const bankGradients = [
    'linear-gradient(135deg,#4F6EF7,#7C5CFC)',
    'linear-gradient(135deg,#06B6D4,#0EA5E9)',
    'linear-gradient(135deg,#16C784,#0891B2)',
    'linear-gradient(135deg,#F59E0B,#F97316)',
    'linear-gradient(135deg,#EF4444,#EC4899)',
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: `1.5px solid ${P.border}`,
    background: '#FFFFFF',
    color: P.ink,
    fontSize: '13px',
    fontWeight: 600,
    outline: 'none',
  };

  const modalStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '28px',
    border: `1px solid ${P.border}`,
    padding: '22px',
    width: '100%',
    maxWidth: '340px',
    boxShadow: '0 20px 60px rgba(79,110,247,0.15)',
  };

  return (
    <div className="px-4 pb-6 space-y-4" style={{paddingTop: '4px'}}>

      <>

          {/* 2. Hero Card — Patrimônio Total */}
          <div
            style={{
              background: 'linear-gradient(135deg,#4F6EF7 0%,#7C5CFC 100%)',
              borderRadius: '24px',
              padding: '22px 20px 20px',
              color: '#fff',
              boxShadow: '0 8px 32px rgba(79,110,247,0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative circles */}
            <div style={{position:'absolute',top:-30,right:-30,width:140,height:140,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}} />
            <div style={{position:'absolute',bottom:-20,right:40,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',position:'relative'}}>
              <div>
                <p style={{fontSize:10,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.7,marginBottom:4}}>
                  Património Total
                </p>
                <div style={{display:'flex',alignItems:'baseline',gap:2}}>
                  <span style={{fontSize:36,fontWeight:900,lineHeight:1,letterSpacing:'-0.02em'}}>
                    {patrimonioTotal < 0 ? '-' : ''}€{(() => {
                      const v = Math.abs(patrimonioTotal);
                      return v.toLocaleString('pt-PT', {minimumFractionDigits:2,maximumFractionDigits:2}).split(',')[0];
                    })()}
                  </span>
                  <span style={{fontSize:20,fontWeight:700,opacity:0.7}}>
                    ,{(() => {
                      const v = Math.abs(patrimonioTotal);
                      return v.toLocaleString('pt-PT', {minimumFractionDigits:2,maximumFractionDigits:2}).split(',')[1];
                    })()}
                  </span>
                </div>
              </div>
              <button
                onClick={onEditBudget}
                style={{width:36,height:36,borderRadius:'12px',background:'rgba(255,255,255,0.18)',border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}
              >
                <Bell style={{width:15,height:15,color:'#fff'}} />
              </button>
            </div>

            {/* Entradas vs Saídas */}
            <div style={{marginTop:18,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={{background:'rgba(255,255,255,0.15)',borderRadius:14,padding:'10px 12px'}}>
                <p style={{fontSize:9,fontWeight:700,opacity:0.7,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Entradas</p>
                <p style={{fontSize:15,fontWeight:900,letterSpacing:'-0.01em'}}>
                  +{formatEuro(currentMonthTransactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0))}
                </p>
              </div>
              <div style={{background:'rgba(255,255,255,0.15)',borderRadius:14,padding:'10px 12px'}}>
                <p style={{fontSize:9,fontWeight:700,opacity:0.7,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Saídas</p>
                <p style={{fontSize:15,fontWeight:900,letterSpacing:'-0.01em'}}>
                  -{formatEuro(currentMonthTransactions.filter(t => t.type !== 'income').reduce((s,t) => s + t.amount, 0))}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Botões Rápidos */}
          <div style={{display:'flex',gap:10}}>
            <button
              onClick={() => onOpenPrefilledTxModal('expense', banks[0]?.id || '')}
              style={{flex:1,padding:'13px 10px',borderRadius:'16px',background:'#FEF2F2',border:'1.5px solid #FECACA',color:'#EF4444',fontSize:12,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',transition:'all 0.2s'}}
            >
              <ArrowDownRight style={{width:16,height:16}} />
              Despesa
            </button>
            <button
              onClick={() => onOpenPrefilledTxModal('transfer', banks[0]?.id || '')}
              style={{width:46,height:46,borderRadius:'14px',background:'#FFFFFF',border:`1.5px solid ${P.border}`,color:P.inkMuted,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,boxShadow:`0 2px 8px rgba(79,110,247,0.06)`}}
            >
              <Repeat style={{width:16,height:16}} />
            </button>
            <button
              onClick={() => onOpenPrefilledTxModal('income', banks[0]?.id || '')}
              style={{flex:1,padding:'13px 10px',borderRadius:'16px',background:'#ECFDF5',border:'1.5px solid #A7F3D0',color:'#059669',fontSize:12,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',transition:'all 0.2s'}}
            >
              <ArrowUpRight style={{width:16,height:16}} />
              Receita
            </button>
          </div>

          {/* 4. Contas Bancárias */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,padding:'0 2px'}}>
              <span style={{fontSize:11,fontWeight:800,color:P.inkSubtle,letterSpacing:'0.08em',textTransform:'uppercase'}}>As Minhas Contas</span>
              <span style={{fontSize:9,fontWeight:600,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>Saldos Atuais</span>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {banks.map((bank, idx) => {
                const balance = getBankBalance(bank.id);
                const grad = bankGradients[idx % bankGradients.length];
                const initials = bank.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div
                    key={bank.id}
                    onTouchStart={() => startPress(bank)}
                    onTouchMove={cancelPress}
                    onTouchEnd={cancelPress}
                    onMouseDown={() => startPress(bank)}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      border: `1px solid ${P.border}`,
                      padding: '14px 14px 12px',
                      width: 130,
                      minWidth: 130,
                      height: 88,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: `0 2px 12px rgba(79,110,247,0.07)`,
                      transform: pressedBankId === bank.id ? 'scale(0.94)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    title="Mantém pressionado para gerir"
                  >
                    {/* Accent bar */}
                    <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:grad,borderRadius:'20px 20px 0 0'}} />

                    <div style={{display:'flex',alignItems:'center',gap:7,marginTop:4}}>
                      <div style={{width:22,height:22,borderRadius:8,background:grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:900,color:'#fff'}}>{initials}</span>
                      </div>
                      <span style={{fontSize:10,fontWeight:700,color:P.inkMuted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{bank.name}</span>
                    </div>

                    <span style={{fontSize:13,fontWeight:900,letterSpacing:'-0.02em',color: balance < 0 ? '#EF4444' : P.ink}}>
                      {formatEuro(balance)}
                    </span>

                    {banks.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteBank(bank.id); }}
                        style={{position:'absolute',top:8,right:8,width:18,height:18,borderRadius:6,background:'#FEF2F2',border:'1px solid #FECACA',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:0,transition:'opacity 0.2s'}}
                        className="group-hover:opacity-100"
                        title="Apagar"
                      >
                        <X style={{width:9,height:9,color:'#EF4444'}} />
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                onClick={handleAddBankClick}
                style={{background:'rgba(79,110,247,0.04)',borderRadius:'20px',border:`1.5px dashed #C7D2FE`,padding:'14px',width:130,minWidth:130,height:88,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,cursor:'pointer',flexShrink:0,transition:'all 0.2s'}}
              >
                <div style={{width:28,height:28,borderRadius:'50%',background:P.brandLight,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <Plus style={{width:14,height:14,color:P.brand}} />
                </div>
                <span style={{fontSize:9,fontWeight:800,color:P.brand,textTransform:'uppercase',letterSpacing:'0.06em'}}>Nova Conta</span>
              </button>
            </div>
          </div>

          {/* 5. Gráfico Donut */}
          {budget.salary > 0 && (
            <div style={{background:'#FFFFFF',borderRadius:'24px',border:`1px solid ${P.border}`,padding:'18px 16px',boxShadow:'0 2px 16px rgba(79,110,247,0.06)'}}>
              <div style={{marginBottom:14}}>
                <span style={{fontSize:11,fontWeight:800,color:P.inkSubtle,letterSpacing:'0.08em',textTransform:'uppercase'}}>Distribuição do Plafond</span>
                <p style={{fontSize:10,color:P.inkSubtle,marginTop:2}}>Despesas variáveis e poupança</p>
              </div>

              <div style={{position:'relative',height:160,display:'flex',alignItems:'center',justifyContent:'center'}}>
                {activeDonutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={4}
                        cornerRadius={6}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                    <div style={{width:40,height:40,borderRadius:'50%',background:P.brandLight,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <Info style={{width:18,height:18,color:P.brand}} />
                    </div>
                    <p style={{fontSize:11,color:P.inkSubtle,textAlign:'center'}}>Sem despesas do Plafond</p>
                  </div>
                )}

                {activeDonutData.length > 0 && (
                  <div style={{position:'absolute',display:'flex',flexDirection:'column',alignItems:'center',pointerEvents:'none'}}>
                    <span style={{fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',color:P.inkSubtle}}>Plafond Livre</span>
                    <span style={{fontSize:16,fontWeight:900,color: remainingPlafondReal < 0 ? '#EF4444' : P.ink}}>
                      {formatEuro(remainingPlafondReal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Legenda */}
              <div style={{borderTop:`1px solid ${P.border}`,paddingTop:12,marginTop:4,display:'flex',flexDirection:'column',gap:6}}>
                {donutData.filter(i => i.value > 0).map((item, idx) => {
                  const IconComponent = item.icon;
                  const pct = totalDonutSpent > 0 ? (item.value / totalDonutSpent) * 100 : 0;
                  return (
                    <div key={idx} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 6px',borderRadius:12}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{width:30,height:30,borderRadius:'50%',background:`${item.color}15`,display:'flex',alignItems:'center',justifyContent:'center',border:`1px solid ${item.color}25`}}>
                          <IconComponent style={{width:14,height:14,color:item.color}} />
                        </div>
                        <div>
                          <p style={{fontSize:12,fontWeight:700,color:P.ink}}>{item.name}</p>
                          <p style={{fontSize:10,color:P.inkSubtle}}>{pct.toFixed(0)}% do total</p>
                        </div>
                      </div>
                      <span style={{fontSize:12,fontWeight:900,color:P.ink}}>{formatEuro(item.value)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Últimos Movimentos */}
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,padding:'0 2px'}}>
              <span style={{fontSize:11,fontWeight:800,color:P.inkSubtle,letterSpacing:'0.08em',textTransform:'uppercase'}}>Últimos Movimentos</span>
              <span style={{fontSize:9,fontWeight:600,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.06em'}}>Recente</span>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {currentMonthTransactions.length === 0 ? (
                <div style={{background:'#FFFFFF',borderRadius:20,border:`1px solid ${P.border}`,padding:'32px 20px',textAlign:'center'}}>
                  <p style={{fontSize:12,color:P.inkSubtle}}>Nenhuma transação registada.</p>
                </div>
              ) : (
                currentMonthTransactions.slice(0, 5).map((tx) => {
                  const catD = getCategoryIcon(tx.category);
                  const Icon = catD.icon;
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const amountColor = isIncome ? '#16C784' : isTransfer ? '#8B5CF6' : '#EF4444';
                  const amountPrefix = isIncome ? '+' : '-';

                  return (
                    <div
                      key={tx.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '18px',
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
                      {/* Left color bar */}
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:catD.color,borderRadius:'18px 0 0 18px'}} />

                      <div style={{display:'flex',alignItems:'center',gap:10,paddingLeft:6}}>
                        <div style={{width:36,height:36,borderRadius:'50%',background:catD.bg,border:`1px solid ${catD.border}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <Icon style={{width:15,height:15,color:catD.color}} />
                        </div>
                        <div>
                          <p style={{fontSize:12,fontWeight:700,color:P.ink,lineHeight:1.3}}>{tx.description}</p>
                          <p style={{fontSize:10,color:P.inkSubtle,marginTop:2}}>
                            {tx.category} · {tx.date}
                            {tx.bankId && banks.find(b => b.id === tx.bankId) && (
                              <span style={{marginLeft:6,background:P.brandLight,color:P.brand,borderRadius:999,padding:'1px 6px',fontSize:9,fontWeight:700}}>
                                {banks.find(b => b.id === tx.bankId)?.name}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <span style={{fontSize:13,fontWeight:900,color:amountColor,flexShrink:0,paddingLeft:8}}>
                        {amountPrefix}{formatEuro(tx.amount)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
      </>


      {/* iOS Context Menu */}
      {activeContextMenuBank && (
        <div
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'24px'}}
          onClick={() => setActiveContextMenuBank(null)}
        >
          <div
            style={{...modalStyle,maxWidth:300}}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{textAlign:'center',borderBottom:`1px solid ${P.border}`,paddingBottom:14,marginBottom:4}}>
              <h4 style={{fontSize:14,fontWeight:900,color:P.ink}}>{activeContextMenuBank.name}</h4>
              <p style={{fontSize:10,color:P.inkSubtle,marginTop:2}}>Gestão de Conta</p>
            </div>

            {[
              { label: 'Nova Despesa',             icon: ArrowDownRight, color: '#EF4444', fn: () => { onOpenPrefilledTxModal('expense', activeContextMenuBank.id); setActiveContextMenuBank(null); }},
              { label: 'Nova Receita',              icon: ArrowUpRight,   color: '#16C784', fn: () => { onOpenPrefilledTxModal('income', activeContextMenuBank.id); setActiveContextMenuBank(null); }},
              { label: 'Assinaturas / Recorrências',icon: Repeat,        color: P.brand,   fn: () => { onOpenRecurringModal(activeContextMenuBank); setActiveContextMenuBank(null); }},
              { label: 'Editar Conta',              icon: Edit3,          color: P.brand,   fn: () => { setEditingBank(activeContextMenuBank); setEditName(activeContextMenuBank.name); setEditBalance(getBankBalance(activeContextMenuBank.id).toString()); setActiveContextMenuBank(null); }},
            ].map(({label, icon: Icon, color, fn}) => (
              <button
                key={label}
                onClick={fn}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 4px',borderBottom:`1px solid ${P.border}`,background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,color:P.ink,textAlign:'left' as const}}
              >
                <span>{label}</span>
                <Icon style={{width:16,height:16,color,flexShrink:0}} />
              </button>
            ))}

            {banks.length > 1 && (
              <button
                onClick={() => { onDeleteBank(activeContextMenuBank.id); setActiveContextMenuBank(null); }}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 4px',background:'none',border:'none',cursor:'pointer',fontSize:13,fontWeight:700,color:'#EF4444',textAlign:'left',marginTop:4}}
              >
                <span>Eliminar Conta</span>
                <Trash2 style={{width:16,height:16,color:'#EF4444'}} />
              </button>
            )}

            <button
              onClick={() => setActiveContextMenuBank(null)}
              style={{width:'100%',marginTop:14,padding:'12px',borderRadius:12,background:P.brandLight,border:'none',fontSize:12,fontWeight:800,color:P.brand,cursor:'pointer'}}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit Bank Modal */}
      {editingBank && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={modalStyle}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h4 style={{fontSize:14,fontWeight:900,color:P.ink}}>Editar Conta</h4>
              <button onClick={() => setEditingBank(null)} style={{width:32,height:32,borderRadius:10,background:P.brandLight,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <X style={{width:14,height:14,color:P.brand}} />
              </button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:18}}>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>Nome da Conta</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>Saldo Atual</label>
                <input type="text" value={editBalance} onChange={e => setEditBalance(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <button
              onClick={() => {
                if (!editName.trim()) { alert('O nome não pode estar vazio!'); return; }
                const p = parseFloat(editBalance.replace(',', '.'));
                if (isNaN(p)) { alert('Saldo inválido.'); return; }
                onEditBank(editingBank.id, editName.trim(), p);
                setEditingBank(null);
              }}
              style={{width:'100%',padding:'14px',borderRadius:'14px',background:`linear-gradient(135deg,${P.brand},#7C5CFC)`,color:'#fff',fontSize:12,fontWeight:800,letterSpacing:'0.06em',border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(79,110,247,0.35)'}}
            >
              Gravar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {isAddingBank && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
          <div style={modalStyle}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h4 style={{fontSize:14,fontWeight:900,color:P.ink}}>Nova Conta / Banco</h4>
              <button onClick={() => setIsAddingBank(false)} style={{width:32,height:32,borderRadius:10,background:P.brandLight,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <X style={{width:14,height:14,color:P.brand}} />
              </button>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:18}}>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>Nome do Banco / Conta</label>
                <input
                  type="text"
                  placeholder="ActivoBank, Revolut, Dinheiro…"
                  value={newBankName}
                  onChange={e => setNewBankName(e.target.value)}
                  style={{...inputStyle,color: newBankName ? P.ink : P.inkSubtle}}
                  autoFocus
                />
              </div>
              <div>
                <label style={{fontSize:10,fontWeight:800,color:P.inkSubtle,textTransform:'uppercase',letterSpacing:'0.08em',display:'block',marginBottom:6}}>Saldo Inicial</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newBankBalance}
                  onChange={e => setNewBankBalance(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!newBankName.trim()) { alert('O nome não pode estar vazio!'); return; }
                const p = parseFloat(newBankBalance.replace(',', '.'));
                if (isNaN(p) || p < 0) { alert('Saldo inicial inválido.'); return; }
                onAddBank(newBankName.trim(), p);
                setIsAddingBank(false);
              }}
              style={{width:'100%',padding:'14px',borderRadius:'14px',background:`linear-gradient(135deg,${P.brand},#7C5CFC)`,color:'#fff',fontSize:12,fontWeight:800,letterSpacing:'0.06em',border:'none',cursor:'pointer',boxShadow:'0 6px 20px rgba(79,110,247,0.35)'}}
            >
              Criar Conta
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
