import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useInviteCodesRequired } from "@/hooks/useInviteCodesRequired";
import logoCollabCrea from "@/assets/logo-collabcrea.png";

const STORAGE_KEY = "invite_gate_code";

interface InviteGateProps {
  children: React.ReactNode;
}

const InviteGate = ({ children }: InviteGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { required, loading: settingLoading } = useInviteCodesRequired();
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage on mount + listen to external changes (e.g. "J'ai un code" button)
  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setUnlocked(!!stored);
      setChecked(true);
    };
    sync();
    window.addEventListener("invite-gate-reset", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("invite-gate-reset", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    setError(null);

    if (!/^COLLAB-[A-Z0-9]{4}$/.test(normalized)) {
      setError("Format invalide (ex: COLLAB-X7K9)");
      return;
    }

    setValidating(true);
    try {
      const { data: isValid, error: rpcError } = await supabase.rpc(
        "validate_invite_code",
        { p_code: normalized }
      );
      if (rpcError) throw rpcError;
      if (!isValid) {
        setError("Code invalide ou déjà utilisé");
        return;
      }
      // Store and unlock
      localStorage.setItem(STORAGE_KEY, normalized);
      setUnlocked(true);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setValidating(false);
    }
  };

  // Bypass: on auth page we never want to gate (avoid blank screens during loading)
  const isAuthRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/auth");
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Wait for initial checks
  if (!checked || authLoading || settingLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // Bypass: system disabled, already unlocked, or already logged in
  if (!required || unlocked || user) {
    return <>{children}</>;
  }

  // Show gate
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-background to-background" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-700/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoCollabCrea} alt="CollabCréa" className="h-16" />
        </div>

        {/* Card */}
        <div className="glass border border-gold/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-4 rounded-2xl bg-gold/10 border border-gold/30"
            >
              <Lock className="w-7 h-7 text-gold" />
            </motion.div>
          </div>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 mb-3">
              <Sparkles className="w-3 h-3 text-gold" />
              <span className="text-xs font-semibold text-gold tracking-wide">ACCÈS PRIVÉ</span>
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">
              Bêta exclusive
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CollabCréa est en lancement privé.<br />
              Entrez votre code d'invitation pour continuer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="COLLAB-XXXX"
              maxLength={11}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              className={`h-14 bg-muted/50 border rounded-xl uppercase tracking-widest font-mono text-center text-lg ${
                error ? "border-destructive" : "border-border focus:border-gold"
              }`}
            />
            {error && (
              <p className="text-destructive text-xs text-center">{error}</p>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={validating}
            >
              {validating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  Entrer
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Pas encore de code ?
            </p>
            <p className="text-xs text-foreground mt-1">
              Ajoute-moi sur Snap{" "}
              <span className="text-gold font-semibold">@lazone_officiel</span>
              <br />
              et demande le tien 👻
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => (window.location.href = "/auth")}
              className="text-xs text-muted-foreground hover:text-gold transition-colors underline underline-offset-4"
            >
              Déjà inscrit ? Se connecter
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteGate;
