import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Image, 
  Video, 
  Trash2, 
  Play, 
  Upload, 
  Loader2,
  X,
  Edit2
} from "lucide-react";
import { usePortfolio, PortfolioItem } from "@/hooks/usePortfolio";
import { useAuth } from "@/hooks/useAuth";

interface PortfolioEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const PortfolioEditSheet = ({ isOpen, onClose }: PortfolioEditSheetProps) => {
  const { user } = useAuth();
  const { items, loading, uploadMedia, deleteItem, updateItem } = usePortfolio(user?.id);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Upload form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;
    
    setUploading(true);
    const success = await uploadMedia(selectedFile, title.trim(), description, platform);
    setUploading(false);
    
    if (success) {
      resetForm();
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeleting(itemId);
    await deleteItem(itemId);
    setDeleting(null);
    setSelectedItem(null);
  };

  const resetForm = () => {
    setShowUploadForm(false);
    setTitle("");
    setDescription("");
    setPlatform("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const images = items.filter((item) => item.media_type === "image");
  const videos = items.filter((item) => item.media_type === "video");

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-xl">Mon Portfolio</SheetTitle>
        </SheetHeader>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <Image className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">{images.length} photos</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
            <Play className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium">{videos.length} vidéos</span>
          </div>
        </div>

        {/* Add button */}
        <Button
          variant="gold"
          className="w-full mb-6"
          onClick={() => setShowUploadForm(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un média
        </Button>

        {/* Upload Form */}
        <AnimatePresence>
          {showUploadForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="glass rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Nouveau média</h3>
                  <button onClick={resetForm} className="p-2">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                {/* File selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!selectedFile ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-3 hover:border-gold/50 transition-colors"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium text-foreground">Sélectionner un fichier</p>
                      <p className="text-xs text-muted-foreground">Photos ou vidéos</p>
                    </div>
                  </button>
                ) : (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/30">
                    {selectedFile.type.startsWith("image/") ? (
                      <img
                        src={previewUrl!}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={previewUrl!}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-background/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Campagne Nike Afrique"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez votre réalisation..."
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Plateforme</Label>
                    <Input
                      id="platform"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      placeholder="Ex: Instagram, YouTube, TikTok..."
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleUpload}
                  disabled={!selectedFile || !title.trim() || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Upload en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Ajouter au portfolio
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Portfolio vide
            </h3>
            <p className="text-sm text-muted-foreground">
              Ajoutez vos meilleures réalisations pour attirer les marques !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted/30 group cursor-pointer"
              >
                {item.media_type === "image" ? (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.media_url}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/60 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-foreground fill-current" />
                    </div>
                  </>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit2 className="w-6 h-6 text-foreground" />
                </div>

                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/90 to-transparent">
                  <p className="text-xs font-medium truncate">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Item Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/95 flex flex-col"
              onClick={() => setSelectedItem(null)}
            >
              <div className="flex-1 flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
                <div className="w-full max-w-md">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-muted"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  {/* Media preview */}
                  <div className="aspect-video rounded-2xl overflow-hidden bg-muted/30 mb-4">
                    {selectedItem.media_type === "image" ? (
                      <img
                        src={selectedItem.media_url}
                        alt={selectedItem.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={selectedItem.media_url}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                      />
                    )}
                  </div>

                  {/* Info */}
                  <h3 className="font-display text-xl font-bold mb-2">
                    {selectedItem.title}
                  </h3>
                  {selectedItem.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedItem.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
                    {selectedItem.platform && <span>{selectedItem.platform}</span>}
                    <span>
                      {selectedItem.media_type === "image" ? "Photo" : "Vidéo"}
                    </span>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(selectedItem.id)}
                    disabled={deleting === selectedItem.id}
                  >
                    {deleting === selectedItem.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default PortfolioEditSheet;
