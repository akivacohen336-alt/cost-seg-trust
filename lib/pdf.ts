// Branded one-page Cost Seg Trust comparison (US Letter, landscape), built with pdf-lib.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ComparisonView } from "./comparison";
import { cellText, formatValue } from "./quote-fields";

const NAVY = rgb(15 / 255, 42 / 255, 68 / 255);
const GREEN = rgb(16 / 255, 185 / 255, 129 / 255);
const INK = rgb(31 / 255, 41 / 255, 55 / 255);
const MUTED = rgb(75 / 255, 85 / 255, 99 / 255);
const LINE = rgb(221 / 255, 227 / 255, 234 / 255);
const HEAD_BG = rgb(232 / 255, 238 / 255, 244 / 255);
const ZEBRA = rgb(247 / 255, 249 / 255, 251 / 255);
const BEST_BG = rgb(209 / 255, 250 / 255, 229 / 255);
const BEST_INK = rgb(6 / 255, 95 / 255, 70 / 255);

// Standard PDF fonts only cover Latin-1; swap anything else for a close match.
const clean = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
   .replace(/…/g, "...").replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");

function wrap(text: string, font: PDFFont, size: number, width: number, maxLines = 99) {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
    if (line) lines.push(line);
    line = w;
    while (font.widthOfTextAtSize(line, size) > width && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,3}$/, "..."); }
  return lines.length ? lines : [""];
}

const GREEN_MEANS: Record<string, string> = {
  fee: "the lowest cost of service", savingsPerDollar: "the highest tax benefit per $1 of fee", turnaroundDays: "the fastest turnaround",
};
/** Says only what is actually green on this page. */
function greenNote(keys: string[]) {
  const parts = keys.map(k => GREEN_MEANS[k]).filter(Boolean);
  if (!parts.length) return "";
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `Green marks ${list}. Other rows are not ranked.`;
}

