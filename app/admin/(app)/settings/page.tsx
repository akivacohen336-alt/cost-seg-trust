import { config, integrationStatus } from "@/lib/config";
import { db } from "@/lib/db";
import SettingsActions, { DeadlineCheck } from "@/components/SettingsActions";

export default async function SettingsPage() {
  const s = integrationStatus();
  const [pipe] = await db()`select value, updated_at from app_settings where key = 'hubspot_pipeline'`;
  const rows: [string, boolean, string][] = [
    ["Database", s.database, "Stores deals, clients and suppliers."],
    ["Admin login", s.adminLogin, "Password sign-in for this dashboard."],
    ["Email alerts (Resend)", s.email, `New-deal emails go to ${config.owner.email}.`],
    ["Text alerts (Twilio)", s.sms, `New-deal texts go to ${config.owner.phone}.`],
    ["HubSpot", s.hubspot, pipe ? `Pipeline "${config.hubspot.pipelineLabel}" is set up.` : "Contacts and deals sync once connected."],
    ["AI (Claude)", s.ai, "Reads supplier proposal PDFs into standard numbers and writes the comparison summary."],
    ["Hourly scheduler", s.scheduler, `Runs the ${config.quoteWindowHours}-hour clock: reminders after ${config.reminderAfterHours} hours, then closes the window. It also runs whenever you open this dashboard.`],
  ];
  return (
    <>
      <div className="page-title"><h1>Settings</h1></div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Connection</th><th>Status</th><th>What it does</th></tr></thead>
          <tbody>
            {rows.map(([name, ok, what]) => (
              <tr key={name}><td><b>{name}</b></td><td>{ok ? <span className="pill good">Connected</span> : <span className="pill warn">Not set up</span>}</td><td className="small">{what}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <SettingsActions hubspot={s.hubspot} alerts={s.email || s.sms} />
      <DeadlineCheck />
    </>
  );
}
