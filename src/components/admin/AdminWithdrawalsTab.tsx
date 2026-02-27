import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Wallet, CheckCircle, XCircle, Clock, Phone, Building2, User, Upload, Image } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface WithdrawalWithProfile {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  method: string;
  status: string;
  mobile_provider: string | null;
  mobile_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  proof_url: string | null;
  created_at: string;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const AdminWithdrawalsTab = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WithdrawalWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalWithProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [showCompletionFlow, setShowCompletionFlow] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const requestsWithProfiles: WithdrawalWithProfile[] = [];
      for (const req of data || []) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("user_id", req.user_id)
          .maybeSingle();
        requestsWithProfiles.push({ ...req, profile } as WithdrawalWithProfile);
      }

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image");
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleMarkCompleted = async (request: WithdrawalWithProfile) => {
    if (!user || !proofFile) {
      toast.error("Veuillez uploader la preuve du virement");
      return;
    }
    setProcessing(true);
    try {
      // Upload proof
      const ext = proofFile.name.split(".").pop();
      const path = `${request.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("withdrawal-proofs")
        .upload(path, proofFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("withdrawal-proofs")
        .getPublicUrl(path);

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "completed",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          proof_url: urlData.publicUrl,
        })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.user_id,
        title: "✅ Retrait effectué !",
        message: `Votre retrait de ${formatAmount(request.amount)} a été envoyé via ${request.method === "mobile_money" ? request.mobile_provider : "virement bancaire"}.`,
        type: "success",
      });

      toast.success("Retrait marqué comme effectué");
      resetCompletionFlow();
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (request: WithdrawalWithProfile) => {
    if (!user || !rejectionReason.trim()) {
      toast.error("Veuillez indiquer la raison du refus");
      return;
    }
    setProcessing(true);
    try {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("id", request.wallet_id)
        .single();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({ balance: wallet.balance + request.amount })
          .eq("id", request.wallet_id);
      }

      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.user_id,
        title: "❌ Retrait refusé",
        message: `Votre demande de retrait de ${formatAmount(request.amount)} a été refusée. Raison : ${rejectionReason}`,
        type: "error",
      });

      toast.success("Retrait refusé, solde restauré");
      setRejectionReason("");
      fetchRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors du refus");
    } finally {
      setProcessing(false);
    }
  };

  const resetCompletionFlow = () => {
    setProofFile(null);
    setProofPreview(null);
    setShowCompletionFlow(false);
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "En attente", variant: "outline" },
      approved: { label: "Approuvé", variant: "secondary" },
      completed: { label: "Effectué", variant: "default" },
      rejected: { label: "Refusé", variant: "destructive" },
    };
    const cfg = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  const pendingRequests = requests.filter((r) => r.status === "pending" || r.status === "approved");
  const completedRequests = requests.filter((r) => r.status === "completed" || r.status === "rejected");

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement des retraits...</div>;
  }

  return (
    <div className="space-y-6">
      <h3 className="font-semibold flex items-center gap-2">
        <Wallet className="w-5 h-5 text-gold" />
        Gestion des retraits
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-yellow-500/10 w-fit mx-auto mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-lg font-bold">{pendingRequests.length}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-green-500/10 w-fit mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-lg font-bold">{completedRequests.filter((r) => r.status === "completed").length}</p>
            <p className="text-xs text-muted-foreground">Effectués</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="p-2 rounded-lg bg-gold/10 w-fit mx-auto mb-2">
              <Wallet className="w-5 h-5 text-gold" />
            </div>
            <p className="text-lg font-bold">
              {formatAmount(pendingRequests.reduce((s, r) => s + r.amount, 0))}
            </p>
            <p className="text-xs text-muted-foreground">À verser</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            Demandes en attente ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Aucune demande en attente</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{req.profile?.full_name || "Inconnu"}</span>
                    </div>
                    <span className="text-sm font-bold text-gold">{formatAmount(req.amount)}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {req.method === "mobile_money" ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {req.mobile_provider} — {req.mobile_number}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {req.bank_name} — {req.account_number}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(req.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-[10px] h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                          setShowCompletionFlow(true);
                        }}
                        disabled={processing}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Effectué
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-[10px] h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                        }}
                        disabled={processing}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Historique des retraits</CardTitle>
        </CardHeader>
        <CardContent>
          {completedRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Aucun retrait traité</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Créateur</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedRequests.map((req) => (
                    <TableRow key={req.id} className="cursor-pointer" onClick={() => setSelectedRequest(req)}>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(req.created_at), "dd MMM yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="text-xs">{req.profile?.full_name || "N/A"}</TableCell>
                      <TableCell className="text-xs">
                        {req.method === "mobile_money"
                          ? `${req.mobile_provider} (${req.mobile_number})`
                          : `${req.bank_name}`}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs">
                        {formatAmount(req.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail / Completion Sheet */}
      <Sheet open={!!selectedRequest} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); resetCompletionFlow(); } }}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          {selectedRequest && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle>Détail du retrait</SheetTitle>
              </SheetHeader>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créateur</span>
                  <span className="font-medium">{selectedRequest.profile?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-bold text-gold">{formatAmount(selectedRequest.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Méthode</span>
                  <span>{selectedRequest.method === "mobile_money" ? "Mobile Money" : "Virement bancaire"}</span>
                </div>
                {selectedRequest.method === "mobile_money" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opérateur</span>
                      <span>{selectedRequest.mobile_provider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Numéro</span>
                      <span className="font-mono">{selectedRequest.mobile_number}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Banque</span>
                      <span>{selectedRequest.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">N° de compte</span>
                      <span className="font-mono">{selectedRequest.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Titulaire</span>
                      <span>{selectedRequest.account_holder}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(selectedRequest.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</span>
                </div>
              </div>

              {/* Completion flow with proof upload */}
              {(selectedRequest.status === "pending" && showCompletionFlow) && (
                <div className="space-y-3 pt-4 border-t">
                  <p className="text-sm font-medium">📸 Uploadez la preuve du virement</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  {proofPreview ? (
                    <div className="relative">
                      <img src={proofPreview} alt="Preuve" className="w-full rounded-lg border max-h-48 object-contain bg-muted" />
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 text-xs h-7"
                        onClick={() => { setProofFile(null); setProofPreview(null); }}
                      >
                        Changer
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-gold/50 hover:text-gold transition-colors"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Cliquez pour ajouter la capture</span>
                    </button>
                  )}

                  <Button
                    className="w-full text-xs"
                    onClick={() => handleMarkCompleted(selectedRequest)}
                    disabled={processing || !proofFile}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer le virement
                  </Button>
                </div>
              )}

              {/* Actions when not in completion flow */}
              {selectedRequest.status === "pending" && !showCompletionFlow && (
                <div className="space-y-3 pt-4 border-t">
                  <Button
                    className="w-full text-xs"
                    onClick={() => setShowCompletionFlow(true)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Virement effectué
                  </Button>

                  <div className="space-y-2">
                    <Textarea
                      placeholder="Raison du refus..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <Button
                      variant="destructive"
                      className="w-full text-xs"
                      onClick={() => handleReject(selectedRequest)}
                      disabled={processing || !rejectionReason.trim()}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Refuser le retrait
                    </Button>
                  </div>
                </div>
              )}

              {/* Show proof for completed */}
              {selectedRequest.status === "completed" && selectedRequest.proof_url && (
                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Image className="w-4 h-4 text-green-500" />
                    Preuve du virement
                  </p>
                  <img src={selectedRequest.proof_url} alt="Preuve" className="w-full rounded-lg border max-h-48 object-contain bg-muted" />
                </div>
              )}

              {selectedRequest.status === "rejected" && selectedRequest.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Raison du refus :</p>
                  <p className="text-sm">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminWithdrawalsTab;
