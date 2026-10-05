export default function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="s-phero">
      <div className="s-wrap">
        <p className="s-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children ? <div className="s-phero-lede">{children}</div> : null}
      </div>
    </section>
  );
}
