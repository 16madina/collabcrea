import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const IOS_URL = "https://apps.apple.com/ca/app/collabcrea/id6758926846?l=fr-CA";
const ANDROID_URL = "https://play.google.com/store/apps/details?id=com.collabcrea.app";
const WEB_BASE = "https://collabcrea.com";
const APP_SCHEME = "collabcrea://"; // custom URL scheme (deep link)

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export default function OpenApp() {
  const [params] = useSearchParams();
  const target = params.get("to") || "/creator/profile";
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [triedOpen, setTriedOpen] = useState(false);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);

    if (p === "desktop") {
      // On desktop, just go to the web app
      window.location.replace(`${WEB_BASE}${target}`);
      return;
    }

    // Mobile: attempt to open the app via custom scheme
    const deepLink = `${APP_SCHEME}${target.replace(/^\//, "")}`;
    const openedAt = Date.now();
    setTriedOpen(true);

    // Hidden iframe trick + location assign fallback
    const timeout = setTimeout(() => {
      // If we're still here after 1.5s, assume app not installed
      if (Date.now() - openedAt >= 1400 && document.visibilityState === "visible") {
        // Don't auto-redirect to store — let user choose via buttons below
      }
    }, 1500);

    try {
      window.location.href = deepLink;
    } catch {
      // ignore
    }

    return () => clearTimeout(timeout);
  }, [target]);

  const storeUrl = platform === "ios" ? IOS_URL : ANDROID_URL;
  const storeLabel = platform === "ios" ? "Télécharger sur l'App Store" : "Télécharger sur Google Play";

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-[hsl(270,40%,12%)] to-[hsl(270,40%,7%)] text-white">
      <div className="max-w-md w-full text-center space-y-6">
        <img
          src="https://fkfdjibqpmdaobjrryja.supabase.co/storage/v1/object/public/email-assets/logo-collabcrea.png?v=1"
          alt="CollabCréa"
          className="h-16 mx-auto"
        />
        <h1 className="text-2xl font-bold">Ouverture de CollabCréa…</h1>
        <p className="text-white/70 text-sm">
          {platform === "desktop"
            ? "Redirection vers le site…"
            : "Si l'application est installée, elle devrait s'ouvrir automatiquement. Sinon, choisissez une option ci-dessous."}
        </p>

        {platform !== "desktop" && (
          <div className="space-y-3 pt-4">
            <a
              href={`${APP_SCHEME}${target.replace(/^\//, "")}`}
              className="block w-full bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a0a2e] font-bold py-4 rounded-xl"
            >
              Ouvrir l'application
            </a>
            <a
              href={storeUrl}
              className="block w-full bg-black text-white font-semibold py-4 rounded-xl"
            >
              {storeLabel}
            </a>
            <a
              href={`${WEB_BASE}${target}`}
              className="block w-full text-white/70 text-sm underline pt-2"
            >
              Continuer sur le site web
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
