import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  method: "bank" | "mobile_money";
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  mobile_provider: string | null;
  mobile_number: string | null;
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
      const { error } = await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        wallet_id: walletId,
        amount,
        method: "bank",
        bank_name: details.bank_name,
        account_number: details.account_number,
        account_holder: details.account_holder,
      });

      if (error) throw error;

      // Deduct from wallet (move to pending)
      await supabase
        .from("wallets")
        .update({
          balance: wallet.balance - amount,
          pending_balance: amount,
        })
        .eq("id", walletId);

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

  return {
    loading,
    requests,
    fetchWithdrawalRequests,
    requestBankWithdrawal,
    requestMobileMoneyWithdrawal,
  };
};
