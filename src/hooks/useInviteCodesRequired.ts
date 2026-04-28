import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useInviteCodesRequired() {
  const [required, setRequired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "invite_codes_required")
        .maybeSingle();
      if (mounted) {
        setRequired(data?.value === true);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { required, loading };
}
