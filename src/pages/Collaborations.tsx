import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  CreditCard,
  Eye,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import { useCollaborations, Collaboration } from "@/hooks/useCollaborations";
import { useAuth } from "@/hooks/useAuth";
import SubmitContentSheet from "@/components/collaboration/SubmitContentSheet";
import PaymentSheet from "@/components/collaboration/PaymentSheet";
import ReviewContentSheet from "@/components/collaboration/ReviewContentSheet";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending_payment":
      return <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">En attente de paiement</Badge>;
    case "in_progress":
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">En cours</Badge>;
    case "content_submitted":
      return <Badge variant="secondary" className="bg-purple-500/20 text-purple-500">Contenu soumis</Badge>;
    case "completed":
      return <Badge variant="secondary" className="bg-green-500/20 text-green-500">Terminé</Badge>;
    case "refunded":
      return <Badge variant="secondary" className="bg-red-500/20 text-red-500">Remboursé</Badge>;
    case "expired":
      return <Badge variant="secondary" className="bg-gray-500/20 text-gray-500">Expiré</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const CollaborationsPage = () => {
  const { user, profile } = useAuth();
  const { collaborations, loading, refreshCollaborations } = useCollaborations();
  const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);
  const [sheetType, setSheetType] = useState<"submit" | "payment" | "review" | null>(null);

  // Determine if user is creator or brand
  const [userRole, setUserRole] = useState<"creator" | "brand" | null>(null);

  useEffect(() => {
    if (user && collaborations.length > 0) {
      const isCreator = collaborations.some((c) => c.creator_id === user.id);
      const isBrand = collaborations.some((c) => c.brand_id === user.id);
      setUserRole(isCreator ? "creator" : isBrand ? "brand" : null);
    }
  }, [user, collaborations]);

  const activeCollabs = collaborations.filter((c) =>
    ["pending_payment", "in_progress", "content_submitted"].includes(c.status)
  );
  const completedCollabs = collaborations.filter((c) =>
    ["completed", "refunded", "expired"].includes(c.status)
  );

  const handleAction = (collab: Collaboration) => {
    setSelectedCollab(collab);

    if (!user) return;

    if (collab.brand_id === user.id) {
      // Brand actions
      if (collab.status === "pending_payment") {
        setSheetType("payment");
      } else if (collab.status === "content_submitted") {
        setSheetType("review");
      }
    } else if (collab.creator_id === user.id) {
      // Creator actions
      if (collab.status === "in_progress") {
        setSheetType("submit");
      }
    }
  };

  const renderCollabCard = (collab: Collaboration) => {
    const deadline = parseISO(collab.deadline);
    const daysLeft = differenceInDays(deadline, new Date());
    const isExpired = isPast(deadline);
    const isCreator = user?.id === collab.creator_id;
    const isBrand = user?.id === collab.brand_id;

    return (
      <Card key={collab.id} className="glass overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground line-clamp-1">
                {collab.offer?.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isCreator
                  ? `Marque: ${collab.brand?.company_name || "N/A"}`
                  : `Créateur: ${collab.creator?.full_name || "N/A"}`}
              </p>
            </div>
            {getStatusBadge(collab.status)}
          </div>

          {/* Info Row */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gold">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">
                {formatCurrency(isCreator ? collab.creator_amount : collab.agreed_amount)}
              </span>
            </div>
            <div
              className={`flex items-center gap-1 ${
                isExpired
                  ? "text-destructive"
                  : daysLeft <= 3
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{format(deadline, "dd MMM yyyy", { locale: fr })}</span>
            </div>
          </div>

          {/* Deadline Warning */}
          {collab.status === "in_progress" && isCreator && (
            <div
              className={`rounded-lg p-2 text-xs ${
                isExpired
                  ? "bg-destructive/10 text-destructive"
                  : daysLeft <= 3
                  ? "bg-orange-500/10 text-orange-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {isExpired ? (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Deadline dépassée !
                </span>
              ) : (
                `${daysLeft} jour${daysLeft > 1 ? "s" : ""} pour livrer`
              )}
            </div>
          )}

          {/* Action Button */}
          {collab.status === "pending_payment" && isBrand && (
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => handleAction(collab)}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Effectuer le paiement
            </Button>
          )}

          {collab.status === "in_progress" && isCreator && !isExpired && (
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => handleAction(collab)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Soumettre le contenu
            </Button>
          )}

          {collab.status === "content_submitted" && isBrand && (
            <Button
              variant="gold"
              size="sm"
              className="w-full"
              onClick={() => handleAction(collab)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Valider le contenu
            </Button>
          )}

          {collab.status === "completed" && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              Collaboration terminée
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-gold-gradient">
            Mes Collaborations
          </h1>
          <p className="text-muted-foreground text-sm">
            {collaborations.length} collaboration{collaborations.length > 1 ? "s" : ""}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              En cours ({activeCollabs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Terminées ({completedCollabs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {loading ? (
                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">Chargement...</p>
                  </CardContent>
                </Card>
              ) : activeCollabs.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucune collaboration en cours
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeCollabs.map(renderCollabCard)
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="completed">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {completedCollabs.length === 0 ? (
                <Card className="glass">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucune collaboration terminée
                    </p>
                  </CardContent>
                </Card>
              ) : (
                completedCollabs.map(renderCollabCard)
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sheets */}
      {selectedCollab && sheetType === "submit" && (
        <SubmitContentSheet
          open={true}
          onOpenChange={() => {
            setSelectedCollab(null);
            setSheetType(null);
          }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      {selectedCollab && sheetType === "payment" && (
        <PaymentSheet
          open={true}
          onOpenChange={() => {
            setSelectedCollab(null);
            setSheetType(null);
          }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      {selectedCollab && sheetType === "review" && (
        <ReviewContentSheet
          open={true}
          onOpenChange={() => {
            setSelectedCollab(null);
            setSheetType(null);
          }}
          collaboration={selectedCollab}
          onSuccess={refreshCollaborations}
        />
      )}

      <BottomNav userRole={userRole || "creator"} />
    </div>
  );
};

export default CollaborationsPage;
