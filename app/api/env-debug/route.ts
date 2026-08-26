import { NextResponse } from "next/server";

/**
 * Environment debug endpoint — disabled in production.
 * Previously leaked environment variable status to unauthenticated users.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }
  return NextResponse.json({ error: "Debug endpoint disabled." }, { status: 403 });
}
