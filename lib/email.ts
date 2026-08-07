import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "GreenDuty <onboarding@resend.dev>";
/** Organizer's inbox — new cleanup participants & donation contacts land here */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export type EmailMode = "email" | "console" | "failed";

export interface EmailResult {
  mode: EmailMode;
  messageId?: string;
}

/**
 * Sends the verification code to ANY email address the user signs up with.
 *
 * - `email`   → delivered via Resend (works for everyone once a verified
 *                domain is configured in Resend).
 * - `console` → no RESEND_API_KEY set; code printed to the server terminal.
 * - `failed`  → Resend rejected the send (e.g. sandbox only delivers to the
 *                account owner's address). The account is still created and
 *                the code is returned as a temporary fallback so the flow
 *                never dead-ends. Fix = verify your domain in Resend.
 *
 * This NEVER throws — email delivery must never block account creation.
 */
export async function sendVerificationEmail(to: string, code: string): Promise<EmailResult> {
  if (!API_KEY) {
    console.log("\n──────────────────────────────────────────────");
    console.log(`  [GreenDuty] Verification code for ${to}`);
    console.log(`  >>> ${code} <<<`);
    console.log("  (Set RESEND_API_KEY in .env.local to send real emails)");
    console.log("──────────────────────────────────────────────\n");
    return { mode: "console" };
  }

  try {
    const resend = new Resend(API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your GreenDuty account",
      html: `
        <div style="background:#0b0b0f;padding:32px;font-family:Arial,sans-serif">
          <div style="max-width:440px;margin:0 auto;background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
            <p style="font-size:20px;font-weight:bold;color:#facc15;margin:0 0 8px">GreenDuty</p>
            <h1 style="color:#f4f4f5;font-size:18px;margin:0 0 16px">Verify your email address</h1>
            <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px">
              Use the code below to activate your GreenDuty account. It expires in 10 minutes.
            </p>
            <div style="background:#22222b;border-radius:12px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:bold;color:#facc15">
              ${code}
            </div>
            <p style="color:#71717a;font-size:12px;line-height:1.5;margin:24px 0 0">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("\n[GreenDuty] ⚠️  Email delivery FAILED:");
      console.error(`  To: ${to}`);
      console.error(`  Reason: ${error.message || "Unknown error"}`);
      console.error("  → Resend sandbox only delivers to YOUR registered email.");
      console.error("  → To send to everyone, verify a domain: resend.com → Domains → Add → follow DNS steps, then set EMAIL_FROM in .env.local");
      console.error("──────────────────────────────────────────────\n");
      return { mode: "failed" };
    }

    console.log(`[GreenDuty] ✅ Verification email sent to ${to} (id: ${data?.id})`);
    return { mode: "email", messageId: data?.id };
  } catch (err) {
    console.error("[GreenDuty] Email exception:", err);
    return { mode: "failed" };
  }
}

/* ─────────────────────────────────────────────────────────────
 * Cleanup participant notification → sent to the organizer
 * (ADMIN_EMAIL env) every time someone fills the participation
 * form. Never throws — notification must never block signup.
 * ───────────────────────────────────────────────────────────── */
export interface ParticipantDetails {
  eventTitle: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  message?: string;
  date?: string;
}

export async function sendParticipantNotification(details: ParticipantDetails): Promise<EmailResult> {
  const to = ADMIN_EMAIL;
  if (!to) {
    console.log("\n──────────────────────────────────────────────");
    console.log("  [GreenDuty] New cleanup participant (no ADMIN_EMAIL set):");
    console.log(`  ${details.firstName} ${details.lastName}`);
    console.log(`  Event: ${details.eventTitle}`);
    console.log(`  Phone: ${details.phone || "—"} · Email: ${details.email || "—"}`);
    console.log(`  Message: ${details.message || "—"}`);
    console.log("  → Set ADMIN_EMAIL in .env.local to receive email notifications");
    console.log("──────────────────────────────────────────────\n");
    return { mode: "console" };
  }
  if (!API_KEY) {
    console.log("\n──────────────────────────────────────────────");
    console.log(`  [GreenDuty] New cleanup participant for ${to}`);
    console.log(`  ${details.firstName} ${details.lastName} joined "${details.eventTitle}"`);
    console.log("  (Set RESEND_API_KEY to send real emails)");
    console.log("──────────────────────────────────────────────\n");
    return { mode: "console" };
  }

  try {
    const resend = new Resend(API_KEY);
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `🧹 New participant: ${details.firstName} ${details.lastName} — ${details.eventTitle}`,
      html: `
        <div style="background:#0b0b0f;padding:32px;font-family:Arial,sans-serif">
          <div style="max-width:480px;margin:0 auto;background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
            <p style="font-size:20px;font-weight:bold;color:#84cc16;margin:0 0 4px">GreenDuty 🧹</p>
            <p style="color:#71717a;font-size:12px;margin:0 0 20px">New cleanup participant notification</p>
            <h1 style="color:#f4f4f5;font-size:18px;margin:0 0 16px">Someone just joined your cleanup!</h1>
            <div style="background:#22222b;border-radius:12px;padding:18px;margin-bottom:16px">
              <p style="color:#a1a1aa;font-size:13px;margin:0 0 10px"><strong style="color:#facc15">Event:</strong> ${details.eventTitle}</p>
              <p style="color:#f4f4f5;font-size:15px;margin:0 0 4px"><strong>${details.firstName} ${details.lastName}</strong></p>
              <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px">wants to participate</p>
              <table style="width:100%;border-collapse:collapse;font-size:13px;color:#a1a1aa">
                <tr><td style="padding:4px 0;color:#71717a">📞 Phone</td><td style="padding:4px 0;color:#f4f4f5">${details.phone || "—"}</td></tr>
                <tr><td style="padding:4px 0;color:#71717a">✉️ Email</td><td style="padding:4px 0;color:#f4f4f5">${details.email || "—"}</td></tr>
                <tr><td style="padding:4px 0;color:#71717a">📅 Signup date</td><td style="padding:4px 0;color:#f4f4f5">${details.date || new Date().toLocaleDateString()}</td></tr>
              </table>
            </div>
            ${details.message ? `
              <div style="background:#131318;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px;margin-bottom:16px">
                <p style="color:#71717a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Message</p>
                <p style="color:#a1a1aa;font-size:13px;margin:0;line-height:1.6">"${details.message}"</p>
              </div>` : ""}
            <p style="color:#71717a;font-size:12px;line-height:1.6;margin:0">
              Reach out to confirm their spot and share the meeting point. 🌱
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("[GreenDuty] Participant email FAILED:", error.message);
      return { mode: "failed" };
    }
    console.log(`[GreenDuty] ✅ Participant notification sent to ${to} (id: ${data?.id})`);
    return { mode: "email", messageId: data?.id };
  } catch (err) {
    console.error("[GreenDuty] Participant email exception:", err);
    return { mode: "failed" };
  }
}

/** Contact info exposed to the client for donations (WhatsApp + email). */
export function getContactInfo(): { whatsapp: string | null; email: string | null } {
  return {
    whatsapp: process.env.WHATSAPP_NUMBER || null,
    email: ADMIN_EMAIL || null,
  };
}
