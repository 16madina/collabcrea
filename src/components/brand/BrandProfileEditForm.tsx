import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Save,
  X,
  Building2,
  Globe,
  MapPin,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const brandProfileSchema = z.object({
  company_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  company_description: z.string().max(1000, "La description ne peut pas dépasser 1000 caractères").optional(),
  sector: z.string().optional(),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  country: z.string().optional(),
});

type BrandProfileFormData = z.infer<typeof brandProfileSchema>;

const sectors = [
  "Beauté & Cosmétiques",
  "Mode & Accessoires",
  "Alimentation & Boissons",
  "Technologie",
  "Télécommunications",
  "Finance & Banque",
  "Automobile",
  "Immobilier",
  "Tourisme & Voyage",
  "Santé & Bien-être",
  "Éducation",
  "Divertissement",
  "Sport",
  "E-commerce",
  "Autre",
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
  "France",
  "Belgique",
  "Suisse",
  "Canada",
  "États-Unis",
  "Autre",
];

interface BrandProfileEditFormProps {
  onClose: () => void;
  initialData?: {
    company_name: string;
    company_description?: string | null;
    sector?: string | null;
    website?: string | null;
    country?: string | null;
  };
}

const BrandProfileEditForm = ({ onClose, initialData }: BrandProfileEditFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BrandProfileFormData>({
    resolver: zodResolver(brandProfileSchema),
    defaultValues: {
      company_name: initialData?.company_name || "",
      company_description: initialData?.company_description || "",
      sector: initialData?.sector || "",
      website: initialData?.website || "",
      country: initialData?.country || "",
    },
  });

  const onSubmit = async (data: BrandProfileFormData) => {
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
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: data.company_name,
          company_description: data.company_description || null,
          sector: data.sector || null,
          website: data.website || null,
          country: data.country || null,
          full_name: data.company_name, // Also update full_name for consistency
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Les informations de votre entreprise ont été enregistrées",
      });

      onClose();
    } catch (error) {
      console.error("Error updating brand profile:", error);
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
            Modifier l'entreprise
          </h1>
          <button onClick={onClose} className="touch-target">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 space-y-6 mt-4">
            {/* Company Info Section */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                Informations de l'entreprise
              </h3>

              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de votre entreprise" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre entreprise, vos valeurs, vos produits..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secteur d'activité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un secteur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact & Location Section */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Globe className="w-5 h-5 text-gold" />
                Contact & Localisation
              </h3>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://votre-site.com" {...field} />
                    </FormControl>
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
                          <SelectValue placeholder="Choisir un pays" />
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

export default BrandProfileEditForm;
