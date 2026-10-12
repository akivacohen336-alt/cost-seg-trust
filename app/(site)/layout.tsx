import type { Metadata } from "next";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import "./site.css";

export const metadata: Metadata = {
  title: { default: "Cost Seg Trust | Compare Cost Segregation Quotes", template: "%s | Cost Seg Trust" },
  description:
    "Submit your property once and compare cost segregation quotes from multiple providers side by side. Free, with no obligation.",
  openGraph: { siteName: "Cost Seg Trust", type: "website" },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <a className="s-skip" href="#main">Skip to content</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
