import type { Metadata } from "next";
import CtaBand from "@/components/site/CtaBand";
import FaqList from "@/components/site/FaqList";
import PageHero from "@/components/site/PageHero";
import { FAQ_GROUPS } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about cost segregation, comparing providers and how Cost Seg Trust works.",
};

// Structured data so search engines can show these answers directly.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap(g => g.items).map(i => ({
    "@type": "Question",
    name: i.q,
    acceptedAnswer: { "@type": "Answer", text: i.a.join(" ") },
  })),
};

export default function FaqPage() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Frequently asked questions.">
        <p>
          Straight answers about cost segregation and how Cost Seg Trust works. Nothing here is tax advice; for decisions
          about your situation, talk with your CPA or tax advisor.
        </p>
      </PageHero>
      <section className="s-sec">
        <div className="s-wrap s-faq-page">
          <nav className="s-faq-toc" aria-label="FAQ sections">
            {FAQ_GROUPS.map((g, i) => <a key={g.title} href={`#faq-${i}`}>{g.title}</a>)}
          </nav>
          <div className="s-faq-groups">
            {FAQ_GROUPS.map((g, i) => (
              <section key={g.title} id={`faq-${i}`} aria-labelledby={`faq-h-${i}`}>
                <h2 id={`faq-h-${i}`}>{g.title}</h2>
                <FaqList items={g.items} />
              </section>
            ))}
            <p className="s-muted">Still have a question? <a href="/contact">Contact us</a>.</p>
          </div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <CtaBand />
    </>
  );
}
