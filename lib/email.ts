import { Resend } from "resend";

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || "GreenDuty <onboarding@resend.dev>";

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
