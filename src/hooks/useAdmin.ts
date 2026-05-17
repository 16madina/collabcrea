import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAdminRole = async (attempt = 0): Promise<void> => {
      if (!user) {
        setIsAdmin(false);
        setErrored(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        setIsAdmin(!!data);
        setErrored(false);
        setLoading(false);
      } catch (error: any) {
        console.error("Error checking admin role:", error);
        // Network-style failures (e.g. iOS "Load failed"): retry a few times
        // before giving up so we don't wrongly redirect admins away.
        if (!cancelled && attempt < 3) {
          setTimeout(() => {
            if (!cancelled) checkAdminRole(attempt + 1);
          }, 1000 * (attempt + 1));
          return;
        }
        if (!cancelled) {
          setIsAdmin(false);
          setErrored(true);
          setLoading(false);
        }
      }
    };

    setLoading(true);
    checkAdminRole();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { isAdmin, loading, errored };
};
