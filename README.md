# Cost Seg Trust

Website and back office for the Cost Seg Trust quote marketplace. Built in stages. **This is stage 1.**

| Stage | What | Status |
|---|---|---|
| 1 | Database, admin dashboard, client quote form, new-deal creation, owner alert (email + text), HubSpot contact and deal sync | Built and tested |
| 2 | Supplier invites with personalized secure links (no supplier logins), 40-hour response tracking, reminders, supplier quote form | Built and tested |
| 3 | AI extraction, side-by-side comparison, approval, branded PDF, send to client | Built and tested |

## Stack

- **Next.js 15** (React 19, TypeScript). Hosts the website, the admin and the API.
- **Postgres** (Supabase recommended, any Postgres 14+ works). The app talks to it from the server only.
- **Resend** for email, **HubSpot** for the CRM. Owner alerts go by email only (no texts). Each is optional: when its keys are missing the app records "skipped" and carries on.

## What happens when a client submits the form

1. The form is validated in the browser and again on the server (bad entries come back with a message next to the field). A hidden field quietly drops bot submissions.
2. The client is saved (one record per email address) and a new deal is created at stage **New Request** with the next CST number (CST-1001, CST-1002 …). Each form load carries a one-time key, so a double-click or retry never creates a second deal.
3. An email goes to akivacohen336@gmail.com and aron.turen@gmail.com with the details and a link to the deal.
4. The deal is synced to HubSpot (see below).
5. The client sees a thank-you message with their reference number.

Every alert and every sync is logged on the deal page. If HubSpot or an alert fails, the deal is still saved, the error is shown on the deal page, and "Retry HubSpot sync" fixes it later.

## HubSpot: how duplicates are prevented

- **Contacts** are matched by email. The app looks the email up in HubSpot first and updates that contact if it exists (name and phone only; other HubSpot fields are left alone). It creates a contact only when HubSpot has none, and if HubSpot answers "contact already exists" it uses that contact.
- **Deals** carry the app's own request ID in a HubSpot field called **Cost Seg Trust request ID**, created as a *unique* field. HubSpot itself refuses a second deal with the same value, so no retry, double submission or crash can produce two deals for one request. Once synced, the HubSpot deal ID is stored and later syncs update that exact deal.
- Each deal is associated with its contact. Re-running the association is harmless.
- **Stages** move with the deal: changing the stage in the admin moves the HubSpot deal to the same stage.
- **Pipeline:** "Cost Seg Trust" with the stages New Request → Waiting on Quotes → Quotes Received → Comparison Ready → Awaiting Approval → Sent to Client → Closed. The admin Settings page has a "Set up HubSpot pipeline" button that creates the pipeline and the unique field. It's safe to run again: it never creates a second pipeline, and it adds any missing stages to an existing one.

## Test suppliers

Three test suppliers are seeded (Test Supplier A, B, C). Their emails are `akivacohen336+supplier-a@gmail.com` and so on, so anything "sent to a supplier" during testing lands in your own inbox. They're marked **Test** on the Suppliers page. Real suppliers are added later on the same page.

## Tests

```
DATABASE_URL=postgres://… npm test
```

19 automated tests run against a real Postgres database with stand-ins for HubSpot and Resend, so no real account is touched. They cover the full submission, alerts, HubSpot contact and deal creation, duplicate submissions, returning clients, contacts that already exist in HubSpot, the "already exists" race, lost HubSpot IDs, HubSpot outages and retries, stage moves, pipeline setup, validation, bot filtering, and that every table is locked from public access.

## Setup checklist (one-time)

The database sets itself up: when the app starts it creates or upgrades every table and adds the three test suppliers (see `lib/migrate.ts`). `db/supabase-setup.sql` is only a manual fallback.


1. **Database (Supabase, free tier):** create a project and copy the connection string (Project Settings → Database → Connection string → "Transaction pooler", port 6543). Then run:
   `DATABASE_URL="…" npm run db:migrate -- --seed`
2. **Hosting (Vercel, free tier):** import this code from GitHub and add the environment variables below.
3. **Admin password:** run `npm run hash-password -- "your password"` and paste the output as `ADMIN_PASSWORD_HASH`. Set `SESSION_SECRET` to any random string of 32+ characters.
4. **Email (Resend):** create an account and an API key. To send from your own domain, verify the domain in Resend and set `EMAIL_FROM` (for example `Cost Seg Trust <alerts@yourdomain.com>`).
5. **HubSpot:** create a private app (HubSpot Settings → Integrations → Private Apps; newer accounts call these "Legacy apps") with these scopes: `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.deals.read`, `crm.objects.deals.write`, `crm.schemas.deals.read`, `crm.schemas.deals.write`. Copy its access token into `HUBSPOT_PRIVATE_APP_TOKEN`, then press **Set up HubSpot pipeline** on the admin Settings page.
   - HubSpot's free plan allows only one deal pipeline. On the free plan, set `HUBSPOT_PIPELINE_LABEL` to the name of your existing pipeline (usually "Sales Pipeline") and the app will add the seven stages to it.

