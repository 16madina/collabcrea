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
import { Loader2, ArrowUpRight, AlertCircle, Clock, ShieldAlert, Globe } from "lucide-react";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { useAuth } from "@/hooks/useAuth";
import { Wallet } from "@/hooks/useWallet";
import { worldCountries } from "@/data/countries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Phone number rules per country (local number length, without country code)
const phoneRulesByCountry: Record<string, { lengths: number[]; hint: string }> = {
  "Côte d'Ivoire": { lengths: [10], hint: "10 chiffres (ex: 07 08 09 10 11)" },
  "Sénégal": { lengths: [9], hint: "9 chiffres (ex: 77 123 45 67)" },
  "Cameroun": { lengths: [9], hint: "9 chiffres (ex: 6 99 99 99 99)" },
  "Mali": { lengths: [8], hint: "8 chiffres" },
  "Burkina Faso": { lengths: [8], hint: "8 chiffres" },
  "Guinée": { lengths: [9], hint: "9 chiffres" },
  "Bénin": { lengths: [8], hint: "8 chiffres" },
  "Togo": { lengths: [8], hint: "8 chiffres" },
  "Niger": { lengths: [8], hint: "8 chiffres" },
  "Congo": { lengths: [9], hint: "9 chiffres" },
  "RD Congo": { lengths: [9], hint: "9 chiffres" },
  "RDC": { lengths: [9], hint: "9 chiffres" },
  "Gabon": { lengths: [7, 8], hint: "7 ou 8 chiffres" },
  "Tchad": { lengths: [8], hint: "8 chiffres" },
  "Madagascar": { lengths: [9], hint: "9 chiffres" },
  "Ghana": { lengths: [9], hint: "9 chiffres" },
  "Nigeria": { lengths: [10], hint: "10 chiffres" },
  "Kenya": { lengths: [9], hint: "9 chiffres" },
};

// Exchange rates FCFA -> target currency (approximate)
const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1 / 656,
  USD: 1 / 610,
};

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
  {
    id: "mtn",
    name: "MTN MoMo",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <rect width="40" height="40" rx="10" fill="#FFCC00" />
        <text x="20" y="26" textAnchor="middle" fontWeight="bold" fontSize="14" fill="#003087">MTN</text>
      </svg>
    ),
  },
  {
    id: "moov",
    name: "Moov Money",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <rect width="40" height="40" rx="10" fill="#0066B3" />
        <text x="20" y="26" textAnchor="middle" fontWeight="bold" fontSize="10" fill="white">MOOV</text>
      </svg>
    ),
  },
  {
    id: "free",
    name: "Free Money",
    logo: (
      <svg viewBox="0 0 40 40" className="w-10 h-10">
        <rect width="40" height="40" rx="10" fill="#CD1719" />
        <text x="20" y="26" textAnchor="middle" fontWeight="bold" fontSize="10" fill="white">FREE</text>
      </svg>
    ),
  },
];

type WithdrawalMethod = "mobile_money" | "paypal";

