"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import {
  BRACKETS, FIRST_YEAR, PROPERTY_TYPES, TAX_YEAR, estimate, roundEstimate,
  type PropertyTypeKey,
} from "@/lib/estimator";
import { QUOTE_HREF, btn } from "./ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: TAX_YEAR - FIRST_YEAR + 1 }, (_, i) => TAX_YEAR - i);
const MIN_PRICE = 150_000;
const MAX_PRICE = 25_000_000;

const field = "w-full rounded-md border border-input bg-background px-3 h-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";
const label = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const range = (low: number, high: number) => `${usd(roundEstimate(low))} – ${usd(roundEstimate(high))}`;

// The price slider is logarithmic so $150K-$1M gets as much room as $1M-$25M.
const toSlider = (price: number) => Math.round((Math.log(price / MIN_PRICE) / Math.log(MAX_PRICE / MIN_PRICE)) * 1000);
const fromSlider = (v: number) => {
  const p = MIN_PRICE * Math.pow(MAX_PRICE / MIN_PRICE, v / 1000);
  return p >= 1_000_000 ? Math.round(p / 50_000) * 50_000 : Math.round(p / 5_000) * 5_000;
};

function Select({ id, value, onChange, children }: { id: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className={`${field} appearance-none pr-9`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function Toggle<T extends string | number>({ options, value, onChange, format }: { options: readonly T[]; value: T; onChange: (v: T) => void; format: (v: T) => string }) {
  return (
    <div className="grid rounded-md border border-input overflow-hidden" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => (
        <button
          key={String(o)}
          type="button"
          aria-pressed={o === value}
          onClick={() => onChange(o)}
          className={`h-9 text-sm font-medium transition-colors border-l border-input first:border-l-0 ${o === value ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-secondary"}`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

/** The homepage "what would a study add?" calculator. Shows a rough range, never a quote. */
export default function Estimator() {
  const [propertyType, setPropertyType] = useState<PropertyTypeKey>("multifamily");
  const [price, setPrice] = useState(2_500_000);
  const [priceText, setPriceText] = useState("2,500,000");
  const [landPct, setLandPct] = useState("20");
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(TAX_YEAR);
  const [contractBefore, setContractBefore] = useState(false);
  const [bracket, setBracket] = useState<number>(0.37);
  const [life, setLife] = useState<27.5 | 39>(27.5);

  const type = PROPERTY_TYPES.find(t => t.key === propertyType)!;
  const result = useMemo(
    () => estimate({ propertyType, price, landShare: (Number(landPct) || 0) / 100, month, year, contractBeforeJan2025: contractBefore, bracket, life }),
    [propertyType, price, landPct, month, year, contractBefore, bracket, life],
  );
  const askContract = year >= 2025;

  const setPriceFromText = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 10);
    const n = Number(digits) || 0;
    setPrice(n);
    setPriceText(digits ? n.toLocaleString("en-US") : "");
  };
  const setPriceFromSlider = (v: number) => {
    const n = fromSlider(v);
    setPrice(n);
    setPriceText(n.toLocaleString("en-US"));
  };

  return (
    <div id="estimate" className="rounded-xl border border-border bg-card text-card-foreground shadow-2xl text-left">
      <div className="px-5 pt-5 pb-4 sm:px-6 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Free · No signup · Rough estimate</p>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-1">What would a cost segregation study add?</h2>
      </div>

      <div className="px-5 py-4 sm:px-6 grid grid-cols-2 gap-x-3 gap-y-3.5">
        <div className="col-span-2">
          <label className={label} htmlFor="est-type">Property type</label>
          <Select id="est-type" value={propertyType} onChange={v => {
            const t = PROPERTY_TYPES.find(p => p.key === v)!;
            setPropertyType(t.key);
            setLife(t.life);
          }}>
            {PROPERTY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Studies commonly move {Math.round(type.low * 100)}–{Math.round(type.high * 100)}% of the building&apos;s cost to faster schedules.
          </p>
        </div>

        <div className="col-span-2">
          <label className={label} htmlFor="est-price">Purchase price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <input id="est-price" inputMode="numeric" value={priceText} onChange={e => setPriceFromText(e.target.value)} className={`${field} pl-7`} />
          </div>
          <input
            type="range" min={0} max={1000} aria-label="Purchase price slider"
            value={toSlider(Math.min(MAX_PRICE, Math.max(MIN_PRICE, price || MIN_PRICE)))}
            onChange={e => setPriceFromSlider(Number(e.target.value))}
            className="w-full mt-2 accent-[hsl(var(--primary))]"
          />
        </div>

        <div>
          <label className={label} htmlFor="est-month">Placed in service</label>
          <Select id="est-month" value={String(month)} onChange={v => setMonth(Number(v))}>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </Select>
        </div>
        <div>
          <label className={label} htmlFor="est-year"><span className="invisible">Year</span></label>
          <Select id="est-year" value={String(year)} onChange={v => setYear(Number(v))}>
            {YEARS.map(y => <option key={y} value={y}>{y === TAX_YEAR ? `This year (${y})` : y}</option>)}
          </Select>
        </div>

        {askContract && (
          <div className="col-span-2">
            <span className={label}>Under contract before Jan 20, 2025?</span>
            <Toggle options={["no", "yes"] as const} value={contractBefore ? "yes" : "no"} onChange={v => setContractBefore(v === "yes")} format={v => (v === "yes" ? "Yes" : "No")} />
          </div>
        )}

        <div>
          <label className={label} htmlFor="est-land">Land share</label>
          <div className="relative">
            <input id="est-land" inputMode="decimal" value={landPct} onChange={e => setLandPct(e.target.value.replace(/[^0-9.]/g, "").slice(0, 4))} className={`${field} pr-7`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div>
          <span className={label}>Building life</span>
          <Toggle options={[27.5, 39] as const} value={life} onChange={setLife} format={v => `${v} yrs`} />
        </div>

        <div className="col-span-2">
          <span className={label}>Federal tax bracket</span>
          <Toggle options={BRACKETS} value={bracket as (typeof BRACKETS)[number]} onChange={setBracket} format={v => `${Math.round(v * 100)}%`} />
        </div>
      </div>

      <div className="mx-5 sm:mx-6 rounded-lg bg-secondary px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {result.catchUp ? `Extra ${TAX_YEAR} deduction (catch-up)` : `Extra first-year deduction`}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-primary mt-0.5">{range(result.deduction.low, result.deduction.high)}</p>
        <p className="text-sm text-foreground mt-2">
          Worth up to <span className="font-semibold">{range(result.taxValue.low, result.taxValue.high)}</span> in federal tax at {Math.round(bracket * 100)}%, if you can use the loss this year.
        </p>
        {result.bonusRate < 1 && (
          <p className="text-xs text-muted-foreground mt-1.5">Uses {Math.round(result.bonusRate * 100)}% bonus depreciation for this timing.</p>
        )}
      </div>

      <div className="px-5 sm:px-6 pt-4 pb-5">
        <Link href={QUOTE_HREF} className={`${btn.accentLg} w-full`}>
          Get real quotes from vetted providers <ArrowRight className="ml-1 h-5 w-5" />
        </Link>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Rough estimate only, not a quote or tax advice. Your actual numbers come from a provider&apos;s study.
        </p>
        <details className="mt-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground/80 hover:text-foreground">How we figure this</summary>
          <ul className="list-disc pl-4 mt-2 space-y-1 leading-relaxed">
            <li>Land is never depreciable, so the land share comes off the price first. Your county assessment shows the real split.</li>
            <li>The low and high ends use general industry ranges for this property type, not figures from any provider or from your property.</li>
            <li>The moved amount is taken as bonus depreciation: 100% for property bought after January 19, 2025 (and 2018–2022), and the old phase-down rate otherwise. The part not covered by bonus is left out, so partial-bonus years read low.</li>
            <li>From that we subtract the straight-line depreciation the same amount gets without a study ({life} years, mid-month).</li>
            {result.catchUp && <li>Placed in service before {TAX_YEAR}: the missed depreciation is usually claimed this year with Form 3115. Your CPA decides.</li>}
            <li>Passive investors often can&apos;t use the loss this year. Real estate professional status, short-term rental rules and state tax all change the value.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
