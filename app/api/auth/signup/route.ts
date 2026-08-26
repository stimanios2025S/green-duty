import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, type DbUser } from "@/lib/db";
import { createSession, publicUser, generateId } from "@/lib/auth-helpers";
import { signupSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, email, password, accountType, businessName, businessAddress, idType, idNumber } = parsed.data;

    if (accountType === "business" && (!businessName?.trim() || !businessAddress?.trim())) {
      return NextResponse.json({ error: "Please provide your business name and address." }, { status: 400 });
    }
    if ((accountType === "buyer" || accountType === "driver") && !idNumber?.trim()) {
      return NextResponse.json({ error: "Please provide your ID document number." }, { status: 400 });
    }

    const db = await getDb();
    const normalizedEmail = email.trim().toLowerCase();

    // ── Check for existing account ──
    const existing = await db.prepare("SELECT id, verified FROM users WHERE email = ?").get(normalizedEmail) as { id: string; verified: number } | undefined;

    if (existing) {
      // Already verified — tell them to log in
      if (existing.verified) {
        return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 409 });
      }
      // Unverified legacy account — auto-verify and return session
      await db.prepare("UPDATE users SET verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?").run(existing.id);
      const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(existing.id) as unknown as DbUser;
      const response = NextResponse.json({ ok: true, user: publicUser(user) }, { status: 200 });
      await createSession(response, user);
      return response;
    }

    // ── Create new account (verified by default, no OTP) ──
    const id = generateId();
    const hash = await bcrypt.hash(password, 10);

    await db.prepare(`
      INSERT INTO users
        (id, name, email, password, account_type, business_name, business_address,
         id_type, id_number, points, verified, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,1,?)
    `).run(
      id,
      name.trim(),
      normalizedEmail,
      hash,
      accountType,
      businessName?.trim() ?? null,
      businessAddress?.trim() ?? null,
      idType ?? null,
      idNumber?.trim() ?? null,
      accountType === "guest" ? 100 : 0,
      new Date().toISOString()
    );

    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as DbUser;
    const response = NextResponse.json({ ok: true, user: publicUser(user) }, { status: 201 });
    await createSession(response, user);
    return response;
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
