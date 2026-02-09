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
import authBackground from "@/assets/auth-background.jpg";
import AvatarUpload from "@/components/auth/AvatarUpload";
import CountrySelect from "@/components/auth/CountrySelect";
import PhoneInput from "@/components/auth/PhoneInput";
import SocialNetworkSelector from "@/components/auth/SocialNetworkSelector";
import { worldCountries, africanCountries, getPhoneCodeByCountry } from "@/data/countries";

type UserRole = "creator" | "brand";
type AuthMode = "choice" | "login" | "signup";

// Steps: 1=Photo+Names, 2=Countries+Phone, 3=Role+Socials, 3.5=Brand Info (if brand), 4=Credentials
type SignupStep = 1 | 2 | 3 | 3.5 | 4;

// Validation schemas
const emailSchema = z.string().email("Email invalide").max(255);
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100);
const nameSchema = z.string().min(2, "Minimum 2 caractères").max(50);
const phoneSchema = z.string().min(6, "Numéro invalide").max(15);
const companyNameSchema = z.string().min(2, "Minimum 2 caractères").max(100);
const websiteSchema = z.string().url("URL invalide").max(255).optional().or(z.literal(""));
const descriptionSchema = z.string().min(10, "Minimum 10 caractères").max(500);

// Brand sectors
const BRAND_SECTORS = [
  "Beauté & Cosmétiques",
  "Mode & Accessoires",
  "Tech & Électronique",
  "Food & Boissons",
  "Sport & Fitness",
  "Lifestyle & Maison",
  "Finance & Assurance",
  "Santé & Bien-être",
  "Éducation & Formation",
  "Tourisme & Voyage",
  "Automobile",
  "Divertissement & Média",
  "Autre",
];

// Collaboration types
const COLLABORATION_TYPES = [
  { id: "sponsored_post", label: "Post sponsorisé" },
  { id: "ambassador", label: "Ambassadeur" },
  { id: "event", label: "Événement" },
  { id: "product_review", label: "Test produit" },
  { id: "giveaway", label: "Jeu concours" },
  { id: "content_creation", label: "Création de contenu" },
];

// Creator categories brands are looking for
const CREATOR_CATEGORIES = [
  "Beauté",
  "Mode",
  "Cuisine",
  "Humour",
  "Tech",
  "Lifestyle",
  "Fitness",
  "Musique",
  "Business",
  "Éducation",
];

// Brand social networks
const BRAND_SOCIAL_NETWORKS = [
  { id: "instagram", name: "Instagram", placeholder: "@votrecompte" },
  { id: "facebook", name: "Facebook", placeholder: "votrepagefacebook" },
  { id: "tiktok", name: "TikTok", placeholder: "@votrecompte" },
];