const WithdrawalSheet = ({
  open,
  onOpenChange,
  wallet,
  onSuccess,
}: WithdrawalSheetProps) => {
  const { user } = useAuth();
  const { loading, requestMobileMoneyWithdrawal, requestPayPalWithdrawal } = useWithdrawal();

  const [withdrawalMethod, setWithdrawalMethod] = useState<WithdrawalMethod>("mobile_money");
  const [amount, setAmount] = useState("");
  const [mobileProvider, setMobileProvider] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileNumberConfirm, setMobileNumberConfirm] = useState("");
  const [userCountry, setUserCountry] = useState("");
  const [userPhoneCode, setUserPhoneCode] = useState("");
  const [userFlag, setUserFlag] = useState("");

  // PayPal fields
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalEmailConfirm, setPaypalEmailConfirm] = useState("");
  const [paypalCurrency, setPaypalCurrency] = useState<"EUR" | "USD">("EUR");

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
  const minAmount = withdrawalMethod === "paypal" ? 3000 : 1000;
  const isValidAmount = numericAmount >= minAmount && numericAmount <= (wallet?.balance || 0);

  // Mobile money validation
  const phoneRules = phoneRulesByCountry[userCountry];
  const maxPhoneLength = phoneRules ? Math.max(...phoneRules.lengths) : 10;
  const isValidPhone = phoneRules
    ? phoneRules.lengths.includes(mobileNumber.length) && /^\d+$/.test(mobileNumber)
    : mobileNumber.length >= 7 && mobileNumber.length <= 10 && /^\d+$/.test(mobileNumber);
  const phonesMatch = mobileNumber === mobileNumberConfirm;
  const phoneHint = phoneRules?.hint || "7 à 10 chiffres";
  const selectedProvider = mobileProviders.find((p) => p.id === mobileProvider);

  // PayPal validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidPaypalEmail = emailRegex.test(paypalEmail);
  const paypalEmailsMatch = paypalEmail === paypalEmailConfirm;

  // PayPal conversion estimate
  const paypalRate = EXCHANGE_RATES[paypalCurrency] || EXCHANGE_RATES.EUR;
  const paypalGrossAmount = numericAmount * paypalRate;
  const paypalFee = paypalGrossAmount * 0.02;
  const paypalNetAmount = paypalGrossAmount - paypalFee;

  const canSubmitMobile = isValidAmount && mobileProvider && isValidPhone && phonesMatch;
  const canSubmitPaypal = isValidAmount && isValidPaypalEmail && paypalEmailsMatch;
  const canSubmit = withdrawalMethod === "paypal" ? canSubmitPaypal : canSubmitMobile;

  const handleSubmit = async () => {
    if (!wallet || !canSubmit) return;

    if (withdrawalMethod === "paypal") {
      await requestPayPalWithdrawal(wallet.id, numericAmount, {
        paypal_email: paypalEmail,
        payout_currency: paypalCurrency,
      });
    } else {
      if (!isValidPhone && mobileNumber) {
        toast.error(`Numéro invalide. Format attendu : ${phoneHint}`);
        return;
      }
      if (!phonesMatch && mobileNumberConfirm) {
        toast.error("Les numéros ne correspondent pas");
        return;
      }
      await requestMobileMoneyWithdrawal(wallet.id, numericAmount, {
        mobile_provider: mobileProvider,
        mobile_number: `${userPhoneCode}${mobileNumber}`,
      });
    }

    onOpenChange(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setAmount("");
    setMobileProvider("");
    setMobileNumber("");
    setMobileNumberConfirm("");
    setPaypalEmail("");
    setPaypalEmailConfirm("");
    setPaypalCurrency("EUR");
  };

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
          {/* Withdrawal Method Selection */}
          <div className="space-y-2">
            <Label>Type de retrait</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWithdrawalMethod("mobile_money")}
                className={`glass rounded-xl p-3 transition-all text-left ${
                  withdrawalMethod === "mobile_money" ? "ring-2 ring-gold" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" />
                    <line x1="12" y1="18" x2="12" y2="18.01" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold">Mobile Money</p>
                    <p className="text-[10px] text-muted-foreground">Wave, Orange, MTN...</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setWithdrawalMethod("paypal")}
                className={`glass rounded-xl p-3 transition-all text-left ${
                  withdrawalMethod === "paypal" ? "ring-2 ring-[#0070BA]" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 40 40" className="w-5 h-5">
                    <rect width="40" height="40" rx="10" fill="#0070BA" />
                    <text x="20" y="26" textAnchor="middle" fontWeight="bold" fontSize="10" fill="white">PP</text>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold">PayPal</p>
                    <p className="text-[10px] text-muted-foreground">EUR ou USD</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <Separator />

          {/* Amount */}
          <div className="space-y-2">
            <Label>Montant à retirer (FCFA) *</Label>
            <Input
              type="number"
              placeholder={minAmount.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg font-semibold bg-muted/30"
            />
            <p className="text-xs text-muted-foreground">
              Minimum: {new Intl.NumberFormat("fr-FR").format(minAmount)} FCFA | Maximum: {formatCurrency(wallet?.balance || 0)}
            </p>

            {/* Fee breakdown */}
            {numericAmount >= minAmount && (
              <div className="glass rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Montant demandé</span>
                  <span>{formatCurrency(numericAmount)}</span>
                </div>

                {withdrawalMethod === "paypal" ? (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Conversion → {paypalCurrency}</span>
                      <span>{paypalGrossAmount.toFixed(2)} {paypalCurrency}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Frais PayPal (2%)</span>
                      <span className="text-destructive">-{paypalFee.toFixed(2)} {paypalCurrency}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Vous recevrez environ</span>
                      <span className="text-[#0070BA]">{paypalNetAmount.toFixed(2)} {paypalCurrency}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Taux indicatif : 1 {paypalCurrency} ≈ {Math.round(1 / paypalRate)} FCFA. Le taux réel peut varier.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Frais de retrait (~2%)</span>
                      <span className="text-destructive">-{formatCurrency(Math.round(numericAmount * 0.02))}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Vous recevrez environ</span>
                      <span className="text-gold">{formatCurrency(numericAmount - Math.round(numericAmount * 0.02))}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Les frais exacts dépendent de l'opérateur et du pays
                    </p>
                  </>
                )}
              </div>
            )}

            {numericAmount > (wallet?.balance || 0) && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="w-3 h-3" />
                Montant supérieur au solde disponible
              </div>
            )}
          </div>

          <Separator />

          {/* METHOD-SPECIFIC FIELDS */}
          {withdrawalMethod === "mobile_money" && (
            <>
              {/* Provider Selection */}
              <div className="space-y-3">
                <Label>Opérateur *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {mobileProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setMobileProvider(provider.id)}
                      className={`glass rounded-xl p-3 transition-all relative ${
                        mobileProvider === provider.id ? "ring-2 ring-gold" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        {provider.logo}
                        <span className="text-[10px] font-semibold leading-tight">{provider.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
              {mobileProvider && (
                <div className="space-y-3">
                  {userCountry && (
                    <div className="flex items-center gap-2 bg-muted/30 rounded-xl p-3">
                      <ShieldAlert className="w-4 h-4 text-gold shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Le numéro doit correspondre à votre pays d'inscription : <span className="font-semibold text-foreground">{userFlag} {userCountry}</span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Numéro {selectedProvider?.name || "Mobile Money"} *</Label>
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
                        maxLength={maxPhoneLength}
                        className="bg-muted/30"
                      />
                    </div>
                    {mobileNumber && !isValidPhone && (
                      <div className="flex items-center gap-2 text-destructive text-xs">
                        <AlertCircle className="w-3 h-3" />
                        Format attendu : {phoneHint}
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
                        maxLength={maxPhoneLength}
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
            </>
          )}

          {withdrawalMethod === "paypal" && (
            <div className="space-y-4">
              {/* Currency selection */}
              <div className="space-y-2">
                <Label>Devise de réception *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["EUR", "USD"] as const).map((cur) => (
                    <button
                      key={cur}
                      onClick={() => setPaypalCurrency(cur)}
                      className={`glass rounded-xl p-3 transition-all ${
                        paypalCurrency === cur ? "ring-2 ring-[#0070BA]" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">{cur === "EUR" ? "€ Euro" : "$ Dollar US"}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* PayPal email */}
              <div className="space-y-2">
                <Label>Email PayPal *</Label>
                <Input
                  type="email"
                  placeholder="votre-email@example.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value.trim())}
                  className="bg-muted/30"
                />
                {paypalEmail && !isValidPaypalEmail && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Format d'email invalide
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Confirmer l'email PayPal *</Label>
                <Input
                  type="email"
                  placeholder="Retapez votre email PayPal"
                  value={paypalEmailConfirm}
                  onChange={(e) => setPaypalEmailConfirm(e.target.value.trim())}
                  className="bg-muted/30"
                />
                {paypalEmailConfirm && !paypalEmailsMatch && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertCircle className="w-3 h-3" />
                    Les emails ne correspondent pas
                  </div>
                )}
              </div>

              {/* PayPal info notice */}
              <div className="bg-[#0070BA]/10 rounded-xl p-3 space-y-1">
                <p className="text-xs font-medium text-[#0070BA]">
                  ℹ️ Informations PayPal
                </p>
                <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>Le paiement sera envoyé à l'adresse email PayPal indiquée</li>
                  <li>Frais PayPal de 2% déduits du montant reçu</li>
                  <li>Taux de change indicatif, le taux réel peut légèrement varier</li>
                  <li>Minimum : 3 000 FCFA (~5 {paypalCurrency})</li>
                </ul>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="glass rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <p className="text-xs font-medium text-foreground">
                Délai de traitement : jusqu'à 24h ouvrables
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Votre demande sera vérifiée et le {withdrawalMethod === "paypal" ? "virement PayPal" : "dépôt"} sera effectué. Vous recevrez une notification une fois le transfert effectué.
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
            {withdrawalMethod === "paypal" 
              ? `Retirer via PayPal (${paypalNetAmount > 0 ? paypalNetAmount.toFixed(2) : "0"} ${paypalCurrency})`
              : "Demander le retrait"
            }
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default WithdrawalSheet;
