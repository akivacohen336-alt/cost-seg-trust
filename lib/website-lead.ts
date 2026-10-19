// Leads from the main website (costsegtrust.com, built in Lovable). Its form
// keeps emailing leads as before and also posts a copy here. Field names and
// formats are whatever that form uses, so this reads them loosely and keeps
// anything it doesn't recognise in the deal notes.
import { createHash } from "node:crypto";
import { z } from "zod";
import type { DealInput } from "./deals";
import { PROPERTY_TYPES } from "./stages";

export const WEBSITE_ORIGINS = [/^https:\/\/(www\.)?costsegtrust\.com$/, /^https:\/\/[a-z0-9-]+\.(lovable\.app|lovableproject\.com|lovable\.dev)$/];
export const allowedOrigin = (origin: string | null) => !!origin && WEBSITE_ORIGINS.some(re => re.test(origin));

const key = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, "");

// Each field, and the names a website form is likely to use for it.
const ALIASES: Record<string, string[]> = {
  fullName: ["fullname", "name", "yourname", "clientname", "contactname"],
  firstName: ["firstname", "first", "fname", "givenname"],
  lastName: ["lastname", "last", "lname", "surname", "familyname"],
  email: ["email", "emailaddress", "youremail", "mail"],
  phone: ["phone", "phonenumber", "mobile", "cell", "cellphone", "telephone", "tel"],
  propertyAddress: ["propertyaddress", "address", "property", "propertylocation", "location", "streetaddress"],
  city: ["city", "propertycity"],
  state: ["state", "propertystate"],
  zip: ["zip", "zipcode", "postalcode", "propertyzip"],
  propertyType: ["propertytype", "type", "assettype", "buildingtype"],
  purchasePrice: ["purchaseprice", "price", "costbasis", "propertyvalue", "purchaseamount", "acquisitionprice", "buildingcost", "value"],
  placedInService: ["placedinservice", "placedinservicedate", "inservicedate", "purchasedate", "acquisitiondate", "dateacquired", "datepurchased", "closingdate", "yearpurchased", "yearacquired", "purchaseyear"],
  landValue: ["landvalue", "land"],
  renovationSpend: ["renovationspend", "renovations", "renovationcost", "improvements", "capex", "renovation"],
  hasCpa: ["hascpa", "cpa", "doyouhaveacpa"],
  notes: ["notes", "message", "comments", "comment", "details", "additionalinfo", "additionalinformation"],
  utmSource: ["utmsource"], utmMedium: ["utmmedium"], utmCampaign: ["utmcampaign"],
  ref: ["ref", "referral", "referralcode", "partnercode"],
  test: ["test", "istest"],
  requestKey: ["requestkey", "submissionid", "leadid", "id"],
};
const KNOWN = new Map(Object.entries(ALIASES).flatMap(([field, names]) => names.map(n => [n, field] as const)));
// Form plumbing that is never worth keeping in the notes.
const IGNORE = new Set(["consent", "agree", "terms", "website", "honeypot", "captcha", "gclid", "fbclid"]);

const text = (v: unknown, max: number) => {
  if (v == null || typeof v === "object") return undefined;
  const s = String(v).trim();
  return s ? s.slice(0, max) : undefined;
};

function money(v: unknown): number | undefined {
  const s = text(v, 60)?.toLowerCase().replace(/[$,\s]/g, "");
  if (!s) return undefined;
  const m = s.match(/^(\d+(?:\.\d+)?)(k|m|mm|million)?$/);
  if (!m) return undefined;
  const n = Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] ? 1e6 : 1);
  return n > 0 && n <= 1e10 ? n : undefined;
}

/** A full date only. A bare year or month is left out for Akiva to fill in, never guessed. */
function isoDate(v: unknown): string | undefined {
  const s = text(v, 40);
  if (!s) return undefined;
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return undefined;
}

