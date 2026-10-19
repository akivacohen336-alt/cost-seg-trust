// The standardized quote: what every supplier response is turned into,
// and the rows of the one-page comparison.
export const STUDY_TYPES = ["Full engineering", "Modified / desktop", "Residential / template", "Other"] as const;

export type QuoteFieldKind = "money" | "pct" | "int" | "bool" | "text" | "study";
export type QuoteField = { key: QuoteKey; label: string; kind: QuoteFieldKind; column: string };

export const QUOTE_FIELDS = [
  { key: "fee", label: "Cost of service (study fee)", kind: "money", column: "fee" },
  { key: "studyType", label: "Study type", kind: "study", column: "study_type" },
  { key: "siteVisit", label: "In-person site visit", kind: "bool", column: "site_visit" },
  { key: "turnaroundDays", label: "Turnaround (days)", kind: "int", column: "turnaround_days" },
  { key: "depreciableBasis", label: "Depreciable basis used", kind: "money", column: "depreciable_basis" },
  { key: "regularDepreciation", label: "First-year regular depreciation (without a study)", kind: "money", column: "regular_first_year_depreciation" },
  { key: "firstYearDeduction", label: "First-year accelerated depreciation (with the study)", kind: "money", column: "est_first_year_deduction" },
  { key: "increasedDeduction", label: "Extra first-year deduction from the study", kind: "money", column: "increased_deduction" },
  { key: "acceleratedAmount", label: "Total moved to 5, 7 and 15-year property", kind: "money", column: "accelerated_amount" },
  { key: "reclassifiedPct", label: "% of basis reclassified", kind: "pct", column: "reclassified_pct" },
  { key: "firstYearTaxSavings", label: "First-year tax benefit", kind: "money", column: "est_first_year_tax_savings" },
  { key: "assumedTaxRate", label: "Assumed tax rate", kind: "pct", column: "assumed_tax_rate" },
  { key: "scopeOfWork", label: "Scope of work", kind: "text", column: "scope_of_work" },
  { key: "auditSupport", label: "Audit support", kind: "text", column: "audit_support" },
  { key: "includesLookback", label: "Look-back / Form 3115 included", kind: "bool", column: "includes_lookback" },
  { key: "paymentTerms", label: "Payment terms", kind: "text", column: "payment_terms" },
  { key: "validDays", label: "Quote valid for (days)", kind: "int", column: "valid_days" },
] as const satisfies readonly { key: string; label: string; kind: QuoteFieldKind; column: string }[];

export type QuoteKey = (typeof QUOTE_FIELDS)[number]["key"];
export type QuoteValues = { [K in QuoteKey]?: number | string | boolean | null };

/**
 * Rows on the comparison, in order. The first seven are the items the CEO
 * asked every one-pager to show. `best` marks which value wins a row.
 */
export const COMPARISON_ROWS: { key: QuoteKey | "savingsPerDollar"; label: string; kind: QuoteFieldKind | "ratio" | "days"; best?: "min" | "max" }[] = [
  { key: "firstYearTaxSavings", label: "First-year tax benefit", kind: "money", best: "max" },
  { key: "regularDepreciation", label: "Regular depreciation (year 1, no study)", kind: "money" },
  { key: "firstYearDeduction", label: "Accelerated depreciation (year 1, with study)", kind: "money", best: "max" },
  { key: "fee", label: "Cost of service", kind: "money", best: "min" },
  { key: "scopeOfWork", label: "Scope of work", kind: "text" },
  { key: "siteVisit", label: "In-person site visit", kind: "bool" },
  { key: "acceleratedAmount", label: "Overall accelerated (moved to 5, 7, 15-yr)", kind: "money", best: "max" },
  { key: "reclassifiedPct", label: "% of basis accelerated", kind: "pct", best: "max" },
  { key: "increasedDeduction", label: "Extra year-1 deduction from the study", kind: "money", best: "max" },
  { key: "depreciableBasis", label: "Depreciable basis used", kind: "money" },
  { key: "assumedTaxRate", label: "Tax rate assumed", kind: "pct" },
  { key: "savingsPerDollar", label: "Tax benefit per $1 of fee", kind: "ratio", best: "max" },
  { key: "turnaroundDays", label: "Turnaround", kind: "days", best: "min" },
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

/** What the deal tells us for working out regular (straight-line) depreciation. */
export type StraightLineContext = { lifeYears: number; inServiceMonth: number } | null;

export function straightLineContext(deal: { property_type?: string | null; placed_in_service?: unknown }): StraightLineContext {
  if (deal.placed_in_service == null) return null;
  const iso = deal.placed_in_service instanceof Date ? deal.placed_in_service.toISOString() : String(deal.placed_in_service);
  const month = Number(iso.slice(5, 7));
  if (!(month >= 1 && month <= 12)) return null;
  // Long-term residential rentals are 27.5-year property; everything else,
  // short-term rentals included, is 39-year.
  const residential = /^(single-family rental|multifamily)$/i.test(deal.property_type ?? "");
  return { lifeYears: residential ? 27.5 : 39, inServiceMonth: month };
}

const has = (v: unknown) => v != null && v !== "" && isFinite(Number(v));

/**
 * Fills the first-year numbers a provider left out but that follow from the
 * ones they gave (accelerated = regular + extra deduction), and works out
 * regular depreciation from the provider's basis when they didn't state it.
 * Returns the filled values and the keys that were calculated by us.
 */
export function deriveValues(v: QuoteValues, sl: StraightLineContext = null) {
  const out: QuoteValues = { ...v };
  const calculated: QuoteKey[] = [];
  const set = (k: QuoteKey, n: number) => { out[k] = Math.round(n * 100) / 100; calculated.push(k); };
  if (!has(out.regularDepreciation) && has(out.firstYearDeduction) && has(out.increasedDeduction)
      && Number(out.firstYearDeduction) > Number(out.increasedDeduction)) {
    set("regularDepreciation", Number(out.firstYearDeduction) - Number(out.increasedDeduction));
  }
  if (!has(out.regularDepreciation) && has(out.depreciableBasis) && sl) {
    // Mid-month convention: the year it's placed in service gets (12.5 - month) / 12 of a year.
    set("regularDepreciation", Number(out.depreciableBasis) / sl.lifeYears * (12.5 - sl.inServiceMonth) / 12);
  }
  if (!has(out.firstYearDeduction) && has(out.regularDepreciation) && has(out.increasedDeduction)) {
    set("firstYearDeduction", Number(out.regularDepreciation) + Number(out.increasedDeduction));
  }
  if (!has(out.increasedDeduction) && has(out.firstYearDeduction) && has(out.regularDepreciation)) {
    set("increasedDeduction", Number(out.firstYearDeduction) - Number(out.regularDepreciation));
  }
  if (!has(out.acceleratedAmount) && has(out.reclassifiedPct) && has(out.depreciableBasis)) {
    set("acceleratedAmount", Number(out.depreciableBasis) * Number(out.reclassifiedPct) / 100);
  }
  if (!has(out.reclassifiedPct) && has(out.acceleratedAmount) && Number(out.depreciableBasis) > 0) {
    set("reclassifiedPct", Number(out.acceleratedAmount) / Number(out.depreciableBasis) * 100);
  }
  return { values: out, calculated };
}
