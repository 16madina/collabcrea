import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  read_at: string | null;
}

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!conversationId || !user) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages = (data || []).filter(
        (m) => m.sender_id !== user.id && !m.read_at
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in(
            "id",
            unreadMessages.map((m) => m.id)
          );
      }
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string): Promise<boolean> => {
    if (!conversationId || !user || !content.trim()) return false;

    try {
      // Check if the other user has blocked us
      const { data: blocked } = await supabase
        .from("blocked_users")
        .select("id")
        .or(`and(blocker_id.eq.${user.id}),and(blocked_id.eq.${user.id})`)
        .limit(1);

      // More precise check - get other participant
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("user_id")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id);

      const otherUserId = participants?.[0]?.user_id;

      if (otherUserId) {
        const { data: blockCheck } = await supabase
          .from("blocked_users")
          .select("id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", otherUserId);

        if (blockCheck && blockCheck.length > 0) {
          setError("Vous avez bloqué cet utilisateur. Débloquez-le pour envoyer un message.");
          return false;
        }
      }

      // Check user verification before sending
      const { data: profile } = await supabase
        .from("profiles")
        .select("identity_verified, email_verified")
        .eq("user_id", user.id)
        .single();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const userRole = roles?.find(r => r.role === "creator" || r.role === "brand")?.role;

      if (userRole === "creator" && !profile?.identity_verified) {
        setError("Vous devez vérifier votre identité pour envoyer des messages.");
        return false;
      }

      if (userRole === "brand" && !profile?.email_verified) {
        setError("Vous devez vérifier votre email pour envoyer des messages.");
        return false;
      }

      const { error: sendError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      });

      if (sendError) throw sendError;

      // Also update conversation's updated_at
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return true;
    } catch (err: any) {
      console.error("Error sending message:", err);
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, user]);

  // Subscribe to new messages in this conversation
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Mark as read if from other user
          if (newMessage.sender_id !== user.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
};