function propertyType(v: unknown): string {
  const s = text(v, 80);
  if (!s) return "Not provided";
  const k = key(s);
  const exact = PROPERTY_TYPES.find(t => key(t) === k);
  if (exact) return exact;
  // Most specific first: "Warehouse" and "Student Housing" contain "house".
  const rules: [RegExp, (typeof PROPERTY_TYPES)[number]][] = [
    [/storage/, "Self storage"], [/industrial|warehouse|manufactur|flex/, "Industrial/Warehouse"],
    [/shortterm|str|airbnb|vacation/, "Short-term rental"], [/multi|apartment|duplex|triplex|fourplex|student/, "Multifamily"],
    [/singlefamily|sfr|house/, "Single-family rental"], [/office|medical/, "Office"], [/retail|shopping|restaurant/, "Retail"],
    [/hotel|motel|hospitality/, "Hotel/Hospitality"], [/mixed/, "Mixed use"],
  ];
  return rules.find(([re]) => re.test(k))?.[1] ?? s;
}

const yesNo = (v: unknown) => {
  if (typeof v === "boolean") return v ? "yes" : "no";
  const s = text(v, 10)?.toLowerCase();
  return s && /^(y|yes|true|1)$/.test(s) ? "yes" : s && /^(n|no|false|0)$/.test(s) ? "no" : undefined;
};

const looksLikeTest = (...vals: (string | undefined)[]) => vals.some(v => v && /\btest(ing)?\b/i.test(v));

export type WebsiteLeadResult = { ok: true; lead: DealInput } | { ok: false; error: string };

export function parseWebsiteLead(body: Record<string, unknown>): WebsiteLeadResult {
  const f: Record<string, unknown> = {};
  const extra: string[] = [];
  for (const [k, v] of Object.entries(body ?? {})) {
    const field = KNOWN.get(key(k));
    if (field) { f[field] ??= v; continue; }
    if (IGNORE.has(key(k)) || v == null || v === "" || typeof v === "object") continue;
    extra.push(`${k}: ${text(v, 300)}`);
  }
  if (text(body?.website, 10) || text(body?.honeypot, 10)) return { ok: false, error: "spam" };

  const email = z.string().trim().toLowerCase().email().max(200).safeParse(f.email);
  if (!email.success) return { ok: false, error: "A valid email is required" };
  const fullName = text(f.fullName, 120) ?? [text(f.firstName, 60), text(f.lastName, 60)].filter(Boolean).join(" ");
  if (!fullName) return { ok: false, error: "A name is required" };

  const street = text(f.propertyAddress, 300);
  const cityLine = [text(f.city, 80), [text(f.state, 40), text(f.zip, 20)].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const propertyAddress = [street, cityLine].filter(Boolean).join(", ") || "Not provided";

  const rawDate = text(f.placedInService, 40);
  const placedInService = isoDate(rawDate);
  const rawPrice = text(f.purchasePrice, 60);
  const purchasePrice = money(rawPrice);
  // Keep what the client typed when it couldn't be read as a price or full date.
  if (rawDate && !placedInService) extra.unshift(`Purchase / in-service date as entered: ${rawDate}`);
  if (rawPrice && purchasePrice == null) extra.unshift(`Purchase price as entered: ${rawPrice}`);

  const notes = [text(f.notes, 2000), ...extra].filter(Boolean).join("\n").slice(0, 4000) || undefined;
  const phone = text(f.phone, 40);
  const isTest = f.test === true || yesNo(f.test) === "yes" || looksLikeTest(fullName, email.data, notes);

  // The same lead posted twice (a double click or retry) becomes one deal.
  const requestKey = z.string().uuid().safeParse(f.requestKey).success
    ? String(f.requestKey)
    : uuidFrom([email.data, propertyAddress, rawPrice, rawDate, notes].join("|"));

  return {
    ok: true,
    lead: {
      requestKey, fullName, email: email.data, phone, propertyAddress, propertyType: propertyType(f.propertyType),
      purchasePrice, placedInService, landValue: text(f.landValue, 60), renovationSpend: money(f.renovationSpend),
      hasCpa: yesNo(f.hasCpa) as "yes" | "no" | undefined, notes,
      utmSource: text(f.utmSource, 100) ?? "costsegtrust.com", utmMedium: text(f.utmMedium, 100), utmCampaign: text(f.utmCampaign, 100),
      ref: text(f.ref, 60), isTest, source: "costsegtrust.com",
    },
  };
}

function uuidFrom(s: string) {
  const h = createHash("sha256").update(s).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
