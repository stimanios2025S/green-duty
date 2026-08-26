import { NextResponse } from "next/server";

/**
 * DEV ONLY — Disabled in production.
 * Previously created accounts for all roles and logged in without auth.
 * This is a security risk and must never be accessible in production.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  return NextResponse.json({ error: "Dev bypass is disabled. Use /api/auth/signup." }, { status: 403 });
}
