import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export const useLegalPages = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("legal_pages")
      .select("*")
      .order("slug");

    if (error) {
      console.error("Error fetching legal pages:", error);
    } else {
      setPages((data as LegalPage[]) || []);
    }
    setLoading(false);
  };

  const getPage = async (slug: string): Promise<LegalPage | null> => {
    const { data, error } = await supabase
      .from("legal_pages")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("Error fetching legal page:", error);
      return null;
    }
    return data as LegalPage;
  };

  const updatePage = async (slug: string, title: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("legal_pages")
      .update({ 
        title, 
        content, 
        last_updated_by: user?.id 
      })
      .eq("slug", slug);

    if (error) {
      console.error("Error updating legal page:", error);
      throw error;
    }
    
    await fetchPages();
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return { pages, loading, getPage, updatePage, refetch: fetchPages };
};
