import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, MessageCircle, Flag, User, CreditCard, Image, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ReportDialog from "@/components/ReportDialog";
import PortfolioTab from "@/components/creator/tabs/PortfolioTab";
import ContactCreatorSheet from "@/components/brand/ContactCreatorSheet";

// Social media icons
const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
  </svg>
);

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
                <h3 className="font-semibold text-foreground mb-3">Réseaux sociaux</h3>
                <div className="grid grid-cols-2 gap-3">
                  {creator.socials.youtube && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <YoutubeIcon className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">YouTube</p>
                        <p className="font-semibold text-foreground">{creator.socials.youtube}</p>
                      </div>
                    </div>
                  )}
                  {creator.socials.instagram && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <InstagramIcon className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Instagram</p>
                        <p className="font-semibold text-foreground">{creator.socials.instagram}</p>
                      </div>
                    </div>
                  )}
                  {creator.socials.tiktok && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
                        <TiktokIcon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">TikTok</p>
                        <p className="font-semibold text-foreground">{creator.socials.tiktok}</p>
                      </div>
                    </div>
                  )}
                  {creator.socials.snapchat && (
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <SnapchatIcon className="w-5 h-5 text-gold" />
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
            <TabsContent value="pricing" className="space-y-2">
              {pricing.map((item, index) => (
                <div
                  key={index}
                  className="glass rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gold">{item.price}</p>
                  </div>
                </div>
              ))}
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
