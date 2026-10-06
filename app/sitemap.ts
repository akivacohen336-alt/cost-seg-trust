import type { MetadataRoute } from "next";
import { config } from "@/lib/config";
import { LEGAL_NAV, NAV, QUOTE_PATH } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...NAV.map(n => n.href), QUOTE_PATH, ...LEGAL_NAV.map(n => n.href)];
  return paths.map(p => ({ url: config.appUrl + (p === "/" ? "" : p), changeFrequency: "monthly", priority: p === "/" ? 1 : 0.7 }));
}
