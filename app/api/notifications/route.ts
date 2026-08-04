import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/notifications?userId=... → list, newest first
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    const d = await getDb();
    const rows = await d.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30").all(userId);
    const unread = await d.prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0").get(userId);
    return NextResponse.json({ notifications: rows, unread: Number((unread as any)?.c || 0) });
  } catch (err) {
    console.error("[notifications]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/notifications → create one
export async function POST(req: Request) {
  try {
    const { userId, title, message, type } = await req.json();
    if (!userId || !title || !message) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const id = "n_" + Math.random().toString(36).slice(2, 10);
    await d.prepare("INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES (?,?,?,?,?,0,?)")
      .run(id, userId, title, message, type || "system", new Date().toISOString());
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[notifications]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
