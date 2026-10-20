// Guards that keep made-up numbers off the one-pager when nobody is checking:
// every number the AI reads must be quoted from the proposal, every number in
// the AI summary must be in the table, and each provider's own figures must
// agree with each other.
import { formatValue, type QuoteKey, type QuoteValues } from "./quote-fields";

/** The fields the AI may fill with a number; each needs a quote from the proposal. */
export const EVIDENCE_FIELDS: QuoteKey[] = ["fee", "turnaroundDays", "turnaroundDaysHigh", "depreciableBasis", "regularDepreciation",
  "firstYearDeduction", "firstYearDeductionHigh", "increasedDeduction", "increasedDeductionHigh", "acceleratedAmount",
  "reclassifiedPct", "reclassifiedPctHigh", "firstYearTaxSavings", "firstYearTaxSavingsHigh", "assumedTaxRate", "validDays"];

export type Evidence = { field: string; quote: string; page?: number | null };
export type Rejected = { field: QuoteKey; value: unknown; reason: string };

const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirty: 30, sixty: 60, ninety: 90 };

/** Every number written in a piece of text ("$1,533,859", "37%", "0.37", "four"). */
export function numbersIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\d[\d,]*(?:\.\d+)?/g)) {
    const n = Number(m[0].replace(/,/g, ""));
    if (isFinite(n)) out.push(n);
  }
  for (const w of text.toLowerCase().match(/[a-z]+/g) ?? []) if (WORDS[w] != null) out.push(WORDS[w]);
  return out;
}

const squash = (s: string) => s.toLowerCase().replace(/[\s ]+/g, "").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-");

/** True if the quote states this value, allowing only unit changes (weeks to days, 0.37 to 37%). */
function quoteStates(field: QuoteKey, value: number, quote: string) {
  const close = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.5, Math.abs(b) * 0.00001);
  return numbersIn(quote).some(n =>
    close(n, value)
    || (field.startsWith("turnaround") && /week/i.test(quote) && close(n * 7, value))
    || (field.startsWith("turnaround") && /month/i.test(quote) && close(n * 30, value))
    || ((field === "assumedTaxRate" || field.startsWith("reclassified")) && n < 1 && close(n * 100, value)));
}

/**
 * Keeps an AI-read number only if the AI quoted the proposal for it, the quote
 * really is in the proposal's text, and the quote states that number.
 * Anything else is dropped (the one-pager then shows "Not stated").
 */
export function verifyEvidence(values: QuoteValues, evidence: Evidence[], pdfText: string | null) {
  const kept: QuoteValues = { ...values };
  const rejected: Rejected[] = [];
  const text = pdfText ? squash(pdfText) : null;
  for (const field of EVIDENCE_FIELDS) {
    const value = values[field];
    if (value == null || value === "") continue;
    const quotes = evidence.filter(e => e.field === field && e.quote?.trim());
    let reason = "";
    if (!quotes.length) reason = "the AI gave no quote from the proposal for it";
    else if (!text) reason = "the proposal's text could not be read to check it";
    else if (!quotes.some(q => text.includes(squash(q.quote)))) reason = "the AI's quote is not in the proposal";
    else if (!quotes.some(q => text.includes(squash(q.quote)) && quoteStates(field, Number(value), q.quote))) reason = "the quoted text does not state this number";
    if (reason) { kept[field] = null; rejected.push({ field, value, reason }); }
  }
  return { kept, rejected };
}

type Col = { name: string; values: Record<string, any> };

/** Numbers a summary may mention: anything in the table, plus the purchase price. */
function allowedNumbers(cols: Col[], extra: number[]) {
  const nums = [...extra];
  for (const c of cols) for (const v of Object.values(c.values)) if (typeof v === "number" && isFinite(v)) {
    nums.push(v);
    if (v % 7 === 0) nums.push(v / 7); // turnaround shown in weeks
  }
  return nums;
}

