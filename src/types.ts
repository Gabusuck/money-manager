export type TransactionCategory =
  | 'Fixos'
  | 'Poupança'
  | 'Investimento'
  | 'Transportes'
  | 'Lazer'
  | 'Outros'
  | 'Salário'
  | 'Transferência Interna';

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO format: YYYY-MM-DD
  isRecurring?: boolean;
  bankId?: string;       // Associado a despesa/renda/objetivo
  fromBankId?: string;   // Associado a transferência entre bancos (Origem)
  toBankId?: string;     // Associado a transferência entre bancos (Destino)
}

export interface Bank {
  id: string;
  name: string;
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
