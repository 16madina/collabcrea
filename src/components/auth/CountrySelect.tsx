import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Country } from "@/data/countries";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

const CountryFlag = ({ code, className = "" }: { code: string; className?: string }) => (
  <img
    src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
    alt={code}
    className={cn("inline-block rounded-sm object-cover", className)}
    style={{ width: 24, height: 16 }}
    loading="lazy"
  />
);

interface CountrySelectProps {
  countries: Country[];
  value: string;
  onChange: (countryCode: string) => void;
  placeholder?: string;
  error?: string;
  showFlag?: boolean;
  showPhoneCode?: boolean;
}

const CountrySelect = ({
  countries,
  value,
  onChange,
  placeholder = "Sélectionner un pays",
  error,
  showFlag = true,
  showPhoneCode = false,
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === value),
    [countries, value]
  );

  const filteredCountries = useMemo(() => {
    if (!search) return countries;
    const searchLower = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.code.toLowerCase().includes(searchLower)
    );
  }, [countries, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-14 bg-muted/50 border rounded-xl px-4 flex items-center justify-between text-left transition-colors",
            "focus:outline-none focus:border-gold",
            error ? "border-destructive" : "border-border hover:border-gold/50"
          )}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              {showFlag && <CountryFlag code={selectedCountry.code} />}
              <span>{selectedCountry.name}</span>
              {showPhoneCode && (
                <span className="text-muted-foreground">
                  ({selectedCountry.phoneCode})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 h-10"
            />
          </div>
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-1">
            {filteredCountries.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                  "hover:bg-muted",
                  value === country.code && "bg-gold/10 text-gold"
                )}
              >
                {showFlag && <CountryFlag code={country.code} />}
                <span className="flex-1">{country.name}</span>
                {showPhoneCode && (
                  <span className="text-muted-foreground text-sm">
                    {country.phoneCode}
                  </span>
                )}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Aucun pays trouvé
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelect;
