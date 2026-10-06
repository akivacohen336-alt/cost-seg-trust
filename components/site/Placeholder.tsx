// A clearly marked spot for real business information that hasn't been
// supplied yet. Search the code for <Placeholder to find every one.
export default function Placeholder({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <aside className="s-placeholder" aria-label={`Placeholder: ${title}`}>
      <span className="s-placeholder-tag">Placeholder</span>
      <strong>{title}</strong>
      {children ? <div>{children}</div> : null}
    </aside>
  );
}
