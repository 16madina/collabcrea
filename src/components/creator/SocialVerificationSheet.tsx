import { useState, useRef, useEffect } from "react";
import { Camera, Upload, CheckCircle, XCircle, Clock, Loader2, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  YouTubeIcon,
  InstagramIcon,
  TikTokIcon,
  SnapchatIcon,
  FacebookIcon,
} from "@/components/ui/social-icons";

interface SocialVerificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  defaultPlatform?: string;
}

const PLATFORMS = [
  { value: "youtube", label: "YouTube", icon: YouTubeIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "tiktok", label: "TikTok", icon: TikTokIcon },
  { value: "snapchat", label: "Snapchat", icon: SnapchatIcon },
  { value: "facebook", label: "Facebook", icon: FacebookIcon },
] as const;

type VerificationStatus = "idle" | "extracting" | "uploading" | "analyzing" | "verified" | "rejected" | "pending_admin";

const SocialVerificationSheet = ({ isOpen, onClose, onUpdate, defaultPlatform }: SocialVerificationSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [platform, setPlatform] = useState<string>(defaultPlatform || "");
  const [pageName, setPageName] = useState("");
  const [claimedFollowers, setClaimedFollowers] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [resultMessage, setResultMessage] = useState("");
  const [identityVerified, setIdentityVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen && defaultPlatform) {
      setPlatform(defaultPlatform);
    }
  }, [isOpen, defaultPlatform]);

  // Check identity verification status when sheet opens
  useEffect(() => {
    if (!isOpen || !user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("identity_verified")
        .eq("user_id", user.id)
        .maybeSingle();
      setIdentityVerified(!!data?.identity_verified);
    })();
  }, [isOpen, user]);

  const resetForm = () => {
    setPlatform("");
    setPageName("");
    setClaimedFollowers("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setStatus("idle");
    setResultMessage("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 10 Mo", variant: "destructive" });
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Auto-extract page name + followers via AI if platform already selected
    if (platform) {
      await extractFromImage(file);
    }
  };

  const extractFromImage = async (file: File) => {
    setStatus("extracting");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-social-screenshot", {
        body: { image_base64: base64, mime_type: file.type, platform },
      });

      if (error) throw error;

      if (data?.found) {
        // SECURITY: Never auto-fill the page name from AI — that would defeat the verification
        // (the AI would compare its own extraction with itself). Only pre-fill the follower count.
        if (data.followers && !claimedFollowers.trim()) setClaimedFollowers(data.followers);
        toast({
          title: "✨ Abonnés extraits par l'IA",
          description: "Vérifiez le nombre et corrigez si besoin.",
        });
      }
    } catch (err) {
      console.error("Auto-extract error:", err);
      // Silent fail – user can fill manually
    } finally {
      setStatus("idle");
    }
  };

  const handleSubmit = async () => {
    if (!user || !platform || !pageName.trim() || !claimedFollowers.trim() || !screenshotFile) {
      toast({ title: "Champs requis", description: "Remplissez tous les champs et ajoutez une capture d'écran", variant: "destructive" });
      return;
    }

    setStatus("uploading");

    try {
      // Upload screenshot
      const fileExt = screenshotFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${platform}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("social-screenshots")
        .upload(filePath, screenshotFile);

      if (uploadError) throw uploadError;

      // Create verification record
      const { data: verification, error: insertError } = await supabase
        .from("social_verifications")
        .insert({
          user_id: user.id,
          platform,
          page_name: pageName.trim(),
          claimed_followers: claimedFollowers.trim(),
          screenshot_url: filePath,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      setStatus("analyzing");

      // Call AI verification
      const { data: result, error: fnError } = await supabase.functions.invoke(
        "verify-social-screenshot",
        { body: { verification_id: verification.id } }
      );

      if (fnError) throw fnError;

      if (result.status === "verified") {
        setStatus("verified");
        setResultMessage(
          `✅ Vérifié ! ${result.extracted_followers} abonnés détectés sur votre page "${result.extracted_name}".`
        );
        onUpdate();
      } else if (result.status === "pending_admin") {
        setStatus("pending_admin");
        setResultMessage(
          "L'IA n'a pas pu vérifier automatiquement. Votre demande a été envoyée à un administrateur pour vérification manuelle."
        );
      } else {
        setStatus("rejected");
        setResultMessage(
          result.reason || "Les informations ne correspondent pas à la capture d'écran. Veuillez réessayer."
        );
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus("idle");
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const selectedPlatform = PLATFORMS.find((p) => p.value === platform);
  const canSubmit = platform && pageName.trim() && claimedFollowers.trim() && screenshotFile && status === "idle";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setTimeout(resetForm, 300);
        }
      }}
    >
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-gold" />
            Vérifier un réseau social
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Ajoutez votre page et une capture d'écran. L'IA vérifiera automatiquement vos abonnés.
          </p>
        </SheetHeader>

        {/* Identity gate — block social verification if user hasn't verified their identity */}
        {identityVerified === false && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Vérification d'identité requise
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pour éviter l'usurpation d'identité, vous devez d'abord vérifier votre identité
                  (pièce d'identité + selfie) avant de pouvoir lier un réseau social.
                </p>
                <Link to="/creator/profile?tab=security">
                  <Button variant="gold" size="sm" className="mt-3" onClick={() => onClose()}>
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Vérifier mon identité
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Result States */}
        {status === "verified" && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">Vérifié avec succès !</p>
                <p className="text-sm text-muted-foreground mt-1">{resultMessage}</p>
                <Button variant="gold" size="sm" className="mt-3" onClick={() => { onClose(); setTimeout(resetForm, 300); }}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === "pending_admin" && (
          <div className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-400">En attente de vérification</p>
                <p className="text-sm text-muted-foreground mt-1">{resultMessage}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { onClose(); setTimeout(resetForm, 300); }}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {status === "rejected" && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">Vérification échouée</p>
                <p className="text-sm text-muted-foreground mt-1">{resultMessage}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { setStatus("idle"); setResultMessage(""); }}>
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Form — hidden until identity is verified */}
        {identityVerified !== false && (status === "idle" || status === "extracting" || status === "uploading" || status === "analyzing") && (
          <div className="space-y-5">
            {/* Platform Select */}
            <div className="space-y-2">
              <Label>Plateforme</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une plateforme" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    return (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 p-0" size={16} />
                          {p.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Page Name — MUST be filled before screenshot upload (security) */}
            <div className="space-y-2">
              <Label>
                Nom de votre page / compte <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder={`Ex: ${platform === "youtube" ? "MaChaine" : platform === "tiktok" ? "@monpseudo" : "MonCompte"}`}
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                maxLength={100}
                disabled={!platform}
              />
              <p className="text-xs text-muted-foreground">
                Saisissez exactement le nom/pseudo affiché sur votre profil {selectedPlatform?.label || "réseau social"}.
              </p>
            </div>

            {/* Screenshot Upload — locked until platform + name are filled */}
            <div className="space-y-2">
              <Label>
                Capture d'écran de votre page <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                {!platform || !pageName.trim()
                  ? "⚠️ Choisissez d'abord la plateforme et saisissez le nom de votre page."
                  : "Prenez une capture montrant clairement le nom de votre page et le nombre d'abonnés."}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={!platform || !pageName.trim()}
              />

              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-gold/30">
                  <img
                    src={screenshotPreview}
                    alt="Capture d'écran"
                    className="w-full max-h-64 object-contain bg-muted"
                  />
                  {status === "extracting" && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-gold" />
                      <span className="text-xs font-medium">L'IA analyse votre capture...</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-background/80 text-xs font-medium hover:bg-background transition-colors"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!platform || !pageName.trim()}
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {!platform || !pageName.trim() ? "Remplissez les champs ci-dessus" : "Cliquez pour ajouter une capture"}
                  </span>
                </button>
              )}
            </div>

            {/* Claimed Followers — auto-filled by AI after upload, editable */}
            <div className="space-y-2">
              <Label>Nombre d'abonnés <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ex: 50K, 1.2M, 15000"
                value={claimedFollowers}
                onChange={(e) => setClaimedFollowers(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Submit */}
            <Button
              variant="gold"
              className="w-full"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {status === "uploading" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Envoi en cours...
                </>
              )}
              {status === "analyzing" && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyse IA en cours...
                </>
              )}
              {status === "idle" && (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Vérifier avec l'IA
                </>
              )}
            </Button>

            {/* Info */}
            {selectedPlatform && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground">
                  💡 <strong>Conseil :</strong> Ouvrez votre profil {selectedPlatform.label} et faites
                  une capture d'écran montrant clairement votre nom et le nombre d'abonnés.
                </p>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default SocialVerificationSheet;
