import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, X, Check, ImagePlus, Trash2, Eye, Calendar, MapPin, Tag, FileText, Phone, MapPinned, Hash, Type, Store, Video, Plus, Clock } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
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
  const { offerId } = useParams<{ offerId: string }>();
  const isEditMode = Boolean(offerId);
  
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loadingOffer, setLoadingOffer] = useState(false);

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
    delivery_mode: "private" as "private" | "network",
    // Creative brief fields
    brief_phone: "",
    brief_address: "",
    brief_hashtags: "",
    brief_mentions: "",
    // On-site fields
    presence_mode: "remote" as "remote" | "on_site",
    filming_by: "creator" as "creator" | "brand",
    on_site_slots: [] as { date: string; start_time: string; end_time: string }[],
    on_site_city: "",
    on_site_neighborhood: "",
    on_site_store_name: "",
  });

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      on_site_slots: [...prev.on_site_slots, { date: "", start_time: "09:00", end_time: "17:00" }],
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      on_site_slots: prev.on_site_slots.filter((_, i) => i !== index),
    }));
  };

  const updateTimeSlot = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      on_site_slots: prev.on_site_slots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  };

  // Load existing offer data when in edit mode
  useEffect(() => {
    if (!offerId || !user) return;

    const loadOffer = async () => {
      setLoadingOffer(true);
      try {
        const { data: offer, error } = await supabase
          .from("offers")
          .select("*")
          .eq("id", offerId)
          .eq("brand_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!offer) {
          toast.error("Offre introuvable");
          navigate("/brand/offers");
          return;
        }

        // Parse description to extract expectations and restrictions
        let description = offer.description;
        let expectations = "";
        let restrictions = "";

        const expectationsMatch = description.match(/\*\*Attentes:\*\*\n([\s\S]*?)(?=\n\n\*\*Restrictions:|$)/);
        if (expectationsMatch) {
          expectations = expectationsMatch[1].trim();
          description = description.replace(/\n\n\*\*Attentes:\*\*\n[\s\S]*?(?=\n\n\*\*Restrictions:|$)/, "");
        }

        const restrictionsMatch = description.match(/\*\*Restrictions:\*\*\n([\s\S]*?)$/);
        if (restrictionsMatch) {
          restrictions = restrictionsMatch[1].trim();
          description = description.replace(/\n\n\*\*Restrictions:\*\*\n[\s\S]*?$/, "");
        }

        // Determine budget type
        let budgetType: BudgetType = "range";
        let budgetMin = "";
        let budgetMax = "";
        let budgetFixed = "";

        if (offer.budget_min === 0 && offer.budget_max === 0) {
          budgetType = "negotiable";
        } else if (offer.budget_min === offer.budget_max) {
          budgetType = "fixed";
          budgetFixed = offer.budget_min.toString();
        } else {
          budgetType = "range";
          budgetMin = offer.budget_min.toString();
          budgetMax = offer.budget_max.toString();
        }

        // Parse countries
        const countries = offer.location ? offer.location.split(", ").filter(Boolean) : [];

        // Parse content types
        const contentTypes = offer.content_type ? offer.content_type.split(", ").filter(Boolean) : [];

        // Load existing images
        const images = (offer as any).images || [];
        setExistingImageUrls(images);
        setImagePreviewUrls(images);

        // Load creative brief
        const brief = (offer as any).creative_brief || {};

        setFormData({
          title: offer.title,
          description: description.trim(),
          category: offer.category,
          content_types: contentTypes,
          budget_type: budgetType,
          budget_min: budgetMin,
          budget_max: budgetMax,
          budget_fixed: budgetFixed,
          deadline: offer.deadline || "",
          countries,
          restrictions,
          expectations,
          delivery_mode: (offer as any).delivery_mode || "private",
          brief_phone: brief.phone || "",
          brief_address: brief.address || "",
          brief_hashtags: brief.hashtags || "",
          brief_mentions: brief.mentions || "",
          presence_mode: (offer as any).presence_mode || "remote",
          filming_by: (offer as any).filming_by || "creator",
          on_site_slots: (offer as any).on_site_slots || [],
          on_site_city: (offer as any).on_site_city || "",
          on_site_neighborhood: (offer as any).on_site_neighborhood || "",
          on_site_store_name: (offer as any).on_site_store_name || "",
        });
      } catch (error) {
        console.error("Error loading offer:", error);
        toast.error("Erreur lors du chargement de l'offre");
      } finally {
        setLoadingOffer(false);
      }
    };

    loadOffer();
  }, [offerId, user, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const totalImages = existingImageUrls.length + productImages.length;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_IMAGES - totalImages;
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
    // Check if it's an existing image or a new upload
    if (index < existingImageUrls.length) {
      // Remove existing image
      setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
      setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Remove new upload
      const newIndex = index - existingImageUrls.length;
      URL.revokeObjectURL(imagePreviewUrls[index]);
      setProductImages((prev) => prev.filter((_, i) => i !== newIndex));
      setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
    }
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

  const formatBudget = () => {
    if (formData.budget_type === "negotiable") return "Négociable";
    if (formData.budget_type === "fixed") {
      const amount = parseInt(formData.budget_fixed);
      return isNaN(amount) ? "Non défini" : `${amount.toLocaleString()} FCFA`;
    }
    const min = parseInt(formData.budget_min);
    const max = parseInt(formData.budget_max);
    if (isNaN(min) || isNaN(max)) return "Non défini";
    return `${min.toLocaleString()} - ${max.toLocaleString()} FCFA`;
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

    // On-site validation
    if (formData.presence_mode === "on_site") {
      if (!formData.on_site_city.trim()) {
        toast.error("La ville est requise pour le mode sur place");
        return;
      }
      if (formData.on_site_slots.length === 0) {
        toast.error("Ajoutez au moins un créneau de disponibilité");
        return;
      }
      const hasEmptySlot = formData.on_site_slots.some(s => !s.date);
      if (hasEmptySlot) {
        toast.error("Remplissez la date de chaque créneau");
        return;
      }
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
      // Upload new images
      setUploadingImages(true);
      const newImageUrls = await uploadImages();
      setUploadingImages(false);

      // Combine existing and new images
      const allImageUrls = [...existingImageUrls, ...newImageUrls];

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

      // Build creative brief
      const creativeBrief: Record<string, string> = {};
      if (formData.brief_phone.trim()) creativeBrief.phone = formData.brief_phone.trim();
      if (formData.brief_address.trim()) creativeBrief.address = formData.brief_address.trim();
      if (formData.brief_hashtags.trim()) creativeBrief.hashtags = formData.brief_hashtags.trim();
      if (formData.brief_mentions.trim()) creativeBrief.mentions = formData.brief_mentions.trim();

      const offerData = {
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
        images: allImageUrls,
        delivery_mode: formData.delivery_mode,
        creative_brief: Object.keys(creativeBrief).length > 0 ? creativeBrief : {},
        presence_mode: formData.presence_mode,
        filming_by: formData.filming_by,
        on_site_slots: formData.presence_mode === "on_site" ? formData.on_site_slots : [],
        on_site_city: formData.presence_mode === "on_site" ? formData.on_site_city || null : null,
        on_site_neighborhood: formData.presence_mode === "on_site" ? formData.on_site_neighborhood || null : null,
        on_site_store_name: formData.presence_mode === "on_site" ? formData.on_site_store_name || null : null,
      } as any;

      if (isEditMode && offerId) {
        // Update existing offer
        const { error } = await supabase
          .from("offers")
          .update(offerData)
          .eq("id", offerId)
          .eq("brand_id", user.id);

        if (error) throw error;

        toast.success(
          status === "draft" 
            ? "Brouillon mis à jour" 
            : "Offre mise à jour avec succès"
        );
      } else {
        // Create new offer
        const { error } = await supabase.from("offers").insert({
          ...offerData,
          brand_id: user.id,
        });

        if (error) throw error;

        toast.success(
          status === "draft" 
            ? "Brouillon enregistré avec succès" 
            : "Offre publiée avec succès"
        );
      }

      navigate("/brand/offers");
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Erreur lors de la création de l'offre");
    } finally {
      setIsSubmitting(false);
      setUploadingImages(false);
    }
  };

  if (authLoading || loadingOffer) {
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
            {isEditMode ? "Modifier l'offre" : "Créer une offre"}
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

        {/* Delivery Mode */}
        <div className="space-y-3">
          <Label>Mode de livraison *</Label>
          <p className="text-xs text-muted-foreground">
            Comment le créateur doit-il livrer le contenu ?
          </p>
          <div className="flex gap-2">
            {[
              { value: "private", label: "📦 Livraison privée", desc: "Le créateur envoie le fichier directement" },
              { value: "network", label: "📱 Publication réseau", desc: "Le créateur publie sur ses réseaux sociaux" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange("delivery_mode", option.value)}
                className={`flex-1 py-3 px-3 rounded-xl text-left transition-all ${
                  formData.delivery_mode === option.value
                    ? "bg-gold/20 border-2 border-gold"
                    : "bg-muted/50 border-2 border-transparent hover:border-gold/30"
                }`}
              >
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs text-muted-foreground block mt-1">{option.desc}</span>
              </button>
            ))}
          </div>
          {formData.delivery_mode === "network" && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-sm text-blue-400">
              <p className="font-medium mb-1">📱 Flux hybride activé</p>
              <p className="text-xs">Le créateur soumettra d'abord un aperçu → vous validez → il publie sur ses réseaux → il soumet le lien → paiement déclenché.</p>
            </div>
          )}
        </div>

        {/* Presence Mode - Remote vs On-site */}
        <div className="space-y-3">
          <Label>Mode de présence *</Label>
          <p className="text-xs text-muted-foreground">
            Le créateur doit-il se déplacer physiquement ?
          </p>
          <div className="flex gap-2">
            {[
              { value: "remote", label: "🏠 À distance", desc: "Le créateur travaille de chez lui" },
              { value: "on_site", label: "📍 Sur place", desc: "Déplacement requis (magasin, événement...)" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange("presence_mode", option.value)}
                className={`flex-1 py-3 px-3 rounded-xl text-left transition-all ${
                  formData.presence_mode === option.value
                    ? "bg-gold/20 border-2 border-gold"
                    : "bg-muted/50 border-2 border-transparent hover:border-gold/30"
                }`}
              >
                <span className="text-sm font-medium block">{option.label}</span>
                <span className="text-xs text-muted-foreground block mt-1">{option.desc}</span>
              </button>
            ))}
          </div>

          {formData.presence_mode === "on_site" && (
            <div className="space-y-4 p-4 rounded-xl border border-gold/20 bg-gold/5 mt-3">
              {/* Who films */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-gold" />
                  Qui filme / produit le contenu ?
                </Label>
                <div className="flex gap-2">
                  {[
                    { value: "creator", label: "📱 Le créateur", desc: "Il filme et soumet" },
                    { value: "brand", label: "🎬 La marque", desc: "Vous filmez, le créateur valide" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("filming_by", option.value)}
                      className={`flex-1 py-2.5 px-3 rounded-lg text-left transition-all ${
                        formData.filming_by === option.value
                          ? "bg-gold/20 border border-gold"
                          : "bg-muted/30 border border-transparent hover:border-gold/30"
                      }`}
                    >
                      <span className="text-sm font-medium block">{option.label}</span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">{option.desc}</span>
                    </button>
                  ))}
                </div>
                {formData.filming_by === "brand" && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-accent">
                    <p className="font-medium mb-1">🎬 Mode « La marque filme »</p>
                    <p className="text-xs">Après le rendez-vous, vous uploaderez la vidéo. Le créateur devra la valider avant que le paiement soit libéré.</p>
                  </div>
                )}
              </div>

              {/* Store name */}
              <div className="space-y-2">
                <Label htmlFor="on_site_store_name" className="flex items-center gap-1.5 text-sm">
                  <Store className="w-3.5 h-3.5" />
                  Nom du lieu / magasin
                </Label>
                <Input
                  id="on_site_store_name"
                  placeholder="Ex: Salon Beauty Queen"
                  value={formData.on_site_store_name}
                  onChange={(e) => handleInputChange("on_site_store_name", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* City */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="on_site_city" className="text-sm">Ville *</Label>
                  <Input
                    id="on_site_city"
                    placeholder="Ex: Abidjan"
                    value={formData.on_site_city}
                    onChange={(e) => handleInputChange("on_site_city", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="on_site_neighborhood" className="text-sm">Quartier</Label>
                  <Input
                    id="on_site_neighborhood"
                    placeholder="Ex: Cocody"
                    value={formData.on_site_neighborhood}
                    onChange={(e) => handleInputChange("on_site_neighborhood", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gold" />
                  Créneaux de disponibilité
                </Label>
                {formData.on_site_slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={slot.date}
                      onChange={(e) => updateTimeSlot(index, "date", e.target.value)}
                      className="h-10 flex-1"
                    />
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(index, "start_time", e.target.value)}
                      className="h-10 w-24"
                    />
                    <span className="text-muted-foreground text-xs">à</span>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(index, "end_time", e.target.value)}
                      className="h-10 w-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                  className="gap-1.5 border-gold/40 text-gold hover:bg-gold/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Ajouter un créneau
                </Button>
              </div>
            </div>
          )}
        </div>

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

        {/* Creative Brief Section */}
        <div className="space-y-4 p-4 rounded-xl border border-gold/20 bg-gold/5">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            <Label className="text-base font-semibold">Brief créatif</Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Informations que le créateur devra intégrer dans son contenu
          </p>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="brief_phone" className="flex items-center gap-1.5 text-sm">
              <Phone className="w-3.5 h-3.5" />
              Numéro de téléphone à afficher
            </Label>
            <Input
              id="brief_phone"
              placeholder="Ex: +225 07 00 00 00"
              value={formData.brief_phone}
              onChange={(e) => handleInputChange("brief_phone", e.target.value)}
              className="h-11"
            />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="brief_address" className="flex items-center gap-1.5 text-sm">
              <MapPinned className="w-3.5 h-3.5" />
              Adresse / lieu à mentionner
            </Label>
            <Input
              id="brief_address"
              placeholder="Ex: Cocody, Abidjan - Près du carrefour Palmeraie"
              value={formData.brief_address}
              onChange={(e) => handleInputChange("brief_address", e.target.value)}
              className="h-11"
            />
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="brief_hashtags" className="flex items-center gap-1.5 text-sm">
              <Hash className="w-3.5 h-3.5" />
              Hashtags & mentions obligatoires
            </Label>
            <Input
              id="brief_hashtags"
              placeholder="Ex: #MaMarque #Pub @mamarque_officiel"
              value={formData.brief_hashtags}
              onChange={(e) => handleInputChange("brief_hashtags", e.target.value)}
              className="h-11"
            />
          </div>

          {/* Mandatory text / Slogans */}
          <div className="space-y-2">
            <Label htmlFor="brief_mentions" className="flex items-center gap-1.5 text-sm">
              <Type className="w-3.5 h-3.5" />
              Textes & slogans obligatoires
            </Label>
            <Textarea
              id="brief_mentions"
              placeholder="Ex: 'Disponible dans toutes les boutiques', mention légale obligatoire..."
              value={formData.brief_mentions}
              onChange={(e) => handleInputChange("brief_mentions", e.target.value)}
              className="min-h-[70px] resize-none"
            />
          </div>
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
            {totalImages < MAX_IMAGES && (
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
            {totalImages}/{MAX_IMAGES} photos • JPG, PNG max 5MB
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Prévisualiser
          </Button>
        </div>
        <div className="flex gap-3">
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
                {uploadingImages ? "Upload photos..." : isEditMode ? "Mise à jour..." : "Publication..."}
              </>
            ) : (
              isEditMode ? "Mettre à jour" : "Publier l'offre"
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
      {/* Preview Sheet */}
      <Sheet open={showPreview} onOpenChange={setShowPreview}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-xl font-bold text-gold-gradient">
              Prévisualisation de l'offre
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Images */}
            {imagePreviewUrls.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {imagePreviewUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Produit ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-xl flex-shrink-0"
                  />
                ))}
              </div>
            )}

            {/* Title & Category */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {formData.title || "Titre de l'offre"}
              </h2>
              {formData.category && (
                <Badge variant="secondary" className="bg-gold/20 text-gold">
                  {formData.category}
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Description</span>
              </div>
              <p className="text-foreground whitespace-pre-wrap">
                {formData.description || "Aucune description"}
              </p>
            </div>

            {/* Content Types */}
            {formData.content_types.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">Types de contenu</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.content_types.map((type) => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Budget */}
            <div className="glass-card p-4 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Budget</p>
              <p className="text-lg font-bold text-gold">{formatBudget()}</p>
            </div>

            {/* Location */}
            {formData.countries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">Pays cibles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.countries.map((country) => {
                    const countryData = africanCountries.find((c) => c.name === country);
                    return (
                      <Badge key={country} variant="outline">
                        {countryData?.flag} {country}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deadline */}
            {formData.deadline && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Date limite</span>
                </div>
                <p className="text-foreground">
                  {new Date(formData.deadline).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            {/* Expectations */}
            {formData.expectations && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Ce que vous attendez du créateur
                </p>
                <p className="text-foreground whitespace-pre-wrap">
                  {formData.expectations}
                </p>
              </div>
            )}

            {/* Restrictions */}
            {formData.restrictions && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Restrictions</p>
                <p className="text-foreground whitespace-pre-wrap">
                  {formData.restrictions}
                </p>
            </div>
            )}

            {/* On-site Info Preview */}
            {formData.presence_mode === "on_site" && (
              <div className="space-y-3 p-4 rounded-xl border border-accent/20 bg-accent/5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  📍 Déplacement requis
                </p>
                <div className="space-y-2 text-sm">
                  {formData.on_site_store_name && (
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{formData.on_site_store_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{[formData.on_site_neighborhood, formData.on_site_city].filter(Boolean).join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{formData.filming_by === "brand" ? "🎬 La marque filme" : "📱 Le créateur filme"}</span>
                  </div>
                  {formData.on_site_slots.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Créneaux disponibles
                      </span>
                      {formData.on_site_slots.map((slot, i) => (
                        <p key={i} className="text-xs bg-muted/30 rounded-lg px-2 py-1">
                          {slot.date ? new Date(slot.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) : "—"} • {slot.start_time} - {slot.end_time}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Creative Brief Preview */}
            {(formData.brief_phone || formData.brief_address || formData.brief_hashtags || formData.brief_mentions) && (
              <div className="space-y-3 p-4 rounded-xl border border-gold/20 bg-gold/5">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  Brief créatif
                </p>
                {formData.brief_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{formData.brief_phone}</span>
                  </div>
                )}
                {formData.brief_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinned className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{formData.brief_address}</span>
                  </div>
                )}
                {formData.brief_hashtags && (
                  <div className="flex items-center gap-2 text-sm">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-gold">{formData.brief_hashtags}</span>
                  </div>
                )}
                {formData.brief_mentions && (
                  <div className="text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Type className="w-3.5 h-3.5" /> Textes obligatoires
                    </span>
                    <p className="text-foreground whitespace-pre-wrap">{formData.brief_mentions}</p>
                  </div>
                )}
              </div>
            )}

            <div className="sticky bottom-0 pt-4 bg-background">
              <Button
                type="button"
                variant="gold"
                className="w-full"
                onClick={() => setShowPreview(false)}
              >
                Fermer la prévisualisation
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CreateOffer;
