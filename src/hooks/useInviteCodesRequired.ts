import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// v2 — bust old stale caches that may have stored "true" before admin toggled it off
const CACHE_KEY = "invite_codes_required_cache_v2";

function readCache(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CACHE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function writeCache(value: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, value ? "true" : "false");
  } catch {
    // ignore
  }
}

export function useInviteCodesRequired() {
  const cached = readCache();
  const [required, setRequired] = useState<boolean>(cached ?? false);
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    let mounted = true;

    const fetchValue = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "invite_codes_required")
        .maybeSingle();
      if (!mounted) return;
      const value = data?.value === true;
      setRequired(value);
      setLoading(false);
      writeCache(value);
    };

    fetchValue();

    // Realtime: react instantly when an admin toggles the setting
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
          const newVal = (payload.new as { value?: unknown } | null)?.value === true;
          if (!mounted) return;
          setRequired(newVal);
          writeCache(newVal);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { required, loading };
}
