import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const categories = [
  "Beauté",
  "Tech",
  "Cuisine",
  "Fitness",
  "Mode",
  "Lifestyle",
  "Voyage",
  "Gaming",
  "Musique",
  "Humour",
  "Éducation",
  "Business",
];

const contentTypes = [
  "Reel",
  "Story",
  "TikTok",
  "Vidéo YouTube",
  "Post Instagram",
  "Thread Twitter",
  "Article Blog",
  "Podcast",
];

const CreateOffer = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    content_type: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    location: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, status: "active" | "draft" = "active") => {
    e.preventDefault();

    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    // Validation
    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("La description est requise");
      return;
    }
    if (!formData.category) {
      toast.error("La catégorie est requise");
      return;
    }
    if (!formData.content_type) {
      toast.error("Le type de contenu est requis");
      return;
    }
    if (!formData.budget_min || !formData.budget_max) {
      toast.error("Le budget est requis");
      return;
    }

    const budgetMin = parseInt(formData.budget_min);
    const budgetMax = parseInt(formData.budget_max);

    if (isNaN(budgetMin) || isNaN(budgetMax)) {
      toast.error("Le budget doit être un nombre valide");
      return;
    }

    if (budgetMin > budgetMax) {
      toast.error("Le budget minimum ne peut pas être supérieur au maximum");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user's profile for logo_url
      const { data: profile } = await supabase
        .from("profiles")
        .select("logo_url")
        .eq("user_id", user.id)
        .single();

      const { error } = await supabase.from("offers").insert({
        brand_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        content_type: formData.content_type,
        budget_min: budgetMin,
        budget_max: budgetMax,
        deadline: formData.deadline || null,
        location: formData.location.trim() || null,
        logo_url: profile?.logo_url || null,
        status,
      });

      if (error) throw error;

      toast.success(
        status === "draft" 
          ? "Brouillon enregistré avec succès" 
          : "Offre publiée avec succès"
      );
      navigate("/brand/offers");
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Erreur lors de la création de l'offre");
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
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="safe-top px-6 py-4 border-b border-border">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <button onClick={() => navigate(-1)} className="touch-target">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="font-display text-xl font-bold text-gold-gradient">
            Créer une offre
          </h1>
        </motion.div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-6 space-y-6"
        onSubmit={(e) => handleSubmit(e, "active")}
      >
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre de l'offre *</Label>
          <Input
            id="title"
            placeholder="Ex: Campagne beauté naturelle"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="h-12"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Décrivez votre campagne, les livrables attendus..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="min-h-[120px] resize-none"
          />
        </div>

        {/* Category & Content Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type de contenu *</Label>
            <Select
              value={formData.content_type}
              onValueChange={(value) => handleInputChange("content_type", value)}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label>Budget (FCFA) *</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                type="number"
                placeholder="Minimum"
                value={formData.budget_min}
                onChange={(e) => handleInputChange("budget_min", e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Maximum"
                value={formData.budget_max}
                onChange={(e) => handleInputChange("budget_max", e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Localisation (optionnel)</Label>
          <Input
            id="location"
            placeholder="Ex: Côte d'Ivoire, Afrique de l'Ouest..."
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            className="h-12"
          />
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <Label htmlFor="deadline">Date limite (optionnel)</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => handleInputChange("deadline", e.target.value)}
            className="h-12"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={(e) => handleSubmit(e, "draft")}
            disabled={isSubmitting}
          >
            Enregistrer brouillon
          </Button>
          <Button
            type="submit"
            variant="gold"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              "Publier l'offre"
            )}
          </Button>
        </div>
      </motion.form>
    </div>
  );
};

export default CreateOffer;
