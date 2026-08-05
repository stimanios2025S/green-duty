import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/chat/typing {conversationId, userId, isTyping}
// Sets (or clears) the typing marker. Expires naturally via the TYPING_TTL.
export async function POST(req: Request) {
  try {
    const { conversationId, userId, isTyping } = await req.json();
    if (!conversationId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    if (isTyping) {
      await d.prepare(`
        INSERT INTO typing_status (conversation_id, user_id, typing_at) VALUES (?,?,?)
        ON CONFLICT(conversation_id, user_id) DO UPDATE SET typing_at = excluded.typing_at
      `).run(conversationId, userId, new Date().toISOString());
    } else {
      await d.prepare("DELETE FROM typing_status WHERE conversation_id = ? AND user_id = ?").run(conversationId, userId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/typing]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

const TYPING_TTL_MS = 5000;

// GET /api/chat/typing?conversationId=&userId= → who is typing right now (excluding me)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const userId = searchParams.get("userId");
    if (!conversationId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const cutoff = new Date(Date.now() - TYPING_TTL_MS).toISOString();
    const rows = await d.prepare(
      "SELECT user_id FROM typing_status WHERE conversation_id = ? AND user_id != ? AND typing_at > ?"
    ).all(conversationId, userId, cutoff) as any[];
    return NextResponse.json({ typing: rows.map(r => r.user_id) });
  } catch (err) {
    console.error("[chat/typing GET]", err);
    return NextResponse.json({ typing: [] }, { status: 500 });
  }
}
