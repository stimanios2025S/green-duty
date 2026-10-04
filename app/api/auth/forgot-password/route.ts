import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateCode } from "@/lib/auth-helpers";

/**
 * POST /api/auth/forgot-password  { email }
 *
 * Sends a 6-digit reset code. The response is deliberately identical whether
 * or not the address exists — otherwise this endpoint becomes a way to find
 * out who has an account.
 *
 * The code is NEVER returned in the response. (The signup flow returns a
 * fallback code when email delivery fails; that is acceptable for a brand-new
 * account, but for a reset it would let anyone who knows an address take that
 * account over.)
 */
export async function POST(req: Request) {
  const generic = NextResponse.json({
    ok: true,
    message: "If that address has an account, a reset code is on its way.",
  });

  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) return generic;

    const db = await getDb();
    const user = (await db.prepare("SELECT id, email FROM users WHERE LOWER(email) = ?").get(email)) as
      | { id: string; email: string }
      | undefined;
    if (!user) return generic;

    const code = generateCode();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await db
      .prepare("UPDATE users SET password_reset_code = ?, password_reset_expires = ? WHERE id = ?")
      .run(code, expires, user.id);

    await sendPasswordResetEmail(user.email, code);
    return generic;
  } catch (err) {
    console.error("[forgot-password]", err);
    // Still generic — never disclose internal state.
    return generic;
  }
}