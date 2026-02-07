import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Youtube, Instagram, Share2 } from "lucide-react";
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

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Snapchat icon component
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.42.42 0 0 1 .165-.036c.101 0 .21.035.3.096.135.09.21.21.21.36 0 .165-.09.315-.225.405a2.2 2.2 0 0 1-.405.195c-.12.045-.24.09-.359.12-.165.045-.329.09-.479.149-.21.075-.27.225-.3.449 0 .03-.015.06-.015.09v.061c.014.175.03.375.089.569a.32.32 0 0 0 .029.069c.021.044.04.085.061.12.165.256.314.404.614.599.27.18.614.315 1.019.45.104.033.21.063.3.105.209.09.405.24.495.45.045.12.06.255.045.39-.075.33-.375.54-.674.585a3.65 3.65 0 0 1-.569.045c-.225 0-.45-.03-.66-.045-.255-.03-.494-.045-.704-.045-.12 0-.24 0-.345.015-.21.015-.42.09-.6.195-.375.195-.705.615-1.095 1.11-.194.25-.404.5-.629.71-.344.33-.749.54-1.169.69-.479.18-.989.27-1.559.27h-.15c-.57 0-1.08-.09-1.559-.27a3.3 3.3 0 0 1-1.169-.69c-.225-.21-.435-.46-.629-.71-.39-.495-.72-.915-1.095-1.11a1.38 1.38 0 0 0-.6-.195c-.106-.015-.225-.015-.345-.015-.21 0-.449.015-.704.045-.21.015-.435.045-.66.045a3.65 3.65 0 0 1-.569-.045c-.3-.045-.599-.255-.674-.585a.71.71 0 0 1 .045-.39c.09-.21.285-.36.495-.45.09-.04.195-.072.3-.105.405-.135.749-.27 1.019-.45.3-.195.449-.343.614-.599l.061-.12c.01-.022.02-.045.029-.069.059-.194.075-.394.089-.569v-.061c0-.03-.015-.06-.015-.09-.03-.224-.09-.374-.3-.449a2.81 2.81 0 0 0-.479-.149c-.12-.03-.24-.075-.359-.12a2.2 2.2 0 0 1-.405-.195c-.135-.09-.225-.24-.225-.405 0-.15.075-.27.21-.36a.5.5 0 0 1 .3-.096.42.42 0 0 1 .165.036c.374.181.733.301 1.033.301.198 0 .326-.045.401-.09a22.1 22.1 0 0 1-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.859 1.069 11.216.793 12.206.793z"/>
  </svg>
);

const socialSchema = z.object({
  youtube_followers: z.string().optional(),
  instagram_followers: z.string().optional(),
  tiktok_followers: z.string().optional(),
  snapchat_followers: z.string().optional(),
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
  };
  onUpdate: () => void;
}

const SocialEditSheet = ({ isOpen, onClose, initialData, onUpdate }: SocialEditSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SocialFormData>({
    resolver: zodResolver(socialSchema),
    defaultValues: {
      youtube_followers: initialData.youtube_followers || "",
      instagram_followers: initialData.instagram_followers || "",
      tiktok_followers: initialData.tiktok_followers || "",
      snapchat_followers: initialData.snapchat_followers || "",
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
                    <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                      <Youtube className="w-5 h-5 text-destructive" />
                    </div>
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
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 250K" {...field} />
                      </FormControl>
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
                    <div className="w-10 h-10 rounded-xl bg-foreground/20 flex items-center justify-center">
                      <TikTokIcon className="w-5 h-5 text-foreground" />
                    </div>
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
                    <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                      <SnapchatIcon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex-1">
                      <FormLabel>Snapchat</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 100K" {...field} />
                      </FormControl>
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
  );
};

export default SocialEditSheet;
