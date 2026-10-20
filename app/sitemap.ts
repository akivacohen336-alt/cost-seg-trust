import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { ARTICLES } from "@/lib/site-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/faq", "/articles", ...ARTICLES.map(a => `/articles/${a.slug}`), "/start", "/privacy", "/terms", "/tax-disclaimer"];
  return paths.map(p => ({ url: config.appUrl + (p === "/" ? "" : p), changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