// Helper function to normalize website URLs
const normalizeWebsiteUrl = (url: string): string => {
  if (!url || url.trim() === "") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface BrandSocialNetworks {
  instagram: string;
  facebook: string;
  tiktok: string;
}

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
  // Brand-specific fields
  companyName: string;
  sector: string;
  website: string;
  collaborationTypes: string[];
  targetCategories: string[];
  companyDescription: string;
  brandSocialNetworks: BrandSocialNetworks;
  selectedBrandSocials: string[];
  // Credentials
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
  // Brand-specific
  companyName: "",
  sector: "",
  website: "",
  collaborationTypes: [],
  targetCategories: [],
  companyDescription: "",
  brandSocialNetworks: { instagram: "", facebook: "", tiktok: "" },
  selectedBrandSocials: [],
  // Credentials
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const Auth = () => {
  const navigate = useNavigate();
  const { user, role: userRole, loading: authLoading, signIn } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("choice");
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
      navigate(userRole === "creator" ? "/creator/profile" : "/brand/profile");
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

    // Brand-specific validation (step 3.5)
    if (currentStep === 3.5) {
      try {
        companyNameSchema.parse(formData.companyName);
      } catch {
        newErrors.companyName = "Nom de l'entreprise invalide";
      }
      if (!formData.sector) {
        newErrors.sector = "Sélectionnez votre secteur d'activité";
      }
      // Website validation removed - we accept any format and normalize it
      if (formData.collaborationTypes.length === 0) {
        newErrors.collaborationTypes = "Sélectionnez au moins un type de collaboration";
      }
      if (formData.targetCategories.length === 0) {
        newErrors.targetCategories = "Sélectionnez au moins une catégorie";
      }
      try {
        descriptionSchema.parse(formData.companyDescription);
      } catch {
        newErrors.companyDescription = "Description trop courte (min 10 caractères)";
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

  const getNextStep = (currentStep: SignupStep): SignupStep => {
    if (currentStep === 3 && formData.role === "brand") {
      return 3.5;
    }
    if (currentStep === 3 && formData.role === "creator") {
      return 4;
    }
    if (currentStep === 3.5) {
      return 4;
    }
    return Math.min(currentStep + 1, 4) as SignupStep;
  };

  const getPrevStep = (currentStep: SignupStep): SignupStep => {
    if (currentStep === 4 && formData.role === "brand") {
      return 3.5;
    }
    if (currentStep === 3.5) {
      return 3;
    }
    return Math.max(currentStep - 1, 1) as SignupStep;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(getNextStep(step));
    }
  };

  const handleBack = () => {
    if (step > 1 && mode === "signup") {
      setStep(getPrevStep(step));
    } else if (mode === "login" || mode === "signup") {
      setMode("choice");
      setFormData(initialFormData);
      setStep(1);
    } else {
      navigate("/");
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

        // For creators, use origin country (African country) as main display country
        // For brands, use residence country
        const displayCountry = formData.role === "creator" 
          ? (originCountry?.name || formData.originCountry)
          : (residenceCountry?.name || formData.residenceCountry);

        // Create profile with all info
        const profileInsertData: {
          user_id: string;
          full_name: string;
          avatar_url: string | null;
          country: string;
          residence_country: string | null;
          company_name: string | null;
          sector: string | null;
          website: string | null;
          company_description: string | null;
          pricing: unknown;
        } = {
          user_id: data.user.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          avatar_url: avatarUrl,
          country: displayCountry,
          // Creator-specific fields
          residence_country: formData.role === "creator" 
            ? (residenceCountry?.name || formData.residenceCountry)
            : null,
          // Brand-specific fields
          company_name: formData.role === "brand" ? formData.companyName : null,
          sector: formData.role === "brand" ? formData.sector : null,
          website: formData.role === "brand" && formData.website ? normalizeWebsiteUrl(formData.website) : null,
          company_description: formData.role === "brand" ? formData.companyDescription : null,
          // Store collaboration types, target categories and brand socials as JSON in pricing field for brands
          pricing: formData.role === "brand" 
            ? {
                collaboration_types: formData.collaborationTypes,
                target_categories: formData.targetCategories,
                brand_socials: formData.brandSocialNetworks,
              }
            : [],
        };

        const { error: profileError } = await supabase.from("profiles").insert(profileInsertData as any);

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
          description: "Bienvenue sur CollabCréa !",
        });

        // Reset form
        setFormData(initialFormData);
        setStep(1);
        
        // Redirect user to their dashboard based on role
        const redirectPath = formData.role === "brand" ? "/brand/profile" : "/creator/profile";
        navigate(redirectPath);
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
        className="px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-2 flex items-center gap-4"
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
          {mode === "choice" ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center gap-8 py-12 relative"
            >
              {/* Background image */}
              <div className="absolute inset-0 -mx-6 -my-12 overflow-hidden">
                <img 
                  src={authBackground} 
                  alt="" 
                  className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
              </div>
              <motion.img 
                src={logoCollabCrea} 
                alt="CollabCréa" 
                className="h-20 md:h-24 w-auto relative z-10 drop-shadow-[0_0_15px_hsla(43,72%,53%,0.5)]"
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
              />
              <motion.div 
                className="text-center space-y-2 relative z-10"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <h1 className="text-2xl font-bold text-foreground drop-shadow-lg">Bienvenue sur CollabCréa</h1>
                <p className="text-foreground/80 drop-shadow-md">La plateforme de collaboration créative en Afrique</p>
              </motion.div>
              <motion.div 
                className="w-full max-w-sm space-y-4 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Button 
                  onClick={() => setMode("login")}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-6 text-lg rounded-xl"
                >
                  Se connecter
                </Button>
                <Button 
                  onClick={() => setMode("signup")}
                  variant="outline"
                  className="w-full border-gold/50 text-gold hover:bg-gold/10 font-semibold py-6 text-lg rounded-xl"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Créer un compte
                </Button>
              </motion.div>
            </motion.div>
          ) : mode === "login" ? (
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

    <div className="mt-4 text-center">
      <Link
        to="/forgot-password"
        className="text-muted-foreground text-sm hover:text-gold"
      >
        Mot de passe oublié ?
      </Link>
    </div>

    <div className="mt-4 text-center">
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
    {/* Progress indicator - Show 4 steps for creators, 5 for brands */}
    <div className="flex justify-center gap-2 mb-6">
      {(formData.role === "brand" ? [1, 2, 3, 3.5, 4] : [1, 2, 3, 4]).map((s) => {
        const isCurrentStep = s === step;
        const isPastStep = formData.role === "brand" 
          ? (s < step || (s === 3 && step === 3.5) || (s === 3.5 && step === 4) || (s === 3 && step === 4))
          : s < step;
        return (
          <div
            key={s}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isCurrentStep ? "bg-gold" : isPastStep ? "bg-gold/50" : "bg-muted"
            }`}
          />
        );
      })}
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
        {step === 3.5 && (
          <StepBrandInfo
            key="step3.5"
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
      {step !== 4 ? (
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

// Step 3.5: Brand Information (only for brands)
interface StepBrandInfoProps {
  formData: SignupFormData;
  updateFormData: <K extends keyof SignupFormData>(field: K, value: SignupFormData[K]) => void;
  errors: Partial<Record<keyof SignupFormData, string>>;
}

const StepBrandInfo = ({ formData, updateFormData, errors }: StepBrandInfoProps) => {
  const toggleCollaborationType = (typeId: string) => {
    const current = formData.collaborationTypes;
    if (current.includes(typeId)) {
      updateFormData("collaborationTypes", current.filter(t => t !== typeId));
    } else {
      updateFormData("collaborationTypes", [...current, typeId]);
    }
  };

  const toggleTargetCategory = (category: string) => {
    const current = formData.targetCategories;
    if (current.includes(category)) {
      updateFormData("targetCategories", current.filter(c => c !== category));
    } else {
      updateFormData("targetCategories", [...current, category]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="text-center mb-4">
        <h2 className="font-display text-2xl font-bold mb-2">Votre entreprise</h2>
        <p className="text-muted-foreground text-sm">Parlez-nous de votre marque</p>
      </div>

      {/* Company Name */}
      <div className="space-y-2">
        <Label>Nom de l'entreprise *</Label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={formData.companyName}
            onChange={(e) => updateFormData("companyName", e.target.value)}
            placeholder="Votre entreprise"
            className={`h-14 bg-muted/50 border rounded-xl pl-12 ${errors.companyName ? "border-destructive" : "border-border focus:border-gold"}`}
          />
        </div>
        {errors.companyName && <p className="text-destructive text-xs">{errors.companyName}</p>}
      </div>

      {/* Sector */}
      <div className="space-y-2">
        <Label>Secteur d'activité *</Label>
        <select
          value={formData.sector}
          onChange={(e) => updateFormData("sector", e.target.value)}
          className={`w-full h-14 bg-muted/50 border rounded-xl px-4 text-foreground ${errors.sector ? "border-destructive" : "border-border focus:border-gold"}`}
        >
          <option value="">Sélectionnez un secteur</option>
          {BRAND_SECTORS.map((sector) => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
        {errors.sector && <p className="text-destructive text-xs">{errors.sector}</p>}
      </div>

      {/* Website */}
      <div className="space-y-2">
        <Label>Site web (optionnel)</Label>
        <Input
          value={formData.website}
          onChange={(e) => updateFormData("website", e.target.value)}
          placeholder="votresite.com"
          className="h-14 bg-muted/50 border rounded-xl px-4 border-border focus:border-gold"
        />
        <p className="text-xs text-muted-foreground">
          Vous pouvez entrer votre URL avec ou sans https://
        </p>
      </div>

      {/* Brand Social Networks */}
      <div className="space-y-3">
        <Label>Vos réseaux sociaux (optionnel)</Label>
        <p className="text-xs text-muted-foreground">Cochez les réseaux sur lesquels vous êtes présent</p>
        <div className="space-y-3">
          {BRAND_SOCIAL_NETWORKS.map((network) => {
            const isSelected = (formData.selectedBrandSocials || []).includes(network.id);
            const socialValue = formData.brandSocialNetworks?.[network.id as keyof BrandSocialNetworks] || "";
            
            return (
              <div key={network.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`brand-social-${network.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const current = formData.selectedBrandSocials || [];
                      if (checked) {
                        updateFormData("selectedBrandSocials", [...current, network.id]);
                      } else {
                        updateFormData("selectedBrandSocials", current.filter(id => id !== network.id));
                        // Clear the value when unchecked
                        updateFormData("brandSocialNetworks", {
                          ...formData.brandSocialNetworks,
                          [network.id]: "",
                        });
                      }
                    }}
                    className="border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                  />
                  <label
                    htmlFor={`brand-social-${network.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {network.name}
                  </label>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Input
                      value={socialValue}
                      onChange={(e) => updateFormData("brandSocialNetworks", {
                        ...formData.brandSocialNetworks,
                        [network.id]: e.target.value,
                      })}
                      placeholder={network.placeholder}
                      className="h-12 bg-muted/50 border rounded-xl px-4 border-border focus:border-gold"
                    />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Collaboration Types */}
      <div className="space-y-2">
        <Label>Types de collaboration recherchés *</Label>
        <div className="flex flex-wrap gap-2">
          {COLLABORATION_TYPES.map((type) => {
            const isSelected = (formData.collaborationTypes || []).includes(type.id);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleCollaborationType(type.id)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-gold text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {isSelected && (
                  <Check className="w-3 h-3 inline mr-1" />
                )}
                {type.label}
              </button>
            );
          })}
        </div>
        {errors.collaborationTypes && <p className="text-destructive text-xs">{errors.collaborationTypes}</p>}
      </div>

      {/* Target Categories */}
      <div className="space-y-2">
        <Label>Catégories de créateurs recherchées *</Label>
        <div className="flex flex-wrap gap-2">
          {CREATOR_CATEGORIES.map((category) => {
            const isSelected = (formData.targetCategories || []).includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleTargetCategory(category)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {isSelected && (
                  <Check className="w-3 h-3 inline mr-1" />
                )}
                {category}
              </button>
            );
          })}
        </div>
        {errors.targetCategories && <p className="text-destructive text-xs">{errors.targetCategories}</p>}
      </div>

      {/* Company Description */}
      <div className="space-y-2">
        <Label>Description de votre entreprise *</Label>
        <textarea
          value={formData.companyDescription || ""}
          onChange={(e) => updateFormData("companyDescription", e.target.value)}
          placeholder="Décrivez brièvement votre activité et vos valeurs (2-3 phrases)"
          rows={3}
          className={`w-full bg-muted/50 border rounded-xl p-4 text-foreground resize-none ${errors.companyDescription ? "border-destructive" : "border-border focus:border-gold"}`}
        />
        <p className="text-xs text-muted-foreground">{(formData.companyDescription || "").length}/500 caractères</p>
        {errors.companyDescription && <p className="text-destructive text-xs">{errors.companyDescription}</p>}
      </div>
    </motion.div>
  );
};

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