// Footnote type: the smallest text on the page, still readable in print.
const FOOT = 8.5, FOOT_LH = 11;
const SUPERSCRIPT = ["\u00b9", "\u00b2", "\u00b3"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (v: unknown) => {
  const iso = v instanceof Date ? v.toISOString() : String(v);
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return m ? `${MONTHS[m - 1]} ${d}, ${y}` : iso;
};

export async function renderComparisonPdf(view: ComparisonView): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Cost Seg Trust comparison CST-${view.deal.number}`);
  doc.setAuthor("Cost Seg Trust");
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 792, H = 612, M = 36;
  let page: PDFPage = doc.addPage([W, H]);
  const text = (p: PDFPage, s: string, x: number, y: number, size: number, font: PDFFont, color = INK) =>
    p.drawText(clean(s), { x, y, size, font, color });
  const right = (p: PDFPage, s: string, y: number, size: number, font: PDFFont, color = INK) =>
    text(p, s, W - M - font.widthOfTextAtSize(clean(s), size), y, size, font, color);

  // Header band
  page.drawRectangle({ x: 0, y: H - 74, width: W, height: 74, color: NAVY });
  page.drawRectangle({ x: 0, y: H - 77, width: W, height: 3, color: GREEN });
  text(page, "Cost Seg Trust", M, H - 38, 22, bold, rgb(1, 1, 1));
  text(page, "Cost segregation quote comparison", M, H - 56, 10, reg, rgb(0.85, 0.89, 0.93));
  const d = view.deal;
  const addr = wrap(d.property_address, bold, 12, 380, 1)[0];
  right(page, addr, H - 34, 12, bold, rgb(1, 1, 1));
  const facts = [d.property_type, `Purchase price ${formatValue(d.purchase_price, "money")}`];
  if (d.placed_in_service != null) facts.push(`Placed in service ${longDate(d.placed_in_service)}`);
  right(page, facts.join("  |  "), H - 50, 9, reg, rgb(0.85, 0.89, 0.93));
  // No client name on the one-pager (Akiva, Oct 20).
  const meta = [`CST-${d.number}`, new Date().toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/New_York" })];
  right(page, meta.filter(Boolean).join("  |  "), H - 62, 9, reg, rgb(0.85, 0.89, 0.93));

  // Table: rows no provider filled in are left out, and the type shrinks
  // until the table and summary fit on the one page.
  const cols = view.columns;
  const n = Math.max(cols.length, 1);
  const labelW = 190, colW = (W - 2 * M - labelW) / n;
  const rows = view.rows.filter(r => cols.some(c => cellText(c.values as any, r) !== "—"));
  const cell = (c: (typeof cols)[number], r: (typeof rows)[number]) => {
    const v = cellText(c.values as any, r);
    return v === "—" ? "Not stated" : v + (c.calculated.includes(r.key as any) ? " *" : "");
  };
  // Notes shown under the table, numbered in the order their rows appear.
  const notes = [...new Set(rows.map(r => r.note).filter((n): n is string => !!n))];
  const mark = (r: (typeof rows)[number]) => (r.note ? ` ${SUPERSCRIPT[notes.indexOf(r.note)] ?? ""}` : "");
  const footLines = [
    greenNote(rows.filter(r => r.best && view.best[r.key] !== undefined).map(r => r.key)),
    ...notes.map((n, i) => `${SUPERSCRIPT[i]} ${n}`),
    cols.some(c => c.calculated.some(k => rows.some(r => r.key === k))) ? "* Added up or divided from that provider's own figures; nothing estimated." : "",
  ].filter(Boolean).flatMap(l => wrap(l, reg, FOOT, W - 2 * M, 3));
  const summary = String(view.comparison.summary || "").trim();
  const layout = (size: number) => {
    const lh = size + 2.2, pad = 3.5;
    const headLines = cols.map(c => wrap(c.name, bold, size, colW - 2 * pad, 2));
    const headH = Math.max(1, ...headLines.map(l => l.length)) * lh + 2 * pad;
    const body = rows.map(r => {
      const lines = cols.map(c => wrap(cell(c, r), reg, size, colW - 2 * pad, 6));
      const labelLines = wrap(r.label + mark(r), bold, size, labelW - 2 * pad, 2);
      return { r, lines, labelLines, h: Math.max(labelLines.length, ...lines.map(l => l.length)) * lh + 2 * pad - 2 };
    });
    const sSize = Math.min(10, size + 0.5);
    const sLines = summary ? wrap(summary, reg, sSize, W - 2 * M - 16) : [];
    const total = headH + body.reduce((a, b) => a + b.h, 0) + (summary ? 22 + 26 + sLines.length * (sSize + 4) : 0);
    return { size, lh, pad, headLines, headH, body, sSize, sLines, total };
  };
  const room = (H - 98) - 56 - footLines.length * FOOT_LH;
  // Never below 8.5pt, so it reads on a laptop and on paper; a table too long
  // for that moves the summary to a second page rather than shrinking further.
  const base = n > 6 ? 9 : 10;
  let L = layout(base);
  for (let s = base - 0.5; L.total > room && s >= 8.5; s -= 0.5) L = layout(s);
  const { size, lh, pad } = L;
  let y = H - 98;

  page.drawRectangle({ x: M, y: y - L.headH, width: W - 2 * M, height: L.headH, color: HEAD_BG });
  L.headLines.forEach((lines, i) => lines.forEach((l, j) => text(page, l, M + labelW + i * colW + pad, y - pad - size - j * lh + 1, size, bold)));
  y -= L.headH;

  L.body.forEach(({ r, lines, labelLines, h }, ri) => {
    if (ri % 2 === 1) page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: ZEBRA });
    labelLines.forEach((l, j) => text(page, l, M + pad, y - pad - size - j * lh + 1, size, bold));
    cols.forEach((c, i) => {
      const v = Number((c.values as any)[r.key]);
      const isBest = r.best && view.best[r.key] !== undefined && v === view.best[r.key];
      if (isBest) page.drawRectangle({ x: M + labelW + i * colW + 1, y: y - h + 1, width: colW - 2, height: h - 2, color: BEST_BG });
      lines[i].forEach((l, j) => text(page, l, M + labelW + i * colW + pad, y - pad - size - j * lh + 1, size, isBest ? bold : reg, isBest ? BEST_INK : INK));
    });
    page.drawLine({ start: { x: M, y: y - h }, end: { x: W - M, y: y - h }, thickness: 0.6, color: LINE });
    y -= h;
  });

  // Summary, left off when the box is empty
  if (summary) {
    y -= 22;
    const { sLines, sSize } = L, sl = sSize + 4;
    const footTop = 50 + footLines.length * FOOT_LH + 6;
    if (y - 18 - (sLines.length - 1) * sl - 6 < footTop) { page = doc.addPage([W, H]); y = H - 50; }
    page.drawRectangle({ x: M, y: y - 8 - sLines.length * sl, width: 3, height: 22 + sLines.length * sl, color: GREEN });
    text(page, "Summary", M + 12, y, 11.5, bold, NAVY);
    sLines.forEach((l, i) => text(page, l, M + 12, y - 18 - i * sl, sSize, reg));
  }
  footLines.forEach((l, i) => text(page, l, M, 50 + (footLines.length - 1 - i) * FOOT_LH, FOOT, reg, MUTED));

  // Footer on every page
  for (const p of doc.getPages()) {
    const foot = wrap("Estimates are provided by each cost segregation provider and are not guarantees. Tax savings depend on your situation; please confirm with your CPA. This comparison is not tax, legal or accounting advice.", reg, FOOT, W - 2 * M, 2);
    foot.forEach((l, i) => text(p, l, M, 32 - i * FOOT_LH, FOOT, reg, MUTED));
  }
  return doc.save();
}
