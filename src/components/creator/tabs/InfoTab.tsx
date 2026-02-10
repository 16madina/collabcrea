import { motion } from "framer-motion";
import { Edit3, MapPin, Globe, Calendar } from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost, FaFacebookF } from "react-icons/fa";
import { Button } from "@/components/ui/button";

interface SocialAccount {
  platform: string;
  followers: string;
}

interface InfoTabProps {
  bio: string | null;
  country: string | null;
  residenceCountry?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  joinedDate?: string | null;
  socialAccounts: SocialAccount[];
  onEditBio: () => void;
  onEditSocial: () => void;
  onEditResidence?: () => void;
}

const InfoTab = ({
  bio,
  country,
  residenceCountry,
  email,
  phone,
  website,
  joinedDate,
  socialAccounts,
  onEditBio,
  onEditSocial,
  onEditResidence,
}: InfoTabProps) => {
  const getSocialIconElement = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FF0000] flex items-center justify-center">
            <FaYoutube className="w-5 h-5 text-white" />
          </div>
        );
      case "instagram":
        return (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            }}
          >
            <FaInstagram className="w-5 h-5 text-white" />
          </div>
        );
      case "tiktok":
        return (
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
            <FaTiktok className="w-5 h-5 text-white" />
          </div>
        );
      case "snapchat":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#FFFC00] flex items-center justify-center">
            <FaSnapchatGhost className="w-5 h-5 text-black" />
          </div>
        );
      case "facebook":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#1877F2] flex items-center justify-center">
            <FaFacebookF className="w-5 h-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-gold" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* Bio Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">À propos</h3>
          <Button variant="ghost" size="sm" onClick={onEditBio} className="text-gold">
            <Edit3 className="w-4 h-4 mr-1" />
            Modifier
          </Button>
        </div>
        
        {bio ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{bio}</p>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Ajoutez une bio pour vous présenter aux marques
            </p>
            <Button variant="outline" size="sm" onClick={onEditBio}>
              Ajouter une bio
            </Button>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Informations</h3>
          {onEditResidence && (
            <Button variant="ghost" size="sm" onClick={onEditResidence} className="text-gold">
              <Edit3 className="w-4 h-4 mr-1" />
              Modifier
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {country && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pays d'origine</p>
                <p className="font-medium text-foreground">{country}</p>
              </div>
            </div>
          )}
          
          {/* Residence country */}
          <div 
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={onEditResidence}
          >
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pays de résidence</p>
              <p className="font-medium text-foreground">
                {residenceCountry || "Non renseigné"}
              </p>
            </div>
          </div>
          
          {joinedDate && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Membre depuis</p>
                <p className="font-medium text-foreground">{joinedDate}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Networks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground italic">Réseaux sociaux</h3>
          <Button variant="ghost" size="sm" onClick={onEditSocial} className="text-gold">
            <Edit3 className="w-4 h-4 mr-1" />
            Modifier
          </Button>
        </div>
        
        {socialAccounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {socialAccounts.map((account, index) => (
              <motion.div
                key={account.platform}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted/30 rounded-xl p-4"
              >
                <div className="mb-2">
                  {getSocialIconElement(account.platform)}
                </div>
                <p className="text-xs text-muted-foreground">{account.platform}</p>
                <p className="font-bold text-foreground">{account.followers}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Connectez vos réseaux sociaux
            </p>
            <Button variant="outline" size="sm" onClick={onEditSocial}>
              Ajouter mes réseaux
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InfoTab;
