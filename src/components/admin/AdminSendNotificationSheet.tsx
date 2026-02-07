import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
}

interface AdminSendNotificationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const AdminSendNotificationSheet = ({
  open,
  onOpenChange,
  userId,
  userName,
}: AdminSendNotificationSheetProps) => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("name");

      if (!error && data) {
        setTemplates(data);
      }
    };

    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setMessage(template.message);
      setType(template.type);
    }
  };

  const handleSend = async () => {
    if (!currentUser || !title.trim() || !message.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: userId,
        title,
        message,
        type,
        created_by: currentUser.id,
      });

      if (error) throw error;

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "notification",
        target_user_id: userId,
        details: { title, message, type },
      });

      toast({
        title: "Notification envoyée",
        description: `La notification a été envoyée à ${userName}.`,
      });

      onOpenChange(false);
      setTitle("");
      setMessage("");
      setType("info");
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold" />
            Envoyer une notification à {userName}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 overflow-y-auto pb-4">
          {/* Template Selector */}
          <div className="space-y-2">
            <Label>Modèle prédéfini (optionnel)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un modèle..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input
              placeholder="Titre de la notification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message *</Label>
            <Textarea
              placeholder="Contenu de la notification..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="success">Succès</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={handleSend}
            disabled={!title.trim() || !message.trim() || isLoading}
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? "Envoi..." : "Envoyer la notification"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdminSendNotificationSheet;
