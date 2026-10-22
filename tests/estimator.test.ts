import { describe, expect, it } from "vitest";
import { bonusRate, estimate, straightLineThroughTaxYear } from "@/lib/estimator";

const base = {
  propertyType: "multifamily" as const, price: 2_500_000, landShare: 0.2, month: 7, year: 2026,
  contractBeforeJan2025: false, bracket: 0.37, life: 27.5 as const,
};

describe("homepage estimator", () => {
  it("uses 100% bonus after Jan 19, 2025 and the old phase-down before", () => {
    expect(bonusRate(2026, false)).toBe(1);
    expect(bonusRate(2026, true)).toBe(0.2);
    expect(bonusRate(2025, true)).toBe(0.4);
    expect(bonusRate(2024, false)).toBe(0.6);
    expect(bonusRate(2023, false)).toBe(0.8);
    expect(bonusRate(2019, false)).toBe(1);
  });

  it("gives a low-high range from the property type's reclass range", () => {
    const e = estimate(base);
    expect(e.basis).toBe(2_000_000);
    const sl = (12 - 7 + 0.5) / 12 / 27.5;
    expect(e.deduction.low).toBeCloseTo(2_000_000 * 0.14 * (1 - sl), 2);
    expect(e.deduction.high).toBeCloseTo(2_000_000 * 0.26 * (1 - sl), 2);
    expect(e.taxValue.high).toBeCloseTo(e.deduction.high * 0.37, 2);
    expect(e.catchUp).toBe(false);
  });

  it("matches the site FAQ example: $10M apartment, 100% bonus", () => {
    // FAQ: ~$363,636 straight-line year one (10M / 27.5) vs ~$2.2M with a study.
    const e = estimate({ ...base, price: 10_000_000, landShare: 0, month: 1 });
    expect(e.deduction.low).toBeLessThan(1_836_364);
    expect(e.deduction.high).toBeGreaterThan(1_836_364);
  });

  it("treats earlier years as a catch-up, net of depreciation already taken", () => {
    const e = estimate({ ...base, year: 2020, month: 1 });
    expect(e.catchUp).toBe(true);
    const sl = straightLineThroughTaxYear(1, 2020, 27.5);
    expect(sl).toBeCloseTo((11.5 / 12 + 6) / 27.5, 6);
    expect(e.deduction.low).toBeCloseTo(2_000_000 * 0.14 * (1 - sl), 2);
  });

  it("is lower when the deal was under contract before Jan 20, 2025", () => {
    expect(estimate({ ...base, contractBeforeJan2025: true }).deduction.high)
      .toBeLessThan(estimate(base).deduction.high);
  });

  it("never goes negative or breaks on empty input", () => {
    const e = estimate({ ...base, price: 0, landShare: Number.NaN });
    expect(e.deduction).toEqual({ low: 0, high: 0 });
  });
});
