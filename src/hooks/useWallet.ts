import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  collaboration_id: string | null;
  wallet_id: string | null;
  user_id: string;
  type: "escrow" | "release" | "refund" | "withdrawal" | "deposit";
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: number;
  fee: number;
  net_amount: number;
  withdrawal_method: string | null;
  withdrawal_details: any;
  description: string | null;
  reference: string | null;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  const fetchWallet = async () => {
    if (!user) return;

    try {
      // Try to get existing wallet
      let { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Create wallet if doesn't exist
      if (!data && !error) {
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        data = newWallet;
      }

      if (error) throw error;
      setWallet(data as Wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data as Transaction[]);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const refreshWallet = () => {
    fetchWallet();
    fetchTransactions();
  };

  return {
    wallet,
    transactions,
    loading,
    refreshWallet,
  };
};
