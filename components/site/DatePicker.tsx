"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const ordinal = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th");
/** "October 19th, 2026", like the Lovable site. */
export const longDate = (s: string) => { const d = parse(s); return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}`; };

const navBtn = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute disabled:pointer-events-none disabled:opacity-20";

/** "Pick a date" button with a month calendar. Future dates can't be picked. */
export default function DatePicker({ value, onChange, height = "h-12 text-base" }: { value: string; onChange: (v: string) => void; height?: string }) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [view, setView] = useState(() => (value ? parse(value) : today));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const y = view.getFullYear(), m = view.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(y, m, i + 1))];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const atThisMonth = y === today.getFullYear() && m === today.getMonth();
  const years = Array.from({ length: 60 }, (_, i) => today.getFullYear() - i);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => { setView(value ? parse(value) : new Date()); setOpen(o => !o); }}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 w-full ${height} justify-start text-left font-normal ${value ? "" : "text-muted-foreground"}`}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? longDate(value) : <span>Pick a date</span>}
      </button>
      {open && (
        <div role="dialog" className="absolute left-0 top-full mt-1 z-50 w-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none">
          <div className="p-3">
            <div className="flex justify-center pt-1 relative items-center">
              <div className="text-sm font-medium flex items-center gap-1">
                <select aria-label="Month" className="bg-transparent text-sm font-medium cursor-pointer" value={m} onChange={e => setView(new Date(y, Number(e.target.value), 1))}>
                  {MONTHS.map((name, i) => <option key={name} value={i} disabled={y === today.getFullYear() && i > today.getMonth()}>{name}</option>)}
                </select>
                <select aria-label="Year" className="bg-transparent text-sm font-medium cursor-pointer" value={y}
                  onChange={e => { const ny = Number(e.target.value); setView(new Date(ny, ny === today.getFullYear() ? Math.min(m, today.getMonth()) : m, 1)); }}>
                  {years.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                </select>
              </div>
              <button type="button" aria-label="Previous month" className={`${navBtn} left-1`} onClick={() => setView(new Date(y, m - 1, 1))}><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" aria-label="Next month" className={`${navBtn} right-1`} disabled={atThisMonth} onClick={() => setView(new Date(y, m + 1, 1))}><ChevronRight className="h-4 w-4" /></button>
            </div>
            <table className="w-full border-collapse space-y-1 mt-4" role="grid">
              <thead><tr className="flex">{DAYS.map(d => <th key={d} className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]">{d}</th>)}</tr></thead>
              <tbody>
                {weeks.map((w, wi) => (
                  <tr key={wi} className="flex w-full mt-2">
                    {w.map((d, di) => {
                      if (!d) return <td key={di} className="h-9 w-9 p-0" />;
                      const future = d > today;
                      const selected = value === iso(d);
                      const isToday = iso(d) === iso(today);
                      return (
                        <td key={di} className="h-9 w-9 text-center text-sm p-0 relative">
                          <button
                            type="button"
                            disabled={future}
                            aria-selected={selected}
                            onClick={() => { onChange(iso(d)); setOpen(false); }}
                            className={`inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-9 w-9 p-0 font-normal ${
                              selected ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                : isToday ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                            } disabled:text-muted-foreground disabled:opacity-50 disabled:pointer-events-none`}
                          >
                            {d.getDate()}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
