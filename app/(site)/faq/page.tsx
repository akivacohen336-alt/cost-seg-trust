import type { Metadata } from "next";
import Link from "next/link";
import Accordion from "@/components/site/Accordion";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { FreeEstimateButton } from "@/components/site/ui";
import { DISCLAIMER_SHORT, FAQ_2026 } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: "FAQ: Cost Segregation & 100% Bonus Depreciation (2026)" },
  description: "Answers on cost segregation and the permanently restored 100% bonus depreciation for 2026 — what moves, date traps, Form 3115 catch-up, and how to get a free estimate.",
};

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="plain" />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">FAQ: Cost Segregation &amp; 100% Bonus Depreciation (2026)</h1>
            <p className="text-primary-foreground/85 text-lg">What changed in 2026, what a study actually does, and the details investment property owners most often miss.</p>
          </div>
        </section>
        <section className="py-16 bg-muted/30">
          <div className="container px-4 mx-auto max-w-4xl">
            <Accordion items={FAQ_2026} />
            <div className="mt-12 bg-background border rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-3">Get a free estimate</h2>
              <p className="text-muted-foreground mb-6">All we need is your property price, purchase date, and address.</p>
              <FreeEstimateButton />
            </div>
            <p className="mt-8 text-center text-muted-foreground">
              Read more:{" "}
              <Link className="underline hover:text-foreground" href="/articles/cost-seg-2026-bonus-depreciation">Cost segregation in 2026: why 100% bonus changes the math</Link>
            </p>
            <p className="mt-10 text-sm text-muted-foreground text-center">{DISCLAIMER_SHORT}</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
