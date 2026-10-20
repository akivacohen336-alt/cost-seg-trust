// The real comparisons Akiva reviewed line by line (Oct 19-20): Tacoma (with CRE added Oct 20) and the 8-property portfolio.
import type { QuoteValues } from "@/lib/quote-fields";
type Col = { name: string; v: QuoteValues; calc?: string[] };
export const T: Col[] = [
    { name: "CSSI", v: { fee: 8550, siteVisit: true, turnaroundDays: 28, turnaroundDaysHigh: 42, lookbackNote: "Not needed (placed in service in 2026)", depreciableBasis: 11_062_671, regularDepreciation: 106_534,
      firstYearDeduction: 1_640_393, firstYearDeductionHigh: 2_595_142, increasedDeduction: 1_533_859, increasedDeductionHigh: 2_488_608, reclassifiedPct: 14, reclassifiedPctHigh: 23,
      firstYearTaxSavings: 567_528, firstYearTaxSavingsHigh: 920_785, taxBenefitOn: "extra", assumedTaxRate: 37,
      scopeOfWork: "Engineering-based study, on-site inspection (travel included), detailed report and results review with your CPA; 4 to 6 weeks",
      auditSupport: "Audit representation included, uncapped" } },
    { name: "SegPro Solutions", v: { fee: 8900, siteVisit: true, turnaroundDays: 28, depreciableBasis: 11_246_250,
      firstYearDeduction: 2_345_221.13, acceleratedAmount: 316_073.5 + 256_268 + 914_266.25 + 772_195.62,
      firstYearTaxSavings: 820_827.40, taxBenefitOn: "total", assumedTaxRate: 35,
      scopeOfWork: "Purchase price allocation study, on-site inspection (inspection fee capped at $1,000), IRS quality report; within 4 weeks",
      auditSupport: "IRS audit assistance if needed", includesLookback: true, paymentTerms: "$0 at signing, balance on final report", validDays: 30 }, calc: ["acceleratedAmount"] },
    { name: "Cost Recovery Experts", v: { fee: 14_500, siteVisit: true, turnaroundDays: 21, turnaroundDaysHigh: 28, depreciableBasis: 11_246_250, regularDepreciation: 288_365,
      firstYearDeduction: 3_412_675, increasedDeduction: 3_124_310, acceleratedAmount: 2_565_222 + 641_306, firstYearTaxSavings: 1_262_690, taxBenefitOn: "total",
      scopeOfWork: "Full engineered study, on-site visit by an engineer (required; its fee is to be determined and is not in the $14,500), final engineered report; 3 to 4 weeks",
      auditSupport: "Full IRS audit support included", paymentTerms: "50% to begin, balance on delivery of the final report" }, calc: ["acceleratedAmount"] },
  ];
export const P: Col[] = [
    { name: "CSSI", v: { fee: 38_000, depreciableBasis: 28_056_170, regularDepreciation: 618_606, firstYearDeduction: 6_303_059, firstYearDeductionHigh: 9_012_650, increasedDeduction: 5_684_453, increasedDeductionHigh: 8_394_044,
      reclassifiedPct: 21, reclassifiedPctHigh: 30, firstYearTaxSavings: 2_103_248, firstYearTaxSavingsHigh: 3_105_796, taxBenefitOn: "extra", assumedTaxRate: 37,
      scopeOfWork: "Cost segregation studies for all 8 properties; estimate based on results of 65,000+ prior CSSI studies" } },
    { name: "Specialty Tax Advisors", v: { fee: 40_000, depreciableBasis: 34_718_327, increasedDeduction: 11_057_787.15,
      firstYearTaxSavings: 4_091_381.25, taxBenefitOn: "extra", assumedTaxRate: 37, includesLookback: true, validDays: 60,
      scopeOfWork: "Detailed engineering report (263(a) format) with electrical, plumbing and HVAC analysis; Circular 230 compliant" } },
    { name: "SegPro Solutions", v: { fee: 41_765, siteVisit: true, turnaroundDays: 28, depreciableBasis: 33_374_700,
      firstYearDeduction: 8_610_122.66, acceleratedAmount: 2_739_010.56 + 928_502.78 + 627_388.99 + 180_244.35 + 948_750 + 403_218.75 + 207_999.63 + 39_556 + 131_812.5 + 18_382.5 + 340_696.25 + 64_791.37 + 929_625 + 125_625 + 301_875 + 56_752.5,
      firstYearTaxSavings: 3_331_961.92, taxBenefitOn: "total", includesLookback: true, paymentTerms: "$0 at signing, balance on final report", validDays: 30,
      scopeOfWork: "Purchase price allocation studies, on-site inspections (inspection fee capped at $1,000), IRS quality reports; within 4 weeks",
      auditSupport: "IRS audit assistance if needed" }, calc: ["acceleratedAmount"] },
  ];
