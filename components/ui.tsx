import { STAGES, stageLabel } from "@/lib/stages";

export const usd = (n: unknown) => (n == null || n === "" ? "—" : "$" + Math.round(Number(n)).toLocaleString("en-US"));
export const dateTime = (d: Date | string) =>
  new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" });
export const dateOnly = (d: Date | string) =>
  (d instanceof Date ? d.toISOString() : String(d)).slice(0, 10);

const tone: Record<string, string> = {
  new_request: "warn", waiting_on_quotes: "info", quotes_received: "good", comparison_ready: "good",
  awaiting_approval: "warn", sent_to_client: "info", closed: "",
};
export function StagePill({ stage }: { stage: string }) {
  return <span className={`pill ${tone[stage] ?? ""}`}>{stageLabel(stage)}</span>;
}

export function SyncPill({ status }: { status: string }) {
  const t = status === "synced" ? "good" : status === "failed" ? "bad" : status === "skipped" ? "" : "warn";
  const label = status === "synced" ? "Synced" : status === "failed" ? "Failed" : status === "skipped" ? "Not connected" : "Pending";
  return <span className={`pill ${t}`}>{label}</span>;
}

export function StageSteps({ stage }: { stage: string }) {
  const i = STAGES.findIndex(s => s.key === stage);
  return (
    <div className="steps">
      {STAGES.map((s, j) => <span key={s.key} className={j < i ? "done" : j === i ? "on" : ""}>{s.label}</span>)}
    </div>
  );
}
