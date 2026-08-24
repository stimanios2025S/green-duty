import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ tasks: [] });
  const d = await getDb();
  const tasks = await d.prepare("SELECT * FROM buyer_tasks WHERE user_id = ? ORDER BY due_date ASC, created_at DESC").all(userId);
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, title, description, due_date, priority } = body;
  if (!userId || !title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const d = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await d.prepare("INSERT INTO buyer_tasks (id, user_id, title, description, due_date, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)").run(id, userId, title, description || "", due_date || "", priority || "medium", now);
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const d = await getDb();
  await d.prepare("UPDATE buyer_tasks SET status = ? WHERE id = ?").run(status || "pending", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const d = await getDb();
  await d.prepare("DELETE FROM buyer_tasks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