### Environment variables

| Name | Required | Example / note |
|---|---|---|
| `DATABASE_URL` | yes | Supabase transaction pooler connection string (`POSTGRES_URL` from Vercel's Supabase integration also works) |
| `APP_URL` | no on Vercel | `https://costsegtrust.com` (used in links); defaults to the Vercel production address |
| `ADMIN_EMAIL` | yes | `akivacohen336@gmail.com` |
| `ADMIN_PASSWORD_HASH` | yes | from `npm run hash-password` |
| `SESSION_SECRET` | yes | random, 32+ characters |
| `OWNER_NOTIFY_EMAIL` | no | comma-separated alert recipients; defaults to `akivacohen336@gmail.com,aron.turen@gmail.com` |
| `CONTACT_EMAIL`, `CONTACT_PHONE` | no | shown in the website footer |
| `RESEND_API_KEY`, `EMAIL_FROM` | for email | |
| `HUBSPOT_PRIVATE_APP_TOKEN` | for HubSpot | |
| `HUBSPOT_PIPELINE_LABEL` | no | defaults to `Cost Seg Trust` |
| `HUBSPOT_PORTAL_ID` | no | your HubSpot account ID, makes deal IDs clickable in the admin |
| `ANTHROPIC_API_KEY` | for AI | reads proposal PDFs and writes the comparison summary; without it suppliers' typed numbers and a plain summary are used |
| `CRON_SECRET` | for the 40-hour clock | random string; the scheduler sends it as `Authorization: Bearer <CRON_SECRET>` |

When putting `ADMIN_PASSWORD_HASH` in a local `.env.local` file, write each `$` as `\$`. Vercel's settings screen takes the hash as-is.

## Suppliers, AI and the one-pager (stages 2 and 3)

1. On a deal, tick up to 10 active suppliers and press **Send quote request**. Each gets an email with a private link (`/q/<token>`). Only a hash of the link is stored. Suppliers see property type, city/state, price, dates, land value, renovation spend and whether there is a CPA, never the client's name, contact details or street address. The deal moves to Waiting on Quotes (HubSpot follows).
2. The supplier fills in the form and/or attaches a proposal PDF (up to 4 MB), or declines. Each response alerts you by email and text. When everyone has responded and at least one quote is in, the deal moves to Quotes Received.
3. The 40-hour clock (`/api/cron/deadlines`, hourly): one reminder with a fresh link after 24 hours (the old link keeps working), then at 40 hours open invites become "No response", the window closes and you are alerted. Late suppliers can still submit. Opening the admin also runs the check.
4. If a PDF is attached, AI reads it into the standard fields. What the supplier typed always wins; AI fills blanks; differences over 1% are flagged on the deal page for you to check.
5. **Build side-by-side comparison** creates the one-pager with a short AI summary (or a plain summary without AI). Click any value to correct it, hide suppliers or rows, or show "Provider A, B…" instead of names.
6. **Generate PDF for approval** locks it and makes the branded PDF. **Approve & send to client** emails it with your message (replies go to your contact email). **Make changes** unlocks it; each regenerated PDF is kept as a new version.

### Scheduler
- Vercel Pro: `vercel.json` already runs the check hourly. Set `CRON_SECRET` in Vercel.
- Vercel Hobby (daily cron only): use `.github/workflows/deadlines.yml`, with repository secrets `APP_URL` and `CRON_SECRET`.

## Referral partners

Admin → **Partners** adds a partner and gives them two links:

- **Referral link** (`/r/CODE`): sends clients to the quote form and remembers the partner for a year, so any quote request from that browser is tagged to the partner. A referred client stays with the partner who first referred them: their later deals are credited to that partner automatically. `/quote?ref=CODE` works too.
- **Partner page** (`/partner/…`): a private page, no password, listing the deals they referred with stage and commission. Partners see the client's first name and last initial, property type and city/state only; never contact details, street address or price. "Replace page link" retires the old link.

Deals can also be tagged to a partner by hand on the deal page. Commission per deal (amount and paid) is set on the partner's admin page. Suppliers never see anything about partners. Adding a partner sends nothing.

## Project layout

```
app/page.tsx                    public page with the quote form
app/api/quote-requests          form endpoint
app/admin/login                 admin sign-in
app/admin/(app)/…               deals list, deal page, suppliers, settings
app/admin/export                CSV export
lib/deals.ts                    deal creation, follow-ups, stage changes
lib/hubspot.ts                  HubSpot sync and duplicate protection
lib/notify.ts                   owner email and text alerts
db/migrations, db/seed          database structure and test suppliers
tests/                          automated tests and fake services
```
