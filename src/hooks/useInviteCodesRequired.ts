import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Source de vérité unique pour l'accès privé.
 * - Toujours relu depuis le serveur au montage (pas de cache persistant
 *   qui pourrait masquer un changement admin après déconnexion).
 * - Écoute Realtime pour réagir instantanément aux toggles admin.
 * - Expose `updatedAt` pour permettre aux écrans (InviteGate, /auth) de
 *   versionner leur déverrouillage local et l'invalider si l'admin a
 *   changé le réglage depuis.
 */
export function useInviteCodesRequired() {
  const [required, setRequired] = useState<boolean>(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const apply = (value: unknown, ts: string | null) => {
      if (!mounted) return;
      const v = value === true;
      setRequired(v);
      setUpdatedAt(ts);
      setLoading(false);
      try {
        // Notifie les autres composants du tab (InviteGate, /auth) pour
        // qu'ils ré-évaluent leur déverrouillage local.
        window.dispatchEvent(
          new CustomEvent("invite-gate-setting-changed", {
            detail: { required: v, updatedAt: ts },
          }),
        );
      } catch {
        /* ignore */
      }
    };

    const fetchValue = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value, updated_at")
        .eq("key", "invite_codes_required")
        .maybeSingle();
      apply(data?.value, (data?.updated_at as string | undefined) ?? null);
    };

    fetchValue();

    const channel = supabase
      .channel("app_settings_invite_gate")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "app_settings",
          filter: "key=eq.invite_codes_required",
        },
        (payload) => {
          const row = payload.new as
            | { value?: unknown; updated_at?: string }
            | null;
          apply(row?.value, row?.updated_at ?? new Date().toISOString());
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { required, updatedAt, loading };
}
