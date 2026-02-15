import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Returns the total count of items needing attention in the Collabs tab:
 * - Unread messages
 * - Collaborations pending action (pending_payment for brands, new collabs for creators)
 */
export const useCollabsBadgeCount = () => {
  const { user, role } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    if (!user) {
      setCount(0);
      return;
    }

    try {
      // 1. Count unread messages
      const { data: participations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      let unreadMessages = 0;
      if (participations && participations.length > 0) {
        const conversationIds = participations.map((p) => p.conversation_id);
        const { count: msgCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .neq("sender_id", user.id)
          .is("read_at", null);
        unreadMessages = msgCount || 0;
      }

      // 2. Count collaborations needing action
      let pendingCollabs = 0;
      if (role === "brand") {
        // Brand: pending_payment or content_submitted need action
        const { count: collabCount } = await supabase
          .from("collaborations")
          .select("*", { count: "exact", head: true })
          .eq("brand_id", user.id)
          .in("status", ["pending_payment", "content_submitted"]);
        pendingCollabs = collabCount || 0;
      } else if (role === "creator") {
        // Creator: in_progress or revision_requested need action
        const { count: collabCount } = await supabase
          .from("collaborations")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", user.id)
          .in("status", ["in_progress", "revision_requested"]);
        pendingCollabs = collabCount || 0;
      }

      setCount(unreadMessages + pendingCollabs);
    } catch (error) {
      console.error("Error fetching collabs badge count:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }

    fetchCount();

    // Subscribe to changes
    const channel = supabase
      .channel(`collabs-badge:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchCount())
      .on("postgres_changes", { event: "*", schema: "public", table: "collaborations" }, () => fetchCount())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  return count;
};
