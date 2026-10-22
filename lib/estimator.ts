// Rough cost segregation estimate for the homepage calculator.
// Everything here is a published assumption, not a provider quote: the
// reclass ranges are general industry ranges, and the result is always a
// low-high range. Real figures only come from a provider's proposal.

/** The tax year the estimate is figured for (a study done now is claimed on this return). */
export const TAX_YEAR = 2026;
export const FIRST_YEAR = 2018;

export type PropertyTypeKey =
  | "multifamily" | "small-rental" | "short-term-rental" | "office" | "retail"
  | "industrial" | "self-storage" | "hotel" | "medical" | "restaurant" | "other";

/**
 * Share of the depreciable building basis a study commonly moves into
 * 5-, 7- and 15-year property. General industry ranges, not any provider's figures.
 */
export const PROPERTY_TYPES: { key: PropertyTypeKey; label: string; typical: number; low: number; high: number; life: 27.5 | 39 }[] = [
  { key: "multifamily", label: "Multifamily (5+ units)", typical: 0.18, low: 0.14, high: 0.26, life: 27.5 },
  { key: "small-rental", label: "Single-family or 2-4 unit rental", typical: 0.22, low: 0.15, high: 0.30, life: 27.5 },
  { key: "short-term-rental", label: "Short-term rental (Airbnb)", typical: 0.28, low: 0.20, high: 0.35, life: 39 },
  { key: "office", label: "Office", typical: 0.17, low: 0.10, high: 0.25, life: 39 },
  { key: "retail", label: "Retail / shopping center", typical: 0.22, low: 0.15, high: 0.30, life: 39 },
  { key: "industrial", label: "Industrial / warehouse", typical: 0.17, low: 0.10, high: 0.25, life: 39 },
  { key: "self-storage", label: "Self-storage", typical: 0.33, low: 0.25, high: 0.40, life: 39 },
  { key: "hotel", label: "Hotel / motel", typical: 0.28, low: 0.20, high: 0.35, life: 39 },
  { key: "medical", label: "Medical office", typical: 0.22, low: 0.15, high: 0.30, life: 39 },
  { key: "restaurant", label: "Restaurant", typical: 0.30, low: 0.20, high: 0.40, life: 39 },
  { key: "other", label: "Other commercial", typical: 0.20, low: 0.10, high: 0.30, life: 39 },
];

export const BRACKETS = [0.24, 0.32, 0.35, 0.37] as const;

export interface EstimateInput {
  propertyType: PropertyTypeKey;
  price: number;
  /** Share of the price that is land (never depreciable), 0-1. */
  landShare: number;
  /** 1-12 */
  month: number;
  year: number;
  /** Bought or under binding contract before Jan 20, 2025 (old bonus phase-down applies). */
  contractBeforeJan2025: boolean;
  bracket: number;
  life: 27.5 | 39;
}

export interface Estimate {
  basis: number;
  bonusRate: number;
  /** Placed in service before the tax year: the deduction is a Form 3115 catch-up. */
  catchUp: boolean;
  deduction: { low: number; high: number };
  taxValue: { low: number; high: number };
}

/**
 * Bonus depreciation rate for property placed in service in `year`.
 * 100% for 2018-2022; TCJA phase-down after that, except the One Big Beautiful
 * Bill Act restored 100% for property acquired after January 19, 2025.
 */
export function bonusRate(year: number, contractBeforeJan2025: boolean): number {
  if (year <= 2022) return 1;
  if (year === 2023) return 0.8;
  if (year === 2024) return 0.6;
  if (!contractBeforeJan2025) return 1;
  if (year === 2025) return 0.4;
  if (year === 2026) return 0.2;
  return 0;
}

/**
 * Straight-line depreciation (mid-month convention) the building would have
 * taken from the month it was placed in service through the end of TAX_YEAR,
 * as a share of basis.
 */
export function straightLineThroughTaxYear(month: number, year: number, life: number): number {
  const firstYear = (12 - month + 0.5) / 12;
  return Math.min(1, (firstYear + Math.max(0, TAX_YEAR - year)) / life);
}

/**
 * Extra deduction a study adds on the TAX_YEAR return: the reclassified basis
 * taken as bonus, minus the straight-line depreciation that same basis gets
 * (or already got) without a study. The part not covered by bonus is left
 * out, which keeps partial-bonus years on the low side.
 */
export function estimate(input: EstimateInput): Estimate {
  const price = Math.max(0, input.price || 0);
  const land = Math.min(0.9, Math.max(0, input.landShare || 0));
  const basis = price * (1 - land);
  const type = PROPERTY_TYPES.find(t => t.key === input.propertyType) ?? PROPERTY_TYPES[0];
  const rate = bonusRate(input.year, input.contractBeforeJan2025);
  const sl = straightLineThroughTaxYear(input.month, input.year, input.life);
  const extra = (share: number) => Math.max(0, basis * share * (rate - sl));
  const deduction = { low: extra(type.low), high: extra(type.high) };
  return {
    basis,
    bonusRate: rate,
    catchUp: input.year < TAX_YEAR,
    deduction,
    taxValue: { low: deduction.low * input.bracket, high: deduction.high * input.bracket },
  };
}

/** Rounds an estimate to a sensible figure so it doesn't look more exact than it is. */
export function roundEstimate(n: number): number {
  if (n >= 1_000_000) return Math.round(n / 10_000) * 10_000;
  if (n >= 100_000) return Math.round(n / 1_000) * 1_000;
  return Math.round(n / 100) * 100;
}
