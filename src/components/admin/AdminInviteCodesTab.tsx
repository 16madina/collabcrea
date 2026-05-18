import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Plus, Ticket, Power, Trash2, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useInviteCodesRequired } from "@/hooks/useInviteCodesRequired";

interface InviteCode {
  id: string;
  code: string;
  used_by: string | null;
  used_at: string | null;
  is_active: boolean;
  note: string | null;
  created_at: string;
  used_profile?: { full_name: string | null } | null;
}

const AdminInviteCodesTab = () => {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemEnabled, setSystemEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bulkCount, setBulkCount] = useState("10");
  const [note, setNote] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "used">("all");
  const { required } = useInviteCodesRequired();
  const localToggleRef = useRef(false);
  const initialSyncDone = useRef(false);

  const loadCodes = async () => {
    setLoading(true);
    const { data: codesData } = await supabase
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (codesData) {
      // Fetch profiles for used codes
      const usedIds = codesData.filter((c) => c.used_by).map((c) => c.used_by!);
      let profilesMap: Record<string, { full_name: string | null }> = {};
      if (usedIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", usedIds);
        if (profiles) {
          profilesMap = Object.fromEntries(
            profiles.map((p) => [p.user_id, { full_name: p.full_name }])
          );
        }
      }
      setCodes(
        codesData.map((c) => ({
          ...c,
          used_profile: c.used_by ? profilesMap[c.used_by] || null : null,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCodes();
  }, []);

  // Sync toggle state with Realtime changes (other tabs / devices)
  useEffect(() => {
    if (!initialSyncDone.current) {
      setSystemEnabled(required);
      initialSyncDone.current = true;
      return;
    }
    if (localToggleRef.current) return;
    if (required !== systemEnabled) {
      setSystemEnabled(required);
      toast.success(
        required
          ? "🔒 Accès privé mis à jour : activé depuis un autre onglet/appareil"
          : "🔓 Accès privé mis à jour : désactivé depuis un autre onglet/appareil"
      );
    }
  }, [required, systemEnabled]);

  const toggleSystem = async (enabled: boolean) => {
    localToggleRef.current = true;
    const { error } = await supabase
      .from("app_settings")
      .update({ value: enabled })
      .eq("key", "invite_codes_required");

    if (error) {
      toast.error("Erreur lors du changement");
      localToggleRef.current = false;
      return;
    }
    setSystemEnabled(enabled);
    toast.success(
      enabled
        ? "✅ Système activé : un code est requis à l'inscription"
        : "🔓 Système désactivé : inscription libre"
    );
    setTimeout(() => {
      localToggleRef.current = false;
    }, 1000);
  };

  const generateCodes = async (count: number) => {
    setGenerating(true);
    try {
      const generated: string[] = [];
      for (let i = 0; i < count; i++) {
        const { data, error } = await supabase.rpc("generate_invite_code", {
          p_note: note || null,
        });
        if (error) throw error;
        if (data && data[0]) generated.push(data[0].code);
      }
      toast.success(`${generated.length} code(s) généré(s)`);
      setNote("");
      await loadData();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`${code} copié`);
  };

  const copyAllAvailable = () => {
    const text = codes
      .filter((c) => !c.used_by && c.is_active)
      .map((c) => c.code)
      .join("\n");
    if (!text) {
      toast.error("Aucun code disponible");
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success("Tous les codes disponibles copiés");
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("invite_codes")
      .update({ is_active: !isActive })
      .eq("id", id);
    if (error) {
      toast.error("Erreur");
      return;
    }
    await loadData();
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Supprimer ce code ?")) return;
    const { error } = await supabase.from("invite_codes").delete().eq("id", id);
    if (error) {
      toast.error("Erreur");
      return;
    }
    await loadData();
  };

  const filteredCodes = codes.filter((c) => {
    if (filter === "available") return !c.used_by && c.is_active;
    if (filter === "used") return !!c.used_by;
    return true;
  });

  const stats = {
    total: codes.length,
    used: codes.filter((c) => c.used_by).length,
    available: codes.filter((c) => !c.used_by && c.is_active).length,
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Toggle système */}
      <Card className="p-5 border-gold/30 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <Power className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold">Codes d'invitation requis</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {systemEnabled
                  ? "🔒 L'inscription est restreinte aux codes valides"
                  : "🔓 Inscription libre, sans code"}
              </p>
            </div>
          </div>
          <Switch checked={systemEnabled} onCheckedChange={toggleSystem} />
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gold">{stats.total}</div>
          <div className="text-xs text-muted-foreground mt-1">Total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.available}</div>
          <div className="text-xs text-muted-foreground mt-1">Disponibles</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-muted-foreground">{stats.used}</div>
          <div className="text-xs text-muted-foreground mt-1">Utilisés</div>
        </Card>
      </div>

      {/* Génération */}
      <Card className="p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-gold" />
          Générer des codes
        </h3>
        <div>
          <Label htmlFor="note" className="text-xs">
            Note (optionnelle, ex: "Envoyé à @marie sur Snap")
          </Label>
          <Input
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note interne..."
            className="mt-1"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => generateCodes(1)} disabled={generating} variant="gold">
            +1 code
          </Button>
          <Button onClick={() => generateCodes(10)} disabled={generating} variant="outline">
            +10 codes
          </Button>
          <Button onClick={() => generateCodes(50)} disabled={generating} variant="outline">
            +50 codes
          </Button>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="1"
              max="500"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              className="w-20"
            />
            <Button
              onClick={() => generateCodes(Math.min(500, parseInt(bulkCount) || 1))}
              disabled={generating}
              variant="outline"
            >
              Générer
            </Button>
          </div>
        </div>
      </Card>

      {/* Liste */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              Tous
            </Button>
            <Button
              size="sm"
              variant={filter === "available" ? "default" : "outline"}
              onClick={() => setFilter("available")}
            >
              Disponibles
            </Button>
            <Button
              size="sm"
              variant={filter === "used" ? "default" : "outline"}
              onClick={() => setFilter("used")}
            >
              Utilisés
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={copyAllAvailable}>
            <Copy className="w-3 h-3 mr-1" />
            Copier tous les dispos
          </Button>
        </div>

        {filteredCodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Aucun code
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCodes.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between gap-2 p-3 rounded-lg border ${
                  c.used_by
                    ? "bg-muted/30 border-border opacity-70"
                    : c.is_active
                    ? "bg-card border-gold/20"
                    : "bg-muted/30 border-border opacity-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono font-bold text-gold">{c.code}</code>
                    {c.used_by ? (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Utilisé
                      </Badge>
                    ) : c.is_active ? (
                      <Badge variant="outline" className="text-xs border-green-500/40 text-green-500">
                        Disponible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Désactivé
                      </Badge>
                    )}
                  </div>
                  {c.note && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">📝 {c.note}</p>
                  )}
                  {c.used_by && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Par {c.used_profile?.full_name || "Utilisateur"} •{" "}
                      {c.used_at && format(new Date(c.used_at), "d MMM yyyy", { locale: fr })}
                    </p>
                  )}
                  {!c.used_by && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Créé le {format(new Date(c.created_at), "d MMM yyyy", { locale: fr })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!c.used_by && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => copyCode(c.code)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleActive(c.id, c.is_active)}
                        title={c.is_active ? "Désactiver" : "Réactiver"}
                      >
                        <Power className={`w-4 h-4 ${c.is_active ? "text-green-500" : "text-muted-foreground"}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteCode(c.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminInviteCodesTab;
