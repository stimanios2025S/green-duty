import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

// POST /api/notifications/read → mark all (or one) as read
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await req.json();
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
