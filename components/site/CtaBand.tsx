import { QUOTE_PATH } from "@/lib/site";

export default function CtaBand({
  title = "See your options before you choose a provider.",
  text = "Submit your property once. We'll request quotes from multiple cost segregation providers and send you a side-by-side comparison. Free, with no obligation.",
}: { title?: string; text?: string }) {
  return (
    <section className="s-cta">
      <div className="s-wrap s-cta-inner">
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
        <div className="s-cta-actions">
          <a className="s-btn s-btn-light s-btn-lg" href={QUOTE_PATH}>Compare Cost Segregation Quotes</a>
          <a className="s-cta-link" href="/how-it-works">How it works</a>
        </div>
      </div>
    </section>
  );
}
