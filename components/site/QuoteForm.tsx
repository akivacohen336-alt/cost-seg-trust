"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, CircleCheck, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { LOVABLE_PROPERTY_TYPES, US_STATES } from "@/lib/site-content";
import DatePicker from "./DatePicker";
import { btn, card } from "./ui";

// The quote form, copied from the Lovable site. "marketing" sits at the
// bottom of the homepage; "app" is the /start page. Every submission
// becomes a deal in the dashboard (and the usual owner alert email).

const MAX_FILE = 4 * 1024 * 1024; // the dashboard keeps files up to 4 MB
const FILE_OK = /\.(pdf|jpe?g|png|heic|heif)$/i;
const ACCEPT = ".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/jpeg,image/png,image/heic,image/heif";
const DOCS = [
  { key: "closing_statement", label: "Closing statement / HUD", hint: "Helps confirm price and closing costs." },
  { key: "prior_depreciation", label: "Prior depreciation schedule", hint: "From your tax return or CPA." },
  { key: "other", label: "Other documents", hint: "Appraisals, rent rolls, improvement invoices, etc." },
] as const;
type DocKey = (typeof DOCS)[number]["key"];

const labelCls = "peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-base font-medium";
const smallLabelCls = "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm font-medium";
const inputBase = "flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
const inputCls = `${inputBase} h-12 text-base`;
const selectBase = "flex w-full items-center justify-between rounded-md border border-input px-3 py-2 pr-9 ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-background";
const radioCls = "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer checked:bg-[radial-gradient(circle,hsl(var(--primary))_0_4.5px,transparent_5px)]";
const errCls = "text-sm text-destructive";

const digits = (s: string) => s.replace(/\D/g, "");
const money = (s: string) => { const d = digits(s); return d ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(d)) : ""; };
const phoneFmt = (s: string) => { const d = digits(s); return d.length <= 3 ? d : d.length <= 6 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`; };
const zipFmt = (s: string) => { const d = digits(s); return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5, 9)}`; };
const ZIP = /^\d{5}(-\d{4})?$/;
const num = (s: string) => { const t = (s || "").replace(/[^0-9.]/g, ""); return t ? Number(t) : NaN; };
const uuid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Values = {
  name: string; email: string; phone: string; streetAddress: string; city: string; state: string; zipCode: string;
  propertyType: string; purchaseDate: string; purchasePrice: string; is1031Exchange: string; exchangeBasis: string;
  relinquishedProperty: string; relinquishedSaleDate: string; priorDepreciation: string; additionalInfo: string;
};
type Extra = { id: string; streetAddress: string; city: string; state: string; zipCode: string; propertyType: string; purchasePrice: string };
const EMPTY: Values = {
  name: "", email: "", phone: "", streetAddress: "", city: "", state: "", zipCode: "", propertyType: "", purchaseDate: "",
  purchasePrice: "", is1031Exchange: "", exchangeBasis: "", relinquishedProperty: "", relinquishedSaleDate: "", priorDepreciation: "", additionalInfo: "",
};
const NO_FILES: Record<DocKey, File[]> = { closing_statement: [], prior_depreciation: [], other: [] };

