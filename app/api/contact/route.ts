import { NextResponse } from "next/server";
import { getContactInfo } from "@/lib/email";

// GET /api/contact → the studio's contact channels (WhatsApp + email).
// Values come from WHATSAPP_NUMBER / ADMIN_EMAIL env vars (nothing secret leaks).
export async function GET() {
  return NextResponse.json(getContactInfo());
}
