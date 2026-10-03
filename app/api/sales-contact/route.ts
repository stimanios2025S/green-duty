import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { str } from "@/lib/agency";

/**
 * GET /api/sales-contact
 *
 * The agency's published sales contact details, for the ordering flow.
 *
 * Read from the server environment so the values are never baked into the
 * client bundle, and so the order page can hide the email / WhatsApp options
 * entirely when they are not configured rather than rendering broken links.
 *
 * Requires a session purely to keep the endpoint from being an open scrape
 * target; the values themselves are not sensitive.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const email = str(process.env.SALES_EMAIL);
  const whatsapp = str(process.env.WHATSAPP_NUMBER).replace(/[^\d]/g, "");

  return NextResponse.json({
    email: email || null,
    // wa.me needs bare international digits, no "+" or punctuation.
    whatsapp: whatsapp || null,
  });
}
