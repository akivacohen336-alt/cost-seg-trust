import { describe, expect, it } from "vitest";
import { deriveValues } from "@/lib/quote-fields";

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

  it("fills the accelerated dollars and percent from each other", () => {
    expect(deriveValues({ depreciableBasis: 1_000_000, reclassifiedPct: 25 }).values.acceleratedAmount).toBe(250_000);
    expect(deriveValues({ depreciableBasis: 1_000_000, acceleratedAmount: 300_000 }).values.reclassifiedPct).toBe(30);
  });

  it("never overwrites a value the provider gave, and skips a negative result", () => {
    const { values, calculated } = deriveValues({ regularDepreciation: 5, firstYearDeduction: 100, increasedDeduction: 100 });
    expect(values.regularDepreciation).toBe(5);
    expect(calculated).toEqual([]);
    expect(deriveValues({ firstYearDeduction: 100, increasedDeduction: 100 }).values.regularDepreciation).toBeUndefined();
  });
});
