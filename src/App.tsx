import { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  TrendingUp, 
  Target, 
  FileText, 
  Plus, 
  WifiOff,
  Cloud,
  Repeat
} from 'lucide-react';
import { CloudSyncModal } from './components/CloudSyncModal';
import { 
  getTransactions, 
  saveTransactions, 
  getBudget, 
  saveBudget, 
  getGoals, 
  saveGoals,
  getBanks,
  saveBanks,
  getRecurringTransactions,
  saveRecurringTransactions
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
  TransactionCategory,
  Bank,
  TransactionType,
  RecurringTransaction
} from './types';
import { RecurringModal } from './components/RecurringModal';

// Views
import { Dashboard } from './components/Dashboard';
import { Evolution } from './components/Evolution';
import { Goals } from './components/Goals';
import { Ledger } from './components/Ledger';
import { SubscriptionsView } from './components/SubscriptionsView';

// Modals
import { TransactionModal } from './components/TransactionModal';

// Funções auxiliares para lidar com datas na hora local da máquina de forma segura, evitando bugs de fuso horário UTC
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

// Função utilitária para verificar e duplicar transações recorrentes para meses em falta (Legado)
const checkAndGenerateRecurring = (txs: Transaction[]): { updated: boolean; transactions: Transaction[] } => {
  let changed = false;
  const updatedTxs = [...txs];
  
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const todayLocalDate = parseLocalDate(todayStr);
  const currentYear = todayLocalDate.getFullYear();
  const currentMonth = todayLocalDate.getMonth();

  // Encontrar todas as transações marcadas como recorrentes
  const recurringTemplates = txs.filter(tx => tx.isRecurring);

  recurringTemplates.forEach(template => {
    const startDate = parseLocalDate(template.date);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    // Calcular quantos meses passaram desde a data inicial até ao mês atual
    let year = startYear;
    let month = startMonth;

    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      // Ignorar o próprio mês de início (já tem a transação original)
      if (year === startYear && month === startMonth) {
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
        continue;
      }

      const targetDate = new Date(year, month, startDay);
      if (targetDate.getMonth() !== month) {
        targetDate.setDate(0); 
      }

      // Se a data da transação for no futuro, paramos a geração para este molde
      if (targetDate > todayLocalDate) {
        break;
      }

      const dateString = getLocalDateString(targetDate);
      const targetMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

      // Verificar se já existe uma transação idêntica neste mês
      const alreadyExists = updatedTxs.some(tx => 
        tx.date.startsWith(targetMonthStr) && 
        tx.description === template.description &&
        tx.amount === template.amount &&
        tx.category === template.category
      );

      if (!alreadyExists) {
        const newTx: Transaction = {
          id: Math.random().toString(36).substring(2, 9),
          description: template.description,
          amount: template.amount,
          type: template.type,
          category: template.category,
          date: dateString,
          isRecurring: true
        };

        updatedTxs.push(newTx);
        changed = true;
      }

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }
  });

  return { updated: changed, transactions: updatedTxs };
};

