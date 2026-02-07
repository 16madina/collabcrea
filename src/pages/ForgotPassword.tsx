import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import logoCollabCrea from "@/assets/logo-collabcrea.png";

const emailSchema = z.string().email("Email invalide").max(255);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      emailSchema.parse(email);
    } catch {
      setError("Email invalide");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast.success("Email envoyé !", {
        description: "Vérifiez votre boîte de réception.",
      });
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-2 pb-2 flex items-center gap-4"
      >
        <button
          onClick={() => navigate("/auth")}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
        >
          {isEmailSent ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-3">
                Email envoyé !
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Nous avons envoyé un lien de réinitialisation à{" "}
                <span className="text-foreground font-medium">{email}</span>.
                <br />
                Vérifiez votre boîte de réception et vos spams.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsEmailSent(false)}
                className="w-full"
              >
                Renvoyer l'email
              </Button>
              <Link
                to="/auth"
                className="block mt-4 text-gold text-sm hover:underline"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl font-bold mb-2">
                  Mot de passe oublié
                </h2>
                <p className="text-muted-foreground text-sm">
                  Entrez votre email pour recevoir un lien de réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="vous@exemple.com"
                      className={`h-14 bg-muted/50 border-border focus:border-gold rounded-xl pl-12 ${
                        error ? "border-destructive" : ""
                      }`}
                    />
                  </div>
                  {error && (
                    <p className="text-destructive text-xs">{error}</p>
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
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/auth"
                  className="text-muted-foreground text-sm hover:text-gold"
                >
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
