import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Youtube, 
  Instagram, 
  Plus, 
  Trash2, 
  Save,
  X,
  MapPin,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const profileSchema = z.object({
  full_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  bio: z.string().max(500, "La bio ne peut pas dépasser 500 caractères").optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  youtube_followers: z.string().optional(),
  instagram_followers: z.string().optional(),
  tiktok_followers: z.string().optional(),
  snapchat_followers: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface PricingItem {
  type: string;
  price: number;
  description: string;
}

const categories = [
  "Beauté",
  "Mode",
  "Lifestyle",
  "Tech",
  "Cuisine",
  "Fitness",
  "Humour",
  "Musique",
  "Gaming",
  "Voyage",
];

const countries = [
  "Sénégal",
  "Côte d'Ivoire",
  "Mali",
  "Cameroun",
  "Guinée",
  "Burkina Faso",
  "Bénin",
  "Togo",
  "Niger",
  "République Démocratique du Congo",
  "Gabon",
  "Mauritanie",
  "Congo",
  "Maroc",
  "Tunisie",
  "Algérie",
];

const contentTypes = [
  "Story Instagram",
  "Reel Instagram",
  "Post Instagram",
  "Live Instagram",
  "Vidéo TikTok",
  "Live TikTok",
  "Vidéo YouTube",
  "Short YouTube",
  "Story Snapchat",
  "Spotlight Snapchat",
];

interface ProfileEditFormProps {
  onClose: () => void;
  initialData?: {
    full_name: string;
    bio?: string | null;
    category?: string | null;
    country?: string | null;
    youtube_followers?: string | null;
    instagram_followers?: string | null;
    tiktok_followers?: string | null;
    snapchat_followers?: string | null;
    pricing?: PricingItem[] | null;
  };
}

const ProfileEditForm = ({ onClose, initialData }: ProfileEditFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pricing, setPricing] = useState<PricingItem[]>(
    initialData?.pricing || []
  );
  const [newPricing, setNewPricing] = useState<PricingItem>({
    type: "",
    price: 0,
    description: "",
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialData?.full_name || "",
      bio: initialData?.bio || "",
      category: initialData?.category || "",
      country: initialData?.country || "",
      youtube_followers: initialData?.youtube_followers || "",
      instagram_followers: initialData?.instagram_followers || "",
      tiktok_followers: initialData?.tiktok_followers || "",
      snapchat_followers: initialData?.snapchat_followers || "",
    },
  });

  const addPricingItem = () => {
    if (!newPricing.type || newPricing.price <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir le type et le prix",
        variant: "destructive",
      });
      return;
    }

    setPricing([...pricing, newPricing]);
    setNewPricing({ type: "", price: 0, description: "" });
  };

  const removePricingItem = (index: number) => {
    setPricing(pricing.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Convert pricing to JSON-compatible format
      const pricingJson = pricing.map(item => ({
        type: item.type,
        price: item.price,
        description: item.description,
      }));

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          bio: data.bio || null,
          category: data.category || null,
          country: data.country || null,
          youtube_followers: data.youtube_followers || null,
          instagram_followers: data.instagram_followers || null,
          tiktok_followers: data.tiktok_followers || null,
          snapchat_followers: data.snapchat_followers || null,
          pricing: pricingJson as unknown as null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès",
      });

      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen pb-20"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 glass-nav px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gold-gradient">
            Modifier le profil
          </h1>
          <button onClick={onClose} className="touch-target">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 space-y-6 mt-4">
            {/* Basic Info Section */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-gold" />
                Informations de base
              </h3>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez-vous en quelques mots..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Social Media Section */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">
                Réseaux sociaux (abonnés)
              </h3>

              <div className="space-y-4">
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
                          <FormControl>
                            <Input placeholder="Ex: 150K" {...field} />
                          </FormControl>
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
                          <FormControl>
                            <Input placeholder="Ex: 500K" {...field} />
                          </FormControl>
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
              </div>
            </div>

            {/* Pricing Section */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold">
                Grille tarifaire
              </h3>

              {/* Existing Pricing Items */}
              {pricing.length > 0 && (
                <div className="space-y-3">
                  {pricing.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.type}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gold font-semibold">
                          {item.price.toLocaleString()} FCFA
                        </span>
                        <button
                          type="button"
                          onClick={() => removePricingItem(index)}
                          className="p-2 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add New Pricing Item */}
              <div className="space-y-3 pt-4 border-t border-border">
                <Label>Ajouter un tarif</Label>
                <div className="space-y-3">
                  <Select
                    value={newPricing.type}
                    onValueChange={(value) =>
                      setNewPricing({ ...newPricing, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type de contenu" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="Prix en FCFA"
                    value={newPricing.price || ""}
                    onChange={(e) =>
                      setNewPricing({
                        ...newPricing,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                  />

                  <Input
                    placeholder="Description (optionnel)"
                    value={newPricing.description}
                    onChange={(e) =>
                      setNewPricing({ ...newPricing, description: e.target.value })
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPricingItem}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter ce tarif
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={isLoading}
              className="w-full"
            >
              <Save className="w-5 h-5 mr-2" />
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </Form>
      </motion.div>
    </motion.div>
  );
};

export default ProfileEditForm;
