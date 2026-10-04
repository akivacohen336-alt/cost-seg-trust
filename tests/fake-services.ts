// In-memory stand-ins for HubSpot, Resend and Twilio, so tests never touch
// real accounts. The HubSpot fake enforces the same rules the real API does
// for duplicates: unique contact email (409 with "Existing ID") and unique
// values on properties created with hasUniqueValue (400 on a repeat).
import http from "node:http";

type Obj = { id: string; properties: Record<string, string> };

export function createFakeServices() {
  let nextId = 1000;
  const id = () => String(++nextId);
  const state = {
    contacts: [] as Obj[],
    deals: [] as Obj[],
    associations: [] as { dealId: string; contactId: string }[],
    pipelines: [] as { id: string; label: string; stages: { id: string; label: string; metadata: any }[] }[],
    properties: [] as { name: string; hasUniqueValue?: boolean }[],
    emails: [] as any[],
    sms: [] as Record<string, string>[],
    calls: [] as string[],
    failHubSpot: 0, // number of upcoming HubSpot calls to fail with 500
    hideNextContactLookup: false, // simulate search lag: next GET by email says 404 even if it exists
  };

  const uniqueDealProps = () => state.properties.filter(p => p.hasUniqueValue).map(p => p.name);

  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const raw = Buffer.concat(chunks).toString();
    const url = new URL(req.url!, "http://x");
    const p = url.pathname;
    const send = (status: number, body?: unknown) => {
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(body === undefined ? "" : JSON.stringify(body));
    };
    const json = () => (raw ? JSON.parse(raw) : {});

    // ---- Resend ----
    if (p === "/emails" && req.method === "POST") {
      state.emails.push(json());
      return send(200, { id: "email_" + id() });
    }
    // ---- Twilio ----
    if (/^\/2010-04-01\/Accounts\/[^/]+\/Messages\.json$/.test(p)) {
      state.sms.push(Object.fromEntries(new URLSearchParams(raw)));
      return send(201, { sid: "SM" + id() });
    }

    // ---- HubSpot ----
    state.calls.push(`${req.method} ${p}${url.search}`);
    if (req.headers.authorization !== "Bearer test-hubspot-token") return send(401, { message: "bad token" });
    if (state.failHubSpot > 0) { state.failHubSpot--; return send(500, { message: "HubSpot is down" }); }

    if (p === "/crm/v3/pipelines/deals" && req.method === "GET") return send(200, { results: state.pipelines });
    if (p === "/crm/v3/pipelines/deals" && req.method === "POST") {
      const b = json();
      const pl = { id: id(), label: b.label, stages: b.stages.map((s: any) => ({ id: id(), label: s.label, metadata: s.metadata })) };
      state.pipelines.push(pl);
      return send(201, pl);
    }
    let m = p.match(/^\/crm\/v3\/pipelines\/deals\/([^/]+)\/stages$/);
    if (m && req.method === "POST") {
      const pl = state.pipelines.find(x => x.id === m![1]);
      if (!pl) return send(404, { message: "no pipeline" });
      const b = json();
      const st = { id: id(), label: b.label, metadata: b.metadata };
      pl.stages.push(st);
      return send(201, st);
    }
    m = p.match(/^\/crm\/v3\/properties\/deals\/([^/]+)$/);
    if (m && req.method === "GET") {
      const prop = state.properties.find(x => x.name === m![1]);
      return prop ? send(200, prop) : send(404, { message: "Property does not exist" });
    }
    if (p === "/crm/v3/properties/deals" && req.method === "POST") {
      const b = json();
      if (state.properties.some(x => x.name === b.name)) return send(409, { message: "Property already exists" });
      state.properties.push(b);
      return send(201, b);
    }

    // contacts
    if (p === "/crm/v3/objects/contacts" && req.method === "POST") {
      const b = json();
      const email = String(b.properties.email).toLowerCase();
      const dupe = state.contacts.find(c => c.properties.email.toLowerCase() === email);
      if (dupe) return send(409, { status: "error", message: `Contact already exists. Existing ID: ${dupe.id}`, category: "CONFLICT" });
      const c = { id: id(), properties: { ...b.properties, email } };
      state.contacts.push(c);
      return send(201, c);
    }
    m = p.match(/^\/crm\/v3\/objects\/contacts\/([^/]+)$/);
    if (m) {
      const key = decodeURIComponent(m[1]);
      const byEmail = url.searchParams.get("idProperty") === "email";
      const c = state.contacts.find(x => (byEmail ? x.properties.email === key.toLowerCase() : x.id === key));
      if (req.method === "GET") {
        if (byEmail && state.hideNextContactLookup) { state.hideNextContactLookup = false; return send(404, { message: "not found" }); }
        return c ? send(200, c) : send(404, { message: "not found" });
      }
      if (req.method === "PATCH") {
        if (!c) return send(404, { message: "not found" });
        Object.assign(c.properties, json().properties);
        return send(200, c);
      }
    }

    // deals
    if (p === "/crm/v3/objects/deals" && req.method === "POST") {
      const b = json();
      for (const prop of uniqueDealProps()) {
        const v = b.properties[prop];
        if (v != null && state.deals.some(d => d.properties[prop] === v)) {
          return send(400, { status: "error", category: "VALIDATION_ERROR", message: `Property values were not valid: ${prop} already has that value` });
        }
      }
      const d = { id: id(), properties: { ...b.properties } };
      state.deals.push(d);
      return send(201, d);
    }
    m = p.match(/^\/crm\/v3\/objects\/deals\/([^/]+)$/);
    if (m) {
      const key = decodeURIComponent(m[1]);
      const idProp = url.searchParams.get("idProperty");
      const d = state.deals.find(x => (idProp ? x.properties[idProp] === key : x.id === key));
      if (req.method === "GET") return d ? send(200, d) : send(404, { message: "not found" });
      if (req.method === "PATCH") {
        if (!d) return send(404, { message: "not found" });
        Object.assign(d.properties, json().properties);
        return send(200, d);
      }
    }
    m = p.match(/^\/crm\/v4\/objects\/deals\/([^/]+)\/associations\/default\/contacts\/([^/]+)$/);
    if (m && req.method === "PUT") {
      if (!state.associations.some(a => a.dealId === m![1] && a.contactId === m![2])) {
        state.associations.push({ dealId: m[1], contactId: m[2] });
      }
      return send(200, { status: "COMPLETE" });
    }
    send(404, { message: `fake: no route for ${req.method} ${p}` });
  });

  return {
    state,
    listen: () => new Promise<string>(resolve => server.listen(0, "127.0.0.1", () => {
      resolve(`http://127.0.0.1:${(server.address() as any).port}`);
    })),
    close: () => new Promise<void>(r => server.close(() => r())),
    reset() {
      state.contacts = []; state.deals = []; state.associations = []; state.pipelines = []; state.properties = [];
      state.emails = []; state.sms = []; state.calls = []; state.failHubSpot = 0; state.hideNextContactLookup = false;
    },
  };
}
