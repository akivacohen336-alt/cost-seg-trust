import { config, integrationStatus } from "@/lib/config";
import { db } from "@/lib/db";
import SettingsActions, { DeadlineCheck } from "@/components/SettingsActions";
import TeamInviteForm from "@/components/TeamInviteForm";
import { dateOnly } from "@/components/ui";
import { currentAdmin } from "@/lib/admin-auth";
import { listTeam } from "@/lib/team";
import { removeTeamLogin } from "../../team-actions";

export default async function SettingsPage() {
  const s = integrationStatus();
  const [pipe] = await db()`select value, updated_at from app_settings where key = 'hubspot_pipeline'`;
  const [me, team] = await Promise.all([currentAdmin(), listTeam()]);
  const rows: [string, boolean, string][] = [
    ["Database", s.database, "Stores deals, clients and suppliers."],
    ["Admin login", s.adminLogin, "Password sign-in for this dashboard."],
    ["Email alerts (Resend)", s.email, `New requests, deal updates and website messages are emailed to ${config.owner.emails.join(" and ")}.`],
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
      <h2 style={{ marginTop: 28 }}>Logins</h2>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Who</th><th>Status</th><th>Last sign-in</th>{me?.owner ? <th /> : null}</tr></thead>
          <tbody>
            <tr><td><b>{config.admin.email}</b><div className="small muted">Owner</div></td><td><span className="pill good">Active</span></td><td className="small muted">–</td>{me?.owner ? <td /> : null}</tr>
            {team.filter(m => m.active).map(m => (
              <tr key={m.id}>
                <td><b>{m.name || m.email}</b>{m.name ? <div className="small muted">{m.email}</div> : null}</td>
                <td>{m.password_set_at ? <span className="pill good">Active</span>
                  : m.invite_expires_at && new Date(m.invite_expires_at) > new Date() ? <span className="pill warn">Email sent, password not chosen yet</span>
                  : <span className="pill warn">Link expired</span>}</td>
                <td className="small">{m.last_login_at ? dateOnly(m.last_login_at) : <span className="muted">Never</span>}</td>
                {me?.owner ? <td><form action={removeTeamLogin}><input type="hidden" name="id" value={m.id} /><button className="btn sm" type="submit">Remove login</button></form></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {me?.owner ? <TeamInviteForm /> : null}
      <SettingsActions hubspot={s.hubspot} alerts={s.email} />
      <DeadlineCheck />
    </>
  );
}
