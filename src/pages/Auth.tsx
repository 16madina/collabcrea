import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  ArrowRight,
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Loader2,
  User,
  Building2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import logoCollabCrea from "@/assets/logo-collabcrea.png";
import AvatarUpload from "@/components/auth/AvatarUpload";
import CountrySelect from "@/components/auth/CountrySelect";
import PhoneInput from "@/components/auth/PhoneInput";
import SocialNetworkSelector from "@/components/auth/SocialNetworkSelector";
import { worldCountries, africanCountries, getPhoneCodeByCountry } from "@/data/countries";

type UserRole = "creator" | "brand";
type AuthMode = "login" | "signup";

// Steps: 1=Photo+Names, 2=Countries+Phone, 3=Role+Socials, 4=Credentials
type SignupStep = 1 | 2 | 3 | 4;

// Validation schemas
const emailSchema = z.string().email("Email invalide").max(255);
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100);
const nameSchema = z.string().min(2, "Minimum 2 caractères").max(50);
const phoneSchema = z.string().min(6, "Numéro invalide").max(15);

interface SignupFormData {
  avatarFile: File | null;
  avatarPreview: string | null;
  firstName: string;
  lastName: string;
  residenceCountry: string;
  originCountry: string;
  phone: string;
  role: UserRole | null;
  socialNetworks: string[];
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const initialFormData: SignupFormData = {
  avatarFile: null,
  avatarPreview: null,
  firstName: "",
  lastName: "",
  residenceCountry: "",
  originCountry: "",
  phone: "",
  role: null,
  socialNetworks: [],
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const Auth = () => {
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading, signIn } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("signup");
  const [step, setStep] = useState<SignupStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SignupFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  const phoneCode = getPhoneCodeByCountry(formData.residenceCountry);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userRole) {
      navigate(userRole === "creator" ? "/creator/dashboard" : "/brand/dashboard");
    }
  }, [user, userRole, authLoading, navigate]);

  const updateFormData = <K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (currentStep: SignupStep): boolean => {
    const newErrors: Partial<Record<keyof SignupFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.avatarPreview) {
        newErrors.avatarFile = "La photo de profil est obligatoire";
      }
      try {
        nameSchema.parse(formData.firstName);
      } catch {
        newErrors.firstName = "Prénom invalide (min 2 caractères)";
      }
      try {
        nameSchema.parse(formData.lastName);
      } catch {
        newErrors.lastName = "Nom invalide (min 2 caractères)";
      }
    }

    if (currentStep === 2) {
      if (!formData.residenceCountry) {
        newErrors.residenceCountry = "Sélectionnez votre pays de résidence";
      }
      if (!formData.originCountry) {
        newErrors.originCountry = "Sélectionnez votre pays d'origine";
      }
      try {
        phoneSchema.parse(formData.phone);
      } catch {
        newErrors.phone = "Numéro de téléphone invalide";
      }
    }

    if (currentStep === 3) {
      if (!formData.role) {
        newErrors.role = "Sélectionnez votre profil";
      }
      if (formData.role === "creator" && formData.socialNetworks.length === 0) {
        newErrors.socialNetworks = "Sélectionnez au moins un réseau social";
      }
    }

    if (currentStep === 4) {
      try {
        emailSchema.parse(formData.email);
      } catch {
        newErrors.email = "Email invalide";
      }
      try {
        passwordSchema.parse(formData.password);
      } catch {
        newErrors.password = "Minimum 6 caractères";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      }
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = "Vous devez accepter les conditions";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4) as SignupStep);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as SignupStep);
    } else if (mode === "login") {
      navigate("/");
    } else {
      setMode("login");
      setFormData(initialFormData);
      setStep(1);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!formData.avatarFile) return null;

    const fileExt = formData.avatarFile.name.split(".").pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, formData.avatarFile, { upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSignup = async () => {
    if (!validateStep(4) || !formData.role) return;

    setIsSubmitting(true);

    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Upload avatar
        const avatarUrl = await uploadAvatar(data.user.id);

        // Get country names
        const residenceCountry = worldCountries.find(c => c.code === formData.residenceCountry);
        const originCountry = africanCountries.find(c => c.code === formData.originCountry);

        // Create profile with all info
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          avatar_url: avatarUrl,
          country: residenceCountry?.name || formData.residenceCountry,
        });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }

        // Assign role
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: data.user.id,
          role: formData.role,
        });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }

        toast.success("Compte créé avec succès !", {
          description: "Vérifiez votre email pour confirmer votre inscription.",
        });

        // Reset form
        setFormData(initialFormData);
        setStep(1);
        setMode("login");
      }
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(error.message || "Une erreur est survenue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(loginEmail);
    } catch {
      newErrors.email = "Email invalide";
    }

    try {
      passwordSchema.parse(loginPassword);
    } catch {
      newErrors.password = "Minimum 6 caractères";
    }

    setLoginErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const { error } = await signIn(loginEmail, loginPassword);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Connexion réussie !");
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-2 pb-2 flex items-center gap-4"
      >
        <button
          onClick={handleBack}
          className="touch-target rounded-full glass p-2"
        >
          <ArrowLeft className="w-5 h-5 text-gold" />
        </button>
        <Link to="/" className="flex items-center">
          <img 
            src={logoCollabCrea} 
            alt="CollabCréa" 
            className="h-10 md:h-12 w-auto"
          />
        </Link>
      </motion.header>

      <div className="flex-1 flex flex-col px-6 pb-8 safe-bottom overflow-y-auto">
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <LoginForm
              key="login"
              email={loginEmail}
              setEmail={setLoginEmail}
              password={loginPassword}
              setPassword={setLoginPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              errors={loginErrors}
              isSubmitting={isSubmitting}
              onSubmit={handleLogin}
              onSwitchToSignup={() => setMode("signup")}
            />
          ) : (
            <SignupForm
              key="signup"
              step={step}
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              phoneCode={phoneCode}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              isSubmitting={isSubmitting}
              onNext={handleNext}
              onBack={handleBack}
              onSubmit={handleSignup}
              onSwitchToLogin={() => {
                setMode("login");
                setFormData(initialFormData);
                setStep(1);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Login Form Component
interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  errors: { email?: string; password?: string };
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToSignup: () => void;
}

const LoginForm = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  errors,
  isSubmitting,
  onSubmit,
  onSwitchToSignup,
}: LoginFormProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex-1 flex flex-col justify-center"
  >
    <div className="text-center mb-8">
      <h2 className="font-display text-2xl font-bold mb-2">Connexion</h2>
      <p className="text-muted-foreground text-sm">
        Heureux de vous revoir !
      </p>
    </div>

    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className={`h-14 bg-muted/50 border-border focus:border-gold rounded-xl pl-12 ${errors.email ? "border-destructive" : ""}`}
          />
        </div>
        {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`h-14 bg-muted/50 border-border focus:border-gold rounded-xl pl-12 pr-12 ${errors.password ? "border-destructive" : ""}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full mt-6" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement...
          </>
        ) : (
          <>
            Se connecter
            <Sparkles className="w-5 h-5" />
          </>
        )}
      </Button>
    </form>

    <div className="mt-6 text-center">
      <p className="text-muted-foreground text-sm">
        Pas encore de compte ?{" "}
        <button onClick={onSwitchToSignup} className="text-gold font-medium hover:underline">
          S'inscrire
        </button>
      </p>
    </div>
  </motion.div>
);

// Signup Form Component
interface SignupFormProps {
  step: SignupStep;
  formData: SignupFormData;
  updateFormData: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
  phoneCode: string;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
  isSubmitting: boolean;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onSwitchToLogin: () => void;
}

const SignupForm = ({
  step,
  formData,
  updateFormData,
  errors,
  phoneCode,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  isSubmitting,
  onNext,
  onBack,
  onSubmit,
  onSwitchToLogin,
}: SignupFormProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="flex-1 flex flex-col"
  >
    {/* Progress indicator */}
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            s === step ? "bg-gold" : s < step ? "bg-gold/50" : "bg-muted"
          }`}
        />
      ))}
    </div>

    <div className="flex-1 flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepOne
            key="step1"
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {step === 2 && (
          <StepTwo
            key="step2"
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            phoneCode={phoneCode}
          />
        )}
        {step === 3 && (
          <StepThree
            key="step3"
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {step === 4 && (
          <StepFour
            key="step4"
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
          />
        )}
      </AnimatePresence>
    </div>

    <div className="mt-6 space-y-4">
      {step < 4 ? (
        <Button onClick={onNext} variant="gold" size="lg" className="w-full">
          Continuer
          <ArrowRight className="w-5 h-5" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          variant="gold"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Création...
            </>
          ) : (
            <>
              Créer mon compte
              <Sparkles className="w-5 h-5" />
            </>
          )}
        </Button>
      )}

      <p className="text-center text-muted-foreground text-sm">
        Déjà un compte ?{" "}
        <button onClick={onSwitchToLogin} className="text-gold font-medium hover:underline">
          Se connecter
        </button>
      </p>
    </div>
  </motion.div>
);

