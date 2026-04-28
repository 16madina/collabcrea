import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "invite_codes_required_cache";

function readCache(): boolean | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CACHE_KEY);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

export function useInviteCodesRequired() {
  const cached = readCache();
  const [required, setRequired] = useState<boolean>(cached ?? false);
  // If we have a cached value, we can skip the loading state to avoid blank screens
  const [loading, setLoading] = useState(cached === null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "invite_codes_required")
        .maybeSingle();
      if (!mounted) return;
      const value = data?.value === true;
      setRequired(value);
      setLoading(false);
      try {
        sessionStorage.setItem(CACHE_KEY, value ? "true" : "false");
      } catch {
        // ignore storage errors
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { required, loading };
}
