import { NextResponse } from "next/server";
import { getContactInfo } from "@/lib/email";

// GET /api/contact → the platform's contact channels (WhatsApp + email)
// used by the donation flow and cleanup participation. Values come from
// WHATSAPP_NUMBER / ADMIN_EMAIL env vars (safe: nothing secret leaks).
export async function GET() {
  return NextResponse.json(getContactInfo());
}
