import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, type DbUser } from "@/lib/db";
import { publicUser, createSession } from "@/lib/auth-helpers";

interface AuthUserRow {
  id: string;
  password: string;
  verified: number | boolean;
  email: string;
  name: string;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as AuthUserRow | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Auto-verify on login — email verification is only enforced at signup time
    if (!user.verified) {
      await db.prepare("UPDATE users SET verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?").run(user.id);
      user.verified = 1;
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
