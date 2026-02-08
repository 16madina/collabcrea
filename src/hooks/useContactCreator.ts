import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ContactResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

export const useContactCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isContacting, setIsContacting] = useState(false);

  const contactCreator = async (
    creatorId: string,
    creatorName: string,
    message?: string
  ): Promise<ContactResult> => {
    if (!user) {
      toast.error("Vous devez être connecté pour contacter un créateur");
      navigate("/auth?role=brand");
      return { success: false, error: "Not authenticated" };
    }

    if (user.id === creatorId) {
      toast.error("Vous ne pouvez pas vous contacter vous-même");
      return { success: false, error: "Cannot contact yourself" };
    }

    setIsContacting(true);

    try {
      // Check if conversation already exists between these two users
      const { data: existingParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (existingParticipations && existingParticipations.length > 0) {
        const conversationIds = existingParticipations.map(p => p.conversation_id);
        
        // Check if creator is also in any of these conversations
        const { data: creatorParticipations } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", creatorId)
          .in("conversation_id", conversationIds);

        if (creatorParticipations && creatorParticipations.length > 0) {
          // Conversation exists, redirect to messages
          toast.info("Vous avez déjà une conversation avec ce créateur");
          navigate("/messages");
          return { success: true, conversationId: creatorParticipations[0].conversation_id };
        }
      }

      // Create new conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          created_by: user.id,
          subject: `Contact avec ${creatorName}`,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add both participants
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: creatorId },
        ]);

      if (partError) throw partError;

      // Send initial message if provided
      if (message) {
        await supabase.from("messages").insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          content: message,
        });
      }

      toast.success("Conversation créée !");
      navigate("/messages");
      
      return { success: true, conversationId: conversation.id };
    } catch (error: any) {
      console.error("Error contacting creator:", error);
      toast.error("Erreur lors de la création de la conversation");
      return { success: false, error: error.message };
    } finally {
      setIsContacting(false);
    }
  };

  return { contactCreator, isContacting };
};
