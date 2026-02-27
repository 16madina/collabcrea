import { motion } from "framer-motion";
import { Star, BadgeCheck } from "lucide-react";
import { FaYoutube, FaInstagram, FaTiktok, FaSnapchatGhost, FaFacebookF } from "react-icons/fa";
import type { Creator } from "./CreatorDetailSheet";
import { CountryFlag } from "@/lib/flags";

interface CreatorCardProps {
  creator: Creator;
  index?: number;
  variant?: "grid" | "horizontal";
  onClick?: () => void;
}

const CreatorCard = ({ creator, index = 0, variant = "grid", onClick }: CreatorCardProps) => {
  if (variant === "horizontal") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 + index * 0.1 }}
        className="flex-shrink-0 w-40 glass-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-gold/50 transition-all"
        onClick={onClick}
      >
        {/* Photo avec badge nom */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={creator.image}
            alt={`${creator.firstName} ${creator.lastName}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Badge nom */}
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold text-primary-foreground">
            {creator.firstName}
          </span>
          
          {/* Badge vérifié - droite */}
          {creator.isVerified && (
            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <BadgeCheck className="w-4 h-4 text-white" />
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="p-3">
          {/* Pays avec double drapeau si disponible */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-0.5">
              {creator.residenceFlag ? (
                <><CountryFlag country={creator.residenceCountry} size={16} /><span className="text-muted-foreground text-xs">-</span><CountryFlag country={creator.country} size={16} /></>
              ) : (
                <CountryFlag country={creator.country} size={16} />
              )}
            </span>
            <span>{creator.country}</span>
          </div>
          
          {/* Réseaux sociaux */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {creator.socials.youtube && (
              <div className="flex items-center gap-0.5">
                <FaYoutube className="w-3 h-3" color="#FF0000" />
                <span className="text-[9px] text-muted-foreground">{creator.socials.youtube}</span>
              </div>
            )}
            {creator.socials.instagram && (
              <div className="flex items-center gap-0.5">
                <FaInstagram className="w-3 h-3" color="#E4405F" />
                <span className="text-[9px] text-muted-foreground">{creator.socials.instagram}</span>
              </div>
            )}
            {creator.socials.tiktok && (
              <div className="flex items-center gap-0.5">
                <FaTiktok className="w-3 h-3 text-foreground" />
                <span className="text-[9px] text-muted-foreground">{creator.socials.tiktok}</span>
              </div>
            )}
            {creator.socials.facebook && (
              <div className="flex items-center gap-0.5">
                <FaFacebookF className="w-3 h-3" color="#1877F2" />
                <span className="text-[9px] text-muted-foreground">{creator.socials.facebook}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="glass-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-gold/50 transition-all"
      onClick={onClick}
    >
      {/* Photo */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={creator.image}
          alt={`${creator.firstName} ${creator.lastName}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Nom Badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold text-primary-foreground">
          {creator.firstName} {creator.lastName}
        </span>
        
        {/* Badge vérifié - droite */}
        {creator.isVerified && (
          <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
            <BadgeCheck className="w-4 h-4 text-white" />
          </span>
        )}

        {/* Rating Badge */}
        {creator.rating && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium glass">
            <Star className="w-3 h-3 text-gold fill-gold" />
            <span className="text-foreground">{creator.rating}</span>
          </span>
        )}
      </div>

      {/* Infos */}
      <div className="p-3">
        {/* Pays + Bouton Voir profil sur la même ligne */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-0.5">
              {creator.residenceFlag ? (
                <><CountryFlag country={creator.residenceCountry} size={16} /><span className="text-muted-foreground text-xs">-</span><CountryFlag country={creator.country} size={16} /></>
              ) : (
                <CountryFlag country={creator.country} size={16} />
              )}
            </span>
            <span>{creator.country}</span>
          </div>
          
          <button
            className="h-5 px-3 rounded-full bg-gradient-to-r from-gold via-[hsl(45,80%,55%)] to-gold text-[9px] font-bold uppercase tracking-wide text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Voir Profil
          </button>
        </div>

        {/* Réseaux sociaux */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {creator.socials.youtube && (
            <div className="flex items-center gap-1">
              <FaYoutube className="w-3.5 h-3.5" color="#FF0000" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {creator.socials.youtube}
              </span>
            </div>
          )}
          {creator.socials.instagram && (
            <div className="flex items-center gap-1">
              <FaInstagram className="w-3.5 h-3.5" color="#E4405F" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {creator.socials.instagram}
              </span>
            </div>
          )}
          {creator.socials.tiktok && (
            <div className="flex items-center gap-1">
              <FaTiktok className="w-3.5 h-3.5 text-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {creator.socials.tiktok}
              </span>
            </div>
            )}
            {creator.socials.facebook && (
              <div className="flex items-center gap-1">
                <FaFacebookF className="w-3.5 h-3.5" color="#1877F2" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {creator.socials.facebook}
                </span>
              </div>
            )}
            {creator.socials.snapchat && (
            <div className="flex items-center gap-1">
              <FaSnapchatGhost className="w-3.5 h-3.5" color="#FFFC00" />
              <span className="text-[10px] font-medium text-muted-foreground">
                {creator.socials.snapchat}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CreatorCard;
