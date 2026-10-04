import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

/**
 * POST /api/auth/reset-password  { email, code, password }
 *
 * Verifies the reset code and expiry, stores the new password hash, clears the
 * code so it cannot be replayed, and signs the account in.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const code = String(body?.code || "").trim();
    const password = String(body?.password || "");

    if (!email || !code || !password) {
      return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const db = await getDb();
    const user = (await db
      .prepare("SELECT id, email, password_reset_code, password_reset_expires FROM users WHERE LOWER(email) = ?")
      .get(email)) as
      | { id: string; email: string; password_reset_code: string | null; password_reset_expires: number | null }
      | undefined;

    if (!user || !user.password_reset_code) {
      return NextResponse.json({ error: "Invalid or expired reset code." }, { status: 400 });
    }
    if (user.password_reset_code !== code) {
      return NextResponse.json({ error: "Invalid or expired reset code." }, { status: 400 });
    }
    if (!user.password_reset_expires || Date.now() > Number(user.password_reset_expires)) {
      return NextResponse.json({ error: "This reset code has expired. Request a new one." }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    await db
      .prepare(
        `UPDATE users
            SET password = ?,
                password_reset_code = NULL,
                password_reset_expires = NULL,
                verified = 1
          WHERE id = ?`
      )
      .run(hash, user.id);

    // A successful reset proves control of the address, so sign them in.
    await setSessionCookie({ id: user.id, email: user.email });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}