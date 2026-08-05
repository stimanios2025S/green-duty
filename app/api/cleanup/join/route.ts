import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/cleanup/join → join (or leave) a cleanup event
export async function POST(req: Request) {
  try {
    const { eventId, userId, join } = await req.json();
    if (!eventId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    if (join) {
      await d.prepare("INSERT OR IGNORE INTO cleanup_signups (event_id, user_id) VALUES (?,?)").run(eventId, userId);
    } else {
      await d.prepare("DELETE FROM cleanup_signups WHERE event_id = ? AND user_id = ?").run(eventId, userId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cleanup join]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
