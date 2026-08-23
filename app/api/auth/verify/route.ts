import { NextResponse } from "next/server";
import { getDb, type DbUser } from "@/lib/db";
import { publicUser } from "@/lib/auth-helpers";

interface AuthUserRow {
  id: string;
  verified: number | boolean;
  verification_expires?: number | null;
  verification_code?: string | null;
  email: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;
    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Missing email or code." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as AuthUserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: "Account not found. Please sign up first." }, { status: 404 });
    }
    if (user.verified) {
      return NextResponse.json({ ok: true, alreadyVerified: true, user: publicUser(user as unknown as DbUser) });
    }
    if (Date.now() > (user.verification_expires || 0)) {
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }
    if (String(user.verification_code) !== String(code).trim()) {
      return NextResponse.json({ error: "That code doesn't match. Please check your email." }, { status: 400 });
    }

    // Activate the account
    await db.prepare("UPDATE users SET verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?").run(user.id);
    const updated = await db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as AuthUserRow | undefined;

    return NextResponse.json({ ok: true, user: publicUser(updated as unknown as DbUser) });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
