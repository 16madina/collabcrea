import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ArrowLeft, Check, CheckCheck, MessageCircle } from "lucide-react";
import ChatActionMenu from "@/components/chat/ChatActionMenu";
import ChatProfileSheet from "@/components/chat/ChatProfileSheet";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { useConversations, Conversation } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ProposalCard from "@/components/creator/ProposalCard";

const CreatorMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversations, loading: conversationsLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
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

  const handleViewFullProfile = (userId: string, _role: string) => {
    navigate(`/profile/${userId}`);
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

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
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
          {/* Proposal Card if conversation has an offer */}
          {selectedConversation.offer_id && (
            <ProposalCard
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
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.sender_id === user?.id
                      ? "bg-gold text-primary-foreground rounded-br-md"
                      : "glass rounded-bl-md"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 ${
                      message.sender_id === user?.id
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-xs">
                      {formatMessageTime(message.created_at)}
                    </span>
                    {message.sender_id === user?.id &&
                      (message.read_at ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3" />
                      ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 glass-nav border-t border-border safe-bottom">
          <div className="flex items-center gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder="Écrivez un message..."
              className="flex-1 h-12 bg-muted/50 border-border focus:border-gold rounded-full px-5"
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-[0_4px_20px_hsl(43_72%_53%_/_0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-2xl font-bold text-gold-gradient mb-4">
            Messages
          </h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="pl-12 h-12 bg-muted/50 border-border focus:border-gold rounded-xl"
            />
          </div>
        </motion.div>
      </div>

      {/* Conversations */}
      <div className="px-6 mt-4 space-y-2">
        {conversationsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
          </div>
        ) : (
          <AnimatePresence>
            {filteredConversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Aucune conversation trouvée"
                    : "Aucune conversation pour le moment"}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Les marques vous contacteront ici
                </p>
              </motion.div>
            ) : (
              filteredConversations.map((conv, index) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conv)}
                  className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-gold/30 transition-all"
                >
                  <div className="relative">
                    {getAvatarUrl(conv) ? (
                      <img
                        src={getAvatarUrl(conv)!}
                        alt={getDisplayName(conv)}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-gold font-bold text-xl">
                          {getInitials(conv)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {getDisplayName(conv)}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {conv.lastMessage
                          ? formatTime(conv.lastMessage.created_at)
                          : formatTime(conv.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.lastMessage?.content || conv.subject || "Nouvelle conversation"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">
                        {conv.unreadCount}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CreatorMessages;
