// All configuration comes from environment variables. Anything optional
// (email, SMS, HubSpot) is skipped cleanly when its keys are missing.
const env = (k: string) => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};

export const config = {
  brand: "Cost Seg Trust",
  contactEmail: env("CONTACT_EMAIL") ?? "akivacohen336@gmail.com",
  contactPhone: env("CONTACT_PHONE") ?? "(305) 219-1907",
  appUrl: (env("APP_URL") ?? "http://localhost:3000").replace(/\/$/, ""),
  databaseUrl: env("DATABASE_URL"),

  admin: {
    email: env("ADMIN_EMAIL") ?? "akivacohen336@gmail.com",
    passwordHash: env("ADMIN_PASSWORD_HASH"),
    sessionSecret: env("SESSION_SECRET"),
  },

  owner: {
    email: env("OWNER_NOTIFY_EMAIL") ?? env("ADMIN_EMAIL") ?? "akivacohen336@gmail.com",
    phone: env("OWNER_NOTIFY_PHONE") ?? "+13052191907",
  },

  resend: {
    apiKey: env("RESEND_API_KEY"),
    from: env("EMAIL_FROM") ?? "Cost Seg Trust <onboarding@resend.dev>",
    baseUrl: env("RESEND_API_URL") ?? "https://api.resend.com",
  },

  twilio: {
    accountSid: env("TWILIO_ACCOUNT_SID"),
    authToken: env("TWILIO_AUTH_TOKEN"),
    from: env("TWILIO_FROM_NUMBER"),
    baseUrl: env("TWILIO_API_URL") ?? "https://api.twilio.com",
  },

  anthropic: {
    apiKey: env("ANTHROPIC_API_KEY"),
    baseUrl: env("ANTHROPIC_BASE_URL"),
    model: env("ANTHROPIC_MODEL") ?? "claude-opus-5-5",
  },

  cronSecret: env("CRON_SECRET"),
  quoteWindowHours: Number(env("QUOTE_WINDOW_HOURS") ?? 40),
  reminderAfterHours: Number(env("REMINDER_AFTER_HOURS") ?? 24),
  maxSuppliersPerDeal: 10,

  hubspot: {
    token: env("HUBSPOT_PRIVATE_APP_TOKEN"),
    baseUrl: env("HUBSPOT_API_URL") ?? "https://api.hubapi.com",
    pipelineLabel: env("HUBSPOT_PIPELINE_LABEL") ?? "Cost Seg Trust",
  },
};

export const integrationStatus = () => ({
  database: !!config.databaseUrl,
  adminLogin: !!(config.admin.passwordHash && config.admin.sessionSecret),
  email: !!config.resend.apiKey,
  sms: !!(config.twilio.accountSid && config.twilio.authToken && config.twilio.from),
  hubspot: !!config.hubspot.token,
  ai: !!config.anthropic.apiKey,
  scheduler: !!config.cronSecret,
});
