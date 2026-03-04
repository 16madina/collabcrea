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
  publication_url: string | null;
  created_at: string;
  updated_at: string;
  preview_viewed_at: string | null;
  // Joined data
  offer?: {
    id: string;
    title: string;
    category: string;
    content_type: string;
    logo_url: string | null;
    delivery_mode?: string;
    presence_mode?: string;
    filming_by?: string;
    creative_brief?: {
      phone?: string;
      address?: string;
      hashtags?: string;
      mentions?: string;
    };
  };
  creator?: {
    full_name: string;
    avatar_url: string | null;
  };
  brand?: {
    company_name: string | null;
    logo_url: string | null;
  };
  selected_slot?: {
    date: string;
    start_time: string;
    end_time: string;
  } | null;
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

  // Subscribe to realtime collaboration updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`collaborations:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collaborations",
        },
        () => {
          fetchCollaborations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchCollaborations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("collaborations")
        .select(`
          *,
          offer:offers(id, title, category, content_type, logo_url, delivery_mode, presence_mode, filming_by, creative_brief)
        `)
        .or(`creator_id.eq.${user.id},brand_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each collaboration
      const collabsWithProfiles = await Promise.all(
        (data || []).map(async (collab) => {
          const [creatorRes, brandRes, applicationRes] = await Promise.all([
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
            collab.conversation_id
              ? supabase
                  .from("applications")
                  .select("selected_slot")
                  .eq("conversation_id", collab.conversation_id)
                  .maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...collab,
            creator: creatorRes.data,
            brand: brandRes.data,
            selected_slot: applicationRes.data?.selected_slot as Collaboration["selected_slot"],
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
    const safeAgreedAmount = Math.max(200, Math.round(agreedAmount));
    const platformFee = Math.round(safeAgreedAmount * PLATFORM_FEE_PERCENTAGE);
    const creatorAmount = safeAgreedAmount - platformFee;

    try {
      const { data, error } = await supabase
        .from("collaborations")
        .insert({
          offer_id: offerId,
          creator_id: creatorId,
          brand_id: brandId,
          agreed_amount: safeAgreedAmount,
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ collaborationId, feedback }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de l'approbation");
      }

      if (result.status === "pending_publication") {
        toast.success("Aperçu approuvé ! Le créateur doit maintenant publier sur ses réseaux.");
      } else {
        toast.success("Contenu approuvé ! Le paiement a été libéré au créateur.");
      }
      fetchCollaborations();
    } catch (error) {
      console.error("Error approving content:", error);
      toast.error("Erreur lors de l'approbation");
      throw error;
    }
  };

  // Creator approves content in "brand films" mode
  const creatorApproveContent = async (collaborationId: string, feedback?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ collaborationId, feedback, mode: "creator_approve" }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de la validation");
      }

      toast.success("Contenu validé ! Le paiement a été libéré.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error creator approving content:", error);
      toast.error("Erreur lors de la validation");
      throw error;
    }
  };

  // Submit publication link (network mode - step 2: creator publishes and submits link)
  const submitPublicationLink = async (collaborationId: string, publicationUrl: string) => {
    try {
      const { error } = await supabase
        .from("collaborations")
        .update({
          publication_url: publicationUrl,
          status: "publication_submitted",
        } as any)
        .eq("id", collaborationId);

      if (error) throw error;

      toast.success("Lien de publication soumis ! La marque va vérifier.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error submitting publication link:", error);
      toast.error("Erreur lors de la soumission du lien");
      throw error;
    }
  };

  // Verify publication link with AI
  const verifyPublicationLink = async (collaborationId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-publication-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ collaboration_id: collaborationId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur de vérification");
      }

      return await response.json();
    } catch (error) {
      console.error("Error verifying publication link:", error);
      throw error;
    }
  };

  // Approve publication (network mode - final step: brand verifies link → payment)
  const approvePublication = async (collaborationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ collaborationId, mode: "approve_publication" }),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de la validation");
      }

      toast.success("Publication vérifiée ! Le paiement a été libéré au créateur.");
      fetchCollaborations();
    } catch (error) {
      console.error("Error approving publication:", error);
      toast.error("Erreur lors de la validation");
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
    creatorApproveContent,
    submitPublicationLink,
    approvePublication,
    verifyPublicationLink,
    refreshCollaborations: fetchCollaborations,
  };
};
