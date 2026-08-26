import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

// GET /api/notifications → list, newest first
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const d = await getDb();
    const rows = await d.prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30").all(userId);
    const unread = await d.prepare("SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0").get(userId);
    return NextResponse.json({ notifications: rows, unread: Number((unread as any)?.c || 0) });
  } catch (err) {
    console.error("[notifications]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/notifications → create one (system/internal use)
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, message, type } = await req.json();
    if (!title || !message) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
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
