import { useState, useEffect } from 'react';
import { 
  Home, 
  TrendingUp, 
  Target, 
  FileText, 
  Plus, 
  WifiOff 
} from 'lucide-react';
import { 
  getTransactions, 
  saveTransactions, 
  getBudget, 
  saveBudget, 
  getGoals, 
  saveGoals 
} from './db';
import { 
  MOCK_BUDGET, 
  MOCK_GOALS, 
  MOCK_TRANSACTIONS 
} from './mockData';
import type { 
  Transaction, 
  BudgetAllocation, 
  SavingGoal,
  TransactionCategory
} from './types';

// Views
import { Dashboard } from './components/Dashboard';
import { Evolution } from './components/Evolution';
import { Goals } from './components/Goals';
import { Ledger } from './components/Ledger';

// Modals
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';

function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'evolution' | 'goals' | 'ledger'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<BudgetAllocation>(MOCK_BUDGET);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  
  // Modals
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  
  // Estado de rede/offline
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Inicializar e carregar dados locais
  useEffect(() => {
    async function loadData() {
      // 1. Carregar Orçamento
      const localBudget = await getBudget();
      if (localBudget) {
        setBudget(localBudget);
      } else {
        await saveBudget(MOCK_BUDGET);
        setBudget(MOCK_BUDGET);
      }

      // 2. Carregar Transações
      const localTxs = await getTransactions();
      if (localTxs && localTxs.length > 0) {
        setTransactions(localTxs);
      } else {
        await saveTransactions(MOCK_TRANSACTIONS);
        setTransactions(MOCK_TRANSACTIONS);
      }

      // 3. Carregar Metas
      const localGoals = await getGoals();
      if (localGoals && localGoals.length > 0) {
        setGoals(localGoals);
      } else {
        await saveGoals(MOCK_GOALS);
        setGoals(MOCK_GOALS);
      }
    }
    
    loadData();

    // Eventos de Conetividade
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handler para adicionar transação
  const handleAddTransaction = async (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: 'tx-' + Date.now()
    };
    
    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    await saveTransactions(updatedTxs);

    // Ajustar metas dinamicamente se a transação for do tipo "Poupança" ou "Investimento"
    // e o utilizador a introduziu manualmente
    if (newTxData.category === 'Poupança' || newTxData.category === 'Investimento') {
      // Encontrar uma meta que corresponda à categoria (e tentar associar pela descrição)
      const matchingGoal = goals.find(g => 
        g.category === newTxData.category && 
        newTxData.description.toLowerCase().includes(g.title.toLowerCase())
      );
      
      if (matchingGoal) {
        const updatedGoals = goals.map(g => {
          if (g.id === matchingGoal.id) {
            return { ...g, current: g.current + newTxData.amount };
          }
          return g;
        });
        setGoals(updatedGoals);
        await saveGoals(updatedGoals);
      }
    }
  };

  // Handler para eliminar transação
  const handleDeleteTransaction = async (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    const updatedTxs = transactions.filter(tx => tx.id !== id);
    setTransactions(updatedTxs);
    await saveTransactions(updatedTxs);

    // Se a transação eliminada for um reforço de meta, deduzir o valor da meta
    if (txToDelete && txToDelete.description.startsWith('Reforço: ')) {
      const goalTitle = txToDelete.description.replace('Reforço: ', '');
      const updatedGoals = goals.map(g => {
        if (g.title === goalTitle) {
          return { ...g, current: Math.max(0, g.current - txToDelete.amount) };
        }
        return g;
      });
      setGoals(updatedGoals);
      await saveGoals(updatedGoals);
    }
  };

  // Handler para adicionar meta
  const handleAddGoal = async (newGoalData: Omit<SavingGoal, 'id'>) => {
    const newGoal: SavingGoal = {
      ...newGoalData,
      id: 'goal-' + Date.now()
    };
    
    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);
  };

  // Handler para eliminar meta
  const handleDeleteGoal = async (id: string) => {
    const updatedGoals = goals.filter(g => g.id !== id);
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);
  };

  // Handler para reforço de metas direto
  const handleContributeToGoal = async (goalId: string, amount: number) => {
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    // 1. Atualizar meta
    const updatedGoals = goals.map(g => {
      if (g.id === goalId) {
        return { ...g, current: g.current + amount };
      }
      return g;
    });
    setGoals(updatedGoals);
    await saveGoals(updatedGoals);

    // 2. Registar transação correspondente
    const contributionTx: Transaction = {
      id: 'tx-' + Date.now(),
      description: `Reforço: ${targetGoal.title}`,
      amount,
      type: 'expense',
      category: targetGoal.category as TransactionCategory,
      date: new Date().toISOString().split('T')[0]
    };
    
    const updatedTxs = [contributionTx, ...transactions];
    setTransactions(updatedTxs);
    await saveTransactions(updatedTxs);
  };

  // Handler para atualizar orçamento
  const handleSaveBudget = async (newBudget: BudgetAllocation) => {
    setBudget(newBudget);
    await saveBudget(newBudget);
  };

  // Render da view selecionada na dock
  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Dashboard 
            transactions={transactions} 
            budget={budget}
            onEditBudget={() => setIsBudgetOpen(true)}
          />
        );
      case 'evolution':
        return <Evolution />;
      case 'goals':
        return (
          <Goals 
            goals={goals} 
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
            onContributeToGoal={handleContributeToGoal}
          />
        );
      case 'ledger':
        return (
          <Ledger 
            transactions={transactions} 
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative overflow-hidden font-sans antialiased selection:bg-brand-gray select-none">
      
      {/* Cabeçalho da App */}
      <header className="px-5 pt-6 pb-4 flex justify-between items-center bg-white border-b border-brand-border shrink-0 safe-pt">
        <div>
          <h1 className="text-lg font-extrabold text-brand-dark tracking-tight">GerePoup</h1>
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">Finanças Offline</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-cat-red bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              <WifiOff className="w-2.5 h-2.5" /> Offline
            </span>
          )}
          <span className="w-2 h-2 rounded-full bg-cat-green animate-pulse" />
        </div>
      </header>

      {/* Conteúdo Principal (Scrollable) */}
      {renderActiveView()}

      {/* Barra de Navegação Inferior (Dock Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border px-4 pt-2 pb-4 safe-pb flex justify-between items-center shadow-lg rounded-t-2xl">
        
        {/* Aba Início */}
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-custom ${
            currentTab === 'home' ? 'text-brand-dark font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="text-[9px] uppercase tracking-wider">Início</span>
        </button>

        {/* Aba Evolução */}
        <button
          onClick={() => setCurrentTab('evolution')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-custom ${
            currentTab === 'evolution' ? 'text-brand-dark font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="text-[9px] uppercase tracking-wider">Evolução</span>
        </button>

        {/* Botão de Ação Central [ ➕ Novo ] */}
        <button
          onClick={() => setIsTxOpen(true)}
          className="w-12 h-12 rounded-full bg-brand-dark text-white flex items-center justify-center shadow-lg -translate-y-4 border-4 border-white hover:bg-slate-800 transition-transform active:scale-95"
          title="Registar Despesa"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Aba Metas */}
        <button
          onClick={() => setCurrentTab('goals')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-custom ${
            currentTab === 'goals' ? 'text-brand-dark font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="text-[9px] uppercase tracking-wider">Metas</span>
        </button>

        {/* Aba Extrato */}
        <button
          onClick={() => setCurrentTab('ledger')}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-custom ${
            currentTab === 'ledger' ? 'text-brand-dark font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="text-[9px] uppercase tracking-wider">Extrato</span>
        </button>

      </nav>

      {/* Modals da Aplicação */}
      <TransactionModal 
        isOpen={isTxOpen} 
        onClose={() => setIsTxOpen(false)} 
        onAddTransaction={handleAddTransaction} 
      />

      <BudgetModal 
        isOpen={isBudgetOpen} 
        onClose={() => setIsBudgetOpen(false)} 
        budget={budget} 
        onSaveBudget={handleSaveBudget} 
      />

    </div>
  );
}

export default App;
