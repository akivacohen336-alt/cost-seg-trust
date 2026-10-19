// The standardized quote: what every supplier response is turned into,
// and the rows of the one-page comparison.
export const STUDY_TYPES = ["Full engineering", "Modified / desktop", "Residential / template", "Other"] as const;

export type QuoteFieldKind = "money" | "pct" | "int" | "bool" | "text" | "study" | "benefitOn";
/** What a provider's tax benefit is figured on. Only "extra" compares across providers. */
export const BENEFIT_ON = { extra: "Extra deduction from the study", total: "All year-1 depreciation (regular portion included)" } as const;
export type QuoteField = { key: QuoteKey; label: string; kind: QuoteFieldKind; column: string };

export const QUOTE_FIELDS = [
  { key: "fee", label: "Cost of service (study fee)", kind: "money", column: "fee" },
  { key: "studyType", label: "Study type", kind: "study", column: "study_type" },
  { key: "siteVisit", label: "In-person site visit", kind: "bool", column: "site_visit" },
  { key: "turnaroundDays", label: "Turnaround (days)", kind: "int", column: "turnaround_days" },
  { key: "depreciableBasis", label: "Depreciable basis used", kind: "money", column: "depreciable_basis" },
  { key: "regularDepreciation", label: "First-year regular depreciation (without a study)", kind: "money", column: "regular_first_year_depreciation" },
  { key: "firstYearDeduction", label: "First-year accelerated depreciation (with the study)", kind: "money", column: "est_first_year_deduction" },
  { key: "firstYearDeductionHigh", label: "First-year accelerated depreciation, high end (if a range)", kind: "money", column: "est_first_year_deduction_high" },
  { key: "increasedDeduction", label: "Extra first-year deduction from the study", kind: "money", column: "increased_deduction" },
  { key: "increasedDeductionHigh", label: "Extra first-year deduction, high end (if a range)", kind: "money", column: "increased_deduction_high" },
  { key: "acceleratedAmount", label: "Total moved to 5, 7 and 15-year property", kind: "money", column: "accelerated_amount" },
  { key: "reclassifiedPct", label: "% of basis reclassified", kind: "pct", column: "reclassified_pct" },
  { key: "reclassifiedPctHigh", label: "% of basis reclassified, high end (if a range)", kind: "pct", column: "reclassified_pct_high" },
  { key: "firstYearTaxSavings", label: "First-year tax benefit", kind: "money", column: "est_first_year_tax_savings" },
  { key: "firstYearTaxSavingsHigh", label: "First-year tax benefit, high end (if a range)", kind: "money", column: "est_first_year_tax_savings_high" },
  { key: "taxBenefitOn", label: "Tax benefit is figured on", kind: "benefitOn", column: "tax_benefit_on" },
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
 * asked every one-pager to show. Only rows that compare like with like get a
 * winner (`best`): providers estimate benefits on their own basis and tax
 * rate, so the benefit rows carry a note instead of a highlight.
 */
export type ComparisonRow = { key: QuoteKey | "savingsPerDollar"; label: string; kind: QuoteFieldKind | "ratio" | "days"; best?: "min" | "max"; note?: string };
export const BASIS_NOTE = "Each provider's own estimate, on its own depreciable basis and tax rate (see those rows). Different land values account for much of the gap, not only a better study.";
export const YEAR1_NOTE = "With 100% bonus, year-1 depreciation with the study = basis moved to 5, 7 and 15-year property + regular depreciation on the rest.";
export const COMPARISON_ROWS: ComparisonRow[] = [
  { key: "firstYearTaxSavings", label: "First-year tax benefit", kind: "money", note: BASIS_NOTE },
  { key: "regularDepreciation", label: "Regular depreciation, year 1 (no study)", kind: "money" },
  { key: "firstYearDeduction", label: "Total year-1 depreciation with the study", kind: "money", note: YEAR1_NOTE },
  { key: "fee", label: "Cost of service", kind: "money", best: "min" },
  { key: "scopeOfWork", label: "Scope of work", kind: "text" },
  { key: "siteVisit", label: "In-person site visit", kind: "bool" },
  { key: "acceleratedAmount", label: "Basis moved to 5, 7 and 15-year property", kind: "money", note: YEAR1_NOTE },
  { key: "reclassifiedPct", label: "% of basis moved", kind: "pct" },
  { key: "increasedDeduction", label: "Extra year-1 deduction vs. no study", kind: "money", note: BASIS_NOTE },
  { key: "depreciableBasis", label: "Depreciable basis used", kind: "money" },
  { key: "assumedTaxRate", label: "Tax rate assumed", kind: "pct" },
  { key: "savingsPerDollar", label: "Tax benefit per $1 of fee", kind: "ratio", best: "max", note: BASIS_NOTE },
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

/** Tax benefit per $1 of fee, low and high end. Not given when the benefit includes regular depreciation. */
export const savingsPerDollar = (v: QuoteValues) => {
  const fee = Number(v.fee), sav = Number(v.firstYearTaxSavings);
  return v.taxBenefitOn !== "total" && fee > 0 && sav > 0 ? sav / fee : null;
};
export const savingsPerDollarHigh = (v: QuoteValues) => {
  const fee = Number(v.fee), high = Number(v.firstYearTaxSavingsHigh);
  return savingsPerDollar(v) != null && high > 0 ? high / fee : null;
};
export const withRatios = <T extends QuoteValues>(v: T) => ({ ...v, savingsPerDollar: savingsPerDollar(v), savingsPerDollarHigh: savingsPerDollarHigh(v) });

const TOTAL_NOTE = "tax on all year-1 depreciation; regular portion not stated";
/** Rows a provider may give as a conservative-to-high range, and where the high end is kept. */
export const HIGH_END: Record<string, QuoteKey> = {
  firstYearTaxSavings: "firstYearTaxSavingsHigh", firstYearDeduction: "firstYearDeductionHigh",
  increasedDeduction: "increasedDeductionHigh", reclassifiedPct: "reclassifiedPctHigh",
};

/** The text a comparison cell shows: "low – high" when the provider gave a range, plus the tax-benefit caveat. Empty is "—". */
export function cellText(values: Record<string, any>, row: { key: string; kind: string }): string {
  const v = values[row.key];
  const high = HIGH_END[row.key] ? values[HIGH_END[row.key]] : null;
  const range = v != null && high > v ? `${formatValue(v, row.kind)} – ${formatValue(high, row.kind)}` : formatValue(v, row.kind);
  if (row.key === "firstYearTaxSavings") {
    if (v == null) return "—";
    return values.taxBenefitOn === "total" ? `${range} (${TOTAL_NOTE})` : range;
  }
  if (row.key === "savingsPerDollar") {
    if (values.taxBenefitOn === "total" && values.firstYearTaxSavings != null) return "Not comparable (benefit includes regular depreciation)";
    if (v == null) return "—";
    return values.savingsPerDollarHigh > v ? `${formatValue(v, "ratio")} – ${formatValue(values.savingsPerDollarHigh, "ratio")}` : formatValue(v, "ratio");
  }
  return range;
}

/**
 * The winning value of each ranked row. A provider wins only if it beats every
 * other provider even at their best (high end of a range); otherwise the row
 * has no winner. Benefits that include regular depreciation never compete.
 */
export function bestValues(columns: { values: Record<string, any> }[], rows: { key: string; best?: "min" | "max" }[]) {
  const best: Record<string, number> = {};
  for (const r of rows) {
    if (!r.best) continue;
    const highKey = r.key === "savingsPerDollar" ? "savingsPerDollarHigh" : null;
    const vals = columns.map(c => {
      const low = Number(c.values[r.key]);
      const high = highKey && Number(c.values[highKey]) > low ? Number(c.values[highKey]) : low;
      return { low, high };
    }).filter(x => isFinite(x.low) && x.low > 0);
    if (vals.length < 2) continue;
    if (r.best === "min") {
      best[r.key] = Math.min(...vals.map(x => x.low));
    } else {
      for (const x of vals) if (vals.every(o => o === x || x.low > o.high)) best[r.key] = x.low;
    }
  }
  return best;
}

const has = (v: unknown) => v != null && v !== "" && isFinite(Number(v));

/**
 * Fills a number a provider left out only when it is plain arithmetic on
 * numbers that same provider gave (accelerated = regular + extra deduction,
 * percent = dollars / basis). Nothing is estimated, assumed or rounded in. Returns the
 * filled values and the keys that were calculated.
 */
export function deriveValues(v: QuoteValues) {
  const out: QuoteValues = { ...v };
  const calculated: QuoteKey[] = [];
  const set = (k: QuoteKey, n: number) => { out[k] = Math.round(n * 100) / 100; calculated.push(k); };
  if (!has(out.regularDepreciation) && has(out.firstYearDeduction) && has(out.increasedDeduction)
      && Number(out.firstYearDeduction) > Number(out.increasedDeduction)) {
    set("regularDepreciation", Number(out.firstYearDeduction) - Number(out.increasedDeduction));
  }
  if (!has(out.firstYearDeduction) && has(out.regularDepreciation) && has(out.increasedDeduction)) {
    set("firstYearDeduction", Number(out.regularDepreciation) + Number(out.increasedDeduction));
  }
  if (!has(out.increasedDeduction) && has(out.firstYearDeduction) && has(out.regularDepreciation)) {
    set("increasedDeduction", Number(out.firstYearDeduction) - Number(out.regularDepreciation));
  }
  if (has(out.regularDepreciation)) {
    const reg = Number(out.regularDepreciation);
    if (!has(out.increasedDeductionHigh) && Number(out.firstYearDeductionHigh) > reg) set("increasedDeductionHigh", Number(out.firstYearDeductionHigh) - reg);
    if (!has(out.firstYearDeductionHigh) && has(out.increasedDeductionHigh)) set("firstYearDeductionHigh", reg + Number(out.increasedDeductionHigh));
  }
  if (!has(out.reclassifiedPct) && has(out.acceleratedAmount) && Number(out.depreciableBasis) > 0) {
    set("reclassifiedPct", Number(out.acceleratedAmount) / Number(out.depreciableBasis) * 100);
  }
  return { values: out, calculated };
}
