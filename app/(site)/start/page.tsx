import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Logo from "@/components/site/Logo";
import StartFlow from "@/components/site/StartFlow";

export const metadata: Metadata = {
  title: { absolute: "Cost Seg Trust — Get Free Quotes" },
  appleWebApp: { capable: true, title: "Cost Seg Trust" },
};
export const viewport: Viewport = { themeColor: "#0f2040" };

// The stand-alone quote page (also where partner links and old /quote links land).
export default function StartPage() {
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center px-4 py-3">
          <Link href="/" aria-label="CostSegTrust home"><Logo size="md" /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-6">
        <StartFlow />
      </main>
    </div>
  );
}