/**
 * The dollar amounts and percents in a summary that are not in the table.
 * "$11.06M" and "$921K" match a table value that rounds to them.
 */
export function summaryProblems(summary: string, cols: Col[], extra: number[] = []) {
  const nums = allowedNumbers(cols, extra);
  const problems: string[] = [];
  for (const m of summary.replace(/per \$1(?![\d,.])/gi, "").matchAll(/\$\s?(\d(?:[\d,]*\d)?(?:\.\d+)?)\s*([MmKk](?![a-z]))?|(\d(?:[\d,]*\d)?(?:\.\d+)?)\s?%/g)) {
    const raw = Number((m[1] ?? m[3]).replace(/,/g, ""));
    const unit = m[2]?.toUpperCase();
    const scale = unit === "M" ? 1e6 : unit === "K" ? 1e3 : 1;
    const decimals = ((m[1] ?? m[3]).split(".")[1] ?? "").length;
    // As written, it must round from a table value: "$11.06M" from 11,062,671, "$820,827" from 820,827.40.
    const tol = 0.5 * 10 ** -decimals * scale + 1e-6;
    const target = raw * scale;
    if (!nums.some(n => Math.abs(n - target) <= tol)) problems.push(m[0].trim());
  }
  return problems;
}

/** Client names or contact details that slipped into a summary. */
export function clientDetailsIn(summary: string, client: { first_name?: string | null; last_name?: string | null; email?: string | null }) {
  const words = [client.first_name, client.last_name].map(w => String(w ?? "").trim()).filter(w => w.length >= 2);
  const found = words.filter(w => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(summary));
  if (client.email && summary.toLowerCase().includes(client.email.toLowerCase())) found.push(client.email);
  return found;
}

export type CheckWarning = { provider: string; message: string };

/** Each provider's own figures checked against each other. */
export function consistencyChecks(cols: Col[]): CheckWarning[] {
  const out: CheckWarning[] = [];
  const money = (n: unknown) => formatValue(n, "money");
  for (const c of cols) {
    const v = c.values;
    const warn = (message: string) => out.push({ provider: c.name, message });
    const rate = Number(v.assumedTaxRate) / 100;
    for (const [inc, ben] of [["increasedDeduction", "firstYearTaxSavings"], ["increasedDeductionHigh", "firstYearTaxSavingsHigh"]] as const) {
      if (v.taxBenefitOn === "extra" && Number(v[inc]) > 0 && rate > 0 && Number(v[ben]) > 0) {
        const expected = Number(v[inc]) * rate;
        if (Math.abs(expected - Number(v[ben])) > Math.max(2, Number(v[ben]) * 0.01)) {
          warn(`Tax benefit ${money(v[ben])} does not equal the extra deduction ${money(v[inc])} × ${v.assumedTaxRate}% (${money(expected)}). It is not ranked.`);
        }
      }
    }
    if (Number(v.firstYearTaxSavings) > 0 && !v.taxBenefitOn) {
      warn("It is not stated whether the tax benefit is on the extra deduction or on all year-1 depreciation, so it is not ranked.");
    }
    if (Number(v.increasedDeduction) > 0 && Math.abs(Number(v.increasedDeduction) - Number(v.firstYearDeduction)) <= 1) {
      warn(`Its "extra" deduction equals its total year-1 depreciation (${money(v.firstYearDeduction)}), so it may include depreciation the client gets without a study.`);
    }
    if (Number(v.firstYearDeduction) > 0 && Number(v.regularDepreciation) > 0 && Number(v.increasedDeduction) > 0
        && Math.abs(Number(v.firstYearDeduction) - Number(v.regularDepreciation) - Number(v.increasedDeduction)) > 2) {
      warn(`Year-1 depreciation with the study (${money(v.firstYearDeduction)}) minus regular depreciation (${money(v.regularDepreciation)}) does not equal the extra deduction (${money(v.increasedDeduction)}).`);
    }
  }
  return out;
}
