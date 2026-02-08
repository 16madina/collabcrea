import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ArrowLeft, MoreVertical, Phone, Video, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
  other_participant: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface MessagesTabProps {
  userRole: "creator" | "brand";
}

const MessagesTab = ({ userRole }: MessagesTabProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data: participations, error: partError } = await supabase
          .from("conversation_participants")
          .select(`
            conversation_id,
            conversations (
              id,
              subject,
              created_at,
              updated_at
            )
          `)
          .eq("user_id", user.id);

        if (partError) throw partError;

        if (!participations || participations.length === 0) {
          setConversations([]);
          setLoadingConversations(false);
          return;
        }

        const conversationsWithDetails: Conversation[] = await Promise.all(
          participations.map(async (p) => {
            const conv = p.conversations as any;
            
            const { data: otherParticipants } = await supabase
              .from("conversation_participants")
              .select("user_id")
              .eq("conversation_id", conv.id)
              .neq("user_id", user.id)
              .limit(1);

            const otherParticipant = otherParticipants?.[0];
            let displayName = "Utilisateur";
            let displayAvatar: string | null = null;
            let otherUserId = otherParticipant?.user_id || "";

            if (otherParticipant?.user_id) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, avatar_url, company_name, logo_url")
                .eq("user_id", otherParticipant.user_id)
                .single();

              if (profileData) {
                displayName = profileData.company_name || profileData.full_name || "Utilisateur";
                displayAvatar = profileData.logo_url || profileData.avatar_url;
              }
            }

            const { data: lastMessages } = await supabase
              .from("messages")
              .select("content, created_at, sender_id")
              .eq("conversation_id", conv.id)
              .order("created_at", { ascending: false })
              .limit(1);

            const { count } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", conv.id)
              .neq("sender_id", user.id)
              .is("read_at", null);

            return {
              id: conv.id,
              subject: conv.subject,
              created_at: conv.created_at,
              updated_at: conv.updated_at,
              other_participant: {
                id: otherUserId,
                full_name: displayName,
                avatar_url: displayAvatar,
              },
              last_message: lastMessages?.[0] || null,
              unread_count: count || 0,
            };
          })
        );

        setConversations(conversationsWithDetails.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ));
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", selectedConversation.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Hier";
    } else if (days < 7) {
      return date.toLocaleDateString("fr-FR", { weekday: "short" });
    } else {
      return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.other_participant?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence mode="wait">
      {!selectedConversation ? (
        <motion.div
          key="conversations-list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="pl-12 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
            />
          </div>

          {/* Conversations */}
          <div className="space-y-2">
            {loadingConversations ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Aucune conversation</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Les conversations apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conv)}
                  className="glass-card p-4 cursor-pointer hover:border-gold/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                        {conv.other_participant?.avatar_url ? (
                          <img
                            src={conv.other_participant.avatar_url}
                            alt={conv.other_participant.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gold" />
                        )}
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground truncate">
                          {conv.other_participant?.full_name || "Utilisateur"}
                        </h3>
                        {conv.last_message && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.last_message?.content || conv.subject || "Nouvelle conversation"}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="chat-view"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Chat Header */}
          <div className="safe-top px-4 py-3 glass-card rounded-none border-x-0 border-t-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="touch-target"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>

              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                {selectedConversation.other_participant?.avatar_url ? (
                  <img
                    src={selectedConversation.other_participant.avatar_url}
                    alt={selectedConversation.other_participant.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-gold" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {selectedConversation.other_participant?.full_name || "Utilisateur"}
                </h3>
                <p className="text-xs text-muted-foreground">En ligne</p>
              </div>

              <button className="touch-target">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {loadingMessages ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aucun message</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Envoyez le premier message !
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        isOwn
                          ? "bg-gold text-primary-foreground rounded-br-md"
                          : "glass rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="safe-bottom px-4 py-3 glass-card rounded-none border-x-0 border-b-0">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Écrivez votre message..."
                className="flex-1 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
              />
              <Button
                onClick={sendMessage}
                variant="gold"
                size="icon"
                className="h-12 w-12 rounded-xl"
                disabled={!newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessagesTab;