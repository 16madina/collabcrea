import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, CheckCircle, XCircle, Clock, Zap, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaydunyaLog {
  id: string;
  event_type: string;
  withdrawal_request_id: string | null;
  payload: Record<string, unknown>;
  response_code: string | null;
  status: string | null;
  transaction_id: string | null;
  amount: number | null;
  matched: boolean;
  created_at: string;
}

const AdminPaydunyaLogsTab = () => {
  const [logs, setLogs] = useState<PaydunyaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<PaydunyaLog | null>(null);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("paydunya_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data as PaydunyaLog[]) || []);
    } catch (error) {
      console.error("Error fetching PayDunya logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Realtime subscription
    const channel = supabase
      .channel("paydunya-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paydunya_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as PaydunyaLog, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getEventIcon = (log: PaydunyaLog) => {
    if (log.event_type === "ipn_error") return <AlertTriangle className="w-4 h-4 text-destructive" />;
    if (log.status === "success" || log.status === "completed") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (log.status === "failed" || log.status === "error") return <XCircle className="w-4 h-4 text-destructive" />;
    if (log.event_type === "payout") return <Zap className="w-4 h-4 text-gold" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getEventBadge = (log: PaydunyaLog) => {
    const isSuccess = log.status === "success" || log.status === "completed";
    const isFailed = log.status === "failed" || log.status === "error";
    
    return (
      <Badge
        variant="secondary"
        className={
          isSuccess ? "bg-green-500/20 text-green-500" :
          isFailed ? "bg-destructive/20 text-destructive" :
          ""
        }
      >
        {log.event_type === "payout" ? "Payout" : log.event_type === "ipn" ? "IPN" : "Erreur"}
      </Badge>
    );
  };

  const formatAmount = (amount: number | null) =>
    amount ? new Intl.NumberFormat("fr-FR").format(amount) + " FCFA" : "—";

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement des logs...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Activity className="w-5 h-5 text-gold" />
        Logs PayDunya (temps réel)
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{logs.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-500">
              {logs.filter((l) => l.status === "success" || l.status === "completed").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Succès</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-destructive">
              {logs.filter((l) => l.status === "failed" || l.status === "error" || l.event_type === "ipn_error").length}
            </p>
            <p className="text-[10px] text-muted-foreground">Échecs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-gold">
              {logs.filter((l) => l.matched).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Matchés</p>
          </CardContent>
        </Card>
      </div>

      {/* Log entries */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Événements récents</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Aucun log PayDunya</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getEventIcon(log)}
                      {getEventBadge(log)}
                      {!log.matched && log.event_type === "ipn" && (
                        <Badge variant="outline" className="text-[10px]">Non matché</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(log.created_at), "dd MMM HH:mm:ss", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono truncate max-w-[180px]">
                      TX: {log.transaction_id || "—"}
                    </span>
                    <span className="font-medium">{formatAmount(log.amount)}</span>
                  </div>
                  {log.response_code && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Code: {log.response_code}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent side="bottom" className="max-h-[80vh]">
          {selectedLog && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {getEventIcon(selectedLog)}
                  Détail du log
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{selectedLog.event_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span>{selectedLog.status || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code réponse</span>
                  <span className="font-mono">{selectedLog.response_code || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{selectedLog.transaction_id || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant</span>
                  <span className="font-medium">{formatAmount(selectedLog.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matché</span>
                  <span>{selectedLog.matched ? "✅ Oui" : "❌ Non"}</span>
                </div>
                {selectedLog.withdrawal_request_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retrait ID</span>
                    <span className="font-mono text-xs">{selectedLog.withdrawal_request_id}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(new Date(selectedLog.created_at), "dd MMM yyyy HH:mm:ss", { locale: fr })}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Payload brut</p>
                <ScrollArea className="h-48">
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminPaydunyaLogsTab;
