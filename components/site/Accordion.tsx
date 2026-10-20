"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/site-content";

/** One-at-a-time FAQ list, styled like the Lovable site's accordion. */
export default function Accordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      {items.map((item, i) => {
        const state = open === i ? "open" : "closed";
        return (
          <div key={i} className="bg-background rounded-lg px-6 border" data-state={state}>
            <h3 className="flex">
              <button
                type="button"
                id={`faq-${i}`}
                aria-expanded={open === i}
                aria-controls={`faq-${i}-panel`}
                data-state={state}
                onClick={() => setOpen(open === i ? null : i)}
                className="flex flex-1 items-center justify-between py-4 font-medium transition-all [&[data-state=open]>svg]:rotate-180 text-left hover:no-underline"
              >
                <span className="text-lg font-semibold">{item.q}</span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </button>
            </h3>
            <div
              id={`faq-${i}-panel`}
              role="region"
              aria-labelledby={`faq-${i}`}
              className={`grid overflow-hidden text-sm transition-all duration-200 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="min-h-0" aria-hidden={open !== i}>
                <div className="pb-4 pt-0 text-muted-foreground"><p>{item.a}</p></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
