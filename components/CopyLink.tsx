"use client";

import { useState } from "react";

/** A read-only link with a Copy button. */
export default function CopyLink({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
      <input type="text" readOnly value={value} aria-label={label ?? "Link"} onFocus={e => e.currentTarget.select()}
             style={{ flex: 1, minWidth: 0, fontSize: 13 }} />
      <button className="btn sm" type="button" onClick={async () => {
        try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
      }}>{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}
