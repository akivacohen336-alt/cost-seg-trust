// What a quote can hold: used by the supplier link form and by quotes typed in by hand on the dashboard.
import { z } from "zod";
import { STUDY_TYPES } from "./quote-fields";

export const MAX_PDF = 4 * 1024 * 1024; // hosting limits request bodies to about 4.5 MB

const optNum = (max: number) =>
  z.preprocess(v => (v === "" || v == null ? null : typeof v === "string" ? v.replace(/[$,%\s]/g, "") : v),
    z.coerce.number().finite().min(0).max(max).nullable());
const optBool = z.preprocess(v => (v === "yes" ? true : v === "no" ? false : null), z.boolean().nullable());
const optText = z.preprocess(v => (typeof v === "string" && v.trim() ? v.trim() : null), z.string().max(300).nullable());

export const quoteSchema = z.object({
  fee: optNum(10_000_000),
  studyType: z.preprocess(v => (v ? v : null), z.enum(STUDY_TYPES).nullable()),
  siteVisit: optBool,
  turnaroundDays: optNum(3650),
  turnaroundDaysHigh: optNum(3650),
  reclassifiedPct: optNum(100),
  reclassifiedPctHigh: optNum(100),
  depreciableBasis: optNum(10_000_000_000),
  regularDepreciation: optNum(10_000_000_000),
  firstYearDeduction: optNum(10_000_000_000),
  firstYearDeductionHigh: optNum(10_000_000_000),
  increasedDeduction: optNum(10_000_000_000),
  increasedDeductionHigh: optNum(10_000_000_000),
  acceleratedAmount: optNum(10_000_000_000),
  firstYearTaxSavings: optNum(10_000_000_000),
  firstYearTaxSavingsHigh: optNum(10_000_000_000),
  taxBenefitOn: z.preprocess(v => (v === "extra" || v === "total" ? v : null), z.enum(["extra", "total"]).nullable()),
  assumedTaxRate: optNum(100),
  scopeOfWork: optText,
  auditSupport: optText,
  includesLookback: optBool,
  lookbackNote: optText,
  paymentTerms: optText,
  validDays: optNum(3650),
});
