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

function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'evolution' | 'goals' | 'ledger'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<BudgetAllocation>(MOCK_BUDGET);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  
  // Modals
  const [isTxOpen, setIsTxOpen] = useState(false);
  
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

  // Handler para atualizar o salário de referência por prompt
  const handleEditSalary = async () => {
    const newSalaryStr = prompt('Qual é o teu Salário Líquido de Referência?', budget.salary.toString());
    if (newSalaryStr === null) return;
    const newSalary = parseFloat(newSalaryStr);
    if (!isNaN(newSalary) && newSalary >= 0) {
      const updatedBudget = { ...budget, salary: newSalary };
      setBudget(updatedBudget);
      await saveBudget(updatedBudget);
    }
  };

  // Handler para limpar todos os dados e recomeçar do zero
  const handleClearAllData = async () => {
    if (window.confirm('Tens a certeza que queres apagar todos os dados e começar do zero? Esta ação é irreversível.')) {
      const { clear } = await import('idb-keyval');
      await clear();
      localStorage.clear();
      window.location.reload();
    }
  };

  // Render da view selecionada na dock
  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Dashboard 
            transactions={transactions} 
            budget={budget}
            onEditBudget={handleEditSalary}
          />
        );
      case 'evolution':
        return <Evolution transactions={transactions} />;
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
    <div className="h-[100dvh] w-full bg-gradient-to-tr from-purple-100/40 via-slate-50 to-pink-50/20 flex flex-col relative overflow-hidden font-sans antialiased selection:bg-purple-100 select-none">
      
      {/* Cabeçalho da App (Flutuante sobre o Gradiente) */}
      <header className="px-5 pt-6 pb-3 flex justify-between items-center bg-transparent shrink-0 safe-pt">
        <div>
          <h1 className="text-lg font-black text-brand-dark tracking-tight">GerePoup</h1>
          <p className="text-[10px] text-brand-purple font-bold tracking-wider uppercase mt-0.5">Finanças Privadas</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleClearAllData}
            className="text-[9px] font-bold text-gray-400 hover:text-cat-red uppercase tracking-wider transition-custom"
            title="Recomeçar do zero"
          >
            Reiniciar
          </button>
          {!isOnline && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-cat-red bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
              <WifiOff className="w-2.5 h-2.5" /> Offline
            </span>
          )}
          <span className="w-2.5 h-2.5 rounded-full bg-cat-green animate-pulse" />
        </div>
      </header>

      {/* Conteúdo Principal (Scrollable) */}
      <main className="flex-1 overflow-y-auto no-scrollbar w-full min-h-0">
        {renderActiveView()}
      </main>

      {/* Barra de Navegação Inferior (Dock Flutuante Premium) */}
      <nav className="fixed bottom-5 left-4 right-4 z-40 bg-white/80 backdrop-blur-md border border-slate-100 px-5 py-2.5 rounded-full shadow-premium flex justify-between items-center safe-mb">
        
        {/* Aba Início */}
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-custom ${
            currentTab === 'home' ? 'text-brand-purple font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-4 h-4 shrink-0" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Início</span>
        </button>

        {/* Aba Evolução */}
        <button
          onClick={() => setCurrentTab('evolution')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-custom ${
            currentTab === 'evolution' ? 'text-brand-purple font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Evolução</span>
        </button>

        {/* Botão de Ação Central Roxo Glow [ ➕ ] */}
        <button
          onClick={() => setIsTxOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-purple to-brand-purple-dark text-white flex items-center justify-center shadow-purple-glow -translate-y-4 border-4 border-white hover:scale-105 active:scale-95 transition-transform"
          title="Registar Despesa"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Aba Metas */}
        <button
          onClick={() => setCurrentTab('goals')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-custom ${
            currentTab === 'goals' ? 'text-brand-purple font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Metas</span>
        </button>

        {/* Aba Extrato */}
        <button
          onClick={() => setCurrentTab('ledger')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-custom ${
            currentTab === 'ledger' ? 'text-brand-purple font-bold scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Extrato</span>
        </button>

      </nav>

      {/* Modals da Aplicação */}
      <TransactionModal 
        isOpen={isTxOpen} 
        onClose={() => setIsTxOpen(false)} 
        onAddTransaction={handleAddTransaction} 
      />

    </div>
  );
}

export default App;
