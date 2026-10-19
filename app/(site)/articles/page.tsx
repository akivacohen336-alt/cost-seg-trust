import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { card } from "@/components/site/ui";
import { ARTICLES } from "@/lib/site-content";

export const metadata: Metadata = {
  title: { absolute: "Articles | CostSegTrust" },
  description: "Educational articles on cost segregation, bonus depreciation, and tax strategy for investment real estate owners.",
};

export default function ArticlesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="nav" />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Articles</h1>
            <p className="text-primary-foreground/85 text-lg">Plain-English guides on cost segregation and depreciation for investment property owners.</p>
          </div>
        </section>
        <section className="py-16 bg-muted/30">
          <div className="container px-4 mx-auto max-w-4xl grid gap-6">
            {ARTICLES.map(a => (
              <div key={a.slug} className={`${card} bg-background`}>
                <div className="flex flex-col space-y-1.5 p-6">
                  <p className="text-sm text-muted-foreground">{a.displayDate} · {a.author}</p>
                  <h3 className="font-semibold leading-none tracking-tight text-2xl">
                    <Link className="hover:text-accent transition-colors" href={`/articles/${a.slug}`}>{a.title}</Link>
                  </h3>
                </div>
                <div className="p-6 pt-0">
                  <p className="text-muted-foreground mb-4">{a.excerpt}</p>
                  <Link className="inline-flex items-center text-accent font-medium hover:underline" href={`/articles/${a.slug}`}>
                    Read article <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
