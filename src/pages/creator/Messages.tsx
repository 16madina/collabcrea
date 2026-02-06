import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, ArrowLeft, MoreVertical, Check, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";

interface Conversation {
  id: number;
  brand: string;
  logo: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: number;
  sender: "me" | "them";
  text: string;
  time: string;
  read: boolean;
}

const conversations: Conversation[] = [
  {
    id: 1,
    brand: "Afrik'Beauty",
    logo: "A",
    lastMessage: "Parfait ! On valide le brief demain.",
    time: "14:30",
    unread: 2,
    online: true,
  },
  {
    id: 2,
    brand: "TechAfrica",
    logo: "T",
    lastMessage: "Merci pour votre proposition !",
    time: "Hier",
    unread: 0,
    online: false,
  },
  {
    id: 3,
    brand: "Mode Dakar",
    logo: "M",
    lastMessage: "Les photos sont superbes 🔥",
    time: "Lun",
    unread: 0,
    online: true,
  },
  {
    id: 4,
    brand: "Cuisine Mama",
    logo: "C",
    lastMessage: "Quand seriez-vous disponible ?",
    time: "Dim",
    unread: 1,
    online: false,
  },
];

const mockMessages: Message[] = [
  { id: 1, sender: "them", text: "Bonjour ! Nous avons adoré votre profil 😍", time: "10:00", read: true },
  { id: 2, sender: "me", text: "Merci beaucoup ! Je suis ravie de collaborer avec vous.", time: "10:05", read: true },
  { id: 3, sender: "them", text: "Nous cherchons une créatrice pour notre nouvelle campagne beauté.", time: "10:06", read: true },
  { id: 4, sender: "me", text: "Ça m'intéresse ! Pouvez-vous m'en dire plus sur le brief ?", time: "10:10", read: true },
  { id: 5, sender: "them", text: "Bien sûr ! Il s'agit d'un Reel Instagram pour notre gamme de soins capillaires.", time: "10:15", read: true },
  { id: 6, sender: "them", text: "Budget: 150,000 FCFA. Livraison dans 5 jours.", time: "10:15", read: true },
  { id: 7, sender: "me", text: "Parfait, ça me convient ! 🙌", time: "10:20", read: true },
  { id: 8, sender: "them", text: "Parfait ! On valide le brief demain.", time: "14:30", read: false },
];

const CreatorMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const filteredConversations = conversations.filter((conv) =>
    conv.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: messages.length + 1,
      sender: "me",
      text: newMessage,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
  };

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat Header */}
        <div className="safe-top px-4 py-3 glass-nav border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="touch-target"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <span className="text-gold font-bold">{selectedConversation.logo}</span>
              </div>
              {selectedConversation.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{selectedConversation.brand}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedConversation.online ? "En ligne" : "Hors ligne"}
              </p>
            </div>
            <button className="touch-target">
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.sender === "me"
                    ? "bg-gold text-primary-foreground rounded-br-md"
                    : "glass rounded-bl-md"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  message.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}>
                  <span className="text-xs">{message.time}</span>
                  {message.sender === "me" && (
                    message.read ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 glass-nav border-t border-border safe-bottom">
          <div className="flex items-center gap-3">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Écrivez un message..."
              className="flex-1 h-12 bg-muted/50 border-border focus:border-gold rounded-full px-5"
            />
            <button
              onClick={handleSendMessage}
              className="w-12 h-12 rounded-full bg-gold flex items-center justify-center shadow-[0_4px_20px_hsl(43_72%_53%_/_0.3)]"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="safe-top px-6 py-4">
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
        <AnimatePresence>
          {filteredConversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedConversation(conv)}
              className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-gold/30 transition-all"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="text-gold font-bold text-xl">{conv.logo}</span>
                </div>
                {conv.online && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{conv.brand}</h3>
                  <span className="text-xs text-muted-foreground">{conv.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread > 0 && (
                <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">{conv.unread}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredConversations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Aucune conversation trouvée</p>
          </motion.div>
        )}
      </div>

      <BottomNav userRole="creator" />
    </div>
  );
};

export default CreatorMessages;
