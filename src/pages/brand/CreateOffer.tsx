import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, X, Check, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { africanCountries } from "@/data/countries";

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

type BudgetType = "range" | "fixed" | "negotiable";

const MAX_IMAGES = 3;

const CreateOffer = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    content_types: [] as string[],
    budget_type: "range" as BudgetType,
    budget_min: "",
    budget_max: "",
    budget_fixed: "",
    deadline: "",
    countries: [] as string[],
    restrictions: "",
    expectations: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_IMAGES - productImages.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos autorisées`);
      return;
    }

    const newFiles = Array.from(files).slice(0, remainingSlots);
    const validFiles = newFiles.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image valide`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setProductImages((prev) => [...prev, ...validFiles]);
      validFiles.forEach((file) => {
        const url = URL.createObjectURL(file);
        setImagePreviewUrls((prev) => [...prev, url]);
      });
    }

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || productImages.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const file of productImages) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("offer-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("offer-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleContentType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      content_types: prev.content_types.includes(type)
        ? prev.content_types.filter((t) => t !== type)
        : [...prev.content_types, type],
    }));
  };

  const toggleCountry = (countryName: string) => {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.includes(countryName)
        ? prev.countries.filter((c) => c !== countryName)
        : [...prev.countries, countryName],
    }));
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
    if (formData.content_types.length === 0) {
      toast.error("Sélectionnez au moins un type de contenu");
      return;
    }

    let budgetMin = 0;
    let budgetMax = 0;

    if (formData.budget_type === "fixed") {
      const fixed = parseInt(formData.budget_fixed);
      if (isNaN(fixed) || fixed <= 0) {
        toast.error("Le budget fixe doit être un nombre valide");
        return;
      }
      budgetMin = fixed;
      budgetMax = fixed;
    } else if (formData.budget_type === "range") {
      budgetMin = parseInt(formData.budget_min);
      budgetMax = parseInt(formData.budget_max);
      if (isNaN(budgetMin) || isNaN(budgetMax)) {
        toast.error("Le budget doit être un nombre valide");
        return;
      }
      if (budgetMin > budgetMax) {
        toast.error("Le budget minimum ne peut pas être supérieur au maximum");
        return;
      }
    }
    // For negotiable, budgetMin and budgetMax stay 0

    setIsSubmitting(true);

    try {
      // Upload images first
      setUploadingImages(true);
      const imageUrls = await uploadImages();
      setUploadingImages(false);

      // Get user's profile for logo_url
      const { data: profile } = await supabase
        .from("profiles")
        .select("logo_url")
        .eq("user_id", user.id)
        .single();

      // Build description with expectations and restrictions
      let fullDescription = formData.description.trim();
      if (formData.expectations.trim()) {
        fullDescription += `\n\n**Attentes:**\n${formData.expectations.trim()}`;
      }
      if (formData.restrictions.trim()) {
        fullDescription += `\n\n**Restrictions:**\n${formData.restrictions.trim()}`;
      }

      const { error } = await supabase.from("offers").insert({
        brand_id: user.id,
        title: formData.title.trim(),
        description: fullDescription,
        category: formData.category,
        content_type: formData.content_types.join(", "),
        budget_min: budgetMin,
        budget_max: budgetMax,
        deadline: formData.deadline || null,
        location: formData.countries.length > 0 ? formData.countries.join(", ") : null,
        logo_url: profile?.logo_url || null,
        status,
        images: imageUrls,
      } as any);

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
      setUploadingImages(false);
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
            className="min-h-[100px] resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Catégorie *</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => handleInputChange("category", value)}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Sélectionner une catégorie" />
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

        {/* Content Types - Multiple Selection */}
        <div className="space-y-3">
          <Label>Types de contenu * (sélection multiple)</Label>
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => {
              const isSelected = formData.content_types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleContentType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? "bg-gold text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground border border-border hover:border-gold/50"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Type */}
        <div className="space-y-3">
          <Label>Type de budget *</Label>
          <div className="flex gap-2">
            {[
              { value: "range", label: "Fourchette" },
              { value: "fixed", label: "Prix fixe" },
              { value: "negotiable", label: "Négociable" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange("budget_type", option.value)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  formData.budget_type === option.value
                    ? "bg-gold text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground border border-border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Budget Fields based on type */}
          {formData.budget_type === "range" && (
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <Input
                  type="number"
                  placeholder="Minimum (FCFA)"
                  value={formData.budget_min}
                  onChange={(e) => handleInputChange("budget_min", e.target.value)}
                  className="h-12"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Maximum (FCFA)"
                  value={formData.budget_max}
                  onChange={(e) => handleInputChange("budget_max", e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
          )}

          {formData.budget_type === "fixed" && (
            <div className="mt-3">
              <Input
                type="number"
                placeholder="Montant fixe (FCFA)"
                value={formData.budget_fixed}
                onChange={(e) => handleInputChange("budget_fixed", e.target.value)}
                className="h-12"
              />
            </div>
          )}

          {formData.budget_type === "negotiable" && (
            <p className="text-sm text-muted-foreground mt-2">
              Le budget sera discuté directement avec les créateurs.
            </p>
          )}
        </div>

        {/* Countries - Multiple Selection */}
        <div className="space-y-2">
          <Label>Pays cibles (sélection multiple)</Label>
          <button
            type="button"
            onClick={() => setShowCountryPicker(true)}
            className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border text-left flex items-center justify-between hover:border-gold/50 transition-colors"
          >
            <span className={formData.countries.length > 0 ? "text-foreground" : "text-muted-foreground"}>
              {formData.countries.length > 0
                ? `${formData.countries.length} pays sélectionné(s)`
                : "Tous les pays africains"}
            </span>
          </button>
          {formData.countries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.countries.map((country) => {
                const countryData = africanCountries.find((c) => c.name === country);
                return (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gold/20 text-gold text-xs"
                  >
                    {countryData?.flag} {country}
                    <button
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
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

        {/* Expectations */}
        <div className="space-y-2">
          <Label htmlFor="expectations">Ce que vous attendez du créateur</Label>
          <Textarea
            id="expectations"
            placeholder="Ex: Minimum 3 stories, mention du produit, lien en bio..."
            value={formData.expectations}
            onChange={(e) => handleInputChange("expectations", e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Restrictions */}
        <div className="space-y-2">
          <Label htmlFor="restrictions">Restrictions</Label>
          <Textarea
            id="restrictions"
            placeholder="Ex: Pas de contenu politique, pas de comparaison avec concurrents..."
            value={formData.restrictions}
            onChange={(e) => handleInputChange("restrictions", e.target.value)}
            className="min-h-[80px] resize-none"
          />
        </div>

        {/* Product Images Upload */}
        <div className="space-y-3">
          <Label>Photos du produit (max {MAX_IMAGES})</Label>
          <div className="flex flex-wrap gap-3">
            {imagePreviewUrls.map((url, index) => (
              <div
                key={index}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-border"
              >
                <img
                  src={url}
                  alt={`Produit ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-destructive rounded-full text-white hover:bg-destructive/80 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {productImages.length < MAX_IMAGES && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-gold/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-gold">
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {productImages.length}/{MAX_IMAGES} photos • JPG, PNG max 5MB
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={(e) => handleSubmit(e, "draft")}
            disabled={isSubmitting || uploadingImages}
          >
            Enregistrer brouillon
          </Button>
          <Button
            type="submit"
            variant="gold"
            className="flex-1"
            disabled={isSubmitting || uploadingImages}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadingImages ? "Upload photos..." : "Publication..."}
              </>
            ) : (
              "Publier l'offre"
            )}
          </Button>
        </div>
      </motion.form>

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setShowCountryPicker(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl p-6 safe-bottom max-h-[70vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold">Sélectionner les pays</h3>
              <button onClick={() => setShowCountryPicker(false)} className="touch-target">
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              {africanCountries.map((country) => {
                const isSelected = formData.countries.includes(country.name);
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => toggleCountry(country.name)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      isSelected
                        ? "bg-gold/20 border border-gold"
                        : "bg-muted/30 border border-transparent hover:border-gold/30"
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className="flex-1 text-left">{country.name}</span>
                    {isSelected && <Check className="w-5 h-5 text-gold" />}
                  </button>
                );
              })}
            </div>

            <div className="sticky bottom-0 pt-4 bg-card mt-4">
              <Button
                type="button"
                variant="gold"
                className="w-full"
                onClick={() => setShowCountryPicker(false)}
              >
                Confirmer ({formData.countries.length} pays)
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default CreateOffer;
