import { useState, useMemo } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { worldCountries } from "@/data/countries";

interface ResidenceEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentResidence: string | null;
  onUpdate: () => void;
}

const ResidenceEditSheet = ({ 
  isOpen, 
  onClose, 
  currentResidence, 
  onUpdate 
}: ResidenceEditSheetProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(currentResidence);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return worldCountries;
    const query = searchQuery.toLowerCase();
    return worldCountries.filter(
      (country) => country.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          residence_country: selectedCountry,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Pays de résidence mis à jour",
        description: selectedCountry 
          ? `Vous résidez maintenant en ${selectedCountry}` 
          : "Pays de résidence supprimé",
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating residence:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedCountry(null);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-gold" />
            Pays de résidence
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Current selection */}
          {selectedCountry && (
            <div className="flex items-center justify-between p-3 bg-gold/10 rounded-xl border border-gold/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {worldCountries.find(c => c.name === selectedCountry)?.flag || "🌍"}
                </span>
                <span className="font-medium text-foreground">{selectedCountry}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Effacer
              </Button>
            </div>
          )}

          {/* Country list */}
          <ScrollArea className="h-[40vh]">
            <div className="space-y-1 pr-4">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.name)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    selectedCountry === country.name
                      ? "bg-gold/20 border border-gold/50"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="text-xl">{country.flag}</span>
                  <span className="text-foreground">{country.name}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Aucun pays trouvé
                </p>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="pt-4 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              variant="gold"
              className="flex-1"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ResidenceEditSheet;
