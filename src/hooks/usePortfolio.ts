import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url: string | null;
  platform: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export const usePortfolio = (userId?: string) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data as PortfolioItem[]) || []);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [userId]);

  const uploadMedia = async (
    file: File,
    title: string,
    description?: string,
    platform?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return false;
      }

      // Determine media type
      const mediaType = file.type.startsWith("video/") ? "video" : "image";
      
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("portfolio")
        .getPublicUrl(fileName);

      // Create portfolio item
      const { error: insertError } = await supabase
        .from("portfolio_items")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          media_type: mediaType,
          media_url: publicUrl,
          thumbnail_url: mediaType === "image" ? publicUrl : null,
          platform: platform || null,
        });

      if (insertError) throw insertError;

      toast.success("Média ajouté au portfolio !");
      await fetchPortfolio();
      return true;
    } catch (error: any) {
      console.error("Error uploading media:", error);
      toast.error("Erreur lors de l'upload", {
        description: error.message,
      });
      return false;
    }
  };

  const deleteItem = async (itemId: string): Promise<boolean> => {
    try {
      const item = items.find((i) => i.id === itemId);
      if (!item) return false;

      // Delete from storage
      const urlParts = item.media_url.split("/portfolio/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("portfolio").remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from("portfolio_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Média supprimé");
      await fetchPortfolio();
      return true;
    } catch (error: any) {
      console.error("Error deleting item:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: { title?: string; description?: string; platform?: string }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("portfolio_items")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Média mis à jour");
      await fetchPortfolio();
      return true;
    } catch (error: any) {
      console.error("Error updating item:", error);
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  return {
    items,
    loading,
    uploadMedia,
    deleteItem,
    updateItem,
    refetch: fetchPortfolio,
  };
};
