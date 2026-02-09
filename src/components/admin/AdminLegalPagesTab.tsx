import { useState, useEffect } from "react";
import { useLegalPages } from "@/hooks/useLegalPages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Loader2, Save, Edit2, X } from "lucide-react";

const AdminLegalPagesTab = () => {
  const { pages, loading, updatePage } = useLegalPages();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEdit = (slug: string) => {
    const page = pages.find(p => p.slug === slug);
    if (page) {
      setEditingSlug(slug);
      setEditTitle(page.title);
      setEditContent(page.content);
    }
  };

  const handleSave = async () => {
    if (!editingSlug) return;
    setSaving(true);
    try {
      await updatePage(editingSlug, editTitle, editContent);
      toast.success("Page mise à jour avec succès");
      setEditingSlug(null);
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSlug(null);
    setEditTitle("");
    setEditContent("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  const slugLabels: Record<string, string> = {
    terms: "Conditions Générales d'Utilisation",
    privacy: "Politique de Confidentialité",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Pages légales</h2>
      <p className="text-sm text-muted-foreground">
        Modifiez le contenu des pages légales. Le contenu supporte le format Markdown.
      </p>

      {pages.map((page) => (
        <div key={page.slug} className="border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              <span className="font-semibold">{slugLabels[page.slug] || page.title}</span>
            </div>
            {editingSlug !== page.slug && (
              <Button variant="outline" size="sm" onClick={() => handleEdit(page.slug)}>
                <Edit2 className="w-4 h-4 mr-1" />
                Modifier
              </Button>
            )}
          </div>

          {editingSlug === page.slug ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titre</label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Contenu (Markdown)</label>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] font-mono text-xs"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-1" />
                  Annuler
                </Button>
                <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(page.updated_at).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminLegalPagesTab;
