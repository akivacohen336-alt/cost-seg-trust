import { config } from "./config";
import { db } from "./db";

type Result = { status: "sent" | "failed" | "skipped"; providerId?: string; error?: string };

async function record(dealId: string | null, channel: "email" | "sms", recipient: string, purpose: string, r: Result) {
  await db()`insert into notifications (deal_id, channel, recipient, purpose, status, provider_id, error)
             values (${dealId}, ${channel}, ${recipient}, ${purpose}, ${r.status}, ${r.providerId ?? null}, ${r.error ?? null})`;
  return r;
}

export async function sendEmail(opts: {
  to: string; subject: string; html: string; text: string; dealId?: string | null; purpose: string;
}): Promise<Result> {
  if (!config.resend.apiKey) {
    return record(opts.dealId ?? null, "email", opts.to, opts.purpose, { status: "skipped", error: "Email service not configured" });
  }
  try {
    const res = await fetch(config.resend.baseUrl + "/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.resend.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: config.resend.from, to: [opts.to], subject: opts.subject, html: opts.html, text: opts.text }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
    return record(opts.dealId ?? null, "email", opts.to, opts.purpose, { status: "sent", providerId: body?.id });
  } catch (e) {
    return record(opts.dealId ?? null, "email", opts.to, opts.purpose, { status: "failed", error: (e as Error).message });
  }
}

export async function sendSms(opts: { to: string; body: string; dealId?: string | null; purpose: string }): Promise<Result> {
  const t = config.twilio;
  if (!t.accountSid || !t.authToken || !t.from) {
    return record(opts.dealId ?? null, "sms", opts.to, opts.purpose, { status: "skipped", error: "Text messaging not configured" });
  }
  try {
    const res = await fetch(`${t.baseUrl}/2010-04-01/Accounts/${t.accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${t.accountSid}:${t.authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: opts.to, From: t.from, Body: opts.body }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message ?? `HTTP ${res.status}`);
    return record(opts.dealId ?? null, "sms", opts.to, opts.purpose, { status: "sent", providerId: body?.sid });
  } catch (e) {
    return record(opts.dealId ?? null, "sms", opts.to, opts.purpose, { status: "failed", error: (e as Error).message });
  }
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const usd = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : "$" + Math.round(Number(n)).toLocaleString("en-US");

export type NewDealSummary = {
  id: string; number: number; clientName: string; email: string; phone: string;
  propertyType: string; address: string; purchasePrice: number; placedInService: string;
  landValue?: string | null; renovationSpend?: number | null; hasCpa?: boolean | null; notes?: string | null;
  utm?: string | null;
};

export async function notifyOwnerOfNewDeal(d: NewDealSummary) {
  const link = `${config.appUrl}/admin/deals/${d.id}`;
  const headline = `New deal #${d.number}: ${d.propertyType} at ${d.address}, ${usd(d.purchasePrice)}`;
  const rows: [string, string][] = [
    ["Client", d.clientName], ["Email", d.email], ["Phone", d.phone],
    ["Property type", d.propertyType], ["Address", d.address], ["Purchase price", usd(d.purchasePrice)],
    ["Placed in service", d.placedInService], ["Land value", d.landValue || "—"],
    ["Renovation spend", d.renovationSpend ? usd(d.renovationSpend) : "—"],
    ["Has a CPA", d.hasCpa == null ? "—" : d.hasCpa ? "Yes" : "No"], ["Notes", d.notes || "—"],
    ["Source", d.utm || "Website (direct)"],
  ];
  const html = `<div style="font-family:Arial,sans-serif;color:#1F2937;max-width:560px">
    <div style="background:#0F2A44;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0"><b style="font-size:18px">Cost Seg Trust</b><br><span style="opacity:.85">New quote request</span></div>
    <div style="border:1px solid #DDE3EA;border-top:0;padding:20px;border-radius:0 0 10px 10px">
      <p style="margin:0 0 14px;font-size:16px"><b>${esc(headline)}</b></p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">${rows
        .map(([k, v]) => `<tr><td style="padding:6px 0;color:#5B6878;width:150px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`)
        .join("")}</table>
      <p style="margin:18px 0 0"><a href="${esc(link)}" style="background:#10B981;color:#062b1f;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:bold;display:inline-block">Open the deal</a></p>
    </div></div>`;
  const text = `${headline}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nOpen the deal: ${link}`;

  const [email, sms] = await Promise.all([
    sendEmail({ to: config.owner.email, subject: headline, html, text, dealId: d.id, purpose: "owner_new_deal" }),
    sendSms({ to: config.owner.phone, body: `Cost Seg Trust: ${headline}. ${link}`, dealId: d.id, purpose: "owner_new_deal" }),
  ]);
  return { email, sms };
}
