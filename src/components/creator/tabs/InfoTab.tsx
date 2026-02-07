import { motion } from "framer-motion";
import { 
  Edit3, 
  Youtube, 
  Instagram, 
  MapPin, 
  Globe,
  Mail,
  Phone,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

// Snapchat icon component
const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.42.42 0 0 1 .165-.036c.101 0 .21.035.3.096.135.09.21.21.21.36 0 .165-.09.315-.225.405a2.2 2.2 0 0 1-.405.195c-.12.045-.24.09-.359.12-.165.045-.329.09-.479.149-.21.075-.27.225-.3.449 0 .03-.015.06-.015.09v.061c.014.175.03.375.089.569a.32.32 0 0 0 .029.069c.021.044.04.085.061.12.165.256.314.404.614.599.27.18.614.315 1.019.45.104.033.21.063.3.105.209.09.405.24.495.45.045.12.06.255.045.39-.075.33-.375.54-.674.585a3.65 3.65 0 0 1-.569.045c-.225 0-.45-.03-.66-.045-.255-.03-.494-.045-.704-.045-.12 0-.24 0-.345.015-.21.015-.42.09-.6.195-.375.195-.705.615-1.095 1.11-.194.25-.404.5-.629.71-.344.33-.749.54-1.169.69-.479.18-.989.27-1.559.27h-.15c-.57 0-1.08-.09-1.559-.27a3.3 3.3 0 0 1-1.169-.69c-.225-.21-.435-.46-.629-.71-.39-.495-.72-.915-1.095-1.11a1.38 1.38 0 0 0-.6-.195c-.106-.015-.225-.015-.345-.015-.21 0-.449.015-.704.045-.21.015-.435.045-.66.045a3.65 3.65 0 0 1-.569-.045c-.3-.045-.599-.255-.674-.585a.71.71 0 0 1 .045-.39c.09-.21.285-.36.495-.45.09-.04.195-.072.3-.105.405-.135.749-.27 1.019-.45.3-.195.449-.343.614-.599l.061-.12c.01-.022.02-.045.029-.069.059-.194.075-.394.089-.569v-.061c0-.03-.015-.06-.015-.09-.03-.224-.09-.374-.3-.449a2.81 2.81 0 0 0-.479-.149c-.12-.03-.24-.075-.359-.12a2.2 2.2 0 0 1-.405-.195c-.135-.09-.225-.24-.225-.405 0-.15.075-.27.21-.36a.5.5 0 0 1 .3-.096.42.42 0 0 1 .165.036c.374.181.733.301 1.033.301.198 0 .326-.045.401-.09a22.1 22.1 0 0 1-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.859 1.069 11.216.793 12.206.793z"/>
  </svg>
);

interface SocialAccount {
  platform: string;
  followers: string;
}

interface InfoTabProps {
  bio: string | null;
  country: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  joinedDate?: string | null;
  socialAccounts: SocialAccount[];
  onEdit: () => void;
}

const InfoTab = ({
  bio,
  country,
  email,
  phone,
  website,
  joinedDate,
  socialAccounts,
  onEdit,
}: InfoTabProps) => {
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return Youtube;
      case "instagram":
        return Instagram;
      case "tiktok":
        return TikTokIcon;
      case "snapchat":
        return SnapchatIcon;
      default:
        return Globe;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return "bg-red-500/10 text-red-500";
      case "instagram":
        return "bg-pink-500/10 text-pink-500";
      case "tiktok":
        return "bg-foreground/10 text-foreground";
      case "snapchat":
        return "bg-yellow-400/10 text-yellow-500";
      default:
        return "bg-gold/10 text-gold";
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
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-gold">
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
            <Button variant="outline" size="sm" onClick={onEdit}>
              Ajouter une bio
            </Button>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Informations</h3>
        <div className="space-y-2">
          {country && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Localisation</p>
                <p className="font-medium text-foreground">{country}</p>
              </div>
            </div>
          )}
          
          {joinedDate && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
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
        <h3 className="font-display font-semibold text-foreground">Réseaux sociaux</h3>
        
        {socialAccounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {socialAccounts.map((account, index) => {
              const Icon = getPlatformIcon(account.platform);
              const colorClass = getPlatformColor(account.platform);
              
              return (
                <motion.div
                  key={account.platform}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-muted/30 rounded-xl p-4"
                >
                  <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">{account.platform}</p>
                  <p className="font-bold text-foreground">{account.followers}</p>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Connectez vos réseaux sociaux
            </p>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Ajouter mes réseaux
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InfoTab;
