"use client";

import { useState } from "react";
import QuoteForm, { SuccessCard } from "./QuoteForm";

type Done = Parameters<typeof SuccessCard>[0];

/** The /start page body: the form, then the "You're all set" card. */
export default function StartFlow() {
  const [done, setDone] = useState<Omit<Done, "onReset"> | null>(null);
  if (done) return <SuccessCard {...done} onReset={() => { setDone(null); window.scrollTo(0, 0); }} />;
  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground">Get free quotes for your property</h1>
        <p className="mt-1 text-muted-foreground">Tell us about your investment property. It takes about two minutes.</p>
      </div>
      <QuoteForm variant="app" onDone={d => { setDone(d); window.scrollTo(0, 0); }} />
    </>
  );
}
