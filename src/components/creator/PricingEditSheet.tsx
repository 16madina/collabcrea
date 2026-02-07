import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, X, CreditCard } from "lucide-react";
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

interface PricingItem {
  type: string;
  price: number;
  description: string;
}

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
  const [newPricing, setNewPricing] = useState<PricingItem>({
    type: "",
    price: 0,
    description: "",
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Modifier mes tarifs
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100%-140px)] space-y-4 pb-4">
          {/* Existing Pricing Items */}
          {pricing.length > 0 && (
            <div className="space-y-3">
              <Label>Mes tarifs actuels</Label>
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
          <div className="space-y-3 p-4 border border-dashed border-gold/30 rounded-xl bg-gold/5">
            <Label className="text-gold">Ajouter un tarif</Label>
            
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

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  value={newPricing.price || ""}
                  onChange={(e) =>
                    setNewPricing({
                      ...newPricing,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Prix (FCFA)"
                />
              </div>
              <Button
                type="button"
                variant="gold"
                onClick={addPricingItem}
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Input
              value={newPricing.description}
              onChange={(e) =>
                setNewPricing({
                  ...newPricing,
                  description: e.target.value,
                })
              }
              placeholder="Description (optionnel)"
            />
          </div>
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
