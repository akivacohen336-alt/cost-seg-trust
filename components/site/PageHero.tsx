import { photoStyle } from "@/lib/site";

export default function PageHero({ eyebrow, title, photo, children }: { eyebrow: string; title: string; photo?: string; children?: React.ReactNode }) {
  return (
    <section className={`s-phero${photo ? " s-photo" : ""}`} style={photo ? photoStyle(photo) : undefined}>
      <div className="s-wrap">
        <p className="s-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children ? <div className="s-phero-lede">{children}</div> : null}
      </div>
    </section>
  );
}
