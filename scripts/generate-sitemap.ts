// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Generates a sitemap index + static sitemap + dynamic creator profiles sitemap.
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://collabcrea.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/explore", changefreq: "daily", priority: "0.9" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/auth", changefreq: "monthly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/child-safety", changefreq: "yearly", priority: "0.3" },
  { path: "/ouvrir", changefreq: "monthly", priority: "0.4" },
];

function renderUrlset(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function renderIndex(files: { loc: string; lastmod: string }[]) {
  const items = files.map(
    (f) =>
      `  <sitemap>\n    <loc>${BASE_URL}/${f.loc}</loc>\n    <lastmod>${f.lastmod}</lastmod>\n  </sitemap>`
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items,
    `</sitemapindex>`,
  ].join("\n");
}

async function fetchCreatorEntries(): Promise<SitemapEntry[]> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] Supabase env missing, skipping creator entries.");
    return [];
  }
  try {
    // Public creator user_ids via user_roles (RLS allows role='creator')
    const rolesRes = await fetch(
      `${url}/rest/v1/user_roles?select=user_id&role=eq.creator`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!rolesRes.ok) throw new Error(`user_roles ${rolesRes.status}`);
    const roles: { user_id: string }[] = await rolesRes.json();
    if (!roles.length) return [];
    const ids = roles.map((r) => r.user_id);

    // Fetch matching non-banned profiles
    const idsParam = `(${ids.map((i) => `"${i}"`).join(",")})`;
    const profRes = await fetch(
      `${url}/rest/v1/profiles?select=user_id,updated_at,is_banned,category&user_id=in.${idsParam}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!profRes.ok) throw new Error(`profiles ${profRes.status}`);
    const profiles: { user_id: string; updated_at: string; is_banned: boolean | null; category: string | null }[] =
      await profRes.json();

    return profiles
      .filter((p) => !p.is_banned && p.category)
      .map((p) => ({
        path: `/profile/${p.user_id}`,
        lastmod: p.updated_at?.split("T")[0],
        changefreq: "weekly" as const,
        priority: "0.7",
      }));
  } catch (err) {
    console.warn("[sitemap] Failed to fetch creators:", (err as Error).message);
    return [];
  }
}

(async () => {
  const today = new Date().toISOString().split("T")[0];
  mkdirSync(resolve("public/sitemaps"), { recursive: true });

  // Static
  writeFileSync(resolve("public/sitemaps/static.xml"), renderUrlset(staticEntries));

  // Creators (dynamic)
  const creators = await fetchCreatorEntries();
  writeFileSync(resolve("public/sitemaps/creators.xml"), renderUrlset(creators));

  // Index
  const index = renderIndex([
    { loc: "sitemaps/static.xml", lastmod: today },
    { loc: "sitemaps/creators.xml", lastmod: today },
  ]);
  writeFileSync(resolve("public/sitemap.xml"), index);

  console.log(
    `sitemap.xml index written (static: ${staticEntries.length}, creators: ${creators.length})`
  );
})();
