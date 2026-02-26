import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ApplyResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

export const useApplyToOffer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);

  const applyToOffer = async (
    offerId: string,
    brandId: string,
    message?: string
  ): Promise<ApplyResult> => {
    if (!user) {
      toast.error("Vous devez être connecté pour postuler");
      navigate("/auth");
      return { success: false, error: "Not authenticated" };
    }

    // Check creator identity verification
    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_verified")
      .eq("user_id", user.id)
      .single();

    if (!profile?.identity_verified) {
      toast.error("Vous devez vérifier votre identité avant de postuler", {
        description: "Rendez-vous dans votre profil pour compléter la vérification.",
        action: { label: "Vérifier", onClick: () => navigate("/creator/profile") },
      });
      return { success: false, error: "Identity not verified" };
    }

    setIsApplying(true);

    try {
      // Check if already applied (only block if application is still active/pending/accepted)
      const { data: existingApplications } = await supabase
        .from("applications")
        .select("id, conversation_id, status")
        .eq("offer_id", offerId)
        .eq("creator_id", user.id);

      const activeApplication = existingApplications?.find(
        (app) => app.status === "pending" || app.status === "accepted"
      );

      if (activeApplication) {
        // Already has an active application, redirect to existing conversation
        if (activeApplication.conversation_id) {
          toast.info("Vous avez déjà postulé à cette offre");
          navigate("/creator/collabs?tab=messages");
          return { success: true, conversationId: activeApplication.conversation_id };
        }
        return { success: false, error: "Déjà postulé" };
      }

      // Get offer details for conversation subject
      const { data: offer } = await supabase
        .from("offers")
        .select("title")
        .eq("id", offerId)
        .single();

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          created_by: user.id,
          offer_id: offerId,
          subject: offer?.title || "Nouvelle candidature",
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: brandId },
        ]);

      if (partError) throw partError;

      // Create application
      const { error: appError } = await supabase
        .from("applications")
        .insert({
          offer_id: offerId,
          creator_id: user.id,
          conversation_id: conversation.id,
          message: message || null,
          status: "pending",
        });

      if (appError) throw appError;

      // Send initial message if provided
      if (message) {
        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: message,
        });
      }

      toast.success("Candidature envoyée !");
      navigate("/creator/collabs?tab=messages");
      
      return { success: true, conversationId: conversation.id };
    } catch (error: any) {
      console.error("Error applying to offer:", JSON.stringify(error));
      toast.error("Erreur lors de la candidature", {
        description: error?.message || error?.details || "Erreur inconnue",
      });
      return { success: false, error: error.message };
    } finally {
      setIsApplying(false);
    }
  };

  return { applyToOffer, isApplying };
};
