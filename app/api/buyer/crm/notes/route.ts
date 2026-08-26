import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId, getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const d = await getDb();
  const notes = await d.prepare("SELECT * FROM buyer_notes WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, content, tags } = body;
  if (!title || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const d = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await d.prepare("INSERT INTO buyer_notes (id, user_id, title, content, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, userId, title, content, tags || "", now);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const d = await getDb();
  const note = await d.prepare("SELECT user_id FROM buyer_notes WHERE id = ?").get(id) as any;
  if (!note || note.user_id !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await d.prepare("DELETE FROM buyer_notes WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
