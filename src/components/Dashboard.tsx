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
  Repeat
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

  // Soma de gastos por categoria e tipo
  const getSumByCategoryAndType = (category: string, type: 'expense' | 'transfer' | 'income') => {
    return currentMonthTransactions
      .filter(tx => tx.category === category && tx.type === type)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const spentFixos = getSumByCategoryAndType('Fixos', 'expense');
  const savedPoupanca = getSumByCategoryAndType('Poupança', 'transfer');
  const investedInvestimento = getSumByCategoryAndType('Investimento', 'transfer');
  
  // Plafond Real (gastos variáveis)
  const spentTransportes = getSumByCategoryAndType('Transportes', 'expense');
  const spentLazer = getSumByCategoryAndType('Lazer', 'expense');
  const spentOutrosExpense = getSumByCategoryAndType('Outros', 'expense');
  
  const spentPlafondReal = spentTransportes + spentLazer + spentOutrosExpense;
  
  // Total de rendas/salários adicionadas no mês
  const totalIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Salário Efetivo é a soma do salário base com as rendas adicionadas
  const effectiveSalary = budget.salary + totalIncome;

  // Plafond Real Alocado é o salário efetivo menos o que foi para Fixos, Poupança e Investimento
  const allocatedPlafondReal = Math.max(0, effectiveSalary - spentFixos - savedPoupanca - investedInvestimento);
  const remainingPlafondReal = allocatedPlafondReal - spentPlafondReal;

  // Gasto/Saída total do mês (Fixos + Poupança + Investimento + Plafond Real)
  const totalSpent = spentFixos + savedPoupanca + investedInvestimento + spentPlafondReal;





  // Formato Monetário
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  // Dados para o Gráfico Circular (Donut) - Inclui Despesas Variáveis e Reforços de Metas (Poupança/Investimento)
  const donutData = [
    { name: 'Transportes / Gasóleo', value: spentTransportes, color: '#f97316', icon: Car },
    { name: 'Lazer', value: spentLazer, color: '#eab308', icon: Smile },
    { name: 'Poupança (TV/Câmara)', value: savedPoupanca, color: '#a855f7', icon: PiggyBank },
    { name: 'Investimento (T212)', value: investedInvestimento, color: '#10b981', icon: TrendingUp },
    { name: 'Outros', value: spentOutrosExpense, color: '#64748b', icon: HelpCircle }
  ];

  const totalDonutSpent = spentTransportes + spentLazer + spentOutrosExpense + savedPoupanca + investedInvestimento;
  const activeDonutData = donutData.filter(item => item.value > 0);

  // Calcular saldo de cada banco individualmente com base em todo o histórico
  const getBankBalance = (bankId: string) => {
    return transactions.reduce((balance, tx) => {
      // Entrada direta
      if (tx.type === 'income' && tx.bankId === bankId) {
        return balance + tx.amount;
      }
      // Saída direta (Despesa ou Transferência de Reforço de meta)
      if ((tx.type === 'expense' || tx.type === 'transfer') && tx.bankId === bankId) {
        return balance - tx.amount;
      }
      // Transferência entre contas: Sai da Origem
      if (tx.fromBankId === bankId) {
        return balance - tx.amount;
      }
      // Transferência entre contas: Entra no Destino
      if (tx.toBankId === bankId) {
        return balance + tx.amount;
      }
      return balance;
    }, 0);
  };

  // Património Total é a soma de todos os saldos bancários
  const patrimonioTotal = banks.reduce((sum, bank) => sum + getBankBalance(bank.id), 0);

  const handleAddBankClick = () => {
    setNewBankName('');
    setNewBankBalance('0');
    setIsAddingBank(true);
  };

  // Funções de Toque Longo (Long-Press) para editar bancos
  const startPress = (bank: Bank) => {
    setPressedBankId(bank.id);
    const timer = setTimeout(() => {
      handleEditBankPrompt(bank);
      setPressedBankId(null);
    }, 600); // 600ms de press
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

  // Icon mapping para as transações recentes
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Transportes': return { icon: Car, color: '#f97316', border: 'border-cat-orange/20', bg: 'bg-cat-orange/10' };
      case 'Lazer': return { icon: Smile, color: '#eab308', border: 'border-cat-yellow/20', bg: 'bg-cat-yellow/10' };
      case 'Fixos': return { icon: Shield, color: '#ef4444', border: 'border-cat-red/20', bg: 'bg-cat-red/10' };
      case 'Poupança': return { icon: PiggyBank, color: '#a855f7', border: 'border-cat-purple/20', bg: 'bg-cat-purple/10' };
      case 'Investimento': return { icon: TrendingUp, color: '#10b981', border: 'border-cat-green/20', bg: 'bg-cat-green/10' };
      case 'Salário': return { icon: DollarSign, color: '#10b981', border: 'border-cat-green/20', bg: 'bg-cat-green/10' };
      default: return { icon: HelpCircle, color: '#64748b', border: 'border-cat-gray/20', bg: 'bg-cat-gray/10' };
    }
  };

  return (
    <div className="px-4 pb-6 space-y-5">
      
      {/* 1. Onboarding inicial caso o salário efetivo seja 0 */}
      {effectiveSalary === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 mt-2 text-center space-y-4 shadow-premium animate-in fade-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-full bg-purple-50 border border-purple-100 text-brand-purple flex items-center justify-center mx-auto shadow-sm">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-brand-dark">Bem-vindo ao All My Money</h3>
            <p className="text-xs text-gray-400 max-w-[280px] mx-auto leading-relaxed">
              Vamos começar a organizar o teu dinheiro. Registar uma **Renda** (ex: o teu salário) ou define o teu salário de referência base.
            </p>
          </div>
          <button
            onClick={onEditBudget}
            className="w-full py-3.5 bg-gradient-to-tr from-brand-purple to-brand-purple-dark text-white text-xs font-bold rounded-full shadow-purple-glow hover:scale-[1.02] active:scale-98 transition-transform"
          >
            Definir Salário de Referência
          </button>
        </div>
      ) : (
        <>
          {/* 2. Topo Premium "Património Total" */}
          <div className="bg-gradient-to-tr from-[#4c2d99] via-[#633bbf] to-[#05bde8] rounded-[32px] p-5 mt-2 relative overflow-hidden shadow-premium">
            {/* Decorações em degradê de fundo */}
            <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 rounded-full bg-indigo-500/20 blur-xl pointer-events-none" />
            
            <div className="relative space-y-4">
              {/* Título */}
              <div className="flex justify-between items-center text-white/90">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-200">Património Total</span>
              </div>

              {/* Património Principal */}
              <p className="text-3xl font-black text-white tracking-tight">
                {formatEuro(patrimonioTotal)}
              </p>

              {/* Cartão de Overlay Branco */}
              <div className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center text-brand-dark">
                {/* Salário Líquido (Start Income) */}
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Entradas do Mês (In)</span>
                  <div className="flex items-center gap-1 text-xs font-extrabold text-cat-green">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatEuro(effectiveSalary)}</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-100" />

                {/* Despesas Totais */}
                <div className="space-y-0.5 text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Saídas do Mês (Out)</span>
                  <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-cat-red">
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                    <span>-{formatEuro(totalSpent)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Secção "As Minhas Contas" horizontal */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">As Minhas Contas</h3>
              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Saldos Atuais</span>
            </div>
            
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-0.5">
              {banks.map(bank => {
                const balance = getBankBalance(bank.id);
                return (
                  <div 
                    key={bank.id} 
                    onTouchStart={() => startPress(bank)}
                    onTouchMove={cancelPress}
                    onTouchEnd={cancelPress}
                    onMouseDown={() => startPress(bank)}
                    onMouseUp={cancelPress}
                    onMouseLeave={cancelPress}
                    className={`bg-white rounded-2xl border p-3.5 shadow-premium w-32 shrink-0 relative overflow-hidden flex flex-col justify-between h-20 transition-all duration-300 group select-none cursor-pointer ${
                      pressedBankId === bank.id 
                        ? 'scale-[0.94] border-brand-purple/30 bg-slate-100/50 brightness-95' 
                        : 'border-slate-100 hover:translate-y-[-1px]'
                    }`}
                    title="Mantém pressionado para editar/gerir"
                  >
                    {/* Botão de Apagar discreto se houver mais que 1 conta */}
                    {banks.length > 1 && (
                      <button
                        onClick={() => onDeleteBank(bank.id)}
                        className="absolute right-1.5 top-1.5 text-slate-300 hover:text-cat-red opacity-0 group-hover:opacity-100 transition-opacity w-4.5 h-4.5 flex items-center justify-center rounded-full bg-slate-50 border border-slate-150"
                        title="Apagar Conta"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                    
                    <span className="text-[10px] font-bold text-slate-500 truncate pr-4">{bank.name}</span>
                    <span className={`text-xs font-black tracking-tight ${balance < 0 ? 'text-cat-red' : 'text-cat-green'}`}>
                      {formatEuro(balance)}
                    </span>
                  </div>
                );
              })}

              {/* Botão dashed de Nova Conta */}
              <button
                onClick={handleAddBankClick}
                className="bg-white/50 rounded-2xl border border-dashed border-slate-350 p-3.5 w-32 shrink-0 flex flex-col items-center justify-center h-20 text-slate-400 hover:border-brand-purple hover:text-brand-purple transition-custom cursor-pointer"
              >
                <Plus className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Novo Banco</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 4. Secção Gráfico Circular "Divisão do Plafond" */}
      {budget.salary > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 shadow-premium">
          <div>
            <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Divisão do Plafond</h3>
            <p className="text-xxs text-slate-400 mt-0.5">Foco apenas em despesas variáveis</p>
          </div>

          {/* Gráfico Donut (Estático, Não Clicável/Hoverable) */}
          <div className="relative h-44 flex items-center justify-center pointer-events-none select-none">
            {activeDonutData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={70}
                    paddingAngle={5}
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
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-2">
                  <Info className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xxs text-slate-400 max-w-[200px]">Sem despesas do Plafond este mês.</p>
              </div>
            )}

            {activeDonutData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Plafond Rest.</span>
                <span className={`text-sm font-black ${remainingPlafondReal < 0 ? 'text-cat-red' : 'text-brand-dark'}`}>{formatEuro(remainingPlafondReal)}</span>
              </div>
            )}
          </div>

          {/* Legenda Detalhada */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-50">
            {donutData.map((item, idx) => {
              const IconComponent = item.icon;
              const percentage = totalDonutSpent > 0 ? (item.value / totalDonutSpent) * 100 : 0;
              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-custom"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center border"
                      style={{ borderColor: `${item.color}22`, backgroundColor: `${item.color}08` }}
                    >
                      <IconComponent className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-dark">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{percentage.toFixed(0)}% do Plafond</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-brand-dark">{formatEuro(item.value)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Acesso rápido às transações recentes (Cartões Flutuantes como na imagem) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest">Últimos Movimentos</h3>
          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Histórico Recente</span>
        </div>

        <div className="space-y-2.5">
          {currentMonthTransactions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center shadow-premium">
              <p className="text-xxs text-slate-400">Nenhuma transação registada.</p>
            </div>
          ) : (
            currentMonthTransactions.slice(0, 3).map((tx) => {
              const catDetails = getCategoryIcon(tx.category);
              const Icon = catDetails.icon;

              return (
                <div 
                  key={tx.id} 
                  className="bg-white rounded-[24px] border border-slate-100 p-3.5 shadow-premium flex items-center justify-between transition-custom hover:translate-y-[-2px] relative overflow-hidden"
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
                      <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{tx.category}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                        {/* Badge do Banco */}
                        {tx.fromBankId && tx.toBankId ? (
                          <span className="bg-purple-50 text-brand-purple border border-purple-100/50 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                            {banks.find(b => b.id === tx.fromBankId)?.name} ➔ {banks.find(b => b.id === tx.toBankId)?.name}
                          </span>
                        ) : tx.bankId ? (
                          <span className="bg-slate-55 text-slate-500 border border-slate-200/50 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                            {banks.find(b => b.id === tx.bankId)?.name}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right pr-1 font-black text-xs">
                    {tx.type === 'income' ? (
                      <span className="text-cat-green">+{formatEuro(tx.amount)}</span>
                    ) : tx.type === 'transfer' ? (
                      <span className="text-brand-purple">-{formatEuro(tx.amount)}</span>
                    ) : (
                      <span className="text-cat-red">-{formatEuro(tx.amount)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* iOS Context Menu Backdrop */}
      {activeContextMenuBank && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-6 animate-in fade-in duration-200" 
          onClick={() => setActiveContextMenuBank(null)}
        >
          <div 
            className="bg-white/90 backdrop-blur-md rounded-[24px] border border-slate-100/50 shadow-premium w-full max-w-[280px] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 text-center">
              <h4 className="text-xs font-black text-brand-dark truncate">{activeContextMenuBank.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Gestão de Conta</p>
            </div>
            
            {/* Opções */}
            <div className="flex flex-col">
              <button
                onClick={() => {
                  onOpenPrefilledTxModal('expense', activeContextMenuBank.id);
                  setActiveContextMenuBank(null);
                }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 border-b border-slate-50 transition-custom text-left text-xs font-bold text-brand-dark"
              >
                <span>Nova Despesa</span>
                <ArrowDownRight className="w-4 h-4 text-cat-red" />
              </button>
              
              <button
                onClick={() => {
                  onOpenPrefilledTxModal('income', activeContextMenuBank.id);
                  setActiveContextMenuBank(null);
                }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 border-b border-slate-50 transition-custom text-left text-xs font-bold text-brand-dark"
              >
                <span>Nova Renda</span>
                <ArrowUpRight className="w-4 h-4 text-cat-green" />
              </button>
              
              <button
                onClick={() => {
                  onOpenRecurringModal(activeContextMenuBank);
                  setActiveContextMenuBank(null);
                }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 border-b border-slate-50 transition-custom text-left text-xs font-bold text-brand-dark"
              >
                <span>Assinaturas / Recorrências</span>
                <Repeat className="w-4 h-4 text-brand-purple" />
              </button>
              
              <button
                onClick={() => {
                  setEditingBank(activeContextMenuBank);
                  setEditName(activeContextMenuBank.name);
                  setEditBalance(getBankBalance(activeContextMenuBank.id).toString());
                  setActiveContextMenuBank(null);
                }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 border-b border-slate-50 transition-custom text-left text-xs font-bold text-brand-dark"
              >
                <span>Editar Conta</span>
                <Edit3 className="w-4 h-4 text-brand-purple" />
              </button>
              
              {banks.length > 1 && (
                <button
                  onClick={() => {
                    onDeleteBank(activeContextMenuBank.id);
                    setActiveContextMenuBank(null);
                  }}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-custom text-left text-xs font-bold text-cat-red"
                >
                  <span>Eliminar Conta</span>
                  <Trash2 className="w-4 h-4 text-cat-red" />
                </button>
              )}
            </div>
            
            {/* Fechar */}
            <button 
              onClick={() => setActiveContextMenuBank(null)}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 border-t border-slate-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Edit Bank Modal Overlay */}
      {editingBank && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-slate-50 w-full max-w-sm rounded-[32px] border border-slate-100 p-5 shadow-premium space-y-4.5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest">Editar Conta</h4>
              <button
                onClick={() => setEditingBank(null)}
                className="w-7 h-7 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-custom"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Nome da Conta</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark text-xs font-bold shadow-premium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Saldo Atual</label>
                <input
                  type="text"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark text-xs font-bold shadow-premium"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!editName.trim()) {
                  alert('O nome do banco não pode estar vazio!');
                  return;
                }
                const parsed = parseFloat(editBalance.replace(',', '.'));
                if (isNaN(parsed)) {
                  alert('Introduz um saldo válido.');
                  return;
                }
                onEditBank(editingBank.id, editName.trim(), parsed);
                setEditingBank(null);
              }}
              className="w-full py-3.5 bg-gradient-to-tr from-brand-purple to-brand-purple-dark text-white rounded-full text-xs font-black uppercase tracking-widest shadow-purple-glow hover:scale-[1.01] active:scale-99 transition-transform"
            >
              Gravar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Add Bank Modal Overlay */}
      {isAddingBank && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-in fade-in duration-200">
          <div className="bg-slate-50 w-full max-w-sm rounded-[32px] border border-slate-100 p-5 shadow-premium space-y-4.5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-brand-dark uppercase tracking-widest">Nova Conta / Banco</h4>
              <button
                onClick={() => setIsAddingBank(false)}
                className="w-7 h-7 rounded-full bg-white border border-slate-150 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-custom"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Nome do Banco/Conta</label>
                <input
                  type="text"
                  placeholder="Ex: ActivoBank, Santander, Revolut, Dinheiro..."
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark text-xs font-bold shadow-premium"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs font-extrabold text-slate-400 uppercase tracking-widest px-1">Saldo Inicial</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={newBankBalance}
                  onChange={(e) => setNewBankBalance(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:border-brand-purple text-brand-dark text-xs font-bold shadow-premium"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!newBankName.trim()) {
                  alert('O nome do banco não pode estar vazio!');
                  return;
                }
                const parsed = parseFloat(newBankBalance.replace(',', '.'));
                if (isNaN(parsed) || parsed < 0) {
                  alert('Introduz um saldo inicial válido igual ou superior a 0.');
                  return;
                }
                onAddBank(newBankName.trim(), parsed);
                setIsAddingBank(false);
              }}
              className="w-full py-3.5 bg-gradient-to-tr from-brand-purple to-brand-purple-dark text-white rounded-full text-xs font-black uppercase tracking-widest shadow-purple-glow hover:scale-[1.01] active:scale-99 transition-transform"
            >
              Criar Conta
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
