import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  method: "bank" | "mobile_money" | "paypal";
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  mobile_provider: string | null;
  mobile_number: string | null;
  paypal_email: string | null;
  payout_currency: string | null;
  status: "pending" | "processing" | "completed" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  transaction_id: string | null;
  created_at: string;
}

interface BankDetails {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

interface MobileMoneyDetails {
  mobile_provider: string;
  mobile_number: string;
}

interface PayPalDetails {
  paypal_email: string;
  payout_currency: "EUR" | "USD";
}

export const useWithdrawal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

  const fetchWithdrawalRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data as WithdrawalRequest[]);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    }
  };

  const requestBankWithdrawal = async (
    walletId: string,
    amount: number,
    details: BankDetails
  ) => {
    if (!user) return;
    setLoading(true);

    try {
      // Check wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", walletId)
        .single();

      if (!wallet || wallet.balance < amount) {
        toast.error("Solde insuffisant");
        return;
      }

      // Create withdrawal request
      const { data: withdrawalRow, error } = await supabase
        .from("withdrawal_requests")
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          amount,
          method: "bank",
          bank_name: details.bank_name,
          account_number: details.account_number,
          account_holder: details.account_holder,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Deduct from wallet (move to pending)
      await supabase
        .from("wallets")
        .update({
          balance: wallet.balance - amount,
          pending_balance: amount,
        })
        .eq("id", walletId);

      // Track in transaction history (pending until admin confirms transfer)
      await supabase.from("transactions").insert({
        user_id: user.id,
        wallet_id: walletId,
        type: "withdrawal",
        status: "pending",
        amount,
        fee: 0,
        net_amount: amount,
        withdrawal_method: "bank",
        withdrawal_details: details as any,
        description: `Retrait bancaire - ${details.bank_name}`,
        reference: withdrawalRow?.id ?? null,
      });

      toast.success("Demande de retrait envoyée !");
      fetchWithdrawalRequests();
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast.error("Erreur lors de la demande de retrait");
    } finally {
      setLoading(false);
    }
  };

  const requestMobileMoneyWithdrawal = async (
    walletId: string,
    amount: number,
    details: MobileMoneyDetails
  ) => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-withdrawal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            wallet_id: walletId,
            amount,
            mobile_provider: details.mobile_provider,
            mobile_number: details.mobile_number,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de la demande de retrait");
        return;
      }

      toast.success("Demande de retrait envoyée !");
      fetchWithdrawalRequests();
    } catch (error) {
      console.error("Error requesting withdrawal:", error);
      toast.error("Erreur lors de la demande de retrait");
    } finally {
      setLoading(false);
    }
  };

  const requestPayPalWithdrawal = async (
    walletId: string,
    amount: number,
    details: PayPalDetails
  ) => {
    if (!user) return;
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-withdrawal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            wallet_id: walletId,
            amount,
            method: "paypal",
            paypal_email: details.paypal_email,
            payout_currency: details.payout_currency,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Erreur lors de la demande de retrait");
        return;
      }

      toast.success("Demande de retrait PayPal envoyée !");
      fetchWithdrawalRequests();
    } catch (error) {
      console.error("Error requesting PayPal withdrawal:", error);
      toast.error("Erreur lors de la demande de retrait");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    requests,
    fetchWithdrawalRequests,
    requestBankWithdrawal,
    requestMobileMoneyWithdrawal,
    requestPayPalWithdrawal,
  };
};
