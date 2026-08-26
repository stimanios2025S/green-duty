import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, type DbUser } from "@/lib/db";
import { publicUser, createSession } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface AuthUserRow {
  id: string;
  password: string;
  verified: number | boolean;
  email: string;
  name: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
    }

    // Rate limit: 5 attempts per minute per IP
    const ip = getClientIp(req);
    const rl = checkRateLimit(`login:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } }
      );
    }

    const db = await getDb();
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as AuthUserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Handle users with empty password (created via dev bypass)
    if (!user.password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Require verified account to log in
    if (!user.verified) {
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }
      );
    }

    // Set HttpOnly session cookie
    const response = NextResponse.json({ user: publicUser(user as unknown as DbUser) });
    await createSession(response, user as unknown as DbUser);
    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
