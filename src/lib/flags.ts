import { Globe } from "lucide-react";
import React from "react";

// Mapping of French country names to ISO 3166-1 alpha-2 codes (lowercase)
const countryToISO: Record<string, string> = {
  // Africa
  "Algérie": "dz",
  "Angola": "ao",
  "Bénin": "bj",
  "Botswana": "bw",
  "Burkina Faso": "bf",
  "Burundi": "bi",
  "Cameroun": "cm",
  "Cap-Vert": "cv",
  "Centrafrique": "cf",
  "Comores": "km",
  "Congo": "cg",
  "Côte d'Ivoire": "ci",
  "Djibouti": "dj",
  "Égypte": "eg",
  "Érythrée": "er",
  "Eswatini": "sz",
  "Éthiopie": "et",
  "Gabon": "ga",
  "Gambie": "gm",
  "Ghana": "gh",
  "Guinée": "gn",
  "Guinée-Bissau": "gw",
  "Guinée Équatoriale": "gq",
  "Kenya": "ke",
  "Lesotho": "ls",
  "Liberia": "lr",
  "Libye": "ly",
  "Madagascar": "mg",
  "Malawi": "mw",
  "Mali": "ml",
  "Maroc": "ma",
  "Maurice": "mu",
  "Mauritanie": "mr",
  "Mozambique": "mz",
  "Namibie": "na",
  "Niger": "ne",
  "Nigeria": "ng",
  "Ouganda": "ug",
  "RDC": "cd",
  "Rwanda": "rw",
  "São Tomé-et-Príncipe": "st",
  "Sénégal": "sn",
  "Seychelles": "sc",
  "Sierra Leone": "sl",
  "Somalie": "so",
  "Soudan": "sd",
  "Soudan du Sud": "ss",
  "Tanzanie": "tz",
  "Tchad": "td",
  "Togo": "tg",
  "Tunisie": "tn",
  "Zambie": "zm",
  "Zimbabwe": "zw",
  "Afrique du Sud": "za",
  // Europe
  "France": "fr",
  "Belgique": "be",
  "Suisse": "ch",
  "Allemagne": "de",
  "Royaume-Uni": "gb",
  "Espagne": "es",
  "Italie": "it",
  "Portugal": "pt",
  "Pays-Bas": "nl",
  // Americas
  "Canada": "ca",
  "États-Unis": "us",
  "Brésil": "br",
  "Mexique": "mx",
  // Middle East & Asia
  "Chine": "cn",
  "Japon": "jp",
  "Australie": "au",
  "Émirats Arabes Unis": "ae",
  "Arabie Saoudite": "sa",
  "Qatar": "qa",
};

export function getCountryCode(country: string | null | undefined): string | null {
  if (!country) return null;
  return countryToISO[country] || null;
}

export function getFlagImageUrl(country: string | null | undefined, width: number = 40): string | null {
  const code = getCountryCode(country);
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}

interface CountryFlagProps {
  country: string | null | undefined;
  size?: number;
  className?: string;
}

export function CountryFlag({ country, size = 20, className = "" }: CountryFlagProps) {
  const code = getCountryCode(country);

  if (!code) {
    return React.createElement(Globe, {
      className: `inline-block text-muted-foreground ${className}`,
      style: { width: size, height: size },
    });
  }

  return React.createElement("img", {
    src: `https://flagcdn.com/w40/${code}.png`,
    alt: country || "",
    width: size,
    height: Math.round(size * 0.75),
    className: `inline-block rounded-sm object-cover ${className}`,
    style: { width: size, height: Math.round(size * 0.75) },
    loading: "lazy" as const,
  });
}