// Nova função utilitária para verificar e gerar transações automáticas com base nos moldes de recorrência/assinatura
const generateRecurringTransactions = (
  templates: RecurringTransaction[],
  txs: Transaction[]
): { updated: boolean; transactions: Transaction[] } => {
  let changed = false;
  const updatedTxs = [...txs];
  
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const todayLocalDate = parseLocalDate(todayStr);
  const currentYear = todayLocalDate.getFullYear();
  const currentMonth = todayLocalDate.getMonth();

  templates.forEach(template => {
    if (!template.isActive) return;

    const startDate = parseLocalDate(template.startDate);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startDay = startDate.getDate();

    if (template.frequency === 'monthly') {
      let year = startYear;
      let month = startMonth;

      while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        const targetDate = new Date(year, month, startDay);
        if (targetDate.getMonth() !== month) {
          targetDate.setDate(0);
        }

        // Se a data simulada for no futuro, paramos a geração para este molde
        if (targetDate > todayLocalDate) {
          break;
        }

        const dateStr = getLocalDateString(targetDate);
        const targetMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const alreadyExists = updatedTxs.some(tx => 
          tx.recurringId === template.id && 
          tx.date.startsWith(targetMonthStr)
        );

        if (!alreadyExists) {
          const newTx: Transaction = {
            id: Math.random().toString(36).substring(2, 9),
            description: template.description,
            amount: template.amount,
            type: template.type,
            category: template.category,
            date: dateStr,
            bankId: template.bankId,
            recurringId: template.id
          };
          updatedTxs.push(newTx);
          changed = true;
        }

        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }
    } else if (template.frequency === 'weekly') {
      let currentDate = new Date(startDate);
      while (currentDate <= todayLocalDate) {
        const dateStr = getLocalDateString(currentDate);

        const alreadyExists = updatedTxs.some(tx => 
          tx.recurringId === template.id && 
          tx.date === dateStr
        );

        if (!alreadyExists) {
          const newTx: Transaction = {
            id: Math.random().toString(36).substring(2, 9),
            description: template.description,
            amount: template.amount,
            type: template.type,
            category: template.category,
            date: dateStr,
            bankId: template.bankId,
            recurringId: template.id
          };
          updatedTxs.push(newTx);
          changed = true;
        }

        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (template.frequency === 'yearly') {
      let year = startYear;
      while (year <= currentYear) {
        const targetDate = new Date(year, startMonth, startDay);
        if (targetDate.getMonth() !== startMonth) {
          targetDate.setDate(0);
        }

        // Se a data do ano corrente for no futuro, paramos a geração
        if (targetDate > todayLocalDate) {
          break;
        }

        const dateStr = getLocalDateString(targetDate);
        const alreadyExists = updatedTxs.some(tx => 
          tx.recurringId === template.id && 
          tx.date.startsWith(String(year))
        );

        if (!alreadyExists) {
          const newTx: Transaction = {
            id: Math.random().toString(36).substring(2, 9),
            description: template.description,
            amount: template.amount,
            type: template.type,
            category: template.category,
            date: dateStr,
            bankId: template.bankId,
            recurringId: template.id
          };
          updatedTxs.push(newTx);
          changed = true;
        }
        year++;
      }
    }
  });

  return { updated: changed, transactions: updatedTxs };
};

function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'evolution' | 'goals' | 'ledger' | 'recurring'>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budget, setBudget] = useState<BudgetAllocation>(MOCK_BUDGET);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  
  const mainRef = useRef<HTMLDivElement>(null);

  // Fazer scroll para o topo sempre que se muda de página/aba
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [currentTab]);

  // Estados e lógica para navegação por swipe (deslizar o dedo) entre abas
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  const handleTouchStartApp = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // Ignorar swipe se o toque começar em elementos com scroll horizontal (ignore-swipe), botões ou inputs
    if (
      target.closest('.ignore-swipe') || 
      target.closest('button') || 
      target.closest('select') || 
      target.closest('input') || 
      target.closest('textarea')
    ) {
      return;
    }
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEndApp = (e: React.TouchEvent) => {
    if (touchStartX === 0 || touchStartY === 0) return;

    const diffX = e.changedTouches[0].clientX - touchStartX;
    const diffY = e.changedTouches[0].clientY - touchStartY;

    setTouchStartX(0);
    setTouchStartY(0);

    // Garantir que o movimento foi predominantemente horizontal e superior a um limiar mínimo de 60px
    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 60) {
      const tabs: ('evolution' | 'goals' | 'home' | 'recurring' | 'ledger')[] = [
        'evolution',
        'goals',
        'home',
        'recurring',
        'ledger'
      ];
      const currentIndex = tabs.indexOf(currentTab);

      if (diffX > 0) {
        // Dedo moveu-se para a direita -> quer ver a aba anterior (esquerda)
        if (currentIndex > 0) {
          setCurrentTab(tabs[currentIndex - 1]);
        }
      } else {
        // Dedo moveu-se para a esquerda -> quer ver a aba seguinte (direita)
        if (currentIndex < tabs.length - 1) {
          setCurrentTab(tabs[currentIndex + 1]);
        }
      }
    }
  };
  
  // Modals
  const [isTxOpen, setIsTxOpen] = useState(false);
  const [isCloudOpen, setIsCloudOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [activeRecurringBank, setActiveRecurringBank] = useState<Bank | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('expense');
  const [defaultBankId, setDefaultBankId] = useState<string>('');
  
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

      // 2. Carregar Bancos
      const localBanks = await getBanks();
      if (localBanks && localBanks.length > 0) {
        setBanks(localBanks);
      } else {
        const defaultBanks = [
          { id: 'activo', name: 'ActivoBank' },
          { id: 'revolut', name: 'Revolut' }
        ];
        await saveBanks(defaultBanks);
        setBanks(defaultBanks);
      }

      // 3. Carregar Metas
      const localGoals = await getGoals();
      if (localGoals && localGoals.length > 0) {
        setGoals(localGoals);
      } else {
        await saveGoals(MOCK_GOALS);
        setGoals(MOCK_GOALS);
      }

      // 4. Carregar Moldes de Recorrências
      const localRecs = await getRecurringTransactions();
      setRecurringTransactions(localRecs);

      // 5. Carregar Transações e Executar Recorrências
      const localTxs = await getTransactions();
      let currentTxs = localTxs.length > 0 ? localTxs : MOCK_TRANSACTIONS;

      // Executar geração de novas recorrências baseadas em moldes
      const { updated: updatedRecs, transactions: afterRecsTxs } = generateRecurringTransactions(localRecs, currentTxs);
      
      // Executar geração de recorrências legadas (isRecurring no objeto de transação)
      const { updated: updatedLegacy, transactions: finalTxs } = checkAndGenerateRecurring(afterRecsTxs);

      setTransactions(finalTxs);
      if (updatedRecs || updatedLegacy || localTxs.length === 0) {
        await saveTransactions(finalTxs);
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

  // Handler para eliminar transação com confirmação de segurança
  const handleDeleteTransaction = async (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    const formattedAmount = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(txToDelete.amount);
    if (!window.confirm(`Tens a certeza que queres eliminar o movimento "${txToDelete.description}" (${formattedAmount})?`)) {
      return;
    }

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

    // 2. Registar transação correspondente (Transferência reduz o Plafond Real)
    const contributionTx: Transaction = {
      id: 'tx-' + Date.now(),
      description: `Reforço: ${targetGoal.title}`,
      amount,
      type: 'transfer',
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

  // Handler para adicionar novo banco/conta
  const handleAddBank = async (name: string, initialBalance: number) => {
    const newBankId = 'bank-' + Date.now();
    const newBank: Bank = { id: newBankId, name };
    const updatedBanks = [...banks, newBank];
    setBanks(updatedBanks);
    await saveBanks(updatedBanks);

    // Registar saldo inicial como transação do tipo Renda
    if (initialBalance > 0) {
      const initialTx: Transaction = {
        id: 'tx-' + Date.now(),
        description: `Saldo Inicial: ${name}`,
        amount: initialBalance,
        type: 'income',
        category: 'Outros',
        date: new Date().toISOString().split('T')[0],
        bankId: newBankId
      };
      const updatedTxs = [initialTx, ...transactions];
      setTransactions(updatedTxs);
      await saveTransactions(updatedTxs);
    }
  };

  // Handler para editar nome e saldo de banco/conta (Com registo de histórico diário de poupança/investimento)
  const handleEditBank = async (bankId: string, newName: string, newBalance: number) => {
    // 1. Atualizar nome do banco
    const updatedBanks = banks.map(b => b.id === bankId ? { ...b, name: newName } : b);
    setBanks(updatedBanks);
    await saveBanks(updatedBanks);

    // 2. Ajustar saldo da transação criando um registo para o dia atual para rastreio
    // Calcular o saldo atual
    const currentBalance = transactions.reduce((balance, tx) => {
      if (tx.type === 'income' && tx.bankId === bankId) return balance + tx.amount;
      if ((tx.type === 'expense' || tx.type === 'transfer') && tx.bankId === bankId) return balance - tx.amount;
      if (tx.fromBankId === bankId) return balance - tx.amount;
      if (tx.toBankId === bankId) return balance + tx.amount;
      return balance;
    }, 0);

    const difference = newBalance - currentBalance;

    if (difference !== 0) {
      // Determinar a categoria com base no nome do banco
      const nameLower = newName.toLowerCase();
      let category: TransactionCategory = 'Outros';
      if (nameLower.includes('trading') || nameLower.includes('invest') || nameLower.includes('ações') || nameLower.includes('bolsa') || nameLower.includes('acoes')) {
        category = 'Investimento';
      } else if (nameLower.includes('poupança') || nameLower.includes('poup') || nameLower.includes('aforro') || nameLower.includes('poupanca')) {
        category = 'Poupança';
      }

      const todayStr = new Date().toISOString().split('T')[0];

      // Procurar se já existe um ajuste feito HOJE para o mesmo banco para o sobrescrever ou agrupar
      const existingTodayTxIndex = transactions.findIndex(tx => 
        tx.bankId === bankId && 
        tx.date === todayStr && 
        tx.description.startsWith('Ajuste:')
      );

      let updatedTxs = [...transactions];
      
      if (existingTodayTxIndex !== -1) {
        // Se já editou hoje, acumula a diferença na mesma transação de hoje
        const todayTx = updatedTxs[existingTodayTxIndex];
        // Calculamos o montante original antes do ajuste de hoje
        const netAdjustment = (todayTx.type === 'income' ? todayTx.amount : -todayTx.amount) + difference;
        
        if (netAdjustment === 0) {
          // Se o ajuste final for 0, removemos a transação de hoje
          updatedTxs.splice(existingTodayTxIndex, 1);
        } else {
          updatedTxs[existingTodayTxIndex] = {
            ...todayTx,
            amount: Math.abs(netAdjustment),
            type: netAdjustment > 0 ? 'income' : 'expense',
            description: `Ajuste: ${newName}`,
            category
          };
        }
      } else {
        // Se for a primeira edição de hoje, cria um novo registo de ajuste de saldo
        const adjustTx: Transaction = {
          id: 'tx-adj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          description: `Ajuste: ${newName}`,
          amount: Math.abs(difference),
          type: difference > 0 ? 'income' : 'expense',
          category,
          date: todayStr,
          bankId
        };
        updatedTxs = [adjustTx, ...updatedTxs];
      }
      
      setTransactions(updatedTxs);
      await saveTransactions(updatedTxs);
    } else {
      // Se a diferença for 0, só atualiza as descrições das transações passadas deste banco com o novo nome
      const updatedTxs = transactions.map(tx => {
        if (tx.bankId === bankId && (tx.description.startsWith('Saldo Inicial') || tx.description.startsWith('Ajuste'))) {
          const suffix = tx.description.includes(':') ? tx.description.split(':')[0] : 'Ajuste';
          return { ...tx, description: `${suffix}: ${newName}` };
        }
        return tx;
      });
      setTransactions(updatedTxs);
      await saveTransactions(updatedTxs);
    }
  };

  // Handler para eliminar banco/conta
  const handleDeleteBank = async (bankId: string) => {
    if (banks.length <= 1) {
      alert('Não podes apagar a tua única conta!');
      return;
    }
    if (window.confirm('Queres apagar este banco? Todas as transações associadas a ele serão apagadas.')) {
      const updatedBanks = banks.filter(b => b.id !== bankId);
      setBanks(updatedBanks);
      await saveBanks(updatedBanks);

      // Filtrar e remover transações deste banco
      const updatedTxs = transactions.filter(tx => 
        tx.bankId !== bankId && 
        tx.fromBankId !== bankId && 
        tx.toBankId !== bankId
      );
      setTransactions(updatedTxs);
      await saveTransactions(updatedTxs);
    }
  };

  // Handler para abrir o modal de lançamentos preenchido de antemão (Origem/Tipo)
  const handleOpenPrefilledTxModal = (type: TransactionType, bankId: string) => {
    setDefaultTxType(type);
    setDefaultBankId(bankId);
    setIsTxOpen(true);
  };

  // Handler para restaurar dados importados/sincronizados da nuvem
  const handleRestoreData = async (data: {
    transactions: Transaction[];
    banks: Bank[];
    budget: BudgetAllocation;
    goals: SavingGoal[];
  }) => {
    await saveTransactions(data.transactions);
    await saveBanks(data.banks);
    await saveBudget(data.budget);
    await saveGoals(data.goals);

    setTransactions(data.transactions);
    setBanks(data.banks);
    setBudget(data.budget);
    setGoals(data.goals);
  };

  // Handlers para Assinaturas e Recorrências
  const handleOpenRecurringModal = (bank: Bank) => {
    setActiveRecurringBank(bank);
    setIsRecurringOpen(true);
  };

  const handleAddRecurringTransaction = async (templateData: Omit<RecurringTransaction, 'id' | 'isActive'>) => {
    const newTemplate: RecurringTransaction = {
      ...templateData,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      isActive: true
    };
    const updatedRecs = [...recurringTransactions, newTemplate];
    setRecurringTransactions(updatedRecs);
    await saveRecurringTransactions(updatedRecs);

    // Gerar transações correspondentes retroativas imediatamente
    const { updated, transactions: finalTxs } = generateRecurringTransactions(updatedRecs, transactions);
    if (updated) {
      setTransactions(finalTxs);
      await saveTransactions(finalTxs);
    }
  };

  const handleDeleteRecurringTransaction = async (id: string) => {
    const updatedRecs = recurringTransactions.filter(r => r.id !== id);
    setRecurringTransactions(updatedRecs);
    await saveRecurringTransactions(updatedRecs);
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
            banks={banks}
            onAddBank={handleAddBank}
            onDeleteBank={handleDeleteBank}
            onEditBank={handleEditBank}
            onOpenPrefilledTxModal={handleOpenPrefilledTxModal}
            onOpenRecurringModal={handleOpenRecurringModal}
          />
        );
      case 'evolution':
        return (
          <Evolution 
            transactions={transactions} 
            budget={budget}
            onEditBudget={handleEditSalary}
            banks={banks}
          />
        );
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
            banks={banks}
          />
        );
      case 'recurring':
        return (
          <SubscriptionsView
            recurringTxs={recurringTransactions}
            banks={banks}
            onAddRecurring={handleAddRecurringTransaction}
            onDeleteRecurring={handleDeleteRecurringTransaction}
          />
        );
    }
  };

  return (
    <div 
      className="h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans antialiased select-none" 
      style={{background:'#EFF1FB',color:'#111827'}}
      onTouchStart={handleTouchStartApp}
      onTouchEnd={handleTouchEndApp}
    >
      
      {/* Cabeçalho da App */}
      <header className="relative z-10 px-5 pt-5 pb-3 flex justify-between items-center shrink-0 safe-pt">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-md" style={{background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)'}}>
            <img src="/icons/icon-192.png" className="w-full h-full rounded-2xl object-cover" alt="Logo" />
          </div>
          <div>
            <h1 className="text-[15px] font-black tracking-tight leading-none" style={{color:'#111827'}}>All My Money</h1>
            <p className="text-[9px] font-bold tracking-widest uppercase mt-0.5" style={{color:'#9CA3AF'}}>Finanças Pessoais</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
          {!isOnline && (
            <span className="flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full" style={{color:'#EF4444',background:'#FEF2F2',border:'1px solid #FECACA'}}>
              <WifiOff className="w-2.5 h-2.5" /> Offline
            </span>
          )}
          <button
            onClick={() => setIsCloudOpen(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-custom cursor-pointer"
            style={{background:'#FFFFFF',border:'1px solid #E5E8F8',color:'#4F6EF7'}}
            title="Sincronização na nuvem"
          >
            <Cloud className="w-3.5 h-3.5" />
          </button>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{background:'#16C784'}} />
        </div>
      </header>

      {/* Conteúdo Principal (Scrollable com Animação Premium de Entrada de View) */}
      <main ref={mainRef} key={currentTab} className="relative z-10 flex-1 overflow-y-auto no-scrollbar w-full min-h-0 overscroll-none animate-view-change">
        {renderActiveView()}
        {/* Espaçador físico no fim do scroll para empurrar o conteúdo acima da navbar no iOS Safari */}
        <div className="h-36 w-full block pointer-events-none shrink-0" />
      </main>

      {/* Barra de Navegação Inferior */}
      <nav
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-4 py-2.5 safe-mb"
        style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px)',borderRadius:'9999px',border:'1px solid #E5E8F8',boxShadow:'0 4px 24px rgba(79,110,247,0.12)'}}
      >
        {([
          { tab: 'evolution', icon: TrendingUp, label: 'Evolução' },
          { tab: 'goals',     icon: Target,    label: 'Metas' },
          { tab: 'home',      icon: Home,      label: 'Início' },
          { tab: 'recurring', icon: Repeat,    label: 'Assinat.' },
          { tab: 'ledger',    icon: FileText,  label: 'Extrato' },
        ] as const).map(({ tab, icon: Icon, label }) => {
          const active = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              title={label}
              className="relative flex flex-col items-center justify-center w-12 h-11 rounded-full transition-custom cursor-pointer"
              style={active ? {color:'#4F6EF7'} : {color:'#9CA3AF'}}
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.8} />
              {active && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{background:'#4F6EF7'}}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* FAB — Novo Lançamento */}
      <button
        onClick={() => setIsTxOpen(true)}
        className="fixed z-40 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 safe-mb"
        style={{bottom:'82px',right:'20px',width:'46px',height:'46px',borderRadius:'14px',background:'linear-gradient(135deg,#4F6EF7,#7C5CFC)',boxShadow:'0 6px 20px rgba(79,110,247,0.40)',color:'#fff'}}
        title="Novo Lançamento"
      >
        <Plus className="w-5 h-5" />
      </button>

      {/* Modals da Aplicação */}
      <TransactionModal 
        isOpen={isTxOpen} 
        onClose={() => {
          setIsTxOpen(false);
          setDefaultTxType('expense');
          setDefaultBankId('');
        }} 
        onAddTransaction={handleAddTransaction} 
        banks={banks}
        defaultType={defaultTxType}
        defaultBankId={defaultBankId}
        transactions={transactions}
      />

      <CloudSyncModal 
        isOpen={isCloudOpen} 
        onClose={() => setIsCloudOpen(false)}
        transactions={transactions}
        banks={banks}
        budget={budget}
        goals={goals}
        onRestoreData={handleRestoreData}
      />

      <RecurringModal
        isOpen={isRecurringOpen}
        onClose={() => {
          setIsRecurringOpen(false);
          setActiveRecurringBank(null);
        }}
        bank={activeRecurringBank}
        recurringTxs={recurringTransactions}
        onAddRecurring={handleAddRecurringTransaction}
        onDeleteRecurring={handleDeleteRecurringTransaction}
      />

    </div>
  );
}

export default App;
