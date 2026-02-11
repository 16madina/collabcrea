import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Share2, Camera } from "lucide-react";
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

  const openVerification = (platform: string) => {
    setVerificationPlatform(platform);
    setShowVerificationSheet(true);
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
            <FormField
              control={form.control}
              name="youtube_followers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <YouTubeIcon className="w-10 h-10 p-2" size={20} />
                    <div className="flex-1">
                      <FormLabel>YouTube</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Ex: 150K" {...field} className="flex-1" />
                        </FormControl>
                        <YouTubeConnectButton 
                          currentFollowers={initialData.youtube_followers}
                          onSyncComplete={onUpdate}
                        />
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instagram_followers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <InstagramIcon className="w-10 h-10 p-2" size={20} />
                    <div className="flex-1">
                      <FormLabel>Instagram</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Ex: 250K" {...field} className="flex-1" />
                        </FormControl>
                        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => openVerification("instagram")}>
                          <Camera className="w-4 h-4" /> Vérifier
                        </Button>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tiktok_followers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <TikTokIcon className="w-10 h-10 p-2" size={20} />
                    <div className="flex-1">
                      <FormLabel>TikTok</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Ex: 500K" {...field} className="flex-1" />
                        </FormControl>
                        <TikTokConnectButton 
                          currentFollowers={initialData.tiktok_followers}
                          onSyncComplete={onUpdate}
                        />
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="snapchat_followers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <SnapchatIcon className="w-10 h-10 p-2" size={20} />
                    <div className="flex-1">
                      <FormLabel>Snapchat</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Ex: 100K" {...field} className="flex-1" />
                        </FormControl>
                        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => openVerification("snapchat")}>
                          <Camera className="w-4 h-4" /> Vérifier
                        </Button>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facebook_followers"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FacebookIcon className="w-10 h-10 p-2" size={20} />
                    <div className="flex-1">
                      <FormLabel>Facebook</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input placeholder="Ex: 200K" {...field} className="flex-1" />
                        </FormControl>
                        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1" onClick={() => openVerification("facebook")}>
                          <Camera className="w-4 h-4" /> Vérifier
                        </Button>
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />



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
