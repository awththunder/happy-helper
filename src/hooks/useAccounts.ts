import { useState, useEffect, useCallback } from 'react';
import { Account } from '@/types/account';

const STORAGE_KEY = 'authenticator_accounts';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAccounts(JSON.parse(stored));
      } catch {
        console.error('Failed to parse stored accounts');
      }
    }
    setIsLoading(false);
  }, []);

  const saveAccounts = useCallback((newAccounts: Account[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
    setAccounts(newAccounts);
  }, []);

  const addAccount = useCallback((account: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    saveAccounts([...accounts, newAccount]);
    return newAccount;
  }, [accounts, saveAccounts]);

  const removeAccount = useCallback((id: string) => {
    saveAccounts(accounts.filter(acc => acc.id !== id));
  }, [accounts, saveAccounts]);

  const updateAccount = useCallback((id: string, updates: Partial<Account>) => {
    saveAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, ...updates } : acc
    ));
  }, [accounts, saveAccounts]);

  const updateBackupCodes = useCallback((id: string, codes: string[]) => {
    saveAccounts(accounts.map(acc => 
      acc.id === id ? { ...acc, backupCodes: codes } : acc
    ));
  }, [accounts, saveAccounts]);

  const importAccounts = useCallback((newAccounts: Account[]) => {
    saveAccounts([...accounts, ...newAccounts]);
  }, [accounts, saveAccounts]);

  const clearAllAccounts = useCallback(() => {
    saveAccounts([]);
  }, [saveAccounts]);

  return {
    accounts,
    isLoading,
    addAccount,
    removeAccount,
    updateAccount,
    updateBackupCodes,
    importAccounts,
    clearAllAccounts,
  };
}
