import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { generateCode, generateId } from "@/lib/auth-helpers";

const VALID_TYPES = ["guest", "buyer", "seller", "driver", "business"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, accountType, businessName, businessAddress, idType, idNumber } = body;

    // ── Validation ──
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
    }
    if (!VALID_TYPES.includes(accountType)) {
      return NextResponse.json({ error: "Invalid account type." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (accountType === "business" && (!businessName?.trim() || !businessAddress?.trim())) {
      return NextResponse.json({ error: "Please provide your business name and address." }, { status: 400 });
    }
    if ((accountType === "buyer" || accountType === "driver") && !idNumber?.trim()) {
      return NextResponse.json({ error: "Please provide your ID document number." }, { status: 400 });
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    // ── Duplicate check ──
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // ── Create account (unverified) + generate code ──
    const id = generateId();
    const hash = await bcrypt.hash(password, 10);
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await db.prepare(`
      INSERT INTO users
        (id, name, email, password, account_type, business_name, business_address,
         id_type, id_number, points, verified, verification_code, verification_expires, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?)
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
      code,
      expires,
      new Date().toISOString()
    );

    // ── Send the real verification email (never blocks account creation) ──
    const { mode } = await sendVerificationEmail(normalizedEmail, code);

    // If delivery failed, return the code as a temporary fallback so the
    // user can still activate their account (fix: verify domain in Resend).
    if (mode === "failed") {
      return NextResponse.json({ id, email: normalizedEmail, mode, fallbackCode: code }, { status: 201 });
    }
    return NextResponse.json({ id, email: normalizedEmail, mode }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
