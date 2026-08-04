import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { generateCode } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;
    if (!email?.trim()) {
      return NextResponse.json({ error: "Missing email." }, { status: 400 });
    }

    const db = await getDb();
    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(normalizedEmail) as any;

    if (!user) {
      return NextResponse.json({ error: "Account not found. Please sign up first." }, { status: 404 });
    }
    if (user.verified) {
      return NextResponse.json({ error: "This account is already verified." }, { status: 400 });
    }

    // Generate a fresh code + new 10-minute expiry
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000;
    await db.prepare("UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?").run(code, expires, user.id);

    const { mode } = await sendVerificationEmail(normalizedEmail, code);

    if (mode === "failed") {
      return NextResponse.json({ ok: true, mode, fallbackCode: code });
    }
    return NextResponse.json({ ok: true, mode });
  } catch (err) {
    console.error("[resend]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
