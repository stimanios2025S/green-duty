import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/notifications/read → mark all (or one) as read
export async function POST(req: Request) {
  try {
    const { userId, id } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    const d = await getDb();
    if (id) {
      await d.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(id, userId);
    } else {
      await d.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(userId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notifications/read]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
