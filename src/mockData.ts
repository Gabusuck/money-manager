import type { Transaction, BudgetAllocation, SavingGoal } from './types';

// Data atual de referência para os mocks
const getCurrentDateOffset = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export const MOCK_BUDGET: BudgetAllocation = {
  salary: 960,
  fixos: 400,
  poupanca: 150,
  investimento: 150,
  plafondReal: 260
};

export const MOCK_GOALS: SavingGoal[] = [
  {
    id: 'goal-1',
    title: 'Smart TV 4K',
    target: 500,
    current: 350,
    category: 'Poupança',
    deadline: '2026-10-31'
  },
  {
    id: 'goal-2',
    title: 'Câmara Mirrorless',
    target: 900,
    current: 300,
    category: 'Poupança',
    deadline: '2026-12-25'
  },
  {
    id: 'goal-3',
    title: 'Trading 212 (Fundo de Ações)',
    target: 2000,
    current: 1200,
    category: 'Investimento'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  // Fixos
  {
    id: 'tx-1',
    description: 'Renda e Condomínio',
    amount: 350,
    type: 'expense',
    category: 'Fixos',
    date: getCurrentDateOffset(9)
  },
  {
    id: 'tx-2',
    description: 'Subscrição Netflix / Spotify',
    amount: 19.99,
    type: 'expense',
    category: 'Fixos',
    date: getCurrentDateOffset(8)
  },
  {
    id: 'tx-3',
    description: 'Fatura Eletricidade & Água',
    amount: 38.50,
    type: 'expense',
    category: 'Fixos',
    date: getCurrentDateOffset(7)
  },
  // Transportes
  {
    id: 'tx-4',
    description: 'Abastecimento Repsol',
    amount: 45.00,
    type: 'expense',
    category: 'Transportes',
    date: getCurrentDateOffset(6)
  },
  {
    id: 'tx-5',
    description: 'Passe Metropolitano',
    amount: 30.00,
    type: 'expense',
    category: 'Transportes',
    date: getCurrentDateOffset(5)
  },
  // Lazer
  {
    id: 'tx-6',
    description: 'Cinema & Jantar fora',
    amount: 32.40,
    type: 'expense',
    category: 'Lazer',
    date: getCurrentDateOffset(4)
  },
  {
    id: 'tx-7',
    description: 'Cafés e Lanches fim de semana',
    amount: 12.50,
    type: 'expense',
    category: 'Lazer',
    date: getCurrentDateOffset(3)
  },
  // Outros
  {
    id: 'tx-8',
    description: 'Supermercado Continente',
    amount: 25.30,
    type: 'expense',
    category: 'Outros',
    date: getCurrentDateOffset(2)
  },
  {
    id: 'tx-9',
    description: 'Farmácia Wells',
    amount: 14.20,
    type: 'expense',
    category: 'Outros',
    date: getCurrentDateOffset(1)
  },
  // Poupança & Investimento
  {
    id: 'tx-10',
    description: 'Transferência Poupança TV/Câmara',
    amount: 100.00,
    type: 'expense',
    category: 'Poupança',
    date: getCurrentDateOffset(5)
  },
  {
    id: 'tx-11',
    description: 'Reforço Portfólio Trading 212',
    amount: 120.00,
    type: 'expense',
    category: 'Investimento',
    date: getCurrentDateOffset(4)
  }
];

// Dados históricos fictícios para a aba "Evolução"
export interface MonthlyHistory {
  name: string;
  poupanca: number;
  investimento: number;
  fixos: number;
  plafond: number;
  poupancaAcumulada: number;
}

export const MOCK_HISTORY: MonthlyHistory[] = [
  { name: 'Mar', poupanca: 120, investimento: 100, fixos: 410, plafond: 250, poupancaAcumulada: 1200 },
  { name: 'Abr', poupanca: 150, investimento: 110, fixos: 405, plafond: 235, poupancaAcumulada: 1350 },
  { name: 'Mai', poupanca: 130, investimento: 150, fixos: 395, plafond: 270, poupancaAcumulada: 1480 },
  { name: 'Jun', poupanca: 150, investimento: 130, fixos: 412, plafond: 220, poupancaAcumulada: 1630 },
  { name: 'Jul', poupanca: 160, investimento: 160, fixos: 390, plafond: 245, poupancaAcumulada: 1790 },
  { name: 'Ago', poupanca: 100, investimento: 120, fixos: 408, plafond: 212, poupancaAcumulada: 1890 }
];
