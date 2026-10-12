import type { Faq } from "@/lib/site";

export default function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="s-faq">
      {items.map(item => (
        <details key={item.q}>
          <summary><span>{item.q}</span><i aria-hidden="true" /></summary>
          <div className="s-faq-a">{item.a.map((p, i) => <p key={i}>{p}</p>)}</div>
        </details>
      ))}
    </div>
  );
}
