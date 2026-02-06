import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { User, Building2, ArrowLeft, Mail, Lock, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import logoCollabCrea from "@/assets/logo-collabcrea.png";

type UserRole = "creator" | "brand" | null;
type AuthMode = "login" | "signup";

// Validation schemas
const emailSchema = z.string().email("Email invalide").max(255);
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100);
const nameSchema = z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100);

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading, signUp, signIn } = useAuth();
  
  const [role, setRole] = useState<UserRole>(null);
  const [mode, setMode] = useState<AuthMode>("signup");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userRole) {
      if (userRole === "creator") {
        navigate("/creator/dashboard");
      } else {
        navigate("/brand/dashboard");
      }
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "creator" || roleParam === "brand") {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
  };

  const handleBack = () => {
    if (role) {
      setRole(null);
    } else {
      navigate("/");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; name?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    if (mode === "signup") {
      try {
        nameSchema.parse(name);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.name = e.errors[0].message;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!role) {
      toast.error("Veuillez sélectionner un rôle");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, name, role);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("Cet email est déjà utilisé");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Compte créé avec succès !", {
          description: "Vérifiez votre email pour confirmer votre inscription.",
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou mot de passe incorrect");
          } else {
            toast.error(error.message);
          }
          return;
        }
        toast.success("Connexion réussie !");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-2 pb-2 flex items-center gap-4"
      >
        <button
          onClick={handleBack}
          className="touch-target rounded-full glass p-2"
        >
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <Link to="/" className="flex items-center">
          <img 
            src={logoCollabCrea} 
            alt="CollabCréa" 
            className="h-10 md:h-12 w-auto"
          />
        </Link>
      </motion.header>

      <div className="flex-1 flex flex-col px-6 pb-8 safe-bottom">
        <AnimatePresence mode="wait">
          {!role ? (
            // Role Selection
            <motion.div
              key="role-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <h2 className="font-display text-3xl font-bold mb-4">
                  Qui êtes-vous ?
                </h2>
                <p className="text-muted-foreground">
                  Choisissez votre profil pour commencer
                </p>
              </motion.div>

              <div className="space-y-4">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => handleRoleSelect("creator")}
                  className="w-full glass-card p-6 flex items-center gap-4 text-left group hover:border-gold/50 transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                    <User className="w-8 h-8 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold text-gold mb-1">
                      Créateur
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Influenceur, créateur de contenu, artiste
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleRoleSelect("brand")}
                  className="w-full glass-card p-6 flex items-center gap-4 text-left group hover:border-gold/50 transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-violet-light/30 flex items-center justify-center group-hover:bg-violet-light/50 transition-colors">
                    <Building2 className="w-8 h-8 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-semibold text-gold mb-1">
                      Marque
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Entreprise, agence, annonceur
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // Auth Form
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-8"
              >
                <div className="w-16 h-16 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  {role === "creator" ? (
                    <User className="w-8 h-8 text-gold" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gold" />
                  )}
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">
                  {mode === "signup" ? "Créer un compte" : "Connexion"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {role === "creator" ? "Compte Créateur" : "Compte Marque"}
                </p>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name" className="text-muted-foreground">
                      {role === "creator" ? "Nom complet" : "Nom de l'entreprise"}
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={role === "creator" ? "Votre nom" : "Nom de votre marque"}
                      className={`h-14 bg-muted/50 border-border focus:border-gold rounded-xl px-4 ${errors.name ? "border-destructive" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-destructive text-xs">{errors.name}</p>
                    )}
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className={`h-14 bg-muted/50 border-border focus:border-gold rounded-xl pl-12 ${errors.email ? "border-destructive" : ""}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-xs">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`h-14 bg-muted/50 border-border focus:border-gold rounded-xl pl-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground touch-target"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs">{errors.password}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  variant="gold" 
                  size="lg" 
                  className="w-full mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      {mode === "signup" ? "Créer mon compte" : "Se connecter"}
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {mode === "signup" ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                    className="text-gold font-medium hover:underline"
                  >
                    {mode === "signup" ? "Se connecter" : "S'inscrire"}
                  </button>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
