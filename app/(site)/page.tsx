import CtaBand from "@/components/site/CtaBand";
import FaqList from "@/components/site/FaqList";
import LegacyQuoteAnchor from "@/components/site/LegacyQuoteAnchor";
import SampleComparison from "@/components/site/SampleComparison";
import { FAQ_PREVIEW, PHOTOS, QUOTE_PATH, photoStyle } from "@/lib/site";

// The homepage is kept deliberately short: each slide is a headline and a
// few words. The detail lives on How It Works, Why Compare and FAQ.
const DIFFERENCES = ["Study pricing", "Estimated tax benefits", "Turnaround time", "Scope of work", "Site inspection", "Audit support"];

const STEPS = [
  ["Submit your property", "Once."],
  ["We request quotes", "From multiple providers."],
  ["Compare", "Side by side."],
  ["Choose", "Or don't. Your call."],
];

const PROMISES = [
  ["Free", "No cost to request."],
  ["No obligation", "You never have to choose."],
  ["Private", "Providers quote without your contact details."],
  ["Reviewed", "Every comparison is checked before it's sent."],
];

export default function Home() {
  return (
    <>
      <LegacyQuoteAnchor />

      <section className="s-hero s-hero-min s-photo" style={photoStyle(PHOTOS.office)}>
        <div className="s-wrap">
          <h1>Compare Cost Segregation Quotes. <em>Choose With Confidence.</em></h1>
          <p className="s-hero-lede">Submit your property once. Compare quotes from multiple providers.</p>
          <div className="s-hero-actions">
            <a className="s-btn s-btn-primary s-btn-lg" href={QUOTE_PATH}>Compare Cost Segregation Quotes</a>
            <a className="s-btn s-btn-ghost s-btn-lg" href="/how-it-works">How It Works</a>
          </div>
        </div>
      </section>

      <section className="s-sec s-slide-center">
        <div className="s-wrap">
          <p className="s-eyebrow">What we do</p>
          <h2>One property. Several quotes. One clear comparison.</h2>
          <a className="s-arrow" href="/about">About us</a>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">Why compare</p>
            <h2>Not all studies are the same.</h2>
          </div>
          <ul className="s-chips">{DIFFERENCES.map(d => <li key={d}>{d}</li>)}</ul>
          <a className="s-arrow" href="/why-compare">Why comparing matters</a>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">How it works</p>
            <h2>Four simple steps.</h2>
          </div>
          <ol className="s-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="s-step-n">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
          <div className="s-row">
            <a className="s-btn s-btn-primary" href={QUOTE_PATH}>Compare Quotes</a>
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">What you get</p>
            <h2>Every quote, side by side.</h2>
          </div>
          <SampleComparison />
        </div>
      </section>

      <section className="s-sec s-sec-dark s-photo" style={photoStyle(PHOTOS.apartmentsNight)}>
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">Our promise</p>
            <h2>Built around the property owner.</h2>
          </div>
          <ul className="s-commit">
            {PROMISES.map(([t, d]) => <li key={t}><h3>{t}</h3><p>{d}</p></li>)}
          </ul>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">FAQ</p>
            <h2>Questions?</h2>
            <a className="s-arrow" href="/faq">All FAQs</a>
          </div>
          <FaqList items={FAQ_PREVIEW} />
        </div>
      </section>

      <CtaBand title="Ready to compare?" text="" />
    </>
  );
}
