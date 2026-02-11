import { useState, useRef } from "react";
import { Camera, Upload, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
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
}

const PLATFORMS = [
  { value: "youtube", label: "YouTube", icon: YouTubeIcon },
  { value: "instagram", label: "Instagram", icon: InstagramIcon },
  { value: "tiktok", label: "TikTok", icon: TikTokIcon },
  { value: "snapchat", label: "Snapchat", icon: SnapchatIcon },
  { value: "facebook", label: "Facebook", icon: FacebookIcon },
] as const;

type VerificationStatus = "idle" | "uploading" | "analyzing" | "verified" | "rejected" | "pending_admin";

const SocialVerificationSheet = ({ isOpen, onClose, onUpdate }: SocialVerificationSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [platform, setPlatform] = useState<string>("");
  const [pageName, setPageName] = useState("");
  const [claimedFollowers, setClaimedFollowers] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [resultMessage, setResultMessage] = useState("");

  const resetForm = () => {
    setPlatform("");
    setPageName("");
    setClaimedFollowers("");
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setStatus("idle");
    setResultMessage("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        {/* Form */}
        {(status === "idle" || status === "uploading" || status === "analyzing") && (
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

            {/* Page Name */}
            <div className="space-y-2">
              <Label>Nom de votre page / compte</Label>
              <Input
                placeholder={`Ex: ${platform === "youtube" ? "MaChaine" : platform === "tiktok" ? "@monpseudo" : "MonCompte"}`}
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Claimed Followers */}
            <div className="space-y-2">
              <Label>Nombre d'abonnés</Label>
              <Input
                placeholder="Ex: 50K, 1.2M, 15000"
                value={claimedFollowers}
                onChange={(e) => setClaimedFollowers(e.target.value)}
                maxLength={20}
              />
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <Label>Capture d'écran de votre page</Label>
              <p className="text-xs text-muted-foreground">
                Prenez une capture d'écran montrant le nom de votre page et le nombre d'abonnés
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {screenshotPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-gold/30">
                  <img
                    src={screenshotPreview}
                    alt="Capture d'écran"
                    className="w-full max-h-64 object-contain bg-muted"
                  />
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
                  className="w-full h-40 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cliquez pour ajouter une capture</span>
                </button>
              )}
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