// Step 1: Photo + Names
interface StepOneProps {
  formData: SignupFormData;
  updateFormData: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
}

const StepOne = ({ formData, updateFormData, errors }: StepOneProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-4">
      <h2 className="font-display text-2xl font-bold mb-2">Créer un compte</h2>
      <p className="text-muted-foreground text-sm">Commençons par votre profil</p>
    </div>

    <AvatarUpload
      value={formData.avatarPreview}
      onChange={(file, preview) => {
        updateFormData("avatarFile", file);
        updateFormData("avatarPreview", preview);
      }}
      error={errors.avatarFile}
    />

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Prénom *</Label>
        <Input
          value={formData.firstName}
          onChange={(e) => updateFormData("firstName", e.target.value)}
          placeholder="Votre prénom"
          className={`h-14 bg-muted/50 border rounded-xl px-4 ${errors.firstName ? "border-destructive" : "border-border focus:border-gold"}`}
        />
        {errors.firstName && <p className="text-destructive text-xs">{errors.firstName}</p>}
      </div>
      <div className="space-y-2">
        <Label>Nom *</Label>
        <Input
          value={formData.lastName}
          onChange={(e) => updateFormData("lastName", e.target.value)}
          placeholder="Votre nom"
          className={`h-14 bg-muted/50 border rounded-xl px-4 ${errors.lastName ? "border-destructive" : "border-border focus:border-gold"}`}
        />
        {errors.lastName && <p className="text-destructive text-xs">{errors.lastName}</p>}
      </div>
    </div>
  </motion.div>
);

