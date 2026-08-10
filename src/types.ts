export type TransactionCategory =
  | 'Fixos'
  | 'Poupança'
  | 'Investimento'
  | 'Transportes'
  | 'Lazer'
  | 'Outros'
  | 'Salário';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO format: YYYY-MM-DD
  isRecurring?: boolean;
}

export interface BudgetAllocation {
  salary: number;
  fixos: number;
  poupanca: number;
  investimento: number;
  plafondReal: number;
}

export interface SavingGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  category: 'Poupança' | 'Investimento';
  deadline?: string;
}
