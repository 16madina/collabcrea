import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Collaboration {
  id: string;
  offer_id: string;
  creator_id: string;
  brand_id: string;
  conversation_id: string | null;
  agreed_amount: number;
  platform_fee: number;
  creator_amount: number;
  status: string;
  deadline: string;
  content_submitted_at: string | null;
  approved_at: string | null;
  auto_approve_at: string | null;
  content_url: string | null;
  content_description: string | null;
  brand_feedback: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  offer?: {
    id: string;
    title: string;
    category: string;
    content_type: string;
    logo_url: string | null;
  };
  creator?: {
    full_name: string;
    avatar_url: string | null;
  };
  brand?: {
    company_name: string | null;
    logo_url: string | null;
  };
}

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

export const useCollaborations = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCollaborations();
    }
  }, [user]);

  const fetchCollaborations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("collaborations")
        .select(`
          *,
          offer:offers(id, title, category, content_type, logo_url)
        `)
        .or(`creator_id.eq.${user.id},brand_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each collaboration
      const collabsWithProfiles = await Promise.all(
        (data || []).map(async (collab) => {
          const [creatorRes, brandRes] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, avatar_url")
              .eq("user_id", collab.creator_id)
              .single(),
            supabase
              .from("profiles")
              .select("company_name, logo_url")
              .eq("user_id", collab.brand_id)
              .single(),
          ]);

          return {
            ...collab,
            creator: creatorRes.data,
            brand: brandRes.data,
          };
        })
      );

      setCollaborations(collabsWithProfiles as Collaboration[]);
    } catch (error) {
      console.error("Error fetching collaborations:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCollaboration = async (
    offerId: string,
    creatorId: string,
    brandId: string,
    agreedAmount: number,
    deadline: string,
    conversationId?: string
  ) => {
    const platformFee = Math.round(agreedAmount * PLATFORM_FEE_PERCENTAGE);
    const creatorAmount = agreedAmount - platformFee;

    try {
      const { data, error } = await supabase
        .from("collaborations")
        .insert({
          offer_id: offerId,
          creator_id: creatorId,
          brand_id: brandId,
          agreed_amount: agreedAmount,
          platform_fee: platformFee,
          creator_amount: creatorAmount,
          deadline: deadline,
          conversation_id: conversationId,
          status: "pending_payment",
        })
        .select()
        .single();

      if (error) throw error;
      
      fetchCollaborations();
      return data;
    } catch (error: any) {
      console.error("Error creating collaboration:", error);
      toast.error("Erreur lors de la création de la collaboration");
      throw error;
    }
  };

  // Simulate payment (will be replaced with real payment later)
  const simulatePayment = async (collaborationId: string) => {
    try {
      // Get collaboration details
      const { data: collab, error: getError } = await supabase
        .from("collaborations")
        .select("*")
        .eq("id", collaborationId)
        .single();

      if (getError) throw getError;

      // Create escrow transaction
      await supabase.from("transactions").insert({
        collaboration_id: collaborationId,
        user_id: collab.brand_id,
        type: "escrow",
        status: "completed",
        amount: collab.agreed_amount,
        fee: collab.platform_fee,
        net_amount: collab.creator_amount,
        description: `Séquestre pour collaboration`,
      });

      // Update collaboration status
      const autoApproveDate = new Date();
      autoApproveDate.setDate(autoApproveDate.getDate() + 7);

      const { error: updateError } = await supabase
        .from("collaborations")
        .update({
          status: "in_progress",
        })
        .eq("id", collaborationId);

      if (updateError) throw updateError;

      toast.success("Paiement effectué ! Le créateur peut maintenant livrer le contenu.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error simulating payment:", error);
      toast.error("Erreur lors du paiement");
      throw error;
    }
  };

  const submitContent = async (
    collaborationId: string,
    contentUrl: string,
    description?: string
  ) => {
    try {
      const autoApproveDate = new Date();
      autoApproveDate.setDate(autoApproveDate.getDate() + 7);

      const { error } = await supabase
        .from("collaborations")
        .update({
          content_url: contentUrl,
          content_description: description,
          content_submitted_at: new Date().toISOString(),
          auto_approve_at: autoApproveDate.toISOString(),
          status: "content_submitted",
        })
        .eq("id", collaborationId);

      if (error) throw error;

      toast.success("Contenu soumis ! La marque a 7 jours pour valider.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error submitting content:", error);
      toast.error("Erreur lors de la soumission");
      throw error;
    }
  };

  const approveContent = async (collaborationId: string, feedback?: string) => {
    try {
      // Get collaboration details
      const { data: collab, error: getError } = await supabase
        .from("collaborations")
        .select("*")
        .eq("id", collaborationId)
        .single();

      if (getError) throw getError;

      // Update collaboration
      const { error: updateError } = await supabase
        .from("collaborations")
        .update({
          status: "completed",
          approved_at: new Date().toISOString(),
          brand_feedback: feedback,
        })
        .eq("id", collaborationId);

      if (updateError) throw updateError;

      // Get or create creator wallet
      let { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", collab.creator_id)
        .maybeSingle();

      if (!wallet) {
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({ user_id: collab.creator_id })
          .select()
          .single();
        wallet = newWallet;
      }

      // Create release transaction
      await supabase.from("transactions").insert({
        collaboration_id: collaborationId,
        wallet_id: wallet?.id,
        user_id: collab.creator_id,
        type: "release",
        status: "completed",
        amount: collab.creator_amount,
        fee: 0,
        net_amount: collab.creator_amount,
        description: `Paiement pour collaboration`,
      });

      // Update wallet balance
      await supabase
        .from("wallets")
        .update({
          balance: (wallet?.balance || 0) + collab.creator_amount,
        })
        .eq("id", wallet?.id);

      toast.success("Contenu approuvé ! Le paiement a été libéré au créateur.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error approving content:", error);
      toast.error("Erreur lors de l'approbation");
      throw error;
    }
  };

  const requestRevision = async (collaborationId: string, feedback: string) => {
    try {
      const { error } = await supabase
        .from("collaborations")
        .update({
          status: "revision_requested",
          brand_feedback: feedback,
          content_submitted_at: null, // Reset so creator can resubmit
          auto_approve_at: null,
        })
        .eq("id", collaborationId);

      if (error) throw error;

      toast.success("Demande de modification envoyée au créateur.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Erreur lors de l'envoi de la demande");
      throw error;
    }
  };

  const refundCollaboration = async (collaborationId: string, reason: string) => {
    try {
      // Get collaboration details
      const { data: collab, error: getError } = await supabase
        .from("collaborations")
        .select("*")
        .eq("id", collaborationId)
        .single();

      if (getError) throw getError;

      // Create refund transaction
      await supabase.from("transactions").insert({
        collaboration_id: collaborationId,
        user_id: collab.brand_id,
        type: "refund",
        status: "completed",
        amount: collab.agreed_amount,
        fee: 0,
        net_amount: collab.agreed_amount,
        description: `Remboursement: ${reason}`,
      });

      // Update collaboration
      const { error: updateError } = await supabase
        .from("collaborations")
        .update({
          status: "refunded",
          brand_feedback: reason,
        })
        .eq("id", collaborationId);

      if (updateError) throw updateError;

      toast.success("Collaboration annulée et remboursée.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error refunding:", error);
      toast.error("Erreur lors du remboursement");
      throw error;
    }
  };

  return {
    collaborations,
    loading,
    createCollaboration,
    simulatePayment,
    submitContent,
    approveContent,
    requestRevision,
    refundCollaboration,
    refreshCollaborations: fetchCollaborations,
  };
};
