// Client folders: one place per client for their deals, files and notes.
import { db } from "./db";

export const MAX_CLIENT_FILE = 4 * 1024 * 1024;

// What can be uploaded, and how it is served back. Anything not shown
// inline is downloaded, so an uploaded file can never run in the admin.
export const FILE_TYPES: Record<string, { label: string; inline: boolean }> = {
  "application/pdf": { label: "PDF", inline: true },
  "image/png": { label: "Image", inline: true },
  "image/jpeg": { label: "Image", inline: true },
  "image/webp": { label: "Image", inline: true },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "Word", inline: false },
  "application/msword": { label: "Word", inline: false },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { label: "Excel", inline: false },
  "application/vnd.ms-excel": { label: "Excel", inline: false },
  "text/csv": { label: "CSV", inline: false },
  "text/plain": { label: "Text", inline: false },
};

const EXT_TYPES: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel",
  csv: "text/csv", txt: "text/plain",
};

/** Decides the stored type from the file name (browsers report types inconsistently). */
export function fileTypeFor(name: string): string | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return EXT_TYPES[ext] ?? null;
}

export const safeFilename = (name: string) => (name || "file").replace(/[^\w.\- ()]+/g, "_").slice(0, 150);

const digits = (s: string) => s.replace(/\D/g, "");

/** Clients matching a search (name, email, phone, property address or CST number), newest activity first. */
export async function searchClients(q: string | null, limit = 200) {
  const like = q ? `%${q}%` : null;
  const phone = q && digits(q).length >= 4 ? `%${digits(q)}%` : null;
  const cst = q?.match(/^\s*(?:cst-?)?(\d{3,})\s*$/i)?.[1] ?? null;
  return db()`
    select c.id, c.first_name, c.last_name, c.email::text as email, c.phone, c.created_at,
           count(distinct d.id)::int as deals,
           max(d.created_at) as last_deal_at,
           (select d2.stage from deals d2 where d2.client_id = c.id order by d2.created_at desc limit 1) as latest_stage,
           (select d2.property_address from deals d2 where d2.client_id = c.id order by d2.created_at desc limit 1) as latest_address,
           (select count(*)::int from client_files f where f.client_id = c.id) as files
    from clients c left join deals d on d.client_id = c.id
    where ${like}::text is null
       or (c.first_name || ' ' || c.last_name) ilike ${like}
       or c.email::text ilike ${like}
       or (${phone}::text is not null and regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') like ${phone})
       or exists (select 1 from deals dx where dx.client_id = c.id
                  and (dx.property_address ilike ${like} or (${cst}::text is not null and dx.number::text = ${cst})))
    group by c.id
    order by coalesce(max(d.created_at), c.created_at) desc
    limit ${limit}`;
}

/** Everything in one client's folder. */
export async function loadClientFolder(clientId: string) {
  const sql = db();
  const [client] = await sql`select id, first_name, last_name, email::text as email, phone, notes, hubspot_contact_id, created_at
                             from clients where id = ${clientId}`;
  if (!client) return null;
  const [deals, uploads, proposals, reports, messages] = await Promise.all([
    sql`select d.id, d.number, d.created_at, d.stage, d.property_type, d.property_address, d.purchase_price,
               d.partner_id, p.name as partner_name
        from deals d left join partners p on p.id = d.partner_id where d.client_id = ${clientId} order by d.created_at desc`,
    sql`select f.id, f.filename, f.content_type, f.size_bytes, f.created_at, f.deal_id, d.number as deal_number
        from client_files f left join deals d on d.id = f.deal_id
        where f.client_id = ${clientId} order by f.created_at desc`,
    sql`select q.id, q.proposal_filename as filename, q.submitted_at as created_at, d.id as deal_id, d.number as deal_number, s.company_name
        from supplier_quotes q join supplier_invites i on i.id = q.invite_id join deals d on d.id = i.deal_id
        join suppliers s on s.id = i.supplier_id
        where d.client_id = ${clientId} and q.proposal_pdf is not null order by q.submitted_at desc`,
    sql`select r.id, r.filename, r.version, r.created_at, r.sent_at, d.id as deal_id, d.number as deal_number
        from pdf_reports r join deals d on d.id = r.deal_id
        where d.client_id = ${clientId} order by r.created_at desc`,
    sql`select id, topic, message, created_at, handled from contact_messages
        where lower(email) = lower(${client.email}) order by created_at desc limit 50`,
  ]);
  return { client, deals, uploads, proposals, reports, messages };
}
