import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth-helpers";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  await destroySession(response);
  return response;
}