function validate(v: Values): Partial<Record<keyof Values, string>> {
  const e: Partial<Record<keyof Values, string>> = {};
  if (v.name.trim().length < 2) e.name = "Name must be at least 2 characters";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = "Invalid email address";
  if (v.phone.length < 10) e.phone = "Please enter a valid phone number";
  if (v.streetAddress.trim().length < 5) e.streetAddress = "Street address is required";
  if (v.city.trim().length < 2) e.city = "City is required";
  if (!v.state) e.state = "State is required";
  if (!ZIP.test(v.zipCode)) e.zipCode = "ZIP code must be 5 digits or ZIP+4 format";
  if (!v.propertyType) e.propertyType = "Please select property type";
  if (!v.purchaseDate) e.purchaseDate = "Purchase date is required";
  if (!v.purchasePrice) e.purchasePrice = "Purchase price is required";
  else if (!(num(v.purchasePrice) > 0)) e.purchasePrice = "Enter a valid price";
  if (!v.is1031Exchange) e.is1031Exchange = "Please select an option";
  if (v.is1031Exchange === "yes") {
    if (!(num(v.exchangeBasis) >= 0)) e.exchangeBasis = "Carried-over basis is required";
    if (v.relinquishedProperty.trim().length < 3) e.relinquishedProperty = "Relinquished property is required";
    if (!v.relinquishedSaleDate) e.relinquishedSaleDate = "Sale date is required";
  }
  if (!v.priorDepreciation) e.priorDepreciation = "Please select an option";
  if (v.additionalInfo.length > 2000) e.additionalInfo = "Additional info must be less than 2000 characters";
  return e;
}

type Done = { reference: string; propertyCount: number; email: string; failedUploads: string[] };

