import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type TransactionStatus = "success" | "failed" | "pending";

export interface Transaction {
  id: string;
  ref_id: string;
  type: string;
  category: string;
  product_name: string;
  buyer_sku_code: string;
  customer_no: string;
  amount: number;
  status: TransactionStatus;
  sn?: string;
  created_at: string;
  desc?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (trx: Transaction) => Promise<void>;
  clearTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | null>(null);
const TRX_KEY = "@ppob_transactions";

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem(TRX_KEY);
      if (stored) setTransactions(JSON.parse(stored));
    } catch {}
  };

  const addTransaction = useCallback(async (trx: Transaction) => {
    setTransactions((prev) => {
      const next = [trx, ...prev];
      AsyncStorage.setItem(TRX_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearTransactions = useCallback(async () => {
    setTransactions([]);
    await AsyncStorage.removeItem(TRX_KEY);
  }, []);

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, clearTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error("useTransactions must be used inside TransactionProvider");
  return ctx;
}
