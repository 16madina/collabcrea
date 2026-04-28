import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle, Briefcase, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "push_prompt_state"; // "accepted" | "denied_forever" | "dismissed:<timestamp>"

const shouldPrompt = async (userId: string): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  // Check system permission first
  try {
    const perm = await PushNotifications.checkPermissions();
    if (perm.receive === "granted") {
      // Already granted — make sure we have a token saved
      const { data } = await supabase
        .from("push_tokens")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
      if (data && data.length > 0) return false;
      // Granted but no token: re-register silently, no sheet needed
      try { await PushNotifications.register(); } catch {}
      return false;
    }
    if (perm.receive === "denied") {
      // OS-level denied: cannot re-prompt, don't bother user
      return false;
    }
  } catch {
    return false;
  }

  const state = localStorage.getItem(STORAGE_KEY);
  if (state === "accepted" || state === "denied_forever") return false;

  // If dismissed recently (less than 24h ago), wait
  if (state?.startsWith("dismissed:")) {
    const ts = parseInt(state.split(":")[1] || "0", 10);
    if (Date.now() - ts < 24 * 60 * 60 * 1000) return false;
  }

  return true;
};

const PushPermissionSheet = () => {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const ok = await shouldPrompt(user.id);
      if (!cancelled && ok) setOpen(true);
    }, 1500); // Let the page settle first
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, loading]);

  const handleEnable = async () => {
    setRequesting(true);
    try {
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive === "granted") {
        await PushNotifications.register();
        localStorage.setItem(STORAGE_KEY, "accepted");
      } else {
        localStorage.setItem(STORAGE_KEY, "denied_forever");
      }
    } catch (e) {
      console.error("Push permission error:", e);
    } finally {
      setRequesting(false);
      setOpen(false);
    }
  };

  const handleLater = () => {
    localStorage.setItem(STORAGE_KEY, `dismissed:${Date.now()}`);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleLater(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-primary/20 bg-gradient-to-b from-background to-background/95 backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
      >
        <SheetHeader className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
            <Bell className="h-8 w-8 text-primary-foreground" />
          </div>
          <SheetTitle className="text-xl">Activez les notifications</SheetTitle>
          <SheetDescription className="text-sm">
            Ne ratez aucune opportunité importante sur CollabCréa.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Nouvelles offres & candidatures</div>
              <div className="text-muted-foreground text-xs">Soyez alerté dès qu'une opportunité arrive</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Messages instantanés</div>
              <div className="text-muted-foreground text-xs">Restez connecté avec vos collaborateurs</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3">
            <Wallet className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Paiements & vérifications</div>
              <div className="text-muted-foreground text-xs">Suivi en temps réel de votre activité</div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button
            onClick={handleEnable}
            disabled={requesting}
            className="w-full h-12 rounded-xl text-base font-semibold"
          >
            {requesting ? "Activation..." : "Activer les notifications"}
          </Button>
          <Button
            onClick={handleLater}
            variant="ghost"
            className="w-full h-11 rounded-xl text-muted-foreground"
          >
            Plus tard
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PushPermissionSheet;
