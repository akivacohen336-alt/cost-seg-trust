// Documents a client attaches to the website quote form. The form first
// creates the deal, then uploads each file with a short-lived token that
// names only that deal. Files land in the client's folder in the dashboard.
import { SignJWT, jwtVerify } from "jose";
import { MAX_CLIENT_FILE, fileTypeFor, safeFilename } from "./clients";
import { db, logEvent } from "./db";

const AUDIENCE = "lead-files";
export const DOC_TYPES: Record<string, string> = {
  closing_statement: "Closing statement",
  prior_depreciation: "Prior depreciation schedule",
  other: "Other document",
};
const MAX_FILES_PER_DEAL = 15;

const key = () => {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(s);
};

export const leadFilesToken = (dealId: string) =>
  new SignJWT({ deal: dealId }).setProtectedHeader({ alg: "HS256" }).setAudience(AUDIENCE).setIssuedAt().setExpirationTime("2h").sign(key());

export async function dealForToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { audience: AUDIENCE });
    return typeof payload.deal === "string" ? payload.deal : null;
  } catch {
    return null;
  }
}

export type SaveResult = { ok: true } | { ok: false; status: number; error: string };

export async function saveLeadFile(dealId: string, docType: string, file: File): Promise<SaveResult> {
  const type = /\.(pdf|jpe?g|png|heic|heif)$/i.test(file.name) ? fileTypeFor(file.name) : null;
  if (!type) return { ok: false, status: 415, error: "Only PDF, JPG, PNG or HEIC files" };
  if (file.size === 0 || file.size > MAX_CLIENT_FILE) return { ok: false, status: 413, error: "Files must be under 4MB" };
  const [deal] = await db()`
    select d.id, d.client_id, (select count(*)::int from client_files f where f.deal_id = d.id) as files
    from deals d where d.id = ${dealId}`;
  if (!deal) return { ok: false, status: 404, error: "Request not found" };
  if (deal.files >= MAX_FILES_PER_DEAL) return { ok: false, status: 429, error: "Too many files" };
  const label = DOC_TYPES[docType] ?? DOC_TYPES.other;
  const filename = safeFilename(`${label} - ${file.name}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await db()`insert into client_files (client_id, deal_id, filename, content_type, size_bytes, data)
             values (${deal.client_id}, ${deal.id}, ${filename}, ${type}, ${bytes.length}, ${bytes})`;
  await logEvent(deal.id, "client_file_uploaded", { filename, docType: label });
  return { ok: true };
}
