import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    jamendo: !!process.env.JAMENDO_CLIENT_ID,
    jamendoValue: process.env.JAMENDO_CLIENT_ID ? String(process.env.JAMENDO_CLIENT_ID).slice(0, 4) + "…" : null,
    hasTurso: !!process.env.TURSO_DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}
