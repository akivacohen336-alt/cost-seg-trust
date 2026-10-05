import type { Metadata } from "next";
import CtaBand from "@/components/site/CtaBand";
import PageHero from "@/components/site/PageHero";
import { QUOTE_PATH } from "@/lib/site";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Submit your property once, receive multiple cost segregation quotes, compare them side by side and choose the provider that fits.",
};

const STEPS = [
  {
    title: "Submit Your Property",
    you: "Fill out one short form with your contact details and a few facts about the property.",
    us: "We confirm we have what providers need to prepare a quote and follow up if anything is missing.",
  },
  {
    title: "We Request Multiple Quotes",
    you: "Nothing. You don't need to contact or fill out forms for each provider.",
    us: "We send your property details to multiple cost segregation providers and request their quotes. Your contact information isn't shared with them at this stage.",
  },
  {
    title: "Compare Your Options",
    you: "Review your comparison, ask questions and share it with your CPA or tax advisor.",
    us: "We organize each quote into the same format, point out differences in scope and assumptions, and review the comparison before sending it to you.",
  },
  {
    title: "Choose Your Provider",
    you: "Decide whether to move forward, and with which provider. There's no obligation.",
    us: "If you choose a provider, we help connect you so the study can begin. The provider performs the study.",
  },
];

const NEEDS = [
  ["Your name, email and phone", "So we can send your comparison."],
  ["Property address", "Providers quote based on location and property."],
  ["Property type", "For example multifamily, short-term rental, office or industrial."],
  ["Purchase price", "The starting point for the cost basis."],
  ["Purchase or placed-in-service date", "When the property started being used for business."],
  ["Optional details", "Approximate land value, renovation spend, whether you have a CPA and any notes."],
];

export default function HowItWorks() {
  return (
    <>
      <PageHero eyebrow="How it works" title="One submission. Multiple quotes. Your decision.">
        <p>
          You provide your property information once. We request quotes from multiple cost segregation providers and
          organize them so you can compare them clearly, then you choose the provider that makes the most sense for you.
        </p>
      </PageHero>

      <section className="s-sec">
        <div className="s-wrap">
          <ol className="s-process">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <div className="s-process-n">{String(i + 1).padStart(2, "0")}</div>
                <div className="s-process-body">
                  <h2>{s.title}</h2>
                  <dl>
                    <div><dt>What you do</dt><dd>{s.you}</dd></div>
                    <div><dt>What we do</dt><dd>{s.us}</dd></div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">Our role</p>
            <h2>We help you compare. We don't sell one provider's study.</h2>
          </div>
          <div className="s-prose">
            <p>
              When you contact a single cost segregation firm, you see one price, one estimate and one approach. Cost Seg Trust
              exists to show you more than one. We request quotes from multiple providers and present them consistently so
              differences in price, estimated benefit, timing and scope are visible.
            </p>
            <p>
              We don't perform studies, and we don't provide tax, legal or accounting advice. The provider you select performs
              the study, and your CPA or tax advisor can help you decide how to use it.
            </p>
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">What you'll need</p>
            <h2>A few details, entered once.</h2>
            <p>Most owners can complete the form in a few minutes with information they already have.</p>
          </div>
          <dl className="s-needs">
            {NEEDS.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
          </dl>
          <div className="s-row">
            <a className="s-btn s-btn-primary s-btn-lg" href={QUOTE_PATH}>Compare Cost Segregation Quotes</a>
          </div>
        </div>
      </section>

      <CtaBand title="Ready to see your options?" />
    </>
  );
}
