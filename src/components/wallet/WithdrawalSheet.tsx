import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowUpRight, AlertCircle, Clock, ShieldAlert } from "lucide-react";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { useAuth } from "@/hooks/useAuth";
import { Wallet } from "@/hooks/useWallet";
import { worldCountries } from "@/data/countries";
import { supabase } from "@/integrations/supabase/client";

interface WithdrawalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet: Wallet | null;
  onSuccess?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const mobileProviders = [
  {
    id: "wave",
    name: "Wave",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <rect width="40" height="40" rx="10" fill="#1DC3E2" />
        <path d="M10 22c3-6 6-8 10-8s7 4 10 8" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "orange",
    name: "Orange Money",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <rect width="40" height="40" rx="10" fill="#FF6600" />
        <circle cx="20" cy="18" r="8" fill="white" />
        <rect x="12" y="26" width="16" height="4" rx="2" fill="white" />
      </svg>
    ),
  },
];

const WithdrawalSheet = ({
  open,
  onOpenChange,
  wallet,
  onSuccess,
}: WithdrawalSheetProps) => {
  const { user } = useAuth();
  const { loading, requestMobileMoneyWithdrawal } = useWithdrawal();

  const [amount, setAmount] = useState("");
  const [mobileProvider, setMobileProvider] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileNumberConfirm, setMobileNumberConfirm] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [userPhoneCode, setUserPhoneCode] = useState("");
  const [userFlag, setUserFlag] = useState("");

  // Fetch user's country from profile
  useEffect(() => {
    if (!user || !open) return;
    const fetchCountry = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("country")
        .eq("user_id", user.id)
        .single();
      if (data?.country) {
        setUserCountry(data.country);
        const found = worldCountries.find((c) => c.name === data.country);
        if (found) {
          setUserPhoneCode(found.phoneCode);
          setUserFlag(found.flag);
        }
      }
    };
    fetchCountry();
  }, [user, open]);

  const numericAmount = parseInt(amount) || 0;
  const isValidAmount = numericAmount >= 1000 && numericAmount <= (wallet?.balance || 0);
  const isValidPhone = /^\d{10}$/.test(mobileNumber);
  const phonesMatch = mobileNumber === mobileNumberConfirm;

  const handleSubmit = async () => {
    if (!wallet || !isValidAmount || !mobileProvider || !isValidPhone || !phonesMatch) return;

    await requestMobileMoneyWithdrawal(wallet.id, numericAmount, {
      mobile_provider: mobileProvider,
      mobile_number: `${userPhoneCode}${mobileNumber}`,
    });

    onOpenChange(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setAmount("");
    setMobileProvider("");
    setMobileNumber("");
    setMobileNumberConfirm("");
  };

  const canSubmit = isValidAmount && mobileProvider && isValidPhone && phonesMatch;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-gold" />
            Retirer des fonds
          </SheetTitle>
          <SheetDescription>
            Solde disponible: {formatCurrency(wallet?.balance || 0)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(85vh-220px)]">
          {/* Amount */}
          <div className="space-y-2">
            <Label>Montant à retirer *</Label>
            <Input
              type="number"
              placeholder="10000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold bg-muted/30"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: 1 000 FCFA | Maximum: {formatCurrency(wallet?.balance || 0)}
            </p>
            {numericAmount > (wallet?.balance || 0) && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                Montant supérieur au solde disponible
              </div>
            )}
          </div>

          <Separator />

          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>Méthode de retrait *</Label>
            <div className="grid grid-cols-2 gap-3">
              {mobileProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setMobileProvider(provider.id)}
                  className={`glass rounded-xl p-4 transition-all ${
                    mobileProvider === provider.id
                      ? "ring-2 ring-gold"
                      : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {provider.logo}
                    <span className="text-sm font-semibold">{provider.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number */}
          {mobileProvider && (
            <div className="space-y-3">
              {/* Country info */}
              {userCountry && (
                <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3">
                  <ShieldAlert className="w-4 h-4 text-gold shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Le numéro doit correspondre à votre pays d'inscription : <span className="font-semibold text-foreground">{userFlag} {userCountry}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  Numéro {mobileProvider === "wave" ? "Wave" : "Orange Money"} *
                </Label>
                <div className="flex gap-2">
                  <div className="w-24 h-10 bg-muted/50 border border-border rounded-xl px-3 flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                    {userFlag} {userPhoneCode || "+--"}
                  </div>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="07 00 00 00 00"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    className="bg-muted/30"
                  />
                </div>
                {mobileNumber && !isValidPhone && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Le numéro doit contenir exactement 10 chiffres
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Confirmer le numéro *</Label>
                <div className="flex gap-2">
                  <div className="w-24 h-10 bg-muted/50 border border-border rounded-xl px-3 flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
                    {userFlag} {userPhoneCode || "+--"}
                  </div>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Retapez le numéro"
                    value={mobileNumberConfirm}
                    onChange={(e) => setMobileNumberConfirm(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    className="bg-muted/30"
                  />
                </div>
                {mobileNumberConfirm && !phonesMatch && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Les numéros ne correspondent pas
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-xs font-medium text-foreground">
                Délai de traitement : 2 jours ouvrables
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Votre demande sera vérifiée et le dépôt sera effectué sur votre compte
              {mobileProvider === "wave" ? " Wave" : mobileProvider === "orange" ? " Orange Money" : ""} sous 2 jours ouvrables.
              Vous recevrez une notification une fois le transfert effectué.
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <ArrowUpRight className="w-5 h-5 mr-2" />
            )}
            Demander le retrait
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WithdrawalSheet;
