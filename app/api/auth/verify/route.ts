import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { publicUser } from "@/lib/auth-helpers";
import { linkVerifiedAccount } from "@/lib/agency";
import { getSession, setSessionCookie } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;
    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Missing email or code." }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as any;

    if (!user) {
      return NextResponse.json({ error: "Account not found. Please sign up first." }, { status: 404 });
    }
    if (user.verified) {
      // The verification code is cleared once an account is active, so there is
      // nothing left to check here. That makes this branch reachable by anyone
      // who knows an email address — so it must only hand back the profile to
      // the account's own session, never to an anonymous caller.
      const session = await getSession();
      if (session?.userId === user.id) {
        return NextResponse.json({ ok: true, alreadyVerified: true, user: publicUser(user) });
      }
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    if (Date.now() > (user.verification_expires || 0)) {
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }
    if (String(user.verification_code) !== String(code).trim()) {
      return NextResponse.json({ error: "That code doesn't match. Please check your email." }, { status: 400 });
    }

    // Activate the account
    await db.prepare("UPDATE users SET verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?").run(user.id);
    const updated = await db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;

    // A verified account becomes a lead (client) or a negotiating partner for
    // the owner. Best-effort: a failure here must never block verification.
    try {
      await linkVerifiedAccount(db, {
        name: updated.name,
        email: updated.email,
        accountType: updated.account_type,
        businessName: updated.business_name,
      });
    } catch (linkErr) {
      console.error("[verify] link account", linkErr);
    }

    // Establish the server-side session now that email ownership is proven.
    await setSessionCookie({ id: updated.id, email: updated.email });

    return NextResponse.json({ ok: true, user: publicUser(updated) });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
