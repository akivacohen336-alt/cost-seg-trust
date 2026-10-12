import { z } from "zod";
import { PROPERTY_TYPES } from "./stages";

const money = z.preprocess(
  v => (typeof v === "string" ? v.replace(/[$,\s]/g, "") : v),
  z.coerce.number().finite().positive().max(10_000_000_000),
);
const optionalMoney = z.preprocess(
  v => (v === "" || v == null ? undefined : typeof v === "string" ? v.replace(/[$,\s]/g, "") : v),
  z.coerce.number().finite().min(0).max(10_000_000_000).optional(),
);
const optionalText = (max: number) =>
  z.preprocess(v => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const quoteRequestSchema = z.object({
  requestKey: z.string().uuid(),
  fullName: z.string().trim().min(2, "Please enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(v => v.replace(/\D/g, "").length >= 10, "Please enter a phone number with area code"),
  propertyAddress: z.string().trim().min(5, "Please enter the property address").max(300),
  propertyType: z.enum(PROPERTY_TYPES),
  purchasePrice: money,
  placedInService: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please choose a date"),
  landValue: optionalText(60),
  renovationSpend: optionalMoney,
  hasCpa: z.enum(["yes", "no"]).optional(),
  notes: optionalText(2000),
  consent: z.literal(true, { message: "Please agree to be contacted so we can send your quotes" }),
  utmSource: optionalText(100),
  utmMedium: optionalText(100),
  utmCampaign: optionalText(100),
  // Referral partner code from a partner link (/r/CODE or /quote?ref=CODE).
  ref: optionalText(60),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export function splitName(full: string) {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function cityState(address: string) {
  const parts = address.split(",").map(s => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts.slice(1).join(", ") : null;
}

export function toE164(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return phone.startsWith("+") ? "+" + d : "+" + d;
}
