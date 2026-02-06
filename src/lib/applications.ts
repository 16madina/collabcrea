import { supabase } from "@/integrations/supabase/client";

interface ApplyToOfferParams {
  offerId: string;
  creatorId: string;
  brandId: string;
  offerTitle: string;
  message?: string;
}

export const applyToOffer = async ({
  offerId,
  creatorId,
  brandId,
  offerTitle,
  message,
}: ApplyToOfferParams): Promise<{ conversationId: string | null; error: Error | null }> => {
  try {
    // Check if already applied
    const { data: existingApplication } = await supabase
      .from("applications")
      .select("id, conversation_id")
      .eq("offer_id", offerId)
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (existingApplication) {
      return {
        conversationId: existingApplication.conversation_id,
        error: new Error("Vous avez déjà postulé à cette offre"),
      };
    }

    // Create conversation first
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        subject: `Candidature: ${offerTitle}`,
        created_by: creatorId,
        offer_id: offerId,
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add both participants to the conversation
    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conversation.id, user_id: creatorId },
        { conversation_id: conversation.id, user_id: brandId },
      ]);

    if (partError) throw partError;

    // Create the application
    const { error: appError } = await supabase.from("applications").insert({
      offer_id: offerId,
      creator_id: creatorId,
      conversation_id: conversation.id,
      message: message,
      status: "pending",
    });

    if (appError) throw appError;

    // Send initial message
    const initialMessage = message || `Bonjour ! Je suis intéressé(e) par votre offre "${offerTitle}". J'aimerais en discuter avec vous.`;
    
    const { error: msgError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: creatorId,
      content: initialMessage,
    });

    if (msgError) throw msgError;

    return { conversationId: conversation.id, error: null };
  } catch (error) {
    console.error("Error applying to offer:", error);
    return { conversationId: null, error: error as Error };
  }
};

export const getApplicationStatus = async (
  offerId: string,
  creatorId: string
): Promise<{ applied: boolean; conversationId: string | null }> => {
  try {
    const { data } = await supabase
      .from("applications")
      .select("id, conversation_id")
      .eq("offer_id", offerId)
      .eq("creator_id", creatorId)
      .maybeSingle();

    return {
      applied: !!data,
      conversationId: data?.conversation_id || null,
    };
  } catch (error) {
    console.error("Error checking application status:", error);
    return { applied: false, conversationId: null };
  }
};
