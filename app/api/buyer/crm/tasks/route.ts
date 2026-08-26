import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId, getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const d = await getDb();
  const tasks = await d.prepare("SELECT * FROM buyer_tasks WHERE user_id = ? ORDER BY due_date ASC, created_at DESC").all(userId);
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, description, due_date, priority } = body;
  if (!title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const d = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  await d.prepare("INSERT INTO buyer_tasks (id, user_id, title, description, due_date, priority, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)").run(id, userId, title, description || "", due_date || "", priority || "medium", now);
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, status } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const d = await getDb();
  // Ensure user owns this task
  const task = await d.prepare("SELECT user_id FROM buyer_tasks WHERE id = ?").get(id) as any;
  if (!task || task.user_id !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await d.prepare("UPDATE buyer_tasks SET status = ? WHERE id = ?").run(status || "pending", id);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const d = await getDb();
  const task = await d.prepare("SELECT user_id FROM buyer_tasks WHERE id = ?").get(id) as any;
  if (!task || task.user_id !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await d.prepare("DELETE FROM buyer_tasks WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
