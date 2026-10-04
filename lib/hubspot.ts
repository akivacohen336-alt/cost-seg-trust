// HubSpot sync. Duplicate protection works in three layers:
//  1. Contacts are keyed by email. We look the contact up by email first and
//     create only if HubSpot has none; a "contact already exists" conflict
//     falls back to updating the existing one.
//  2. Each deal carries our own request id in a unique HubSpot property
//     (cst_request_id). HubSpot itself rejects a second deal with the same
//     value, so retries and double submissions can never create two deals.
//  3. Once synced, the HubSpot ids are stored on our rows and every later
//     sync is an update of that exact record.
import { config } from "./config";
import { db } from "./db";
import { STAGES, type StageKey } from "./stages";

export const REQUEST_ID_PROPERTY = "cst_request_id";

export class HubSpotError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function hs<T = any>(method: string, path: string, body?: unknown, attempt = 0): Promise<T> {
  if (!config.hubspot.token) throw new HubSpotError("HubSpot is not configured", 0);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(config.hubspot.baseUrl + path, {
      method,
      headers: { Authorization: `Bearer ${config.hubspot.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    if (attempt < 2) { await sleep(500 * 2 ** attempt); return hs(method, path, body, attempt + 1); }
    throw new HubSpotError(`HubSpot request failed: ${(e as Error).message}`, 0);
  } finally {
    clearTimeout(timer);
  }
  if ((res.status === 429 || res.status >= 500) && attempt < 3) {
    const wait = Number(res.headers.get("retry-after")) * 1000 || 700 * 2 ** attempt;
    await sleep(wait);
    return hs(method, path, body, attempt + 1);
  }
  const text = await res.text();
  const json = text ? safeJson(text) : undefined;
  if (!res.ok) {
    const msg = (json as any)?.message ?? text ?? res.statusText;
    throw new HubSpotError(`HubSpot ${method} ${path.split("?")[0]} failed (${res.status}): ${msg}`, res.status, json);
  }
  return json as T;
}
const safeJson = (t: string) => { try { return JSON.parse(t); } catch { return t; } };

// ---------- One-time setup: pipeline + unique request-id property ----------

type PipelineCache = { pipelineId: string; stages: Record<StageKey, string> };

export async function ensureRequestIdProperty() {
  try {
    await hs("GET", `/crm/v3/properties/deals/${REQUEST_ID_PROPERTY}`);
    return "exists" as const;
  } catch (e) {
    if (!(e instanceof HubSpotError) || e.status !== 404) throw e;
  }
  await hs("POST", "/crm/v3/properties/deals", {
    name: REQUEST_ID_PROPERTY,
    label: "Cost Seg Trust request ID",
    description: "Set by the Cost Seg Trust website. Unique per quote request; prevents duplicate deals.",
    groupName: "dealinformation",
    type: "string",
    fieldType: "text",
    hasUniqueValue: true,
  });
  return "created" as const;
}

export async function ensurePipeline(): Promise<PipelineCache> {
  const list = await hs<{ results: { id: string; label: string; stages: { id: string; label: string }[] }[] }>(
    "GET", "/crm/v3/pipelines/deals",
  );
  let pipeline = list.results.find(p => p.label.trim().toLowerCase() === config.hubspot.pipelineLabel.toLowerCase());
  if (!pipeline) {
    pipeline = await hs("POST", "/crm/v3/pipelines/deals", {
      label: config.hubspot.pipelineLabel,
      displayOrder: 99,
      stages: STAGES.map((s, i) => ({
        label: s.label,
        displayOrder: i,
        metadata: { probability: s.probability, ...("closed" in s ? { isClosed: "true" } : {}) },
      })),
    });
  }
  const p = pipeline!;
  const stages = {} as Record<StageKey, string>;
  for (const [i, s] of STAGES.entries()) {
    let found = p.stages.find(x => x.label.trim().toLowerCase() === s.label.toLowerCase());
    if (!found) {
      found = await hs("POST", `/crm/v3/pipelines/deals/${p.id}/stages`, {
        label: s.label,
        displayOrder: i,
        metadata: { probability: s.probability, ...("closed" in s ? { isClosed: "true" } : {}) },
      });
    }
    stages[s.key] = found!.id;
  }
  const cache = { pipelineId: p.id, stages };
  await db()`insert into app_settings (key, value) values ('hubspot_pipeline', ${db().json(cache)})
             on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return cache;
}

async function pipelineIds(): Promise<PipelineCache> {
  const [row] = await db()`select value from app_settings where key = 'hubspot_pipeline'`;
  if (row) return row.value as PipelineCache;
  await ensureRequestIdProperty();
  return ensurePipeline();
}

export async function setupHubSpot() {
  const property = await ensureRequestIdProperty();
  const pipeline = await ensurePipeline();
  return { property, pipeline };
}

// ---------- Contacts ----------

export type ContactInput = { email: string; firstName: string; lastName: string; phone?: string | null };

export async function upsertContact(c: ContactInput, knownId?: string | null): Promise<string> {
  const properties: Record<string, string> = { email: c.email, firstname: c.firstName, lastname: c.lastName };
  if (c.phone) properties.phone = c.phone;

  if (knownId) {
    try {
      await hs("PATCH", `/crm/v3/objects/contacts/${knownId}`, { properties });
      return knownId;
    } catch (e) {
      // Contact was deleted or merged in HubSpot: fall through to lookup by email.
      if (!(e instanceof HubSpotError) || e.status !== 404) throw e;
    }
  }
  const existing = await findContactByEmail(c.email);
  if (existing) {
    await hs("PATCH", `/crm/v3/objects/contacts/${existing}`, { properties });
    return existing;
  }
  try {
    const created = await hs<{ id: string }>("POST", "/crm/v3/objects/contacts", { properties });
    return created.id;
  } catch (e) {
    // Created by someone else a moment ago: HubSpot answers 409 and names the id.
    if (e instanceof HubSpotError && e.status === 409) {
      const id = existingIdFromConflict(e) ?? (await findContactByEmail(c.email));
      if (id) {
        await hs("PATCH", `/crm/v3/objects/contacts/${id}`, { properties });
        return id;
      }
    }
    throw e;
  }
}

async function findContactByEmail(email: string): Promise<string | null> {
  try {
    const r = await hs<{ id: string }>("GET", `/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`);
    return r.id;
  } catch (e) {
    if (e instanceof HubSpotError && e.status === 404) return null;
    throw e;
  }
}

function existingIdFromConflict(e: HubSpotError): string | null {
  const m = String((e.body as any)?.message ?? "").match(/Existing ID:\s*(\d+)/i);
  return m ? m[1] : null;
}

// ---------- Deals ----------

export type DealInput = {
  requestId: string;
  name: string;
  stage: StageKey;
  description: string;
};

export async function upsertDeal(d: DealInput, knownId?: string | null): Promise<string> {
  const { pipelineId, stages } = await pipelineIds();
  const properties = {
    dealname: d.name,
    pipeline: pipelineId,
    dealstage: stages[d.stage],
    description: d.description,
    [REQUEST_ID_PROPERTY]: d.requestId,
  };

  if (knownId) {
    try {
      await hs("PATCH", `/crm/v3/objects/deals/${knownId}`, { properties });
      return knownId;
    } catch (e) {
      if (!(e instanceof HubSpotError) || e.status !== 404) throw e;
    }
  }
  const existing = await findDealByRequestId(d.requestId);
  if (existing) {
    await hs("PATCH", `/crm/v3/objects/deals/${existing}`, { properties });
    return existing;
  }
  try {
    const created = await hs<{ id: string }>("POST", "/crm/v3/objects/deals", { properties });
    return created.id;
  } catch (e) {
    // The unique request-id property already exists on a deal: use that deal.
    if (e instanceof HubSpotError && (e.status === 409 || e.status === 400)) {
      const id = await findDealByRequestId(d.requestId);
      if (id) {
        await hs("PATCH", `/crm/v3/objects/deals/${id}`, { properties });
        return id;
      }
    }
    throw e;
  }
}

async function findDealByRequestId(requestId: string): Promise<string | null> {
  try {
    const r = await hs<{ id: string }>(
      "GET", `/crm/v3/objects/deals/${encodeURIComponent(requestId)}?idProperty=${REQUEST_ID_PROPERTY}`,
    );
    return r.id;
  } catch (e) {
    if (e instanceof HubSpotError && e.status === 404) return null;
    throw e;
  }
}

export async function updateDealStage(hubspotDealId: string, stage: StageKey) {
  const { stages } = await pipelineIds();
  await hs("PATCH", `/crm/v3/objects/deals/${hubspotDealId}`, { properties: { dealstage: stages[stage] } });
}

export async function associateDealWithContact(dealId: string, contactId: string) {
  // Default association; HubSpot treats a repeat call as a no-op.
  await hs("PUT", `/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`);
}
