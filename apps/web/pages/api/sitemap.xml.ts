import type { NextApiRequest, NextApiResponse } from "next";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://infamous-freight-as-3gw.fly.dev";
  const today = new Date().toISOString().split("T")[0];

  const urls: SitemapUrl[] = [
    {
      loc: baseUrl,
      lastmod: today,
      changefreq: "daily",
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/solutions`,
      lastmod: today,
      changefreq: "weekly",
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/pricing`,
      lastmod: today,
      changefreq: "weekly",
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/product`,
      lastmod: today,
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/docs`,
      lastmod: today,
      changefreq: "weekly",
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/security`,
      lastmod: today,
      changefreq: "monthly",
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/login`,
      lastmod: today,
      changefreq: "monthly",
      priority: 0.6,
    },
    {
      loc: `${baseUrl}/signup`,
      lastmod: today,
      changefreq: "monthly",
      priority: 0.6,
    },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ""}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate");
  res.status(200).send(sitemap);
}
