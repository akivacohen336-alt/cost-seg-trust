// The safety checks on the one-pager, run against the two real comparisons Akiva
// reviewed line by line, plus the mistakes we already made once and must not repeat.
import { describe, expect, it } from "vitest";
import { ALL_COMPARISON_ROWS, COMPARISON_ROWS, bestValues, cellText, deriveValues, withRatios, type QuoteValues } from "@/lib/quote-fields";
import { consistencyChecks, numbersIn, summaryProblems, verifyEvidence } from "@/lib/checks";
import { fallbackSummary } from "@/lib/ai";
import { P, PS, T, TS } from "./one-pager-data";

const build = (cols: { name: string; v: QuoteValues }[]) => cols.map(c => ({ name: c.name, values: withRatios(deriveValues(c.v).values) as Record<string, any> }));
const row = (key: string) => ALL_COMPARISON_ROWS.find(r => r.key === key)!;
const cells = (cols: ReturnType<typeof build>, key: string) => cols.map(c => cellText(c.values, row(key)));

describe("Tacoma one-pager", () => {
  const cols = build(T);
  it("shows each figure as the proposal states it", () => {
    expect(cells(cols, "firstYearTaxSavings")).toEqual(["$567,528 – $920,785 (tax on the extra deduction from the study)", "$820,827 (tax on all year-1 depreciation, regular depreciation included)", "$1,262,690 (tax on all year-1 depreciation, regular depreciation included)"]);
    expect(cells(cols, "increasedDeduction")).toEqual(["$1,533,859 – $2,488,608", cellText({}, row("increasedDeduction")), "$3,124,310"]);
    expect(cells(cols, "turnaroundDays")).toEqual(["4 to 6 weeks", "4 weeks", "3 to 4 weeks"]);
    expect(cells(cols, "assumedTaxRate")[2]).toBe(cellText({}, row("assumedTaxRate"))); // CRE never states its rate
    expect(cells(cols, "acceleratedAmount")[2]).toBe("$3,206,528");
    expect(cells(cols, "savingsPerDollar")[1]).toBe("Not comparable (benefit includes regular depreciation)");
    expect(cells(cols, "includesLookback")[0]).toBe("Not needed (placed in service in 2026)");
  });
  it("marks green only an outright winner", () => {
    expect(bestValues(cols, COMPARISON_ROWS)).toEqual({ fee: 8550 });
  });
  it("finds nothing that fails to add up", () => {
    expect(consistencyChecks(cols)).toEqual([]);
  });
  it("flags summary numbers that are not in the table, so a person confirms them against the proposal", () => {
    expect(summaryProblems(TS, cols)).toEqual(["26.22%", "25%", "25%"]); // land values, from the proposals, not table rows
  });
});

describe("8-property portfolio one-pager", () => {
  const cols = build(P);
  it("never shows SegPro's year-end total as an extra deduction", () => {
    expect(cells(cols, "increasedDeduction")[2]).toBe(cellText({}, row("increasedDeduction")));
    expect(cells(cols, "acceleratedAmount")[2]).toBe("$8,044,231");
    expect(cells(cols, "reclassifiedPct")[2]).toBe("24.1%");
    expect(cells(cols, "savingsPerDollar")[2]).toBe("Not comparable (benefit includes regular depreciation)");
  });
  it("ranks per-$1 only among benefits on the same basis", () => {
    expect(bestValues(cols, ALL_COMPARISON_ROWS)).toEqual({ fee: 38000, savingsPerDollar: 4_091_381.25 / 40_000 });
  });
  it("leaves off the rows the CEO removed", () => {
    expect(COMPARISON_ROWS.some(r => ["reclassifiedPct", "increasedDeduction", "savingsPerDollar"].includes(r.key))).toBe(false);
    expect(bestValues(cols, COMPARISON_ROWS)).toEqual({ fee: 38000 });
  });
  it("finds nothing that fails to add up, and the approved summary uses only table numbers", () => {
    expect(consistencyChecks(cols)).toEqual([]);
    expect(summaryProblems(PS, cols)).toEqual([]);
  });
  it("catches the wrong figures from the first draft", () => {
    expect(summaryProblems("SegPro's extra deduction is $8,191,819, or 24.5% of basis.", cols)).toEqual(["$8,191,819", "24.5%"]);
  });
  it("writes a standard summary with no number outside the table", () => {
    const best = bestValues(cols, COMPARISON_ROWS);
    const s = fallbackSummary("multifamily", cols as any, best);
    expect(s).toContain("SegPro Solutions gives a benefit that cannot be compared");
    expect(summaryProblems(s, cols)).toEqual([]);
  });
});

