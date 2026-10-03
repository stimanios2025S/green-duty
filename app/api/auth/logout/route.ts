import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

/**
 * POST /api/auth/logout
 *
 * Clears the signed session cookie.
 *
 * This has to be a server round trip: the cookie is HttpOnly, so the browser
 * cannot remove it. Previously "Sign Out" only cleared localStorage, which
 * left the server-side identity intact — a user who logged out was still
 * authenticated to every API route.
 */
export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
