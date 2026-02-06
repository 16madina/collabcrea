import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  phoneCode: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const PhoneInput = ({ phoneCode, value, onChange, error }: PhoneInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const cleaned = e.target.value.replace(/\D/g, "");
    onChange(cleaned);
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="w-24 h-14 bg-muted/50 border border-border rounded-xl px-4 flex items-center justify-center text-muted-foreground font-medium">
          {phoneCode || "+--"}
        </div>
        <Input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder="Numéro de téléphone"
          className={cn(
            "flex-1 h-14 bg-muted/50 border rounded-xl px-4",
            error ? "border-destructive" : "border-border focus:border-gold"
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        🔒 Votre numéro restera privé et ne sera jamais partagé.
      </p>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
};

export default PhoneInput;
