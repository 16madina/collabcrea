import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "creator" | "brand";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  category: string | null;
  country: string | null;
  followers: string | null;
  identity_verified: boolean | null;
  email_verified: boolean | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const fetchUserData = async (userId: string) => {
    // Prevent duplicate concurrent calls
    if (isFetching) return;
    setIsFetching(true);

    // Timeout failsafe: si une requête reste bloquée (réseau Capacitor),
    // on n'attend pas indéfiniment.
    const withTimeout = <T,>(p: Promise<T>, ms = 8000): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("fetchUserData timeout")), ms)
        ),
      ]);

    try {
      const [profileResult, rolesResult] = await withTimeout(
        Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId),
        ])
      );

      if (profileResult.data) {
        setProfile(profileResult.data);
      }

      if (rolesResult.data && rolesResult.data.length > 0) {
        const roles = rolesResult.data.map((r) => r.role);
        const primaryRole = roles.find((r) => r === "creator" || r === "brand");
        if (primaryRole) {
          setRole(primaryRole as AppRole);
        }
      }
    } catch (error) {
      console.warn("[useAuth] fetchUserData error:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let initialSessionHandled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Only process if this is a new event, not the initial session
        if (initialSessionHandled) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            // Defer Supabase calls with setTimeout
            setTimeout(() => {
              if (mounted) {
                fetchUserData(session.user.id).finally(() => {
                  if (mounted) setLoading(false);
                });
              }
            }, 0);
          } else {
            setProfile(null);
            setRole(null);
            setLoading(false);
          }
        }
      }
    );

    // THEN check for existing session - this handles the initial load
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!mounted || initialSessionHandled) return;
        initialSessionHandled = true;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserData(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          if (mounted) setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("[useAuth] getSession failed:", err);
        if (!mounted) return;
        initialSessionHandled = true;
        setLoading(false);
      });

    // Failsafe: si getSession ne répond pas en 8s (réseau Capacitor lent
    // ou WebView bloquée), on débloque le chargement pour éviter un
    // spinner infini sur iOS/Android.
    const failsafe = setTimeout(() => {
      if (mounted && !initialSessionHandled) {
        console.warn("[useAuth] failsafe timeout - unblocking loading");
        initialSessionHandled = true;
        setLoading(false);
      }
    }, 8000);

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, selectedRole: AppRole) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: fullName,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // Assign role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: selectedRole,
        });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }

        setRole(selectedRole);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("invite_gate_code");
    localStorage.removeItem("invite_gate_version");
    sessionStorage.removeItem("invite_gate_force_prompt");
    sessionStorage.removeItem("invite_gate_unlocked_session");
    window.dispatchEvent(new Event("invite-gate-reset"));
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
