"use client";

import { useEffect } from "react";
import { QUOTE_PATH } from "@/lib/site";

// Older campaign links point at "/#quote-form", where the form used to live.
// Send those visitors straight to the quote page, keeping any UTM tags.
export default function LegacyQuoteAnchor() {
  useEffect(() => {
    if (window.location.hash === "#quote-form") window.location.replace(QUOTE_PATH + window.location.search);
  }, []);
  return null;
}
