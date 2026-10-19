import { describe, expect, it } from "vitest";
import { deriveValues, straightLineContext } from "@/lib/quote-fields";

describe("one-pager numbers worked out from a provider's own figures", () => {
  it("fills regular depreciation from accelerated minus the extra deduction", () => {
    const { values, calculated } = deriveValues({ firstYearDeduction: 1_640_393, increasedDeduction: 1_533_859 });
    expect(values.regularDepreciation).toBe(106_534);
    expect(calculated).toEqual(["regularDepreciation"]);
  });

  it("works out straight-line from the basis with the mid-month convention, then the extra deduction", () => {
    const sl = straightLineContext({ property_type: "Industrial / warehouse", placed_in_service: "2026-08-27" });
    expect(sl).toEqual({ lifeYears: 39, inServiceMonth: 8 });
    const { values, calculated } = deriveValues({ depreciableBasis: 11_246_250, firstYearDeduction: 2_345_221.13 }, sl);
    expect(values.regularDepreciation).toBeCloseTo(108_137.02, 1);
    expect(values.increasedDeduction).toBeCloseTo(2_237_084.11, 1);
    expect(calculated).toEqual(["regularDepreciation", "increasedDeduction"]);
  });

  it("uses 27.5 years for residential rentals and fills the accelerated total and percent from each other", () => {
    expect(straightLineContext({ property_type: "Multifamily", placed_in_service: new Date("2026-03-18") })?.lifeYears).toBe(27.5);
    expect(deriveValues({ depreciableBasis: 1_000_000, reclassifiedPct: 25 }).values.acceleratedAmount).toBe(250_000);
    expect(deriveValues({ depreciableBasis: 1_000_000, acceleratedAmount: 300_000 }).values.reclassifiedPct).toBe(30);
  });

  it("never overwrites a value the provider gave, and skips a negative straight-line", () => {
    const { values, calculated } = deriveValues({ regularDepreciation: 5, firstYearDeduction: 100, increasedDeduction: 100 });
    expect(values.regularDepreciation).toBe(5);
    expect(calculated).toEqual([]);
    expect(deriveValues({ firstYearDeduction: 100, increasedDeduction: 100 }).values.regularDepreciation).toBeUndefined();
  });
});
