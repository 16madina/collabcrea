import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CreditCard } from "lucide-react";
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
import { InstagramIcon, TikTokIcon, YouTubeIcon, SnapchatIcon } from "@/components/ui/social-icons";

interface PricingItem {
  type: string;
  price: number;
  description: string;
}

// Platform options
const platforms = [
  { id: "snapchat", name: "Snapchat", icon: SnapchatIcon },
  { id: "tiktok", name: "TikTok", icon: TikTokIcon },
  { id: "instagram", name: "Instagram", icon: InstagramIcon },
  { id: "youtube", name: "YouTube", icon: YouTubeIcon },
];

// Content types per platform
const contentTypesByPlatform: Record<string, string[]> = {
  snapchat: ["Story", "Spotlight", "Post"],
  tiktok: ["Vidéo", "Live", "Série"],
  instagram: ["Story", "Reel", "Post", "Carrousel", "Live"],
  youtube: ["Vidéo", "Short", "Live"],
};

// Duration options
const durationOptions = [
  { value: "", label: "Sans durée" },
  { value: "24h", label: "24h" },
  { value: "48h", label: "48h" },
  { value: "72h", label: "72h" },
  { value: "1 semaine", label: "1 semaine" },
  { value: "2 semaines", label: "2 semaines" },
  { value: "1 mois", label: "1 mois" },
];

// Quantity options
const quantityOptions = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 8, label: "8" },
  { value: 10, label: "10" },
];

interface PricingEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialPricing: PricingItem[] | null;
  onUpdate: () => void;
}

const PricingEditSheet = ({ isOpen, onClose, initialPricing, onUpdate }: PricingEditSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pricing, setPricing] = useState<PricingItem[]>(initialPricing || []);
  
  // New pricing form state
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [customDescription, setCustomDescription] = useState("");

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setPricing(initialPricing || []);
    }
  }, [isOpen, initialPricing]);

  // Reset content type when platform changes
  useEffect(() => {
    setSelectedContentType("");
  }, [selectedPlatform]);

  // Generate the type string based on selections
  const generateTypeString = () => {
    if (!selectedPlatform || !selectedContentType) return "";
    
    let typeStr = "";
    
    // Quantity
    if (selectedQuantity > 1) {
      typeStr += `${selectedQuantity} `;
    } else {
      typeStr += "1 ";
    }
    
    // Content type (lowercase for natural reading)
    typeStr += selectedContentType.toLowerCase();
    
    // Duration
    if (selectedDuration) {
      typeStr += ` de ${selectedDuration}`;
    }
    
    // Platform prefix for backend grouping
    const platformPrefix = selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1);
    
    return `${platformPrefix} ${typeStr}`;
  };

  const addPricingItem = () => {
    if (!selectedPlatform || !selectedContentType || price <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une plateforme, un type de contenu et un prix",
        variant: "destructive",
      });
      return;
    }

    const newItem: PricingItem = {
      type: generateTypeString(),
      price: price,
      description: customDescription,
    };

    setPricing([...pricing, newItem]);
    
    // Reset form
    setSelectedContentType("");
    setSelectedQuantity(1);
    setSelectedDuration("");
    setPrice(0);
    setCustomDescription("");
  };

  const removePricingItem = (index: number) => {
    setPricing(pricing.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const pricingJson = pricing.map(item => ({
        type: item.type,
        price: item.price,
        description: item.description,
      }));

      const { error } = await supabase
        .from("profiles")
        .update({
          pricing: pricingJson as unknown as null,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Tarifs mis à jour",
        description: "Votre grille tarifaire a été enregistrée",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating pricing:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return null;
    const IconComponent = platform.icon;
    return <IconComponent className="w-5 h-5 p-0.5" size={14} />;
  };

  // Group existing pricing by platform for display
  const groupedPricing = pricing.reduce((acc, item) => {
    let platform = "Autres";
    if (item.type.toLowerCase().includes("instagram")) platform = "Instagram";
    else if (item.type.toLowerCase().includes("tiktok")) platform = "TikTok";
    else if (item.type.toLowerCase().includes("youtube")) platform = "YouTube";
    else if (item.type.toLowerCase().includes("snapchat") || item.type.toLowerCase().includes("snap")) platform = "Snapchat";
    
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push({ ...item, originalIndex: pricing.indexOf(item) });
    return acc;
  }, {} as Record<string, (PricingItem & { originalIndex: number })[]>);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Modifier mes tarifs
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-140px)] space-y-4 pb-4">
          {/* Add New Pricing Item */}
          <div className="space-y-4 p-4 border border-dashed border-gold/30 rounded-xl bg-gold/5">
            <Label className="text-gold font-semibold">Ajouter une offre</Label>
            
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Plateforme</Label>
              <div className="flex gap-2">
                {platforms.map((platform) => {
                  const IconComponent = platform.icon;
                  const isSelected = selectedPlatform === platform.id;
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setSelectedPlatform(platform.id)}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        isSelected 
                          ? "border-gold bg-gold/10" 
                          : "border-border hover:border-gold/50"
                      }`}
                    >
                      <IconComponent className="w-8 h-8 p-1" size={18} />
                      <span className="text-[10px] font-medium">{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Type */}
            {selectedPlatform && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label className="text-sm text-muted-foreground">Type de contenu</Label>
                <div className="flex flex-wrap gap-2">
                  {contentTypesByPlatform[selectedPlatform]?.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedContentType(type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedContentType === type
                          ? "bg-gold text-background"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quantity & Duration */}
            {selectedContentType && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Quantité</Label>
                  <Select
                    value={selectedQuantity.toString()}
                    onValueChange={(v) => setSelectedQuantity(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quantityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Durée</Label>
                  <Select
                    value={selectedDuration}
                    onValueChange={setSelectedDuration}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optionnel" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}

            {/* Price */}
            {selectedContentType && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <Label className="text-sm text-muted-foreground">Prix (FCFA)</Label>
                <div className="flex gap-3">
                  <Input
                    type="number"
                    value={price || ""}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 120000"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="gold"
                    onClick={addPricingItem}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Preview */}
            {selectedPlatform && selectedContentType && price > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-background rounded-lg border border-gold/20"
              >
                <p className="text-xs text-muted-foreground mb-1">Aperçu :</p>
                <p className="font-medium">
                  {generateTypeString()} — <span className="text-gold">{price.toLocaleString()}f</span>
                </p>
              </motion.div>
            )}
          </div>

          {/* Existing Pricing Items grouped by platform */}
          {Object.keys(groupedPricing).length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Mes tarifs actuels</Label>
              
              {Object.entries(groupedPricing).map(([platform, items]) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform.toLowerCase())}
                    <span className="font-medium text-sm">{platform}</span>
                  </div>
                  
                  {items.map((item) => (
                    <motion.div
                      key={item.originalIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl ml-7"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.type.replace(/instagram|tiktok|youtube|snapchat|snap/gi, "").trim()}
                        </p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gold font-semibold text-sm">
                          {item.price.toLocaleString()}f
                        </span>
                        <button
                          type="button"
                          onClick={() => removePricingItem(item.originalIndex)}
                          className="p-2 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t safe-bottom">
          <Button
            onClick={handleSave}
            variant="gold"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Enregistrement..." : "Enregistrer les tarifs"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PricingEditSheet;
