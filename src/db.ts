import { get, set } from 'idb-keyval';
import type { Transaction, BudgetAllocation, SavingGoal } from './types';

const TRANSACTIONS_KEY = 'gp_transactions';
const BUDGET_KEY = 'gp_budget';
const GOALS_KEY = 'gp_goals';

// Fallback do LocalStorage caso o IndexedDB falhe ou não seja suportado
const isLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  try {
    await set(TRANSACTIONS_KEY, transactions);
  } catch (err) {
    console.warn('Erro ao guardar no IndexedDB, a usar fallback localStorage', err);
    if (isLocalStorageAvailable()) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await get<Transaction[]>(TRANSACTIONS_KEY);
    if (data) return data;
  } catch (err) {
    console.warn('Erro ao ler do IndexedDB, a usar fallback localStorage', err);
  }

  if (isLocalStorageAvailable()) {
    const localData = localStorage.getItem(TRANSACTIONS_KEY);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch {
        return [];
      }
    }
  }
  return [];
}

export async function saveBudget(budget: BudgetAllocation): Promise<void> {
  try {
    await set(BUDGET_KEY, budget);
  } catch (err) {
    console.warn('Erro ao guardar no IndexedDB, a usar fallback localStorage', err);
    if (isLocalStorageAvailable()) {
      localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
    }
  }
}

export async function getBudget(): Promise<BudgetAllocation | null> {
  try {
    const data = await get<BudgetAllocation>(BUDGET_KEY);
    if (data) return data;
  } catch (err) {
    console.warn('Erro ao ler do IndexedDB, a usar fallback localStorage', err);
  }

  if (isLocalStorageAvailable()) {
    const localData = localStorage.getItem(BUDGET_KEY);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function saveGoals(goals: SavingGoal[]): Promise<void> {
  try {
    await set(GOALS_KEY, goals);
  } catch (err) {
    console.warn('Erro ao guardar no IndexedDB, a usar fallback localStorage', err);
    if (isLocalStorageAvailable()) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }
  }
}

export async function getGoals(): Promise<SavingGoal[]> {
  try {
    const data = await get<SavingGoal[]>(GOALS_KEY);
    if (data) return data;
  } catch (err) {
    console.warn('Erro ao ler do IndexedDB, a usar fallback localStorage', err);
  }

  if (isLocalStorageAvailable()) {
    const localData = localStorage.getItem(GOALS_KEY);
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch {
        return [];
      }
    }
  }
  return [];
}
