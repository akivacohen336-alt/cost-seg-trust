// The standardized quote: what every supplier response is turned into,
// and the rows of the one-page comparison.
export const STUDY_TYPES = ["Full engineering", "Modified / desktop", "Residential / template", "Other"] as const;

export type QuoteFieldKind = "money" | "pct" | "int" | "bool" | "text" | "study";
export type QuoteField = { key: QuoteKey; label: string; kind: QuoteFieldKind; column: string };

export const QUOTE_FIELDS = [
  { key: "fee", label: "Study fee", kind: "money", column: "fee" },
  { key: "studyType", label: "Study type", kind: "study", column: "study_type" },
  { key: "siteVisit", label: "Site visit included", kind: "bool", column: "site_visit" },
  { key: "turnaroundDays", label: "Turnaround (days)", kind: "int", column: "turnaround_days" },
  { key: "reclassifiedPct", label: "% of basis reclassified", kind: "pct", column: "reclassified_pct" },
  { key: "firstYearDeduction", label: "Est. first-year deduction", kind: "money", column: "est_first_year_deduction" },
  { key: "firstYearTaxSavings", label: "Est. first-year tax savings", kind: "money", column: "est_first_year_tax_savings" },
  { key: "assumedTaxRate", label: "Assumed tax rate", kind: "pct", column: "assumed_tax_rate" },
  { key: "auditSupport", label: "Audit support", kind: "text", column: "audit_support" },
  { key: "includesLookback", label: "Look-back / Form 3115 included", kind: "bool", column: "includes_lookback" },
  { key: "paymentTerms", label: "Payment terms", kind: "text", column: "payment_terms" },
  { key: "validDays", label: "Quote valid for (days)", kind: "int", column: "valid_days" },
] as const satisfies readonly { key: string; label: string; kind: QuoteFieldKind; column: string }[];

export type QuoteKey = (typeof QUOTE_FIELDS)[number]["key"];
export type QuoteValues = { [K in QuoteKey]?: number | string | boolean | null };

/** Rows on the comparison, in order. `best` marks which value wins a row. */
export const COMPARISON_ROWS: { key: QuoteKey | "savingsPerDollar"; label: string; kind: QuoteFieldKind | "ratio" | "days"; best?: "min" | "max" }[] = [
  { key: "fee", label: "Study fee", kind: "money", best: "min" },
  { key: "studyType", label: "Study type", kind: "text" },
  { key: "siteVisit", label: "Site visit", kind: "bool" },
  { key: "turnaroundDays", label: "Turnaround", kind: "days", best: "min" },
  { key: "reclassifiedPct", label: "% reclassified", kind: "pct", best: "max" },
  { key: "firstYearDeduction", label: "Est. first-year deduction", kind: "money", best: "max" },
  { key: "firstYearTaxSavings", label: "Est. first-year tax savings", kind: "money", best: "max" },
  { key: "savingsPerDollar", label: "Savings per $1 of fee", kind: "ratio", best: "max" },
  { key: "auditSupport", label: "Audit support", kind: "text" },
  { key: "includesLookback", label: "Look-back / 3115", kind: "bool" },
  { key: "paymentTerms", label: "Payment terms", kind: "text" },
  { key: "validDays", label: "Quote valid for", kind: "days" },
];

export function formatValue(v: unknown, kind: string): string {
  if (v == null || v === "" || (typeof v === "number" && !isFinite(v))) return "—";
  switch (kind) {
    case "money": return "$" + Math.round(Number(v)).toLocaleString("en-US");
    case "pct": return `${Number(v).toFixed(Number(v) % 1 ? 1 : 0)}%`;
    case "days": case "int": return kind === "days" ? `${v} days` : String(v);
    case "bool": return v === true ? "Yes" : v === false ? "No" : "—";
    case "ratio": return "$" + Number(v).toFixed(1);
    default: return String(v);
  }
}

/** Reads a supplier_quotes row into standardized values. */
export function rowToValues(row: Record<string, any>): QuoteValues {
  const out: QuoteValues = {};
  for (const f of QUOTE_FIELDS) {
    const v = row[f.column];
    out[f.key] = v == null ? null : f.kind === "money" || f.kind === "pct" || f.kind === "int" ? Number(v) : v;
  }
  return out;
}

export const savingsPerDollar = (v: QuoteValues) => {
  const fee = Number(v.fee), sav = Number(v.firstYearTaxSavings);
  return fee > 0 && sav > 0 ? sav / fee : null;
};
