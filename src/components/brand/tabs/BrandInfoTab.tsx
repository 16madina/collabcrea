import { motion } from "framer-motion";
import { Edit3, Building2, Globe, MapPin, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BrandInfoTabProps {
  companyDescription: string | null;
  sector: string | null;
  website: string | null;
  country: string | null;
  joinedDate: string | null;
  onEdit: () => void;
}

const BrandInfoTab = ({
  companyDescription,
  sector,
  website,
  country,
  joinedDate,
  onEdit,
}: BrandInfoTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 space-y-6"
    >
      {/* Description Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">À propos</h3>
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-gold">
            <Edit3 className="w-4 h-4 mr-1" />
            Modifier
          </Button>
        </div>
        
        {companyDescription ? (
          <p className="text-muted-foreground text-sm leading-relaxed">{companyDescription}</p>
        ) : (
          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm mb-2">
              Décrivez votre entreprise pour attirer les meilleurs créateurs
            </p>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Ajouter une description
            </Button>
          </div>
        )}
      </div>

      {/* Company Details */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-foreground">Informations</h3>
        <div className="space-y-2">
          {sector && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Secteur d'activité</p>
                <p className="font-medium text-foreground">{sector}</p>
              </div>
            </div>
          )}
          
          {website && (
            <a 
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Site web</p>
                <p className="font-medium text-gold">{website.replace(/^https?:\/\//, "")}</p>
              </div>
            </a>
          )}

          {country && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Localisation</p>
                <p className="font-medium text-foreground">{country}</p>
              </div>
            </div>
          )}
          
          {joinedDate && (
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Membre depuis</p>
                <p className="font-medium text-foreground">{joinedDate}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state if no info */}
      {!sector && !website && !country && (
        <div className="bg-muted/30 rounded-xl p-6 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-3">
            Complétez votre profil d'entreprise pour inspirer confiance
          </p>
          <Button onClick={onEdit} variant="gold">
            Compléter mon profil
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default BrandInfoTab;
