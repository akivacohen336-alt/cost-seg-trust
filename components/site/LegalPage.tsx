import PageHero from "./PageHero";
import Placeholder from "./Placeholder";

export default function LegalPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title}><p>{intro}</p></PageHero>
      <section className="s-sec">
        <div className="s-wrap s-legal">
          <Placeholder title="Legal review, entity name and effective date">
            This page is a starting draft. Add the legal business name, the effective date and any state-specific terms,
            and have it reviewed by a qualified attorney before relying on it.
          </Placeholder>
          <div className="s-legal-body">{children}</div>
        </div>
      </section>
    </>
  );
}
