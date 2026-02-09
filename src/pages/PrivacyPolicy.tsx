import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useLegalPages } from "@/hooks/useLegalPages";

const PrivacyPolicy = () => {
  const { getPage } = useLegalPages();
  const [title, setTitle] = useState("Politique de Confidentialité");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const load = async () => {
      const page = await getPage("privacy");
      if (page) {
        setTitle(page.title);
        setContent(page.content);
        setUpdatedAt(new Date(page.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-12">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>

        <h1 className="font-display text-3xl font-bold text-gold-gradient mb-8">
          {title}
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        ) : (
          <div className="prose prose-invert max-w-none text-muted-foreground">
            {updatedAt && <p className="text-sm mb-6">Dernière mise à jour : {updatedAt}</p>}
            <ReactMarkdown
              components={{
                h2: ({ children }) => <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">{children}</h2>,
                p: ({ children }) => <p className="mb-4">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-6 mt-2 space-y-2">{children}</ul>,
                a: ({ href, children }) => <Link to={href || "#"} className="text-gold hover:underline">{children}</Link>,
                strong: ({ children }) => <strong className="text-foreground">{children}</strong>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
