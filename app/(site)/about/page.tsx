import type { Metadata } from "next";
import CtaBand from "@/components/site/CtaBand";
import PageHero from "@/components/site/PageHero";
import Placeholder from "@/components/site/Placeholder";

export const metadata: Metadata = {
  title: "About",
  description: "Cost Seg Trust was created to make cost segregation easier to understand and easier to compare.",
};

const PRINCIPLES = [
  ["Options, not a single pitch", "We request quotes from multiple providers so you are not relying on one firm's price and estimate."],
  ["Clarity over complexity", "Each quote is organized in the same format so you can see the differences without decoding several proposals."],
  ["Honest about estimates", "Provider figures are estimates. We present them that way and never promise a tax outcome."],
  ["Your decision", "You choose whether to move forward and with whom. There is no obligation."],
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="About Cost Seg Trust" title="Making cost segregation easier to understand and easier to compare.">
        <p>
          Cost Seg Trust was created for property owners who want to see more than one option before choosing a cost
          segregation provider.
        </p>
      </PageHero>

      <section className="s-sec">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">Why we exist</p>
            <h2>One quote rarely tells the whole story.</h2>
          </div>
          <div className="s-prose">
            <p>
              Cost segregation can be valuable, but it is also unfamiliar to many owners. Pricing, estimates and scope vary from
              provider to provider, and comparing them usually means contacting several firms, repeating the same information
              and trying to line up proposals that are formatted differently.
            </p>
            <p>
              Cost Seg Trust simplifies that. You submit your property once. We request quotes from multiple providers and
              organize them side by side, so you can make an informed choice instead of relying on a single provider.
            </p>
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">How we work</p>
            <h2>Principles we hold ourselves to.</h2>
          </div>
          <div className="s-grid2">
            {PRINCIPLES.map(([t, d]) => <div className="s-feature" key={t}><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="s-sec">
        <div className="s-wrap s-split">
          <div>
            <p className="s-eyebrow">What we are, and aren't</p>
            <h2>A comparison service.</h2>
          </div>
          <div className="s-isnt">
            <div>
              <h3>We do</h3>
              <ul>
                <li>Request quotes from multiple cost segregation providers</li>
                <li>Organize those quotes into one side-by-side comparison</li>
                <li>Point out differences in scope, timing and assumptions</li>
                <li>Help connect you with the provider you choose</li>
              </ul>
            </div>
            <div>
              <h3>We don't</h3>
              <ul>
                <li>Perform cost segregation studies ourselves</li>
                <li>Provide tax, legal or accounting advice</li>
                <li>Guarantee tax savings or study results</li>
                <li>Require you to choose a provider</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="s-sec s-sec-alt">
        <div className="s-wrap">
          <div className="s-sec-head">
            <p className="s-eyebrow">Our team</p>
            <h2>The people behind Cost Seg Trust.</h2>
          </div>
          <Placeholder title="Founder story and team">
            Add the founder's background, the team and any verified professional experience here. Only include real names,
            credentials and history.
          </Placeholder>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
