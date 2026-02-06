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

    setIsApplying(true);

    try {
      // Check if already applied
      const { data: existingApplication } = await supabase
        .from("applications")
        .select("id, conversation_id")
        .eq("offer_id", offerId)
        .eq("creator_id", user.id)
        .single();

      if (existingApplication) {
        // Already applied, redirect to existing conversation
        if (existingApplication.conversation_id) {
          toast.info("Vous avez déjà postulé à cette offre");
          navigate("/messages");
          return { success: true, conversationId: existingApplication.conversation_id };
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
      navigate("/messages");
      
      return { success: true, conversationId: conversation.id };
    } catch (error: any) {
      console.error("Error applying to offer:", error);
      toast.error("Erreur lors de la candidature");
      return { success: false, error: error.message };
    } finally {
      setIsApplying(false);
    }
  };

  return { applyToOffer, isApplying };
};
