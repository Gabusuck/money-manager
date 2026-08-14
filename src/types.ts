export type TransactionCategory = string;

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO format: YYYY-MM-DD
  isRecurring?: boolean;
  recurringId?: string;  // ID do molde da transação recorrente de origem
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

export type RecurringInterval = 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: TransactionCategory;
  frequency: RecurringInterval;
  startDate: string; // ISO date: YYYY-MM-DD
  bankId: string; // Conta bancária associada
  isActive: boolean;
}