describe("figures that don't add up", () => {
  it("warns and stops ranking a benefit that isn't deduction × tax rate", () => {
    const cols = build([{ name: "X", v: { fee: 5000, increasedDeduction: 1_000_000, assumedTaxRate: 37, firstYearTaxSavings: 500_000, taxBenefitOn: "extra" } }]);
    expect(consistencyChecks(cols)[0].message).toMatch(/does not equal the extra deduction/);
    expect(cells(cols, "savingsPerDollar")[0]).toBe("Not comparable (benefit does not match deduction × tax rate)");
  });
  it("warns when an 'extra' deduction equals total year-1 depreciation", () => {
    const cols = build([{ name: "X", v: { increasedDeduction: 900_000, firstYearDeduction: 900_000 } }]);
    expect(consistencyChecks(cols).map(c => c.message).join()).toMatch(/may include depreciation the client gets without a study/);
  });
  it("warns when it isn't stated what the benefit is figured on", () => {
    const cols = build([{ name: "X", v: { fee: 5000, firstYearTaxSavings: 100_000 } }]);
    expect(consistencyChecks(cols)[0].message).toMatch(/not stated whether/);
    expect(bestValues(cols, ALL_COMPARISON_ROWS).savingsPerDollar).toBeUndefined();
  });
});

describe("AI reads only what the proposal says", () => {
  const text = "Study Fee: $8,550\nDelivery in 4-6 weeks\nEstimated tax savings of $567,528 at a 0.37 rate";
  it("keeps numbers whose quote is in the proposal, allowing only unit changes", () => {
    const r = verifyEvidence({ fee: 8550, turnaroundDays: 28, firstYearTaxSavings: 567528, assumedTaxRate: 37 }, [
      { field: "fee", quote: "Study  fee: $8,550" }, { field: "turnaroundDays", quote: "Delivery in 4-6 weeks" },
      { field: "firstYearTaxSavings", quote: "tax savings of $567,528" }, { field: "assumedTaxRate", quote: "at a 0.37 rate" },
    ], text);
    expect(r.rejected).toEqual([]);
    expect(r.kept.fee).toBe(8550);
  });
  it("drops a number with no quote, a quote not in the proposal, or a quote that says something else", () => {
    const r = verifyEvidence({ fee: 8550, firstYearTaxSavings: 600000, depreciableBasis: 11_062_671, firstYearDeduction: 1_640_393 }, [
      { field: "firstYearTaxSavings", quote: "tax savings of $567,528" },
      { field: "depreciableBasis", quote: "Depreciable basis $11,062,671" },
    ], text);
    expect(r.kept).toMatchObject({ fee: null, firstYearTaxSavings: null, depreciableBasis: null, firstYearDeduction: null });
    expect(r.rejected.map(x => [x.field, x.reason])).toEqual([
      ["fee", "the AI gave no quote from the proposal for it"],
      ["depreciableBasis", "the AI's quote is not in the proposal"],
      ["firstYearDeduction", "the AI gave no quote from the proposal for it"],
      ["firstYearTaxSavings", "the quoted text does not state this number"],
    ]);
  });
  it("drops everything when the proposal's text can't be read", () => {
    const r = verifyEvidence({ fee: 8550 }, [{ field: "fee", quote: "Study Fee: $8,550" }], null);
    expect(r.kept.fee).toBeNull();
  });
  it("reads numbers written as words", () => {
    expect(numbersIn("four to six weeks, $1,533,859")).toEqual(expect.arrayContaining([4, 6, 1533859]));
  });
});
