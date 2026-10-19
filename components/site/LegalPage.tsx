import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

/** Privacy, terms and tax disclaimer pages, in the same style as the articles. */
export default function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="nav" />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 mx-auto max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">{title}</h1>
            <p className="text-primary-foreground/80">{intro}</p>
          </div>
        </section>
        <section className="py-16 bg-muted/30">
          <article className="container px-4 mx-auto max-w-3xl bg-background border rounded-lg p-6 md:p-10 [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-relaxed [&_li]:text-muted-foreground [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:underline">
            {children}
          </article>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
