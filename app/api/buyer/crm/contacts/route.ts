import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId, getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const d = await getDb();
  const contacts = await d.prepare("SELECT * FROM buyer_contacts WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, company, phone, email, category, notes } = body;
  if (!name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const d = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await d.prepare("INSERT INTO buyer_contacts (id, user_id, name, company, phone, email, category, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, userId, name, company || "", phone || "", email || "", category || "supplier", notes || "", now);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const d = await getDb();
  // Ensure user owns this contact
  const contact = await d.prepare("SELECT user_id FROM buyer_contacts WHERE id = ?").get(id) as any;
  if (!contact || contact.user_id !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await d.prepare("DELETE FROM buyer_contacts WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
