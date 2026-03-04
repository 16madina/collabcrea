import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ArrowLeft, Check, CheckCheck, MessageCircle, User } from "lucide-react";
import ChatActionMenu from "@/components/chat/ChatActionMenu";
import ChatProfileSheet from "@/components/chat/ChatProfileSheet";
import CreatorDetailSheet from "@/components/CreatorDetailSheet";
import type { Creator } from "@/components/CreatorDetailSheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConversations, Conversation } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ProposalCard from "@/components/creator/ProposalCard";
import ProposalStatusCard from "@/components/brand/ProposalStatusCard";
import { supabase } from "@/integrations/supabase/client";

interface MessagesTabProps {
  userRole: "creator" | "brand";
}

const MessagesTab = ({ userRole }: MessagesTabProps) => {
  const { user } = useAuth();
  const { conversations, loading: conversationsLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [fullProfileCreator, setFullProfileCreator] = useState<(Creator & { userId: string }) | null>(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading: messagesLoading, sendMessage } = useMessages(
    selectedConversation?.id || null
  );

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.otherParticipant?.profile?.company_name ||
      conv.otherParticipant?.profile?.full_name ||
      "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const handleViewFullProfile = async (userId: string, _role: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (profile) {
      const nameParts = profile.full_name.split(" ");
      setFullProfileCreator({
        userId,
        firstName: profile.company_name || nameParts[0] || "",
        lastName: profile.company_name ? "" : (nameParts.slice(1).join(" ") || ""),
        category: profile.category || profile.sector || "Lifestyle",
        country: profile.country || "Afrique",
        flag: "🌍",
        image: profile.logo_url || profile.avatar_url || "/placeholder.svg",
        bio: profile.bio || profile.company_description || undefined,
        isVerified: profile.identity_verified === true,
        socials: {
          youtube: profile.youtube_followers || undefined,
          instagram: profile.instagram_followers || undefined,
          tiktok: profile.tiktok_followers || undefined,
          snapchat: profile.snapchat_followers || undefined,
          facebook: profile.facebook_followers || undefined,
        },
      });
      setShowFullProfile(true);
    }
  };

  const getDisplayName = (conv: Conversation) => {
    if (!conv.otherParticipant?.profile) return "Utilisateur";
    return conv.otherParticipant.profile.company_name ||
      conv.otherParticipant.profile.full_name ||
      "Utilisateur";
  };

  const getInitials = (conv: Conversation) => {
    const name = getDisplayName(conv);
    return name.charAt(0).toUpperCase();
  };

  const getAvatarUrl = (conv: Conversation) => {
    if (!conv.otherParticipant?.profile) return null;
    return conv.otherParticipant.profile.logo_url ||
      conv.otherParticipant.profile.avatar_url;
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: false,
        locale: fr,
      });
    } catch {
      return "";
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Chat View
  if (selectedConversation) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-background flex flex-col"
      >
        {/* Chat Header */}
        <div className="px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 glass-nav border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSelectedConversation(null)}
              className="touch-target"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="relative cursor-pointer"
            >
              {getAvatarUrl(selectedConversation) ? (
                <img
                  src={getAvatarUrl(selectedConversation)!}
                  alt={getDisplayName(selectedConversation)}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold">
                    {getInitials(selectedConversation)}
                  </span>
                </div>
              )}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="flex-1 min-w-0 text-left cursor-pointer"
            >
              <h2 className="font-semibold truncate">
                {getDisplayName(selectedConversation)}
              </h2>
              {selectedConversation.subject && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedConversation.subject}
                </p>
              )}
            </button>
            <ChatActionMenu
              otherUserId={selectedConversation.otherParticipant?.user_id || null}
              otherUserName={getDisplayName(selectedConversation)}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Proposal Card: shown to the RECEIVER (not the initiator) for accept/refuse */}
          {selectedConversation.offer_id && selectedConversation.created_by !== user?.id && (
            <ProposalCard
              offerId={selectedConversation.offer_id}
              conversationId={selectedConversation.id}
            />
          )}
          
          {/* Proposal Status Card: shown to the INITIATOR to track status */}
          {selectedConversation.offer_id && selectedConversation.created_by === user?.id && (
            <ProposalStatusCard
              offerId={selectedConversation.offer_id}
              conversationId={selectedConversation.id}
            />
          )}

          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
            </div>
          ) : messages.length === 0 && !selectedConversation.offer_id ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun message pour le moment
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
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      <span className="text-[10px]">
                        {formatMessageTime(msg.created_at)}
                      </span>
                      {isOwn && (
                        msg.read_at ? (
                          <CheckCheck className="w-3 h-3" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="sticky bottom-0 left-0 right-0 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-background border-t border-border z-10">
          <div className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Écrivez votre message..."
              className="flex-1 h-12 bg-muted/50 border-border focus:border-gold rounded-full px-5"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-[0_4px_20px_hsl(43_72%_53%_/_0.3)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>

        <ChatProfileSheet
          userId={selectedConversation.otherParticipant?.user_id || null}
          open={showProfile}
          onOpenChange={setShowProfile}
          onViewFullProfile={handleViewFullProfile}
        />

        <CreatorDetailSheet
          creator={fullProfileCreator}
          creatorUserId={fullProfileCreator?.userId || null}
          open={showFullProfile}
          onOpenChange={setShowFullProfile}
        />
      </div>
    );
  }

  // Conversations List
  return (
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
        {conversationsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Aucune conversation</p>
              <p className="text-muted-foreground text-sm mt-1">
                {userRole === "creator"
                  ? "Postulez à une offre pour commencer une conversation"
                  : "Contactez un créateur pour commencer une conversation"}
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
                    {getAvatarUrl(conv) ? (
                      <img
                        src={getAvatarUrl(conv)!}
                        alt={getDisplayName(conv)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gold font-bold text-lg">
                        {getInitials(conv)}
                      </span>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate">
                      {getDisplayName(conv)}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conv.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conv.lastMessage?.content || conv.subject || "Nouvelle conversation"}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default MessagesTab;
