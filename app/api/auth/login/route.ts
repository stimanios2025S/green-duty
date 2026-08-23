import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, type DbUser } from "@/lib/db";
import { publicUser } from "@/lib/auth-helpers";

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

    if (!user.verified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in.", needsVerification: true, email: user.email },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: publicUser(user as unknown as DbUser) });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
