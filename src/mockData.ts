import type { Transaction, BudgetAllocation, SavingGoal } from './types';

export const MOCK_BUDGET: BudgetAllocation = {
  salary: 0,
  fixos: 0,
  poupanca: 0,
  investimento: 0,
  plafondReal: 0
};

export const MOCK_GOALS: SavingGoal[] = [];

export const MOCK_TRANSACTIONS: Transaction[] = [];

export interface MonthlyHistory {
  name: string;
  poupanca: number;
  investimento: number;
  fixos: number;
  plafond: number;
  poupancaAcumulada: number;
}

export const MOCK_HISTORY: MonthlyHistory[] = [];
