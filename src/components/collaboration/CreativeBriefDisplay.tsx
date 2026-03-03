import { Phone, MapPinned, Hash, Type, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CreativeBrief {
  phone?: string;
  address?: string;
  hashtags?: string;
  mentions?: string;
}

interface CreativeBriefDisplayProps {
  brief: CreativeBrief;
  compact?: boolean;
}

const CreativeBriefDisplay = ({ brief, compact = false }: CreativeBriefDisplayProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const hasContent = brief.phone || brief.address || brief.hashtags || brief.mentions;
  if (!hasContent) return null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="rounded-xl border border-gold/20 bg-gold/5 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gold" />
              Brief créatif
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          {expanded && (
            <div className="px-3 pb-3 space-y-2 border-t border-gold/10 pt-2">
              <BriefItems brief={brief} />
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <FileText className="w-4 h-4 text-gold" />
        Brief créatif
      </p>
      <BriefItems brief={brief} />
    </div>
  );
};

const BriefItems = ({ brief }: { brief: CreativeBrief }) => (
  <>
    {brief.phone && (
      <div className="flex items-center gap-2 text-sm">
        <Phone className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-foreground">{brief.phone}</span>
      </div>
    )}
    {brief.address && (
      <div className="flex items-center gap-2 text-sm">
        <MapPinned className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-foreground">{brief.address}</span>
      </div>
    )}
    {brief.hashtags && (
      <div className="flex items-center gap-2 text-sm">
        <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-gold">{brief.hashtags}</span>
      </div>
    )}
    {brief.mentions && (
      <div className="text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5 mb-1">
          <Type className="w-3.5 h-3.5 flex-shrink-0" /> Textes obligatoires
        </span>
        <p className="text-foreground whitespace-pre-wrap text-xs">{brief.mentions}</p>
      </div>
    )}
  </>
);

export default CreativeBriefDisplay;
