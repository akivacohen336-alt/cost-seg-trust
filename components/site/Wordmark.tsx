// Typographic logo: a small monogram seal plus the name.
export default function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`s-wordmark${light ? " is-light" : ""}`}>
      <svg className="s-seal" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 22V12.5L16 8l8 4.5V22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 22v-6h8v6M8 22h16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="s-name">Cost Seg <b>Trust</b></span>
    </span>
  );
}
