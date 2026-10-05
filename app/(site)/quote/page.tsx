import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import { config } from "@/lib/config";

export const metadata: Metadata = {
  title: "Compare Cost Segregation Quotes",
  description: "Submit your property once and receive a side-by-side comparison of cost segregation quotes from multiple providers. Free, no obligation.",
};

const NEXT = [
  "We send your property details to multiple cost segregation providers.",
  "Providers prepare their quotes. Your contact details aren't shared with them.",
  "We organize the quotes side by side and review the comparison.",
  "You receive your comparison and decide whether to move forward.",
];

// The quote form below is the existing quote system, used as is.
export default function QuotePage() {
  const tel = config.contactPhone.replace(/\D/g, "");
  return (
    <section className="s-quote">
      <div className="s-wrap">
        <div className="s-quote-head">
          <p className="s-eyebrow">Free quote comparison</p>
          <h1>Compare cost segregation quotes.</h1>
          <p>Tell us about your property once. We'll request quotes from multiple providers and send you a side-by-side comparison.</p>
        </div>
        <div className="s-quote-grid">
          <div className="s-quote-form" id="quote-form">
            <QuoteForm />
          </div>
          <aside className="s-quote-aside">
            <div className="s-aside-card">
              <h2>What happens next</h2>
              <ol>{NEXT.map(n => <li key={n}>{n}</li>)}</ol>
            </div>
            <ul className="s-aside-points">
              <li>Free to request</li>
              <li>No obligation to choose a provider</li>
              <li>Estimates are not guarantees</li>
            </ul>
            <p className="s-aside-help">
              Questions first? Email <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> or
              call <a href={`tel:+1${tel.slice(-10)}`}>{config.contactPhone}</a>.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
