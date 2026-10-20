import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { FreeEstimateButton } from "@/components/site/ui";
import { ARTICLES, DISCLAIMER_ARTICLE, findArticle } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => ARTICLES.map(a => ({ slug: a.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = findArticle((await params).slug);
  return a ? { title: { absolute: `${a.title} | CostSegTrust` }, description: a.excerpt } : {};
}

const PROSE = "container px-4 mx-auto max-w-3xl bg-background border rounded-lg p-6 md:p-10 [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1";

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  if (slug === "logistics-storage-cost-seg") redirect("/articles/warehouse-self-storage-cost-seg");
  const a = findArticle(slug);
  if (!a) notFound();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="nav" />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 mx-auto max-w-3xl">
            <Link className="text-primary-foreground/70 text-sm hover:text-accent transition-colors" href="/articles">← All articles</Link>
            <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-3">{a.title}</h1>
            <p className="text-primary-foreground/80">By {a.author} · {a.displayDate}</p>
          </div>
        </section>
        <section className="py-16 bg-muted/30">
          <article className={PROSE}>
            <div dangerouslySetInnerHTML={{ __html: a.html }} />
            <div className="mt-10 border-t pt-8 text-center not-prose">
              <FreeEstimateButton />
              <p className="mt-4 text-sm text-muted-foreground">
                Related reading:{" "}
                {a.related.map((r, i) => (
                  <span key={r.href}>
                    <Link className="underline hover:text-foreground" href={r.href}>{r.label}</Link>
                    {i < a.related.length - 1 ? " · " : ""}
                  </span>
                ))}
              </p>
            </div>
            <p className="mt-8 text-sm text-muted-foreground text-center">{DISCLAIMER_ARTICLE}</p>
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
