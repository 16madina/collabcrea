import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Bell, Plus, Edit, Trash2, Send, Users, Megaphone, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
}

const AdminNotificationsTab = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showBroadcastSheet, setShowBroadcastSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    message: "",
    type: "info",
  });
  const [broadcastData, setBroadcastData] = useState({
    title: "",
    message: "",
    type: "info",
    targetRole: "all",
  });
  const [pushData, setPushData] = useState({
    title: "",
    body: "",
    targetRole: "all",
  });
  const [showPushSheet, setShowPushSheet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_templates")
        .select("*")
        .order("name");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAddTemplate = async () => {
    if (!formData.name || !formData.title || !formData.message) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase.from("notification_templates").insert(formData);
      if (error) throw error;

      toast({
        title: "Modèle créé",
        description: "Le modèle de notification a été créé avec succès.",
      });

      fetchTemplates();
      setShowAddSheet(false);
      setFormData({ name: "", title: "", message: "", type: "info" });
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le modèle",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate || !formData.name || !formData.title || !formData.message) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("notification_templates")
        .update(formData)
        .eq("id", selectedTemplate.id);

      if (error) throw error;

      toast({
        title: "Modèle modifié",
        description: "Le modèle de notification a été modifié avec succès.",
      });

      fetchTemplates();
      setShowEditSheet(false);
      setSelectedTemplate(null);
      setFormData({ name: "", title: "", message: "", type: "info" });
    } catch (error) {
      console.error("Error editing template:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le modèle",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("notification_templates")
        .delete()
        .eq("id", selectedTemplate.id);

      if (error) throw error;

      toast({
        title: "Modèle supprimé",
        description: "Le modèle de notification a été supprimé.",
      });

      fetchTemplates();
      setShowDeleteDialog(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le modèle",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBroadcast = async () => {
    if (!currentUser || !broadcastData.title || !broadcastData.message) return;
    setIsProcessing(true);

    try {
      // Get target users based on role
      let userIds: string[] = [];

      if (broadcastData.targetRole === "all") {
        const { data } = await supabase.from("profiles").select("user_id");
        userIds = data?.map((p) => p.user_id) || [];
      } else {
        const targetRole = broadcastData.targetRole as "creator" | "brand";
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", targetRole);
        userIds = roleData?.map((r) => r.user_id) || [];
      }

      if (userIds.length === 0) {
        toast({
          title: "Aucun destinataire",
          description: "Aucun utilisateur trouvé pour cette cible.",
          variant: "destructive",
        });
        return;
      }

      // Create notifications for all users
      const notifications = userIds.map((userId) => ({
        user_id: userId,
        title: broadcastData.title,
        message: broadcastData.message,
        type: broadcastData.type,
        created_by: currentUser.id,
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) throw error;

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "broadcast_notification",
        details: {
          title: broadcastData.title,
          target: broadcastData.targetRole,
          count: userIds.length,
        },
      });

      toast({
        title: "Notification envoyée",
        description: `La notification a été envoyée à ${userIds.length} utilisateurs.`,
      });

      setShowBroadcastSheet(false);
      setBroadcastData({ title: "", message: "", type: "info", targetRole: "all" });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendPushNotification = async () => {
    if (!currentUser || !pushData.title || !pushData.body) return;
    setIsProcessing(true);

    try {
      // Get target user IDs based on role
      let userIds: string[] = [];

      if (pushData.targetRole === "all") {
        const { data } = await supabase.from("profiles").select("user_id");
        userIds = data?.map((p) => p.user_id) || [];
      } else {
        const targetRole = pushData.targetRole as "creator" | "brand";
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", targetRole);
        userIds = roleData?.map((r) => r.user_id) || [];
      }

      if (userIds.length === 0) {
        toast({
          title: "Aucun destinataire",
          description: "Aucun utilisateur trouvé pour cette cible.",
          variant: "destructive",
        });
        return;
      }

      // Call the edge function to send push notifications
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          user_ids: userIds,
          title: pushData.title,
          body: pushData.body,
          data: { route: "/" },
        },
      });

      if (error) throw error;

      // Log the action
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        action_type: "push_notification",
        details: {
          title: pushData.title,
          target: pushData.targetRole,
          sent: data?.sent || 0,
          failed: data?.failed || 0,
        },
      });

      toast({
        title: "Notifications push envoyées",
        description: `${data?.sent || 0} notifications envoyées, ${data?.failed || 0} échecs.`,
      });

      setShowPushSheet(false);
      setPushData({ title: "", body: "", targetRole: "all" });
    } catch (error) {
      console.error("Error sending push notifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer les notifications push",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditSheet = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      title: template.title,
      message: template.message,
      type: template.type,
    });
    setShowEditSheet(true);
  };

  return (
    <div className="space-y-4">
      {/* Push Notifications Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            Notifications Push (Mobile)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Sheet open={showPushSheet} onOpenChange={setShowPushSheet}>
            <SheetTrigger asChild>
              <Button className="w-full bg-blue-500 hover:bg-blue-600">
                <Smartphone className="w-4 h-4 mr-2" />
                Envoyer une notification push
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl h-[70vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-blue-500" />
                  Notification Push Mobile
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 overflow-y-auto pb-4">
                <div className="space-y-2">
                  <Label>Destinataires</Label>
                  <Select
                    value={pushData.targetRole}
                    onValueChange={(v) => setPushData({ ...pushData, targetRole: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="creator">Créateurs uniquement</SelectItem>
                      <SelectItem value="brand">Marques uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    placeholder="Titre de la notification"
                    value={pushData.title}
                    onChange={(e) => setPushData({ ...pushData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    placeholder="Contenu de la notification..."
                    value={pushData.body}
                    onChange={(e) => setPushData({ ...pushData, body: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    💡 Les notifications push seront envoyées uniquement aux utilisateurs ayant installé l'application mobile et autorisé les notifications.
                  </p>
                </div>
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={handleSendPushNotification}
                  disabled={!pushData.title || !pushData.body || isProcessing}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isProcessing ? "Envoi..." : "Envoyer les notifications push"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {/* Broadcast Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-gold" />
            Diffusion de masse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Sheet open={showBroadcastSheet} onOpenChange={setShowBroadcastSheet}>
            <SheetTrigger asChild>
              <Button variant="gold" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Envoyer une notification à tous
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl h-[80vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-gold" />
                  Notification de masse
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 overflow-y-auto pb-4">
                <div className="space-y-2">
                  <Label>Destinataires</Label>
                  <Select
                    value={broadcastData.targetRole}
                    onValueChange={(v) => setBroadcastData({ ...broadcastData, targetRole: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les utilisateurs</SelectItem>
                      <SelectItem value="creator">Créateurs uniquement</SelectItem>
                      <SelectItem value="brand">Marques uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titre *</Label>
                  <Input
                    placeholder="Titre de la notification"
                    value={broadcastData.title}
                    onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message *</Label>
                  <Textarea
                    placeholder="Contenu de la notification..."
                    value={broadcastData.message}
                    onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={broadcastData.type}
                    onValueChange={(v) => setBroadcastData({ ...broadcastData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information</SelectItem>
                      <SelectItem value="success">Succès</SelectItem>
                      <SelectItem value="warning">Avertissement</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleBroadcast}
                  disabled={!broadcastData.title || !broadcastData.message || isProcessing}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isProcessing ? "Envoi..." : "Envoyer à tous"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {/* Templates Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Modèles de notification
            </CardTitle>
            <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl h-[70vh]">
                <SheetHeader>
                  <SheetTitle>Nouveau modèle</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Nom du modèle *</Label>
                    <Input
                      placeholder="Ex: promotion_noel"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titre *</Label>
                    <Input
                      placeholder="Titre de la notification"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message *</Label>
                    <Textarea
                      placeholder="Contenu de la notification..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="success">Succès</SelectItem>
                        <SelectItem value="warning">Avertissement</SelectItem>
                        <SelectItem value="promotion">Promotion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddTemplate}
                    disabled={!formData.name || !formData.title || !formData.message || isProcessing}
                  >
                    {isProcessing ? "Création..." : "Créer le modèle"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">Aucun modèle</div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 glass rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">{template.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditSheet(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={showEditSheet} onOpenChange={setShowEditSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[70vh]">
          <SheetHeader>
            <SheetTitle>Modifier le modèle</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Nom du modèle *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Succès</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleEditTemplate}
              disabled={!formData.name || !formData.title || !formData.message || isProcessing}
            >
              {isProcessing ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce modèle ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le modèle "{selectedTemplate?.name}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing ? "..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNotificationsTab;
