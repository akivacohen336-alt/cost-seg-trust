// Deal stages, in pipeline order. Labels match the HubSpot pipeline exactly.
export const STAGES = [
  { key: "new_request", label: "New Request", probability: "0.1" },
  { key: "waiting_on_quotes", label: "Waiting on Quotes", probability: "0.2" },
  { key: "quotes_received", label: "Quotes Received", probability: "0.4" },
  { key: "comparison_ready", label: "Comparison Ready", probability: "0.5" },
  { key: "awaiting_approval", label: "Awaiting Approval", probability: "0.6" },
  { key: "sent_to_client", label: "Sent to Client", probability: "0.8" },
  { key: "closed", label: "Closed", probability: "1.0", closed: true },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export const stageLabel = (k: string) => STAGES.find(s => s.key === k)?.label ?? k;
export const isStageKey = (k: string): k is StageKey => STAGES.some(s => s.key === k);

export const PROPERTY_TYPES = [
  "Single-family rental", "Short-term rental", "Multifamily", "Office", "Retail",
  "Industrial/Warehouse", "Self storage", "Hotel/Hospitality", "Mixed use", "Other",
] as const;
