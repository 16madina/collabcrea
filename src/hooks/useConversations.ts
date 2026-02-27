import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ConversationParticipant {
  user_id: string;
  profile: {
    full_name: string;
    company_name: string | null;
    avatar_url: string | null;
    logo_url: string | null;
  } | null;
}

export interface ConversationMessage {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

export interface Conversation {
  id: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  offer_id: string | null;
  application_id: string | null;
  created_by: string;
  participants: ConversationParticipant[];
  lastMessage: ConversationMessage | null;
  unreadCount: number;
  otherParticipant: ConversationParticipant | null;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all conversations the user participates in
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      // Fetch conversations
      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convError) throw convError;

      // For each conversation, fetch participants and last message
      const enrichedConversations: Conversation[] = await Promise.all(
        (convData || []).map(async (conv) => {
          // Fetch participants with profiles
          const { data: participants } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.id);

          // Fetch profiles for participants
          const participantProfiles: ConversationParticipant[] = await Promise.all(
            (participants || []).map(async (p) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, company_name, avatar_url, logo_url")
                .eq("user_id", p.user_id)
                .single();

              return {
                user_id: p.user_id,
                profile: profile || null,
              };
            })
          );

          // Find the other participant (not current user)
          const otherParticipant = participantProfiles.find(
            (p) => p.user_id !== user.id
          ) || null;

          // Fetch last message
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMessage = messages?.[0] || null;

          // Count unread messages
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .is("read_at", null);

          return {
            ...conv,
            participants: participantProfiles,
            lastMessage,
            unreadCount: count || 0,
            otherParticipant,
          };
        })
      );
      // Sort by most recent message first, fallback to conversation updated_at
      enrichedConversations.sort((a, b) => {
        const dateA = a.lastMessage?.created_at || a.updated_at;
        const dateB = b.lastMessage?.created_at || b.updated_at;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      setConversations(enrichedConversations);
    } catch (err: any) {
      console.error("Error fetching conversations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  // Subscribe to new messages for real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`conversations:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch conversations when messages change
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_participants",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
};