export default function QuoteForm({ variant = "marketing", onDone }: { variant?: "marketing" | "app"; onDone?: (d: Done | null) => void }) {
  const app = variant === "app";
  const [v, setV] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [tried, setTried] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [files, setFiles] = useState(NO_FILES);
  const [fileError, setFileError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const requestKey = useRef<string>("");
  const doneRef = useRef<HTMLDivElement>(null);
  const [track, setTrack] = useState<Record<string, string>>({});

  // Campaign tags and a partner code from the address bar (e.g. /start?ref=CODE).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t: Record<string, string> = {};
    for (const [from, to] of [["utm_source", "utmSource"], ["utm_medium", "utmMedium"], ["utm_campaign", "utmCampaign"], ["ref", "ref"]]) {
      const val = q.get(from);
      if (val) t[to] = val.slice(0, 100);
    }
    setTrack(t);
  }, []);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    const next = { ...v, [k]: val };
    setV(next);
    if (tried) setErrors(validate(next));
  };
  const setExtra = (id: string, k: keyof Extra, val: string) => setExtras(xs => xs.map(x => (x.id === id ? { ...x, [k]: val } : x)));
  const addExtra = () => { setExtras(xs => [...xs, { id: uuid(), streetAddress: "", city: "", state: "", zipCode: "", propertyType: "", purchasePrice: "" }]); setExtrasOpen(true); };

  function addFiles(key: DocKey, list: FileList | null) {
    if (!list) return;
    const ok: File[] = [];
    let problem: string | null = null;
    for (const f of Array.from(list)) {
      if (!FILE_OK.test(f.name)) { problem = `${f.name}: only PDF, JPG, PNG or HEIC files`; continue; }
      if (f.size > MAX_FILE) { problem = `${f.name}: file must be under 4MB`; continue; }
      ok.push(f);
    }
    setFileError(problem);
    setFiles(fs => ({ ...fs, [key]: [...fs[key], ...ok].slice(0, 5) }));
    if (key === "prior_depreciation" && ok.length) setScheduleError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    const errs = validate(v);
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    if (v.priorDepreciation === "yes" && files.prior_depreciation.length === 0) {
      setScheduleError("Please upload the prior depreciation schedule");
      return;
    }
    setSubmitting(true);
    requestKey.current ||= uuid();
    const is1031 = v.is1031Exchange === "yes";
    const yesNo = (s: string) => (s === "yes" ? "Yes" : "No");
    const more = extras.filter(x => x.streetAddress && x.city && x.state && ZIP.test(x.zipCode));
    // Field names the dashboard's website-lead inbox understands; anything
    // else is kept word for word in the deal notes.
    const payload: Record<string, string> = {
      requestKey: requestKey.current, name: v.name.trim(), email: v.email.trim(), phone: v.phone,
      streetAddress: v.streetAddress.trim(), city: v.city.trim(), state: v.state, zipCode: v.zipCode,
      propertyType: v.propertyType, purchaseDate: v.purchaseDate, purchasePrice: v.purchasePrice,
      additionalInfo: v.additionalInfo.trim(),
      "1031 exchange": yesNo(v.is1031Exchange),
      ...(is1031 ? {
        "Carried-over basis": v.exchangeBasis, "Relinquished property": v.relinquishedProperty.trim(),
        "Relinquished property sale date": v.relinquishedSaleDate,
      } : {}),
      "Placed in service in a previous tax year and already depreciated": yesNo(v.priorDepreciation),
      ...Object.fromEntries(more.map((x, i) => [
        `Additional property ${i + 2}`,
        [`${x.streetAddress}, ${x.city}, ${x.state} ${x.zipCode}`, x.propertyType, x.purchasePrice].filter(Boolean).join(" · "),
      ])),
      ...track,
    };
    try {
      const res = await fetch("/api/website-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || "Submission failed");

      const failedUploads: string[] = [];
      for (const key of Object.keys(files) as DocKey[]) {
        for (const f of files[key]) {
          const body = new FormData();
          body.set("token", out.uploadToken ?? "");
          body.set("docType", key);
          body.set("file", f);
          const up = await fetch("/api/website-lead/files", { method: "POST", body }).catch(() => null);
          if (!up?.ok) failedUploads.push(f.name);
        }
      }

      const result: Done = { reference: out.reference ?? "", propertyCount: 1 + more.length, email: v.email.trim(), failedUploads };
      setV(EMPTY); setFiles(NO_FILES); setExtras([]); setExtrasOpen(false); setTried(false); setErrors({});
      requestKey.current = "";
      if (onDone) onDone(result);
      else { setDone(result); setTimeout(() => doneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }
    } catch (err) {
      console.error("Form submission error:", err);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k: keyof Values) => errors[k] && <p className={errCls}>{errors[k]}</p>;
  const radio = (name: "is1031Exchange" | "priorDepreciation", ids: [string, string]) => (
    <div role="radiogroup" className="flex gap-6">
      {(["yes", "no"] as const).map((val, i) => (
        <div key={val} className="flex items-center space-x-2">
          <input type="radio" id={ids[i]} name={name} value={val} checked={v[name] === val} onChange={() => {
            set(name, val);
            if (name === "priorDepreciation" && val === "no") setScheduleError(null);
          }} className={radioCls} />
          <label htmlFor={ids[i]} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-normal cursor-pointer">{val === "yes" ? "Yes" : "No"}</label>
        </div>
      ))}
    </div>
  );
  const select = (id: string, value: string, onChange: (s: string) => void, placeholder: string, options: [string, string][], size: string) => (
    <div className="relative">
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className={`${selectBase} ${size} ${value ? "" : "text-foreground"}`}>
        <option value="" disabled>{placeholder}</option>
        {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
    </div>
  );
  const types: [string, string][] = LOVABLE_PROPERTY_TYPES.map(t => [t, t]);
  const states = US_STATES;

  const form = (
    <form onSubmit={submit} noValidate className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className={labelCls}>Full Name *</label>
        <input id="name" name="name" autoComplete="name" value={v.name} onChange={e => set("name", e.target.value)} placeholder="John Smith" className={inputCls} />
        {err("name")}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="email" className={labelCls}>Email *</label>
          <input id="email" name="email" type="email" autoComplete="email" value={v.email} onChange={e => set("email", e.target.value)} placeholder="john@example.com" className={inputCls} />
          {err("email")}
        </div>
        <div className="space-y-2">
          <label htmlFor="phone" className={labelCls}>Phone Number *</label>
          <input id="phone" type="tel" autoComplete="tel" value={v.phone} onChange={e => set("phone", phoneFmt(e.target.value))} placeholder="(555) 123-4567" className={inputCls} />
          {err("phone")}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="streetAddress" className={labelCls}>Street Address *</label>
        <input id="streetAddress" name="streetAddress" autoComplete="address-line1" value={v.streetAddress} onChange={e => set("streetAddress", e.target.value)} placeholder="123 Main Street" className={inputCls} />
        {err("streetAddress")}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="city" className={labelCls}>City *</label>
          <input id="city" name="city" autoComplete="address-level2" value={v.city} onChange={e => set("city", e.target.value)} placeholder="Los Angeles" className={inputCls} />
          {err("city")}
        </div>
        <div className="space-y-2">
          <label htmlFor="state" className={labelCls}>State *</label>
          {select("state", v.state, s => set("state", s), "Select state", states, "h-12 text-base")}
          {err("state")}
        </div>
        <div className="space-y-2">
          <label htmlFor="zipCode" className={labelCls}>ZIP Code *</label>
          <input id="zipCode" inputMode="numeric" autoComplete="postal-code" maxLength={10} value={v.zipCode} onChange={e => set("zipCode", zipFmt(e.target.value))} placeholder="90210" className={inputCls} />
          {err("zipCode")}
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="propertyType" className={labelCls}>Property Type *</label>
        {select("propertyType", v.propertyType, s => set("propertyType", s), "Select property type", types, "h-12 text-base")}
        {err("propertyType")}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className={labelCls}>Purchase Date *</label>
          <DatePicker value={v.purchaseDate} onChange={d => set("purchaseDate", d)} />
          {err("purchaseDate")}
        </div>
        <div className="space-y-2">
          <label htmlFor="purchasePrice" className={labelCls}>Purchase Price *</label>
          <input id="purchasePrice" type="text" inputMode="numeric" value={v.purchasePrice} onChange={e => set("purchasePrice", money(e.target.value))} placeholder="$500,000" className={inputCls} />
          {err("purchasePrice")}
        </div>
      </div>
      <div className="space-y-3">
        <label className={labelCls}>Was this purchased as a 1031 exchange? *</label>
        {radio("is1031Exchange", ["yes", "no"])}
        {err("is1031Exchange")}
      </div>
      {v.is1031Exchange === "yes" && (
        <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
          <div className="space-y-2">
            <label htmlFor="exchangeBasis" className={labelCls}>Carried-over basis *</label>
            <input id="exchangeBasis" inputMode="numeric" value={v.exchangeBasis} onChange={e => set("exchangeBasis", money(e.target.value))} placeholder="$250,000" className={inputCls} />
            {err("exchangeBasis")}
          </div>
          <div className="space-y-2">
            <label htmlFor="relinquishedProperty" className={labelCls}>Relinquished property (address or description) *</label>
            <textarea id="relinquishedProperty" value={v.relinquishedProperty} onChange={e => set("relinquishedProperty", e.target.value)} maxLength={500}
              placeholder="456 Oak Ave, Austin, TX — 12-unit apartment"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-20 text-base resize-none" />
            {err("relinquishedProperty")}
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Relinquished property sale date *</label>
            <DatePicker value={v.relinquishedSaleDate} onChange={d => set("relinquishedSaleDate", d)} />
            {err("relinquishedSaleDate")}
          </div>
        </div>
      )}
      <div className="space-y-3">
        <label className={labelCls}>Was this property placed in service in a previous tax year and already depreciated? *</label>
        {radio("priorDepreciation", ["prior-yes", "prior-no"])}
        {err("priorDepreciation")}
      </div>
      <div className="space-y-3">
        <h3 className="text-base font-medium text-foreground">Documents</h3>
        <p className="text-sm text-muted-foreground">PDF, JPG, PNG or HEIC, up to 4MB each.</p>
        {DOCS.map(d => {
          const required = d.key === "prior_depreciation" && v.priorDepreciation === "yes";
          return (
            <div key={d.key} className="space-y-2 rounded-md border border-border p-4">
              <label htmlFor={`doc-${d.key}`} className={labelCls}>
                {d.label} {required ? "*" : <span className="text-muted-foreground font-normal">(optional)</span>}
              </label>
              <p className="text-sm text-muted-foreground">{d.hint}</p>
              <input id={`doc-${d.key}`} type="file" accept={ACCEPT} multiple className={`${inputCls} file:mr-3`}
                onChange={e => { addFiles(d.key, e.target.files); e.target.value = ""; }} />
              {files[d.key].length > 0 && (
                <ul className="space-y-1">
                  {files[d.key].map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-sm bg-muted/40 rounded px-2 py-1">
                      <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                      <button type="button" className={btn.ghostSm} aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles(fs => ({ ...fs, [d.key]: fs[d.key].filter((_, j) => j !== i) }))}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {d.key === "prior_depreciation" && scheduleError && <p className={errCls}>{scheduleError}</p>}
            </div>
          );
        })}
        {fileError && <p className={errCls}>{fileError}</p>}
      </div>
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-foreground">Additional Properties</h3>
            <p className="text-sm text-muted-foreground">Have multiple properties? Add them here for bundled quotes.</p>
          </div>
          <button type="button" aria-expanded={extrasOpen} onClick={() => setExtrasOpen(o => !o)} className={`${btn.outlineSm} gap-2`}>
            {extrasOpen ? <><ChevronUp className="h-4 w-4" />Hide</> : <><Plus className="h-4 w-4" />Add a Property</>}
          </button>
        </div>
        {extrasOpen && (
          <div className="space-y-4 mt-4">
            {extras.length === 0 ? (
              <button type="button" onClick={addExtra} className={`${btn.outline} w-full h-12 border-dashed gap-2`}>
                <Plus className="h-4 w-4" />Add Your First Additional Property
              </button>
            ) : (
              <>
                {extras.map((x, i) => (
                  <div key={x.id} className={`${card} p-4 bg-muted/30`}>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-foreground">Property {i + 2}</h4>
                      <button type="button" aria-label={`Remove property ${i + 2}`} onClick={() => setExtras(xs => xs.filter(y => y.id !== x.id))}
                        className={`${btn.ghostSm} text-destructive hover:text-destructive hover:bg-destructive/10`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className={smallLabelCls}>Street Address</label>
                        <input value={x.streetAddress} onChange={e => setExtra(x.id, "streetAddress", e.target.value)} placeholder="123 Main Street" className={`${inputBase} h-10 text-base`} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <label className={smallLabelCls}>City</label>
                          <input value={x.city} onChange={e => setExtra(x.id, "city", e.target.value)} placeholder="City" className={`${inputBase} h-10 text-base`} />
                        </div>
                        <div className="space-y-2">
                          <label className={smallLabelCls}>State</label>
                          {select(`state-${x.id}`, x.state, s => setExtra(x.id, "state", s), "State", states, "h-10 text-sm")}
                        </div>
                        <div className="space-y-2">
                          <label className={smallLabelCls}>ZIP</label>
                          <input value={x.zipCode} inputMode="numeric" maxLength={10} onChange={e => setExtra(x.id, "zipCode", zipFmt(e.target.value))} placeholder="12345" className={`${inputBase} h-10 text-base`} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className={smallLabelCls}>Property Type</label>
                          {select(`type-${x.id}`, x.propertyType, s => setExtra(x.id, "propertyType", s), "Select type", types, "h-10 text-sm")}
                        </div>
                        <div className="space-y-2">
                          <label className={smallLabelCls}>Purchase Price</label>
                          <input value={x.purchasePrice} inputMode="numeric" onChange={e => setExtra(x.id, "purchasePrice", money(e.target.value))} placeholder="$500,000" className={`${inputBase} h-10 text-base`} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addExtra} className={`${btn.outline} w-full h-10 gap-2`}>
                  <Plus className="h-4 w-4" />Add Another Property
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="additionalInfo" className={labelCls}>Additional Information (Optional)</label>
        <textarea id="additionalInfo" name="additionalInfo" value={v.additionalInfo} onChange={e => set("additionalInfo", e.target.value)}
          placeholder="Any other details you'd like to share about your property or situation..."
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-24 text-base resize-none" />
        {err("additionalInfo")}
      </div>
      {formError && <p className={`${errCls} text-center`} role="alert">{formError}</p>}
      <button type="submit" disabled={submitting}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2 w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300">
        {submitting ? "Submitting..." : app ? "Get My Free Quotes" : "Get Free Quotes"}
      </button>
      <p className="text-sm text-muted-foreground text-center">
        {app ? "By submitting, you agree to be contacted about your quotes." : "By submitting, you agree to receive quotes from qualified cost segregation providers"}
      </p>
    </form>
  );

  if (app) return <div id="quote-form" className={`${card} p-5 sm:p-8 shadow-lg border-border`}>{form}</div>;
  return (
    <section id="quote-form" className="py-24 bg-gradient-to-br from-secondary/50 to-background">
      <div className="container px-4 mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Get Your Free Quotes</h2>
            <p className="text-xl text-muted-foreground">Compare pricing and services from qualified providers</p>
          </div>
          {done ? (
            <div ref={doneRef} className="scroll-mt-28"><SuccessCard {...done} onReset={() => setDone(null)} /></div>
          ) : (
            <div className={`${card} p-5 sm:p-8 md:p-12 shadow-2xl border-border`}>{form}</div>
          )}
        </div>
      </div>
    </section>
  );
}

const NEXT_STEPS = ["Providers review your property", "Competing quotes arrive", "You compare and choose (no obligation)"];

export function SuccessCard({ reference, propertyCount, email, failedUploads, onReset }: Done & { onReset: () => void }) {
  return (
    <div className={`${card} p-6 sm:p-8 shadow-lg border-border`}>
      <div className="text-center">
        <CircleCheck className="mx-auto mb-4 h-14 w-14 text-primary" />
        <h2 className="mb-3 text-2xl sm:text-3xl font-bold text-foreground">You&apos;re all set</h2>
        {reference && (
          <div className="mx-auto mb-5 inline-block rounded-lg border border-border bg-secondary/50 px-4 py-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
            <p className="font-mono text-xl font-bold text-foreground">{reference}</p>
          </div>
        )}
        <p className="mb-2 text-foreground">
          We&apos;ll share your {propertyCount > 1 ? `${propertyCount} properties'` : "property"} details with vetted cost segregation providers, who will prepare competing quotes for you.
        </p>
        <p className="mb-6 text-muted-foreground">
          We&apos;ll send your quotes to <span className="font-medium text-foreground break-all">{email}</span>.
        </p>
      </div>
      {failedUploads.length > 0 && (
        <p className="mb-6 text-center text-sm text-destructive">
          We couldn&apos;t upload {failedUploads.join(", ")}. Please email {failedUploads.length > 1 ? "them" : "it"} to sales@costsegtrust.com.
        </p>
      )}
      <div className="mb-6 rounded-lg bg-secondary/40 p-4 sm:p-5">
        <h3 className="mb-3 font-semibold text-foreground">What happens next</h3>
        <ol className="space-y-3">
          {NEXT_STEPS.map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{i + 1}</span>
              <span className="pt-0.5 text-foreground">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mb-2 flex items-start justify-center gap-2 text-center text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        Your name, email and phone are never shared with providers.
      </p>
      <p className="mb-6 text-center text-sm text-muted-foreground">
        Questions?{" "}
        <a href="mailto:sales@costsegtrust.com" className="font-medium text-primary underline-offset-4 hover:underline">sales@costsegtrust.com</a>
      </p>
      <div className="text-center">
        <button type="button" onClick={onReset} className={btn.outline}>Submit another property</button>
      </div>
    </div>
  );
}
