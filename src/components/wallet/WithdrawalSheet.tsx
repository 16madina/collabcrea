import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowUpRight,
  Building2,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { Wallet } from "@/hooks/useWallet";

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
  { id: "orange", name: "Orange Money", color: "bg-orange-500" },
  { id: "mtn", name: "MTN Mobile Money", color: "bg-yellow-500" },
  { id: "wave", name: "Wave", color: "bg-blue-500" },
  { id: "moov", name: "Moov Money", color: "bg-cyan-500" },
];

const banks = [
  "Ecobank",
  "UBA",
  "Société Générale",
  "Bank of Africa",
  "BICICI",
  "NSIA Banque",
  "Coris Bank",
  "Orabank",
  "Autre",
];

const WithdrawalSheet = ({
  open,
  onOpenChange,
  wallet,
  onSuccess,
}: WithdrawalSheetProps) => {
  const { loading, requestBankWithdrawal, requestMobileMoneyWithdrawal } =
    useWithdrawal();

  const [method, setMethod] = useState<"bank" | "mobile_money">("mobile_money");
  const [amount, setAmount] = useState("");

  // Bank details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // Mobile money details
  const [mobileProvider, setMobileProvider] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const numericAmount = parseInt(amount) || 0;
  const isValidAmount = numericAmount >= 1000 && numericAmount <= (wallet?.balance || 0);

  const handleSubmit = async () => {
    if (!wallet || !isValidAmount) return;

    if (method === "bank") {
      if (!bankName || !accountNumber || !accountHolder) return;
      await requestBankWithdrawal(wallet.id, numericAmount, {
        bank_name: bankName,
        account_number: accountNumber,
        account_holder: accountHolder,
      });
    } else {
      if (!mobileProvider || !mobileNumber) return;
      await requestMobileMoneyWithdrawal(wallet.id, numericAmount, {
        mobile_provider: mobileProvider,
        mobile_number: mobileNumber,
      });
    }

    onOpenChange(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setAmount("");
    setBankName("");
    setAccountNumber("");
    setAccountHolder("");
    setMobileProvider("");
    setMobileNumber("");
  };

  const canSubmit =
    isValidAmount &&
    (method === "bank"
      ? bankName && accountNumber && accountHolder
      : mobileProvider && mobileNumber);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-xl font-display flex items-center gap-2">
            <ArrowUpRight className="w-6 h-6 text-gold" />
            Retirer des fonds
          </SheetTitle>
          <SheetDescription>
            Solde disponible: {formatCurrency(wallet?.balance || 0)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
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

          {/* Method Selection */}
          <div className="space-y-3">
            <Label>Méthode de retrait</Label>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as "bank" | "mobile_money")}
              className="flex gap-3"
            >
              <div
                className={`flex-1 glass rounded-xl p-4 cursor-pointer transition-all ${
                  method === "mobile_money" ? "ring-2 ring-gold" : ""
                }`}
                onClick={() => setMethod("mobile_money")}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="cursor-pointer flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gold" />
                    Mobile Money
                  </Label>
                </div>
              </div>
              <div
                className={`flex-1 glass rounded-xl p-4 cursor-pointer transition-all ${
                  method === "bank" ? "ring-2 ring-gold" : ""
                }`}
                onClick={() => setMethod("bank")}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="bank" id="bank" />
                  <Label htmlFor="bank" className="cursor-pointer flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gold" />
                    Virement
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Mobile Money Form */}
          {method === "mobile_money" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Opérateur *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {mobileProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setMobileProvider(provider.id)}
                      className={`glass rounded-xl p-3 text-left transition-all ${
                        mobileProvider === provider.id
                          ? "ring-2 ring-gold"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${provider.color}`} />
                        <span className="text-sm font-medium">{provider.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Numéro de téléphone *</Label>
                <Input
                  type="tel"
                  placeholder="07 00 00 00 00"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
            </div>
          )}

          {/* Bank Form */}
          {method === "bank" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Banque *</Label>
                <Select value={bankName} onValueChange={setBankName}>
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Sélectionnez votre banque" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Numéro de compte / IBAN *</Label>
                <Input
                  placeholder="XX00 0000 0000 0000 0000 0000"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="bg-muted/30"
                />
              </div>

              <div className="space-y-2">
                <Label>Titulaire du compte *</Label>
                <Input
                  placeholder="Nom complet"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="bg-muted/30"
                />
              </div>
            </div>
          )}

          {/* Info */}
          <div className="glass rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              Les retraits sont traités sous 24-48h ouvrées. Vous recevrez une
              notification une fois le transfert effectué.
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
