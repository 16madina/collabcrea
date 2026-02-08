import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CreditCard, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  { id: "snapchat", name: "Snap", icon: SnapchatIcon },
  { id: "tiktok", name: "TikTok", icon: TikTokIcon },
  { id: "instagram", name: "Insta", icon: InstagramIcon },
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
  { value: "none", label: "Sans durée" },
  { value: "24h", label: "24h" },
  { value: "48h", label: "48h" },
  { value: "72h", label: "72h" },
  { value: "1 semaine", label: "1 semaine" },
  { value: "2 semaines", label: "2 semaines" },
  { value: "1 mois", label: "1 mois" },
  { value: "illimitée", label: "Illimitée", excludeFor: ["snapchat"] },
];

// Get available duration options based on selected platform
const getAvailableDurations = (platform: string) => {
  return durationOptions.filter(opt => 
    !opt.excludeFor || !opt.excludeFor.includes(platform)
  );
};

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
  const [activeTab, setActiveTab] = useState("service");
  
  // New pricing form state
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedContentType, setSelectedContentType] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDuration, setSelectedDuration] = useState("none");
  const [price, setPrice] = useState<number>(0);

  // Pack form state
  const [packName, setPackName] = useState("");
  const [packDescription, setPackDescription] = useState("");
  const [packPrice, setPackPrice] = useState<number>(0);

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
    if (selectedDuration && selectedDuration !== "none") {
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
      description: "",
    };

    setPricing([...pricing, newItem]);
    
    // Reset form
    setSelectedContentType("");
    setSelectedQuantity(1);
    setSelectedDuration("none");
    setPrice(0);

    toast({
      title: "Service ajouté",
      description: newItem.type,
    });
  };

  const addPackItem = () => {
    if (!packName || packPrice <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un nom de pack et un prix",
        variant: "destructive",
      });
      return;
    }

    const newItem: PricingItem = {
      type: `Pack ${packName}`,
      price: packPrice,
      description: packDescription,
    };

    setPricing([...pricing, newItem]);
    
    // Reset form
    setPackName("");
    setPackDescription("");
    setPackPrice(0);

    toast({
      title: "Pack ajouté",
      description: newItem.type,
    });
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

  // Separate packs from regular items
  const packs = pricing.filter(item => item.type.toLowerCase().includes("pack"));
  const regularItems = pricing.filter(item => !item.type.toLowerCase().includes("pack"));

  // Group existing pricing by platform for display
  const groupedPricing = regularItems.reduce((acc, item) => {
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
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Modifier mes tarifs
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-140px)] space-y-4 pb-4">
          {/* Tabs for Service vs Pack */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="service" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Service
              </TabsTrigger>
              <TabsTrigger value="pack" className="gap-2">
                <Package className="w-4 h-4" />
                Pack
              </TabsTrigger>
            </TabsList>

            {/* Service Tab */}
            <TabsContent value="service" className="mt-0">
              <div className="space-y-4 p-4 border border-dashed border-gold/30 rounded-xl bg-gold/5">
                <Label className="text-gold font-semibold">Ajouter un service</Label>
                
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Plateforme</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {platforms.map((platform) => {
                      const IconComponent = platform.icon;
                      const isSelected = selectedPlatform === platform.id;
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => setSelectedPlatform(platform.id)}
                          className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                            isSelected 
                              ? "border-gold bg-gold/10" 
                              : "border-border hover:border-gold/50"
                          }`}
                        >
                          <IconComponent className="w-7 h-7 p-1" size={16} />
                          <span className="text-[9px] font-medium">{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Type */}
                <AnimatePresence>
                  {selectedPlatform && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label className="text-xs text-muted-foreground">Type de contenu</Label>
                      <div className="flex flex-wrap gap-2">
                        {contentTypesByPlatform[selectedPlatform]?.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setSelectedContentType(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
                </AnimatePresence>

                {/* Quantity & Duration */}
                <AnimatePresence>
                  {selectedContentType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-3 overflow-hidden"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Quantité</Label>
                        <Select
                          value={selectedQuantity.toString()}
                          onValueChange={(v) => setSelectedQuantity(parseInt(v))}
                        >
                          <SelectTrigger className="h-9">
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
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Durée</Label>
                        <Select
                          value={selectedDuration}
                          onValueChange={setSelectedDuration}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Optionnel" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableDurations(selectedPlatform).map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Price */}
                <AnimatePresence>
                  {selectedContentType && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Label className="text-xs text-muted-foreground">Prix (FCFA)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={price || ""}
                          onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                          placeholder="Ex: 120000"
                          className="flex-1 h-9"
                        />
                        <Button
                          type="button"
                          variant="gold"
                          size="sm"
                          onClick={addPricingItem}
                          className="shrink-0 h-9"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview */}
                {selectedPlatform && selectedContentType && price > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-2 bg-background rounded-lg border border-gold/20 text-sm"
                  >
                    <span className="text-muted-foreground">Aperçu: </span>
                    <span className="font-medium">{generateTypeString()}</span>
                    <span className="text-gold font-semibold"> — {price.toLocaleString()}f</span>
                  </motion.div>
                )}
              </div>
            </TabsContent>

            {/* Pack Tab */}
            <TabsContent value="pack" className="mt-0">
              <div className="space-y-4 p-4 border border-dashed border-violet/30 rounded-xl bg-violet/5">
                <Label className="text-violet font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Créer un pack
                </Label>
                
                <p className="text-xs text-muted-foreground">
                  Combinez plusieurs services dans un pack à prix réduit (ex: "Pack Influenceur = 3 stories + 2 vidéos")
                </p>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Nom du pack</Label>
                    <Input
                      value={packName}
                      onChange={(e) => setPackName(e.target.value)}
                      placeholder="Ex: Influenceur, Premium, Starter..."
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Contenu du pack</Label>
                    <Textarea
                      value={packDescription}
                      onChange={(e) => setPackDescription(e.target.value)}
                      placeholder="Ex: 3 stories 24h + 2 vidéos TikTok + 1 reel Instagram"
                      className="min-h-[70px] text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Prix du pack (FCFA)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={packPrice || ""}
                        onChange={(e) => setPackPrice(parseInt(e.target.value) || 0)}
                        placeholder="Ex: 500000"
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPackItem}
                        className="shrink-0 h-9 border-violet text-violet hover:bg-violet/10"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Pack Preview */}
                {packName && packPrice > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 bg-background rounded-lg border border-violet/20"
                  >
                    <p className="text-xs text-muted-foreground mb-1">Aperçu :</p>
                    <p className="font-semibold">Pack {packName}</p>
                    {packDescription && (
                      <p className="text-xs text-muted-foreground mt-1">{packDescription}</p>
                    )}
                    <p className="text-violet font-bold mt-1">{packPrice.toLocaleString()}f</p>
                  </motion.div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Existing Packs */}
          {packs.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-violet" />
                Mes packs
              </Label>
              
              {packs.map((pack) => {
                const originalIndex = pricing.indexOf(pack);
                return (
                  <motion.div
                    key={originalIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start justify-between p-3 bg-violet/5 border border-violet/20 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{pack.type}</p>
                      {pack.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{pack.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-violet font-bold text-sm">
                        {pack.price.toLocaleString()}f
                      </span>
                      <button
                        type="button"
                        onClick={() => removePricingItem(originalIndex)}
                        className="p-1.5 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Existing Pricing Items grouped by platform */}
          {Object.keys(groupedPricing).length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Mes services</Label>
              
              {Object.entries(groupedPricing).map(([platform, items]) => (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(platform.toLowerCase())}
                    <span className="font-medium text-xs">{platform}</span>
                  </div>
                  
                  {items.map((item) => (
                    <motion.div
                      key={item.originalIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2.5 bg-muted/50 rounded-xl ml-6"
                    >
                      <p className="font-medium text-xs flex-1">
                        {item.type.replace(/instagram|tiktok|youtube|snapchat|snap/gi, "").trim()}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-gold font-semibold text-xs">
                          {item.price.toLocaleString()}f
                        </span>
                        <button
                          type="button"
                          onClick={() => removePricingItem(item.originalIndex)}
                          className="p-1.5 text-destructive hover:bg-destructive/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
