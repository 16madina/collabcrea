import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, MessageCircle, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@collabor.africa",
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "+225 07 00 00 00 00",
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: "Abidjan, Côte d'Ivoire",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success("Message envoyé avec succès !", {
      description: "Nous vous répondrons dans les plus brefs délais.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-2">
            Contact
          </h1>
          <p className="text-muted-foreground text-sm">
            Une question ? Contactez-nous !
          </p>
        </motion.div>
      </div>

      {/* Contact Info Cards */}
      <div className="px-6 mt-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid gap-3"
        >
          {contactInfo.map((info, index) => (
            <motion.div
              key={info.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="glass-card p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                <info.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{info.label}</p>
                <p className="font-medium text-foreground">{info.value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Contact Form */}
      <div className="px-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-lg font-bold mb-4">
            Envoyez-nous un <span className="text-gold-gradient">message</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Nom
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Votre nom"
                  className="h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="votre@email.com"
                  className="h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Sujet
              </label>
              <Input
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Sujet de votre message"
                className="h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Message
              </label>
              <Textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Écrivez votre message ici..."
                className="min-h-[120px] bg-muted/50 border-border focus:border-gold rounded-xl resize-none"
                required
              />
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le message
                </>
              )}
            </Button>
          </form>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="px-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-gold" />
            <h3 className="font-semibold">Questions fréquentes</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Consultez notre FAQ pour trouver des réponses rapides à vos questions.
          </p>
          <Button variant="glass-gold" size="sm" className="mt-3 w-full">
            Voir la FAQ
          </Button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Contact;
