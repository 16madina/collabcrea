import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Smartphone,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, Transaction } from "@/hooks/useWallet";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import WithdrawalSheet from "@/components/wallet/WithdrawalSheet";
import { format, parseISO, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { fr } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const getTransactionIcon = (type: Transaction["type"]) => {
  switch (type) {
    case "release":
    case "deposit":
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    case "withdrawal":
      return <ArrowUpRight className="w-4 h-4 text-orange-500" />;
    case "refund":
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const getTransactionLabel = (tx: Transaction) => {
  switch (tx.type) {
    case "release": return "Paiement reçu";
    case "withdrawal": return "Retrait";
    case "deposit": return "Dépôt";
    case "refund": return "Remboursement";
    case "escrow": return tx.status === "pending" ? "En cours de traitement" : "Séquestre validé";
    default: return tx.type;
  }
};

const WalletTab = () => {
  const { wallet, transactions, loading, refreshWallet } = useWallet();
  const { requests, fetchWithdrawalRequests } = useWithdrawal();
  const [showWithdrawalSheet, setShowWithdrawalSheet] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [period, setPeriod] = useState<"all" | "week" | "month">("all");

  const filteredTransactions = useMemo(() => {
    if (period === "all") return transactions;
    const now = new Date();
    const start = period === "week" ? startOfWeek(now, { locale: fr }) : startOfMonth(now);
    return transactions.filter((tx) => isAfter(parseISO(tx.created_at), start));
  }, [transactions, period]);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const pendingWithdrawals = requests.filter((r) => r.status === "pending" || r.status === "processing");
  const completedWithdrawals = requests.filter((r) => r.status === "completed" || r.status === "rejected");

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-gold/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solde disponible</p>
                <p className="text-2xl font-bold text-gold">
                  {loading ? "..." : formatCurrency(wallet?.balance || 0)}
                </p>
              </div>
            </div>

            {wallet?.pending_balance ? (
              <div className="bg-muted/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    En cours de retrait:{" "}
                    <span className="text-foreground font-medium">
                      {formatCurrency(wallet.pending_balance)}
                    </span>
                  </span>
                </div>
              </div>
            ) : null}

            <Button
              variant="gold"
              className="w-full"
              onClick={() => setShowWithdrawalSheet(true)}
              disabled={!wallet || wallet.balance === 0}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Retirer des fonds
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-orange-500" />
            Retraits en attente
          </h3>
          <div className="space-y-2">
            {pendingWithdrawals.map((req) => (
              <Card key={req.id} className="glass">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {req.method === "bank" ? (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{formatCurrency(req.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.method === "bank" ? req.bank_name : `${req.mobile_provider} - ${req.mobile_number}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={req.status === "processing" ? "bg-orange-500/20 text-orange-500" : ""}>
                      {req.status === "pending" ? "En attente" : "En traitement"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Withdrawals */}
      {completedWithdrawals.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Historique des retraits
          </h3>
          <div className="space-y-2">
            {completedWithdrawals.map((req) => (
              <Card key={req.id} className="glass">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{formatCurrency(req.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(req.created_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className={req.status === "completed" ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"}>
                        {req.status === "completed" ? "Effectué" : "Refusé"}
                      </Badge>
                      {req.status === "completed" && (req as any).proof_url && (
                        <button
                          className="text-xs text-gold flex items-center gap-1 mt-1"
                          onClick={async () => {
                            const fileName = (req as any).proof_url.split("/").pop();
                            const { data } = await supabase.storage.from("withdrawal-proofs").createSignedUrl(fileName, 300);
                            if (data?.signedUrl) setProofUrl(data.signedUrl);
                          }}
                        >
                          <Image className="w-3 h-3" />
                          Voir preuve
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Transactions</h3>
          <div className="flex gap-1">
            {([["all", "Tout"], ["week", "Semaine"], ["month", "Mois"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  period === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-4 text-center">
                <Wallet className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Aucune transaction</p>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((tx) => (
              <Card key={tx.id} className="glass">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getTransactionLabel(tx)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(tx.created_at), "dd MMM yyyy", { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${
                        tx.type === "release" || tx.type === "deposit" ? "text-green-500" : tx.type === "withdrawal" ? "text-orange-500" : ""
                      }`}>
                        {tx.type === "release" || tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <WithdrawalSheet
        open={showWithdrawalSheet}
        onOpenChange={setShowWithdrawalSheet}
        wallet={wallet}
        onSuccess={() => {
          refreshWallet();
          fetchWithdrawalRequests();
        }}
      />

      <Dialog open={!!proofUrl} onOpenChange={(open) => !open && setProofUrl(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Preuve du virement</DialogTitle>
          </DialogHeader>
          {proofUrl && <img src={proofUrl} alt="Preuve de virement" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletTab;
