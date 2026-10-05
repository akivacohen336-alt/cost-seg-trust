import type { Metadata } from "next";
import CtaBand from "@/components/site/CtaBand";
import PageHero from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Why Compare Providers",
  description: "Cost segregation studies can differ in price, estimated benefit, turnaround, scope, inspection and audit support. Here's what to compare.",
};

const FACTORS = [
  {
    title: "Study pricing",
    text: "Fees for the same property can vary between providers. Price alone doesn't tell the whole story, but knowing the range helps you judge whether a quote is reasonable for what's included.",
    ask: "Is the fee fixed? Are there extra charges for site visits, revisions or audit support?",
  },
  {
    title: "Estimated tax benefits",
    text: "Providers may estimate different amounts of reclassified property and first-year depreciation. These figures are estimates and may vary from the final study and from the tax benefit you actually realize.",
    ask: "How was the estimate calculated, and what would cause the final number to differ?",
  },
  {
    title: "Turnaround time",
    text: "Timelines range from provider to provider and can matter if you're working toward a filing deadline or an extension date.",
    ask: "When does the timeline start, and what do you need from me to keep it on track?",
  },
  {
    title: "Scope of work",
    text: "What a study covers and how detailed the report is are not standardized. Some studies include more components, more documentation or more supporting detail than others.",
    ask: "What exactly is included in the deliverable, and what would cost extra?",
  },
  {
    title: "Engineering and site inspection",
    text: "Some providers include an on-site inspection by an engineer or specialist; others work from documents, plans and photos. The approach can affect the cost, the timeline and the level of supporting detail.",
    ask: "Will someone visit the property? Who performs and reviews the analysis?",
  },
  {
    title: "Audit support",
    text: "If the IRS ever has questions about a study, the provider's support can matter. The level of support, and whether it's included in the fee, can differ.",
    ask: "What audit support is included, for how long, and is there an additional cost?",
  },
  {
    title: "Assumptions",
    text: "Estimates rest on assumptions such as land value, the cost basis, the placed-in-service date and how improvements are treated. Different assumptions can produce different numbers for the same property.",
    ask: "What assumptions did you use, and how sensitive is the estimate to them?",
  },
  {
    title: "Additional services",
    text: "Some providers offer related services, such as reviews of prior-year properties, renovation or partial-disposition analysis, or coordination with your CPA.",
    ask: "Which additional services are offered, and which are relevant to my situation?",
  },
];

export default function WhyCompare() {
  return (
    <>
      <PageHero eyebrow="Why compare" title="The same property can produce very different quotes.">
        <p>
          Cost segregation providers don't all price, estimate or deliver studies the same way. Comparing several options
          side by side helps you understand what you're paying for and ask better questions before you commit.
        </p>
      </PageHero>

      <section className="s-sec">
        <div className="s-wrap">
          <div className="s-factors">
            {FACTORS.map((f, i) => (
              <article className="s-factor" key={f.title}>
                <span className="s-factor-n">{String(i + 1).padStart(2, "0")}</span>
                <h2>{f.title}</h2>
                <p>{f.text}</p>
                <p className="s-factor-ask"><span>Worth asking</span>{f.ask}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">A note on estimates</p>
            <h2>Estimates are a starting point, not a promise.</h2>
          </div>
          <div className="s-prose">
            <p>
              The estimated benefits in a provider's quote are projections based on limited information. The completed study
              may differ, and the tax benefit you actually realize depends on your individual tax situation, how the study is
              applied and the tax law in effect.
            </p>
            <p>
              The lowest fee or the highest estimate isn't automatically the best choice. Comparing helps you weigh price,
              estimated benefit, timing and scope together. Review your options with your CPA or tax advisor before deciding.
            </p>
            <a className="s-arrow" href="/tax-disclaimer">Read our tax disclaimer</a>
          </div>
        </div>
      </section>

      <CtaBand title="Compare before you commit." />
    </>
  );
}
