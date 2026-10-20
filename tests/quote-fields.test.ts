import { describe, expect, it } from "vitest";
import { bestValues, cellText, ALL_COMPARISON_ROWS, deriveValues, withRatios } from "@/lib/quote-fields";

describe("one-pager numbers worked out only from a provider's own figures", () => {
  it("fills regular depreciation from accelerated minus the extra deduction", () => {
    const { values, calculated } = deriveValues({ firstYearDeduction: 1_640_393, increasedDeduction: 1_533_859 });
    expect(values.regularDepreciation).toBe(106_534);
    expect(calculated).toEqual(["regularDepreciation"]);
  });

  it("never estimates straight-line from a basis: a missing number stays blank", () => {
    const { values, calculated } = deriveValues({ depreciableBasis: 11_246_250, firstYearDeduction: 2_345_221.13 });
    expect(values.regularDepreciation).toBeUndefined();
    expect(values.increasedDeduction).toBeUndefined();
    expect(calculated).toEqual([]);
  });

  it("fills the percent from exact dollars, never dollars from a rounded percent", () => {
    expect(deriveValues({ depreciableBasis: 1_000_000, reclassifiedPct: 25 }).values.acceleratedAmount).toBeUndefined(); // a rounded percent never becomes dollars
    expect(deriveValues({ depreciableBasis: 1_000_000, acceleratedAmount: 300_000 }).values.reclassifiedPct).toBe(30);
  });

  it("never overwrites a value the provider gave, and skips a negative result", () => {
    const { values, calculated } = deriveValues({ regularDepreciation: 5, firstYearDeduction: 100, increasedDeduction: 100 });
    expect(values.regularDepreciation).toBe(5);
    expect(calculated).toEqual([]);
    expect(deriveValues({ firstYearDeduction: 100, increasedDeduction: 100 }).values.regularDepreciation).toBeUndefined();
  });
});

describe("tax benefits on the one-pager are only compared when they are comparable", () => {
  const row = (k: string) => ALL_COMPARISON_ROWS.find(r => r.key === k)!;
  // The Tacoma quotes: CSSI gives a range on the extra deduction; SegPro taxes all year-1 depreciation.
  const cssi = withRatios({ fee: 8550, firstYearTaxSavings: 567_528, firstYearTaxSavingsHigh: 920_785, taxBenefitOn: "extra" as const });
  const segpro = withRatios({ fee: 8900, firstYearTaxSavings: 820_827.4, taxBenefitOn: "total" as const });

  it("shows a range, and labels a benefit that includes regular depreciation", () => {
    expect(cellText(cssi, row("firstYearTaxSavings"))).toBe("$567,528 – $920,785 (tax on the extra deduction from the study)");
    expect(cellText(segpro, row("firstYearTaxSavings"))).toBe("$820,827 (tax on all year-1 depreciation, regular depreciation included)");
    expect(cellText(cssi, row("savingsPerDollar"))).toBe("$66.4 – $107.7");
    expect(cellText(segpro, row("savingsPerDollar"))).toBe("Not comparable (benefit includes regular depreciation)");
  });

  it("never ranks a benefit that includes regular depreciation", () => {
    expect(bestValues([{ values: cssi }, { values: segpro }], ALL_COMPARISON_ROWS).savingsPerDollar).toBeUndefined();
  });

  it("ranks benefit per $1 only when one provider beats the others' high end", () => {
    const sta = withRatios({ fee: 40_000, firstYearTaxSavings: 4_091_381, taxBenefitOn: "extra" as const });
    const cssiPortfolio = withRatios({ fee: 38_000, firstYearTaxSavings: 2_103_248, firstYearTaxSavingsHigh: 3_105_796, taxBenefitOn: "extra" as const });
    expect(bestValues([{ values: sta }, { values: cssiPortfolio }], ALL_COMPARISON_ROWS).savingsPerDollar).toBeCloseTo(102.28, 1);
    const close = withRatios({ fee: 38_000, firstYearTaxSavings: 2_103_248, firstYearTaxSavingsHigh: 4_500_000, taxBenefitOn: "extra" as const });
    expect(bestValues([{ values: sta }, { values: close }], ALL_COMPARISON_ROWS).savingsPerDollar).toBeUndefined();
  });
});

describe("turnaround and Form 3115", () => {
  const row = (k: string) => ALL_COMPARISON_ROWS.find(r => r.key === k)!;
  it("shows a delivery range in weeks and only greens a provider that is faster outright", () => {
    const cssi = { turnaroundDays: 28, turnaroundDaysHigh: 42 }, segpro = { turnaroundDays: 28 };
    expect(cellText(cssi, row("turnaroundDays"))).toBe("4 to 6 weeks");
    expect(cellText(segpro, row("turnaroundDays"))).toBe("4 weeks");
    expect(bestValues([{ values: cssi }, { values: segpro }], ALL_COMPARISON_ROWS).turnaroundDays).toBeUndefined();
    expect(bestValues([{ values: cssi }, { values: { turnaroundDays: 21 } }], ALL_COMPARISON_ROWS).turnaroundDays).toBe(21);
  });
  it("shows the provider's own reason when Form 3115 is not needed", () => {
    expect(cellText({ lookbackNote: "Not needed (placed in service in 2026)" }, row("includesLookback"))).toBe("Not needed (placed in service in 2026)");
    expect(cellText({ includesLookback: true }, row("includesLookback"))).toBe("Yes");
  });
});
