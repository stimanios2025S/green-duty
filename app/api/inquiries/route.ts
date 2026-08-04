import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

// POST /api/inquiries → B2B quote request
export async function POST(req: Request) {
  try {
    const { userId, companyName, email, phone, service, message } = await req.json();
    if (!companyName?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Please fill in company, email, and message." }, { status: 400 });
    }
    const d = await getDb();
    const id = genId("inq");
    await d.prepare("INSERT INTO b2b_inquiries (id, user_id, company_name, email, phone, service, message, created_at) VALUES (?,?,?,?,?,?,?,?)")
      .run(id, userId || null, companyName.trim(), email.trim(), phone?.trim() || null, service || null, message.trim(), new Date().toISOString());
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[inquiries]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
