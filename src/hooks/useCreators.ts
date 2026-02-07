import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { allCreators as staticCreators } from "@/data/creators";
import type { Creator } from "@/components/CreatorDetailSheet";

interface ProfileWithRole {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  category: string | null;
  country: string | null;
  residence_country: string | null;
  followers: string | null;
  youtube_followers: string | null;
  instagram_followers: string | null;
  tiktok_followers: string | null;
  snapchat_followers: string | null;
  pricing: unknown;
  identity_verified: boolean | null;
  is_banned: boolean | null;
}

// Country to flag mapping (African countries)
const africanCountryFlags: Record<string, string> = {
  "Côte d'Ivoire": "🇨🇮",
  "Sénégal": "🇸🇳",
  "Mali": "🇲🇱",
  "Ghana": "🇬🇭",
  "Nigeria": "🇳🇬",
  "Cameroun": "🇨🇲",
  "Guinée": "🇬🇳",
  "Bénin": "🇧🇯",
  "Togo": "🇹🇬",
  "Burkina Faso": "🇧🇫",
  "Niger": "🇳🇪",
  "Gabon": "🇬🇦",
  "Congo": "🇨🇬",
  "RDC": "🇨🇩",
  "Maroc": "🇲🇦",
  "Algérie": "🇩🇿",
  "Tunisie": "🇹🇳",
  "Égypte": "🇪🇬",
  "Kenya": "🇰🇪",
  "Afrique du Sud": "🇿🇦",
};

// Worldwide country flags (for residence)
const worldCountryFlags: Record<string, string> = {
  // Africa
  ...africanCountryFlags,
  // Europe
  "France": "🇫🇷",
  "Belgique": "🇧🇪",
  "Suisse": "🇨🇭",
  "Allemagne": "🇩🇪",
  "Royaume-Uni": "🇬🇧",
  "Espagne": "🇪🇸",
  "Italie": "🇮🇹",
  "Portugal": "🇵🇹",
  "Pays-Bas": "🇳🇱",
  // Americas
  "Canada": "🇨🇦",
  "États-Unis": "🇺🇸",
  "Brésil": "🇧🇷",
  "Mexique": "🇲🇽",
  // Others
  "Chine": "🇨🇳",
  "Japon": "🇯🇵",
  "Australie": "🇦🇺",
  "Émirats Arabes Unis": "🇦🇪",
  "Arabie Saoudite": "🇸🇦",
  "Qatar": "🇶🇦",
};

function getFlag(country: string | null): string {
  if (!country) return "🌍";
  return worldCountryFlags[country] || africanCountryFlags[country] || "🌍";
}

function mapProfileToCreator(profile: ProfileWithRole): Creator & { userId: string } {
  const nameParts = profile.full_name.split(" ");
  const firstName = nameParts[0] || "Créateur";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Parse pricing from JSON
  let pricing: Creator["pricing"] = undefined;
  if (profile.pricing && Array.isArray(profile.pricing)) {
    pricing = (profile.pricing as Array<{ type?: string; price?: string; description?: string }>).map((p) => ({
      type: p.type || "",
      price: p.price || "",
      description: p.description || "",
    }));
  }

  // Get residence flag only if different from origin
  const residenceFlag = profile.residence_country ? getFlag(profile.residence_country) : undefined;

  return {
    userId: profile.user_id,
    firstName,
    lastName,
    category: profile.category || "Lifestyle",
    country: profile.country || "Afrique",
    flag: getFlag(profile.country),
    residenceFlag: residenceFlag !== getFlag(profile.country) ? residenceFlag : undefined,
    image: profile.avatar_url || "/placeholder.svg",
    rating: undefined, // Could be calculated from reviews later
    bio: profile.bio || undefined,
    socials: {
      youtube: profile.youtube_followers || undefined,
      instagram: profile.instagram_followers || undefined,
      tiktok: profile.tiktok_followers || undefined,
      snapchat: profile.snapchat_followers || undefined,
    },
    pricing,
  };
}

export function useCreators() {
  const [dbCreators, setDbCreators] = useState<(Creator & { userId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreators() {
      try {
        setLoading(true);
        
        // First, get all creator user_ids from user_roles
        const { data: creatorRoles, error: rolesError } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "creator");

        if (rolesError) throw rolesError;

        if (!creatorRoles || creatorRoles.length === 0) {
          setDbCreators([]);
          return;
        }

        const creatorUserIds = creatorRoles.map((r) => r.user_id);

        // Then fetch profiles for these users
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("user_id", creatorUserIds)
          .eq("is_banned", false);

        if (profilesError) throw profilesError;

        const mappedCreators = (profiles || []).map((profile) => 
          mapProfileToCreator(profile as ProfileWithRole)
        );

        setDbCreators(mappedCreators);
      } catch (err) {
        console.error("Error fetching creators:", err);
        setError("Erreur lors du chargement des créateurs");
      } finally {
        setLoading(false);
      }
    }

    fetchCreators();
  }, []);

  // Combine real creators with static ones (real ones first)
  const allCreators = useMemo(() => {
    // Static creators don't have userId, so we add a fake one
    const staticWithId = staticCreators.map((c, i) => ({
      ...c,
      userId: `static-${i}`,
    }));

    // Real creators first, then fill with static if needed
    if (dbCreators.length === 0) {
      return staticWithId;
    }

    // Return real creators + static ones to ensure variety
    return [...dbCreators, ...staticWithId];
  }, [dbCreators]);

  // Only real creators from DB
  const realCreators = dbCreators;

  return {
    allCreators,
    realCreators,
    staticCreators: staticCreators.map((c, i) => ({ ...c, userId: `static-${i}` })),
    loading,
    error,
    hasRealCreators: dbCreators.length > 0,
  };
}
