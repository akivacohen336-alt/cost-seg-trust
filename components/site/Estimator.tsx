"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { BRACKETS, FIRST_YEAR, PROPERTY_TYPES, TAX_YEAR, estimate, roundEstimate, type PropertyTypeKey } from "@/lib/estimator";
import { btn } from "./ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = Array.from({ length: TAX_YEAR - FIRST_YEAR + 1 }, (_, i) => TAX_YEAR - i);
const MIN_PRICE = 150_000;
const MAX_PRICE = 25_000_000;

const field = "w-full rounded-md border border-input bg-background px-3 h-11 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1";
const label = "block text-sm font-medium text-foreground mb-2";
const hint = "text-xs text-muted-foreground mt-1.5";

// The price slider is logarithmic so $150K-$1M gets as much room as $1M-$25M.
const toSlider = (price: number) => Math.round((Math.log(price / MIN_PRICE) / Math.log(MAX_PRICE / MIN_PRICE)) * 1000);
const fromSlider = (v: number) => {
  const p = MIN_PRICE * Math.pow(MAX_PRICE / MIN_PRICE, v / 1000);
  return p >= 1_000_000 ? Math.round(p / 50_000) * 50_000 : Math.round(p / 5_000) * 5_000;
};
// The screenshot has no land input, so a typical 20% land share is assumed.
const LAND_SHARE = 0.2;
const usd = (n: number) => `$${roundEstimate(n).toLocaleString("en-US")}`;

const SLIDER_MARKS = [["$150K", MIN_PRICE], ["$1M", 1_000_000], ["$5M", 5_000_000], ["$25M", MAX_PRICE]] as const;

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
          className={`h-10 text-sm font-medium transition-colors border-l border-input first:border-l-0 ${o === value ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-secondary"}`}
        >
          {format(o)}
        </button>
      ))}
    </div>
  );
}

/** The homepage "what would a study add?" estimator, laid out like the CEO's version. */
export default function Estimator() {
  const [propertyType, setPropertyType] = useState<PropertyTypeKey>("multifamily");
  const [price, setPrice] = useState(2_500_000);
  const [priceText, setPriceText] = useState("2,500,000");
  const [month, setMonth] = useState(7);
  const [year, setYear] = useState(TAX_YEAR);
  const [bracket, setBracket] = useState<number>(0.37);
  const [life, setLife] = useState<27.5 | 39>(27.5);
  const [showEstimate, setShowEstimate] = useState(false);

  const type = PROPERTY_TYPES.find(t => t.key === propertyType)!;

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
    <div id="estimate" className="rounded-xl border border-border bg-card text-card-foreground shadow-2xl text-left p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">Free · No signup</p>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">What would a cost segregation study add?</h2>
      <p className="text-sm text-muted-foreground mt-2">
        Estimate the extra first-year depreciation a study would produce on your property, and what it is worth at your bracket. Every assumption is published below.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-secondary/40 p-4 sm:p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your property</p>

        <div>
          <label className={label} htmlFor="est-type">Property type</label>
          <Select id="est-type" value={propertyType} onChange={v => {
            const t = PROPERTY_TYPES.find(p => p.key === v)!;
            setPropertyType(t.key);
            setLife(t.life);
          }}>
            {PROPERTY_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
          <p className={hint}>
            Typically reclassifies {Math.round(type.typical * 100)}% of depreciable basis ({Math.round(type.low * 100)}–{Math.round(type.high * 100)}% range).
          </p>
        </div>

        <div>
          <label className={label} htmlFor="est-price">Purchase price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <input id="est-price" inputMode="numeric" value={priceText} onChange={e => setPriceFromText(e.target.value)} className={`${field} pl-7`} />
          </div>
          <input
            type="range" min={0} max={1000} aria-label="Purchase price slider"
            value={toSlider(Math.min(MAX_PRICE, Math.max(MIN_PRICE, price || MIN_PRICE)))}
            onChange={e => setPriceFromSlider(Number(e.target.value))}
            className="w-full mt-3 accent-[hsl(var(--primary))]"
          />
          <div className="relative h-4 text-xs text-muted-foreground">
            {SLIDER_MARKS.map(([text, value], i) => (
              <span
                key={text}
                className="absolute"
                style={{ left: `${toSlider(value) / 10}%`, transform: i === 0 ? "none" : i === SLIDER_MARKS.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className={label}>Placed in service</span>
          <div className="grid grid-cols-2 gap-3">
            <Select id="est-month" value={String(month)} onChange={v => setMonth(Number(v))}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
            <Select id="est-year" value={String(year)} onChange={v => setYear(Number(v))}>
              {YEARS.map(y => <option key={y} value={y}>{y === TAX_YEAR ? `This year (${y})` : y}</option>)}
            </Select>
          </div>
        </div>

        <div>
          <span className={label}>Federal bracket</span>
          <Toggle options={BRACKETS} value={bracket as (typeof BRACKETS)[number]} onChange={setBracket} format={v => `${Math.round(v * 100)}%`} />
        </div>

        <div>
          <span className={label}>Building depreciated over</span>
          <Toggle options={[27.5, 39] as const} value={life} onChange={setLife} format={v => `${v} years`} />
          <p className={hint}>Residential rental is 27.5. Office, retail, industrial and other nonresidential property is 39.</p>
        </div>
      </div>
      <button type="button" onClick={() => setShowEstimate(true)} className={`${btn.accentLg} w-full mt-5`}>
        Get my estimate
      </button>
      {showEstimate && (() => {
        const e = estimate({ propertyType, price, landShare: LAND_SHARE, month, year, contractBeforeJan2025: false, bracket, life });
        return (
          <div className="mt-4 rounded-lg bg-secondary px-4 py-4 text-center" aria-live="polite">
            <p className="text-sm text-muted-foreground">Estimated tax savings</p>
            <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{usd(e.taxValue.low)} – {usd(e.taxValue.high)}</p>
          </div>
        );
      })()}
      <p className="text-sm text-muted-foreground mt-4">For estimate purposes only. Real numbers will vary.</p>
    </div>
  );
}
