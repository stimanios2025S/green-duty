import { NextResponse } from "next/server";
import { getDb } from "./db";
import { getSession } from "./session";

/**
 * Owner (agency admin) authorization — server-side.
 *
 * ── How the caller is identified ──────────────────────────────────────────
 * From the signed, HttpOnly session cookie (see lib/session.ts). The client
 * cannot read or modify it, so it cannot claim an identity it does not hold.
 *
 * This replaced an earlier scheme that took a `userId` from the query string
 * or request body. That was forgeable: anyone who knew the owner's user id
 * could act as them against routes exposing invoices, deposits and client
 * records.
 *
 * The authorization decision itself is unchanged and stays on the server: we
 * re-read the caller's row and compare the *stored* email against OWNER_EMAIL.
 * Reading it from the database rather than from the cookie means an account
 * whose email was changed after the cookie was issued does not retain owner
 * rights.
 */

export interface OwnerContext {
  id: string;
  name: string;
  email: string;
}

/** The configured owner email, normalized. Empty string when unset. */
export function ownerEmail(): string {
  return (process.env.OWNER_EMAIL || "").trim().toLowerCase();
}

/** True when `email` belongs to the configured owner. */
export function isOwnerEmail(email: string | null | undefined): boolean {
  const configured = ownerEmail();
  if (!configured) return false;
  return String(email || "").trim().toLowerCase() === configured;
}

export type OwnerAuthResult = { owner: OwnerContext; error?: undefined } | { owner?: undefined; error: NextResponse };

/**
 * Authorize an owner-only request.
 *
 *   const auth = await requireOwner();
 *   if (auth.error) return auth.error;
 *   const { owner } = auth;
 */
export async function requireOwner(): Promise<OwnerAuthResult> {
  if (!ownerEmail()) {
    return {
      error: NextResponse.json(
        { error: "Owner dashboard is not configured. Set OWNER_EMAIL on the server." },
        { status: 503 }
      ),
    };
  }

  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }

  const db = await getDb();
  const row = (await db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(session.userId)) as
    | { id: string; name: string; email: string }
    | undefined;

  if (!row) {
    // The account behind this cookie no longer exists.
    return { error: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }

  if (!isOwnerEmail(row.email)) {
    return { error: NextResponse.json({ error: "Owner access required." }, { status: 403 }) };
  }

  return { owner: { id: row.id, name: row.name, email: String(row.email).toLowerCase() } };
}

/** Standard failure response for an unexpected server error. */
export function serverError(scope: string, err: unknown): NextResponse {
  console.error(`[${scope}]`, err);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
