import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import BottomNav from "@/components/BottomNav";
import { useWallet, Transaction } from "@/hooks/useWallet";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import WithdrawalSheet from "@/components/wallet/WithdrawalSheet";
import { format, parseISO } from "date-fns";
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

const getTransactionLabel = (type: Transaction["type"]) => {
  switch (type) {
    case "release":
      return "Paiement reçu";
    case "withdrawal":
      return "Retrait";
    case "deposit":
      return "Dépôt";
    case "refund":
      return "Remboursement";
    case "escrow":
      return "Séquestre";
    default:
      return type;
  }
};

const CreatorWallet = () => {
  const { wallet, transactions, loading, refreshWallet } = useWallet();
  const { requests, fetchWithdrawalRequests } = useWithdrawal();
  const [showWithdrawalSheet, setShowWithdrawalSheet] = useState(false);

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const pendingWithdrawals = requests.filter((r) => r.status === "pending" || r.status === "processing");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-gold-gradient">
            Mon Portefeuille
          </h1>
        </motion.div>
      </div>

      {/* Balance Card */}
      <div className="px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border-gold/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gold/20 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solde disponible</p>
                  <p className="text-3xl font-bold text-gold">
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
      </div>

      {/* Pending Withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="px-6 mt-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" />
            Retraits en attente
          </h2>
          <div className="space-y-2">
            {pendingWithdrawals.map((req) => (
              <Card key={req.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {req.method === "bank" ? (
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{formatCurrency(req.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.method === "bank"
                            ? req.bank_name
                            : `${req.mobile_provider} - ${req.mobile_number}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        req.status === "processing"
                          ? "bg-orange-500/20 text-orange-500"
                          : ""
                      }
                    >
                      {req.status === "pending" ? "En attente" : "En traitement"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="px-6 mt-6">
        <h2 className="font-semibold mb-3">Historique des transactions</h2>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Aucune transaction</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map((tx) => (
              <Card key={tx.id} className="glass">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium">{getTransactionLabel(tx.type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(tx.created_at), "dd MMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          tx.type === "release" || tx.type === "deposit"
                            ? "text-green-500"
                            : tx.type === "withdrawal"
                            ? "text-orange-500"
                            : ""
                        }`}
                      >
                        {tx.type === "release" || tx.type === "deposit" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={
                          tx.status === "completed"
                            ? "bg-green-500/20 text-green-500"
                            : tx.status === "pending"
                            ? "bg-orange-500/20 text-orange-500"
                            : ""
                        }
                      >
                        {tx.status === "completed"
                          ? "Effectué"
                          : tx.status === "pending"
                          ? "En attente"
                          : tx.status}
                      </Badge>
                    </div>
                  </div>
                  {tx.description && (
                    <p className="text-xs text-muted-foreground mt-2 pl-13">
                      {tx.description}
                    </p>
                  )}
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

      <BottomNav />
    </div>
  );
};

export default CreatorWallet;