// Step 2: Countries + Phone
interface StepTwoProps {
  formData: SignupFormData;
  updateFormData: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
  phoneCode: string;
}

const StepTwo = ({ formData, updateFormData, errors, phoneCode }: StepTwoProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-4">
      <h2 className="font-display text-2xl font-bold mb-2">Localisation</h2>
      <p className="text-muted-foreground text-sm">D'où venez-vous ?</p>
    </div>

    <div className="space-y-2">
      <Label>Pays de résidence *</Label>
      <CountrySelect
        countries={worldCountries}
        value={formData.residenceCountry}
        onChange={(code) => updateFormData("residenceCountry", code)}
        placeholder="Sélectionnez votre pays de résidence"
        error={errors.residenceCountry}
        showPhoneCode
      />
      {errors.residenceCountry && (
        <p className="text-destructive text-xs">{errors.residenceCountry}</p>
      )}
    </div>

    <div className="space-y-2">
      <Label>Pays d'origine (Afrique) *</Label>
      <CountrySelect
        countries={africanCountries}
        value={formData.originCountry}
        onChange={(code) => updateFormData("originCountry", code)}
        placeholder="Sélectionnez votre pays d'origine"
        error={errors.originCountry}
      />
      {errors.originCountry && (
        <p className="text-destructive text-xs">{errors.originCountry}</p>
      )}
    </div>

    <div className="space-y-2">
      <Label>Numéro de téléphone *</Label>
      <PhoneInput
        phoneCode={phoneCode}
        value={formData.phone}
        onChange={(v) => updateFormData("phone", v)}
        error={errors.phone}
      />
    </div>
  </motion.div>
);

// Step 3: Role + Social Networks
interface StepThreeProps {
  formData: SignupFormData;
  updateFormData: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
}

