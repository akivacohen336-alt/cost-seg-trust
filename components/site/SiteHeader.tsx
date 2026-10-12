"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV, QUOTE_PATH } from "@/lib/site";
import Wordmark from "./Wordmark";

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu after navigating or pressing Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("menu-open");
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="s-hdr" data-open={open || undefined}>
      <div className="s-wrap s-hdr-bar">
        <a href="/" className="s-logo" aria-label="Cost Seg Trust home"><Wordmark /></a>
        <nav className="s-nav" aria-label="Main">
          {NAV.map(n => (
            <a key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
        <a className="s-btn s-btn-primary s-hdr-cta" href={QUOTE_PATH}>Compare Quotes</a>
        <button
          type="button"
          className="s-menu-btn"
          aria-expanded={open}
          aria-controls="s-mobile-nav"
          onClick={() => setOpen(o => !o)}
        >
          <span className="s-sr">{open ? "Close menu" : "Open menu"}</span>
          <span className="s-burger" aria-hidden="true"><i /><i /><i /></span>
        </button>
      </div>
      <div id="s-mobile-nav" className="s-mnav" hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map(n => (
            <a key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
        <a className="s-btn s-btn-primary s-btn-lg s-btn-block" href={QUOTE_PATH}>Compare Quotes</a>
      </div>
    </header>
  );
}
