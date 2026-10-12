import { z } from "zod";
import { config } from "./config";
import { db } from "./db";
import { CONTACT_TOPICS } from "./contact-topics";
import { esc, emailHtml, sendEmail } from "./notify";

const optionalText = (max: number) =>
  z.preprocess(v => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const contactSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(200),
  phone: optionalText(40),
  topic: z.enum(CONTACT_TOPICS, { message: "Please choose a topic" }),
  message: z.string().trim().min(10, "Please include a short message").max(4000),
  // Honeypot: real people never see or fill this field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactMessage = z.infer<typeof contactSchema>;

/** Saves the message (so nothing is lost if email isn't set up) and alerts the owner. */
export async function saveContactMessage(m: ContactMessage) {
  const [row] = await db()`insert into contact_messages (full_name, email, phone, topic, message)
    values (${m.fullName}, ${m.email}, ${m.phone ?? null}, ${m.topic}, ${m.message}) returning id`;
  const headline = `Website message from ${m.fullName}: ${m.topic}`;
  const link = `${config.appUrl}/admin/messages`;
  const body = `<p style="margin:0 0 10px"><b>${esc(headline)}</b></p>
    <p style="margin:0 0 4px">Email: ${esc(m.email)}${m.phone ? ` · Phone: ${esc(m.phone)}` : ""}</p>
    <p style="margin:12px 0 0;white-space:pre-line">${esc(m.message)}</p>`;
  await sendEmail({
      to: config.owner.emails, subject: headline, html: emailHtml("Website message", body, { href: link, label: "Open messages" }),
      text: `${headline}\n\nEmail: ${m.email}${m.phone ? `\nPhone: ${m.phone}` : ""}\n\n${m.message}\n\n${link}`,
      replyTo: m.email, purpose: "owner_contact_message",
  });
  return { id: Number(row.id) };
}

export async function listContactMessages(limit = 200) {
  return db()`select id, full_name, email, phone, topic, message, handled, created_at
    from contact_messages order by created_at desc limit ${limit}`;
}
