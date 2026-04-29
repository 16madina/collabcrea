import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Share2, Camera, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import YouTubeConnectButton from "./YouTubeConnectButton";
import TikTokConnectButton from "./TikTokConnectButton";
import SocialVerificationSheet from "./SocialVerificationSheet";
import { YouTubeIcon, InstagramIcon, TikTokIcon, SnapchatIcon, FacebookIcon } from "@/components/ui/social-icons";

const socialSchema = z.object({
  youtube_followers: z.string().optional(),
  instagram_followers: z.string().optional(),
  tiktok_followers: z.string().optional(),
  snapchat_followers: z.string().optional(),
  facebook_followers: z.string().optional(),
});

type SocialFormData = z.infer<typeof socialSchema>;

interface SocialEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    youtube_followers: string | null;
    instagram_followers: string | null;
    tiktok_followers: string | null;
    snapchat_followers: string | null;
    facebook_followers: string | null;
  };
  onUpdate: () => void;
}

const SocialEditSheet = ({ isOpen, onClose, initialData, onUpdate }: SocialEditSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationSheet, setShowVerificationSheet] = useState(false);
  const [verificationPlatform, setVerificationPlatform] = useState<string>("");
  const [verificationStatuses, setVerificationStatuses] = useState<Record<string, string>>({});

  // Fetch latest verification status for each platform
  useEffect(() => {
    if (!user || !isOpen) return;
    const fetchStatuses = async () => {
      const { data } = await supabase
        .from("social_verifications")
        .select("platform, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        const statuses: Record<string, string> = {};
        data.forEach((v) => {
          if (!statuses[v.platform]) statuses[v.platform] = v.status;
        });
        setVerificationStatuses(statuses);
      }
    };
    fetchStatuses();
  }, [user, isOpen]);

  const openVerification = (platform: string) => {
    setVerificationPlatform(platform);
    setShowVerificationSheet(true);
  };

  const getVerifyButton = (platform: string) => {
    const status = verificationStatuses[platform];
    if (status === "verified") {
      return (
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1 text-green-600 border-green-300">
          <CheckCircle className="w-4 h-4" /> Vérifié
        </Button>
      );
    }
    if (status === "pending_admin" || status === "pending") {
      return (
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1 text-yellow-600 border-yellow-300" disabled>
          <Clock className="w-4 h-4" /> En cours
        </Button>
      );
    }
    return (
      <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => openVerification(platform)}>
        <Camera className="w-4 h-4" /> Vérifier
      </Button>
    );
  };

  const form = useForm<SocialFormData>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      youtube_followers: initialData.youtube_followers || "",
      instagram_followers: initialData.instagram_followers || "",
      tiktok_followers: initialData.tiktok_followers || "",
      snapchat_followers: initialData.snapchat_followers || "",
      facebook_followers: initialData.facebook_followers || "",
    },
  });

  const onSubmit = async (data: SocialFormData) => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          youtube_followers: data.youtube_followers || null,
          instagram_followers: data.instagram_followers || null,
          tiktok_followers: data.tiktok_followers || null,
          snapchat_followers: data.snapchat_followers || null,
          facebook_followers: data.facebook_followers || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Réseaux sociaux mis à jour",
        description: "Vos statistiques ont été enregistrées",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating social:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-gold" />
            Mes réseaux sociaux
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {([
              { name: "youtube_followers", platform: "youtube", label: "YouTube", placeholder: "Ex: 150K", Icon: YouTubeIcon, connectBtn: "youtube" as string | undefined },
              { name: "instagram_followers", platform: "instagram", label: "Instagram", placeholder: "Ex: 250K", Icon: InstagramIcon, connectBtn: undefined as string | undefined },
              { name: "tiktok_followers", platform: "tiktok", label: "TikTok", placeholder: "Ex: 500K", Icon: TikTokIcon, connectBtn: "tiktok" as string | undefined },
              { name: "snapchat_followers", platform: "snapchat", label: "Snapchat", placeholder: "Ex: 100K", Icon: SnapchatIcon, connectBtn: undefined as string | undefined },
              { name: "facebook_followers", platform: "facebook", label: "Facebook", placeholder: "Ex: 200K", Icon: FacebookIcon, connectBtn: undefined as string | undefined },
            ]).map(({ name, platform, label, placeholder, Icon, connectBtn }) => {
              const isVerified = verificationStatuses[platform] === "verified";
              return (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-3">
                        <Icon className="w-10 h-10 p-2" size={20} />
                        <div className="flex-1">
                          <FormLabel>{label}</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Input
                                placeholder={placeholder}
                                {...field}
                                className="flex-1"
                                readOnly={isVerified}
                                disabled={isVerified}
                              />
                            </FormControl>
                            {connectBtn === "youtube" && (
                              <YouTubeConnectButton
                                currentFollowers={initialData.youtube_followers}
                                onSyncComplete={onUpdate}
                              />
                            )}
                            {connectBtn === "tiktok" && (
                              <TikTokConnectButton
                                currentFollowers={initialData.tiktok_followers}
                                onSyncComplete={onUpdate}
                              />
                            )}
                            {getVerifyButton(platform)}
                          </div>
                          {isVerified && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              🔒 Champ verrouillé. Pour modifier, refaites une vérification avec une nouvelle capture.
                            </p>
                          )}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}



            {/* Footer */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>

    <SocialVerificationSheet
      isOpen={showVerificationSheet}
      onClose={() => setShowVerificationSheet(false)}
      onUpdate={onUpdate}
      defaultPlatform={verificationPlatform}
    />
    </>
  );
};

export default SocialEditSheet;
