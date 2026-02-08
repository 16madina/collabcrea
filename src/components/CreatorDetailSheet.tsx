import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, MessageCircle, Flag, User, CreditCard, Image } from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ReportDialog from "@/components/ReportDialog";
import PortfolioTab from "@/components/creator/tabs/PortfolioTab";
import ContactCreatorSheet from "@/components/brand/ContactCreatorSheet";
import RateCardDisplay from "@/components/creator/RateCardDisplay";

export interface CreatorSocials {
  youtube?: string;
  instagram?: string;
  tiktok?: string;
  snapchat?: string;
}

export interface CreatorPricing {
  type: string;
  price: string;
  description: string;
}

export interface Creator {
  firstName: string;
  lastName: string;
  category: string;
  country: string;
  flag: string;
  residenceFlag?: string;
  image: string;
  rating?: number;
  bio?: string;
  isVerified?: boolean;
  socials: CreatorSocials;
  pricing?: CreatorPricing[];
}

interface CreatorDetailSheetProps {
  creator: Creator | null;
  creatorUserId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultPricing: CreatorPricing[] = [
  { type: "Story Instagram", price: "25 000 FCFA", description: "1 story avec mention" },
  { type: "Post Instagram", price: "50 000 FCFA", description: "1 post feed + caption" },
  { type: "Reel / TikTok", price: "75 000 FCFA", description: "Vidéo courte 15-60s" },
  { type: "Vidéo YouTube", price: "150 000 FCFA", description: "Intégration produit 2-5min" },
  { type: "Pack Complet", price: "250 000 FCFA", description: "Story + Post + Reel" },
];

const CreatorDetailSheet = ({ creator, creatorUserId, open, onOpenChange }: CreatorDetailSheetProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showContactSheet, setShowContactSheet] = useState(false);

  if (!creator) return null;

  const pricing = creator.pricing || defaultPricing;
  const creatorFullName = `${creator.firstName} ${creator.lastName}`;

  const handleContact = () => {
    if (!user) {
      navigate("/auth?role=brand");
      return;
    }

    if (!creatorUserId || creatorUserId.startsWith("static-")) {
      // For static/demo creators, redirect to auth
      navigate("/auth?role=brand");
      return;
    }
    
    // Open contact sheet with offer selection
    setShowContactSheet(true);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Profil de {creator.firstName} {creator.lastName}</SheetTitle>
        </SheetHeader>
        
        {/* Header avec photo */}
        <div className="relative -mx-6 -mt-6">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={creator.image}
              alt={`${creator.firstName} ${creator.lastName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
          
          {/* Infos sur la photo */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gold text-primary-foreground">
                {creator.category}
              </span>
              {creator.rating && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium glass">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  {creator.rating}
                </span>
              )}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {creator.firstName} {creator.lastName}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>
                {creator.residenceFlag ? `${creator.residenceFlag}-${creator.flag}` : creator.flag}
              </span>
              <MapPin className="w-3 h-3" />
              <span>{creator.country}</span>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mt-4">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full grid grid-cols-3 bg-muted/50 p-1 rounded-xl mb-4">
              <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                <User className="w-4 h-4 mr-1.5" />
                Infos
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                <Image className="w-4 h-4 mr-1.5" />
                Portfolio
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-lg data-[state=active]:bg-gold data-[state=active]:text-primary-foreground">
                <CreditCard className="w-4 h-4 mr-1.5" />
                Tarifs
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">À propos</h3>
                <p className="text-sm text-muted-foreground">
                  {creator.bio || `Créateur de contenu ${creator.category} basé en ${creator.country}. Passionné par la création de contenu authentique et engageant pour les marques africaines et internationales.`}
                </p>
              </div>

              {/* Réseaux sociaux */}
              <div>
                <h3 className="font-semibold text-foreground mb-3 italic">Réseaux sociaux</h3>
                <div className="grid grid-cols-2 gap-3">
                  {creator.socials.youtube && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FF0000] flex items-center justify-center">
                        <FaYoutube className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">YouTube</p>
                        <p className="font-semibold text-foreground">{creator.socials.youtube}</p>
                      </div>
                    </div>
                  )}
                  {creator.socials.instagram && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        }}
                      >
                        <FaInstagram className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Instagram</p>
                        <p className="font-semibold text-foreground">{creator.socials.instagram}</p>
                      </div>
                    </div>
                  )}
                  {creator.socials.tiktok && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                        <FaTiktok className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">TikTok</p>
                        <p className="font-semibold text-foreground">{creator.socials.tiktok}</p>
                      </div>
                    </div>
                  )}
                  {creator.socials.snapchat && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFFC00] flex items-center justify-center">
                        <FaSnapchatGhost className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Snapchat</p>
                        <p className="font-semibold text-foreground">{creator.socials.snapchat}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              {creatorUserId && !creatorUserId.startsWith("static-") ? (
                <PortfolioTab userId={creatorUserId} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Portfolio non disponible</h3>
                  <p className="text-sm text-muted-foreground">
                    Ce créateur n'a pas encore configuré son portfolio.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="pb-4">
              <RateCardDisplay
                pricing={pricing.map(p => ({
                  ...p,
                  price: typeof p.price === "string" ? parseInt(p.price.replace(/\D/g, "")) || 0 : p.price
                }))}
                avatarUrl={creator.image}
                fullName={`${creator.firstName} ${creator.lastName}`}
              />
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="pt-4 pb-8 space-y-3">
            <Button 
              variant="gold" 
              size="lg" 
              className="w-full"
              onClick={handleContact}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Contacter {creator.firstName}
            </Button>

            {/* Report button - only show if logged in and not own profile */}
            {user && creatorUserId && user.id !== creatorUserId && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-muted-foreground hover:text-destructive"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="w-4 h-4 mr-2" />
                Signaler ce profil
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Contact Creator Sheet with Offer Selection */}
    {creatorUserId && !creatorUserId.startsWith("static-") && (
      <ContactCreatorSheet
        open={showContactSheet}
        onOpenChange={setShowContactSheet}
        creatorId={creatorUserId}
        creatorName={creatorFullName}
      />
    )}

    {/* Report Dialog */}
    <ReportDialog
      open={showReportDialog}
      onOpenChange={setShowReportDialog}
      reportType="user"
      targetUserId={creatorUserId}
      targetName={creatorFullName}
    />
    </>
  );
};

export default CreatorDetailSheet;
