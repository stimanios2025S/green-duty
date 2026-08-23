import { Resend } from "resend";
import nodemailer from "nodemailer";

const RESEND_KEY = process.env.RESEND_API_KEY || "";
const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_PASS = process.env.GMAIL_PASS || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

export type EmailMode = "email" | "console" | "failed";

export interface EmailResult {
  mode: EmailMode;
  messageId?: string;
}

const VERIFY_HTML = (code: string) => `
<div style="background:#0b0b0f;padding:32px;font-family:Arial,sans-serif">
  <div style="max-width:440px;margin:0 auto;background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
    <p style="font-size:20px;font-weight:bold;color:#22c55e;margin:0 0 8px">GreenDuty</p>
    <h1 style="color:#f4f4f5;font-size:18px;margin:0 0 16px">Verify your email address</h1>
    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px">
      Use the code below to activate your GreenDuty account. It expires in 10 minutes.
    </p>
    <div style="background:#22222b;border-radius:12px;padding:20px;text-align:center;letter-spacing:8px;font-size:28px;font-weight:bold;color:#22c55e">
      ${code}
    </div>
    <p style="color:#71717a;font-size:12px;line-height:1.5;margin:24px 0 0">
      If you didn't create this account, you can safely ignore this email.
    </p>
  </div>
</div>`;

/**
 * Sends verification email using Resend API (HTTP — works on Vercel).
 * Falls back to Gmail SMTP if Resend is not configured.
 */
export async function sendVerificationEmail(to: string, code: string): Promise<EmailResult> {
  // ── Try Resend first (HTTP-based, reliable on Vercel) ──
  if (RESEND_KEY) {
    try {
      const resend = new Resend(RESEND_KEY);
      const { data, error } = await resend.emails.send({
        from: "GreenDuty <onboarding@resend.dev>",
        to,
        subject: "Verify your GreenDuty account",
        html: VERIFY_HTML(code),
      });

      if (!error) {
        console.log(`[GreenDuty] ✅ Resend email sent to ${to} (id: ${data?.id})`);
        return { mode: "email", messageId: data?.id };
      }
      console.error(`[GreenDuty] ⚠️ Resend failed for ${to}: ${error.message}`);
      // Fall through to Gmail
    } catch (err) {
      console.error("[GreenDuty] Resend exception:", err);
      // Fall through to Gmail
    }
  }

  // ── Fallback: Gmail SMTP ──
  if (GMAIL_USER && GMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: GMAIL_USER, pass: GMAIL_PASS },
      });
      await transporter.sendMail({
        from: `GreenDuty <${GMAIL_USER}>`,
        to,
        subject: "Verify your GreenDuty account",
        html: VERIFY_HTML(code),
      });
      console.log(`[GreenDuty] ✅ Gmail email sent to ${to}`);
      return { mode: "email" };
    } catch (err) {
      console.error(`[GreenDuty] Gmail SMTP failed for ${to}:`, err);
    }
  }

  // ── Last resort: console log ──
  console.log("\n──────────────────────────────────────────────");
  console.log(`  [GreenDuty] Verification code for ${to}`);
  console.log(`  >>> ${code} <<<`);
  console.log("──────────────────────────────────────────────\n");
  return { mode: "console" };
}

/* ── Participant notification ── */
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
    console.log(`[GreenDuty] New participant: ${details.firstName} ${details.lastName} for "${details.eventTitle}" (no ADMIN_EMAIL set)`);
    return { mode: "console" };
  }

  const PARTICIPANT_HTML = `
<div style="background:#0b0b0f;padding:32px;font-family:Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:#131318;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px">
    <p style="font-size:20px;font-weight:bold;color:#84cc16;margin:0 0 4px">GreenDuty 🧹</p>
    <h1 style="color:#f4f4f5;font-size:18px;margin:0 0 16px">Someone just joined your cleanup!</h1>
    <div style="background:#22222b;border-radius:12px;padding:18px;margin-bottom:16px">
      <p style="color:#a1a1aa;font-size:13px;margin:0 0 10px"><strong style="color:#facc15">Event:</strong> ${details.eventTitle}</p>
      <p style="color:#f4f4f5;font-size:15px;margin:0 0 4px"><strong>${details.firstName} ${details.lastName}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#a1a1aa">
        <tr><td style="padding:4px 0;color:#71717a">📞 Phone</td><td style="padding:4px 0;color:#f4f4f5">${details.phone || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#71717a">✉️ Email</td><td style="padding:4px 0;color:#f4f4f5">${details.email || "—"}</td></tr>
      </table>
    </div>
    ${details.message ? `<div style="background:#131318;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px;margin-bottom:16px"><p style="color:#a1a1aa;font-size:13px;margin:0">"${details.message}"</p></div>` : ""}
  </div>
</div>`;

  if (RESEND_KEY) {
    try {
      const resend = new Resend(RESEND_KEY);
      const { error } = await resend.emails.send({
        from: "GreenDuty <onboarding@resend.dev>",
        to,
        subject: `🧹 New participant: ${details.firstName} ${details.lastName}`,
        html: PARTICIPANT_HTML,
      });
      if (!error) return { mode: "email" };
    } catch {}
  }

  if (GMAIL_USER && GMAIL_PASS) {
    try {
      const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
      await transporter.sendMail({ from: `GreenDuty <${GMAIL_USER}>`, to, subject: `🧹 New participant: ${details.firstName} ${details.lastName}`, html: PARTICIPANT_HTML });
      return { mode: "email" };
    } catch {}
  }

  return { mode: "console" };
}

export function getContactInfo(): { whatsapp: string | null; email: string | null } {
  return { whatsapp: process.env.WHATSAPP_NUMBER || null, email: ADMIN_EMAIL || null };
}
