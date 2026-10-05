import CtaBand from "@/components/site/CtaBand";
import FaqList from "@/components/site/FaqList";
import LegacyQuoteAnchor from "@/components/site/LegacyQuoteAnchor";
import Placeholder from "@/components/site/Placeholder";
import SampleComparison from "@/components/site/SampleComparison";
import { FAQ_PREVIEW, QUOTE_PATH } from "@/lib/site";

const DIFFERENCES = [
  ["Study pricing", "Fees for the same property can differ from one provider to the next."],
  ["Estimated tax benefits", "Providers may estimate different reclassification amounts and first-year depreciation."],
  ["Turnaround time", "Timelines vary, which matters if you are working toward a filing deadline."],
  ["Scope of work", "Deliverables, detail and what is included are not standardized."],
  ["Site inspection", "Some studies include an on-site visit; others rely on documents and photos."],
  ["Audit support", "The level of support offered if the IRS asks questions can differ."],
];

const STEPS = [
  ["Submit your property", "Share a few details about your property one time. It takes a few minutes."],
  ["We request multiple quotes", "We send your property details to multiple cost segregation providers and ask each for a quote."],
  ["Compare your options", "You receive a side-by-side comparison of pricing, estimates, scope and timing."],
  ["Choose your provider", "Move forward with the option that makes the most sense for you, or don't. It's your call."],
];

const WHY_US = [
  ["Independent of any one provider", "We don't sell our own study. Our role is to help you see more than one option."],
  ["One submission", "Enter your property information once instead of filling out forms on several provider websites."],
  ["Your details stay protected", "Providers receive the property details they need to quote. Your contact information isn't shared unless you choose to move forward."],
  ["Reviewed before it reaches you", "Every comparison is reviewed by our team before it is sent, so the options are organized clearly and consistently."],
];

export default function Home() {
  return (
    <>
      <LegacyQuoteAnchor />

      <section className="s-hero">
        <div className="s-wrap s-hero-grid">
          <div className="s-hero-copy">
            <p className="s-eyebrow">Cost segregation comparison</p>
            <h1>Compare Cost Segregation Quotes. <em>Choose With Confidence.</em></h1>
            <p className="s-hero-lede">
              Submit your property information once. Cost Seg Trust requests quotes from multiple cost segregation
              providers and organizes them side by side, so you can compare your options instead of going directly to a single firm.
            </p>
            <div className="s-hero-actions">
              <a className="s-btn s-btn-primary s-btn-lg" href={QUOTE_PATH}>Compare Cost Segregation Quotes</a>
              <a className="s-btn s-btn-ghost s-btn-lg" href="/how-it-works">How It Works</a>
            </div>
            <ul className="s-assure">
              <li>Free to request</li>
              <li>No obligation to choose</li>
              <li>One submission, multiple quotes</li>
            </ul>
          </div>
          <div className="s-hero-panel" aria-label="What your comparison includes">
            <p className="s-panel-label">Your comparison</p>
            <ul className="s-panel-list">
              <li><span>Study fee</span><b>Side by side</b></li>
              <li><span>Estimated first-year depreciation</span><b>Side by side</b></li>
              <li><span>Turnaround time</span><b>Side by side</b></li>
              <li><span>Site inspection</span><b>Noted</b></li>
              <li><span>Audit support</span><b>Noted</b></li>
              <li><span>Key assumptions</span><b>Flagged</b></li>
            </ul>
            <p className="s-panel-foot">Reviewed by our team before it is sent to you.</p>
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">What we do</p>
            <h2>A comparison service, not a single study provider.</h2>
          </div>
          <div className="s-prose">
            <p>
              Most property owners hear about cost segregation from one firm and receive one quote. Cost Seg Trust gives you
              a different starting point: we collect quotes from multiple providers for your property and present them in one
              clear, consistent format.
            </p>
            <p>
              We don't perform studies and we don't provide tax advice. We help you understand your options so you and your
              tax advisor can make an informed decision.
            </p>
            <a className="s-arrow" href="/about">About Cost Seg Trust</a>
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">Why compare</p>
            <h2>Cost segregation studies are not all the same.</h2>
            <p>Two providers can look at the same property and return different prices, estimates and levels of service. Comparing helps you see those differences before you commit.</p>
          </div>
          <div className="s-grid3">
            {DIFFERENCES.map(([t, d]) => (
              <div className="s-tile" key={t}><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
          <a className="s-arrow" href="/why-compare">Why comparing providers matters</a>
        </div>
      </section>

      <section className="s-sec" id="how-it-works">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">How it works</p>
            <h2>Four steps from one submission to an informed choice.</h2>
          </div>
          <ol className="s-steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="s-step-n">{String(i + 1).padStart(2, "0")}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
          <div className="s-row">
            <a className="s-btn s-btn-primary" href={QUOTE_PATH}>Compare Quotes</a>
            <a className="s-arrow" href="/how-it-works">See the full process</a>
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">What you can compare</p>
            <h2>Every option, organized in the same format.</h2>
            <p>Your comparison lines up each provider's quote so the differences are easy to read. The example below shows the layout only.</p>
          </div>
          <SampleComparison />
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">Why Cost Seg Trust</p>
            <h2>Built around the property owner.</h2>
          </div>
          <div className="s-grid2">
            {WHY_US.map(([t, d]) => (
              <div className="s-feature" key={t}><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-dark">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">Our commitments</p>
            <h2>Clear, careful and straightforward.</h2>
          </div>
          <ul className="s-commit">
            <li><h3>No cost to request</h3><p>Submitting your property and receiving your comparison is free.</p></li>
            <li><h3>No pressure</h3><p>You are never obligated to choose a provider.</p></li>
            <li><h3>No guarantees overstated</h3><p>Provider figures are presented as estimates, because that is what they are.</p></li>
            <li><h3>Your advisor stays in the loop</h3><p>We encourage you to review every option with your CPA or tax advisor.</p></li>
          </ul>
          <Placeholder title="Client testimonials and provider network details">
            Add real client testimonials, the number or type of providers in the network, or other verified credibility details here once available.
          </Placeholder>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">FAQ</p>
            <h2>Common questions.</h2>
            <a className="s-arrow" href="/faq">Read all FAQs</a>
          </div>
          <FaqList items={FAQ_PREVIEW} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
