// Branded one-page Cost Seg Trust comparison (US Letter, landscape), built with pdf-lib.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ComparisonView } from "./comparison";
import { formatValue } from "./quote-fields";

const NAVY = rgb(15 / 255, 42 / 255, 68 / 255);
const GREEN = rgb(16 / 255, 185 / 255, 129 / 255);
const INK = rgb(31 / 255, 41 / 255, 55 / 255);
const MUTED = rgb(107 / 255, 114 / 255, 128 / 255);
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
  right(page, `${d.property_type}  |  Purchase price ${formatValue(d.purchase_price, "money")}  |  Placed in service ${String(d.placed_in_service instanceof Date ? d.placed_in_service.toISOString() : d.placed_in_service).slice(0, 10)}`, H - 50, 9, reg, rgb(0.85, 0.89, 0.93));
  right(page, `Prepared for ${d.first_name} ${d.last_name}`.trim() + `  |  CST-${d.number}  |  ${new Date().toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/New_York" })}`, H - 62, 9, reg, rgb(0.85, 0.89, 0.93));

  // Table
  const cols = view.columns;
  const n = Math.max(cols.length, 1);
  const labelW = 150, colW = (W - 2 * M - labelW) / n;
  const size = n > 6 ? 7.5 : n > 4 ? 8.5 : 9.5;
  const lh = size + 2.5, pad = 6;
  let y = H - 98;

  const headLines = cols.map(c => wrap(c.name, bold, size, colW - 2 * pad, 2));
  const headH = Math.max(...headLines.map(l => l.length)) * lh + 2 * pad;
  page.drawRectangle({ x: M, y: y - headH, width: W - 2 * M, height: headH, color: HEAD_BG });
  headLines.forEach((lines, i) => lines.forEach((l, j) => text(page, l, M + labelW + i * colW + pad, y - pad - size - j * lh + 1, size, bold)));
  y -= headH;

  view.rows.forEach((r, ri) => {
    const vals = cols.map(c => formatValue((c.values as any)[r.key], r.kind));
    const lines = vals.map(v => wrap(v, reg, size, colW - 2 * pad, 3));
    const labelLines = wrap(r.label, bold, size, labelW - 2 * pad, 2);
    const h = Math.max(labelLines.length, ...lines.map(l => l.length)) * lh + 2 * pad - 2;
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

  // Summary
  y -= 22;
  const summary = String(view.comparison.summary || "").trim();
  const sLines = wrap(summary, reg, 10, W - 2 * M - 16);
  if (y - 20 - sLines.length * 14 < 50) { page = doc.addPage([W, H]); y = H - 50; }
  page.drawRectangle({ x: M, y: y - 8 - sLines.length * 14, width: 3, height: 22 + sLines.length * 14, color: GREEN });
  text(page, "Summary", M + 12, y, 11.5, bold, NAVY);
  sLines.forEach((l, i) => text(page, l, M + 12, y - 18 - i * 14, 10, reg));
  text(page, "Green marks the best value in each row.", M, 48, 7.5, reg, MUTED);

  // Footer on every page
  for (const p of doc.getPages()) {
    const foot = wrap("Estimates are provided by each cost segregation provider and are not guarantees. Tax savings depend on your situation; please confirm with your CPA. This comparison is not tax, legal or accounting advice.", reg, 7.5, W - 2 * M, 2);
    foot.forEach((l, i) => text(p, l, M, 32 - i * 10, 7.5, reg, MUTED));
  }
  return doc.save();
}