const StepThree = ({ formData, updateFormData, errors }: StepThreeProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-6"
  >
    <div className="text-center mb-4">
      <h2 className="font-display text-2xl font-bold mb-2">Votre profil</h2>
      <p className="text-muted-foreground text-sm">Êtes-vous créateur ou marque ?</p>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        onClick={() => updateFormData("role", "creator")}
        className={`p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
          formData.role === "creator"
            ? "border-gold bg-gold/10"
            : "border-border hover:border-gold/50"
        }`}
      >
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          formData.role === "creator" ? "bg-gold/20" : "bg-muted"
        }`}>
          <User className={`w-7 h-7 ${formData.role === "creator" ? "text-gold" : "text-muted-foreground"}`} />
        </div>
        <div className="text-center">
          <p className={`font-semibold ${formData.role === "creator" ? "text-gold" : ""}`}>
            Créateur
          </p>
          <p className="text-xs text-muted-foreground">Influenceur, artiste</p>
        </div>
        {formData.role === "creator" && (
          <Check className="w-5 h-5 text-gold" />
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          updateFormData("role", "brand");
          updateFormData("socialNetworks", []);
        }}
        className={`p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
          formData.role === "brand"
            ? "border-gold bg-gold/10"
            : "border-border hover:border-gold/50"
        }`}
      >
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
          formData.role === "brand" ? "bg-gold/20" : "bg-muted"
        }`}>
          <Building2 className={`w-7 h-7 ${formData.role === "brand" ? "text-gold" : "text-muted-foreground"}`} />
        </div>
        <div className="text-center">
          <p className={`font-semibold ${formData.role === "brand" ? "text-gold" : ""}`}>
            Marque
          </p>
          <p className="text-xs text-muted-foreground">Entreprise, agence</p>
        </div>
        {formData.role === "brand" && (
          <Check className="w-5 h-5 text-gold" />
        )}
      </button>
    </div>
    {errors.role && <p className="text-destructive text-xs text-center">{errors.role}</p>}

    {formData.role === "creator" && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
      >
        <SocialNetworkSelector
          value={formData.socialNetworks}
          onChange={(networks) => updateFormData("socialNetworks", networks)}
          error={errors.socialNetworks}
        />
      </motion.div>
    )}
  </motion.div>
);

// Step 4: Credentials
interface StepFourProps {
  formData: SignupFormData;
  updateFormData: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}

const StepFour = ({
  formData,
  updateFormData,
  errors,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: StepFourProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="space-y-4"
  >
    <div className="text-center mb-4">
      <h2 className="font-display text-2xl font-bold mb-2">Dernière étape</h2>
      <p className="text-muted-foreground text-sm">Créez vos identifiants</p>
    </div>

    <div className="space-y-2">
      <Label>Email *</Label>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          placeholder="vous@exemple.com"
          className={`h-14 bg-muted/50 border rounded-xl pl-12 ${errors.email ? "border-destructive" : "border-border focus:border-gold"}`}
        />
      </div>
      {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
    </div>

    <div className="space-y-2">
      <Label>Mot de passe *</Label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type={showPassword ? "text" : "password"}
          value={formData.password}
          onChange={(e) => updateFormData("password", e.target.value)}
          placeholder="••••••••"
          className={`h-14 bg-muted/50 border rounded-xl pl-12 pr-12 ${errors.password ? "border-destructive" : "border-border focus:border-gold"}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
    </div>

    <div className="space-y-2">
      <Label>Confirmer le mot de passe *</Label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type={showConfirmPassword ? "text" : "password"}
          value={formData.confirmPassword}
          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
          placeholder="••••••••"
          className={`h-14 bg-muted/50 border rounded-xl pl-12 pr-12 ${errors.confirmPassword ? "border-destructive" : "border-border focus:border-gold"}`}
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        >
          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {errors.confirmPassword && (
        <p className="text-destructive text-xs">{errors.confirmPassword}</p>
      )}
    </div>

    <div className="flex items-start gap-3 pt-2">
      <Checkbox
        id="terms"
        checked={formData.acceptTerms}
        onCheckedChange={(checked) => updateFormData("acceptTerms", checked as boolean)}
        className={errors.acceptTerms ? "border-destructive" : ""}
      />
      <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
        J'accepte les{" "}
        <Link to="/terms" className="text-gold hover:underline">
          conditions d'utilisation
        </Link>{" "}
        et la{" "}
        <Link to="/privacy" className="text-gold hover:underline">
          politique de confidentialité
        </Link>
      </label>
    </div>
    {errors.acceptTerms && (
      <p className="text-destructive text-xs">{errors.acceptTerms}</p>
    )}
  </motion.div>
);

export default Auth;
