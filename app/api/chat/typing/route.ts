import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

interface TypingRow {
  user_id: string;
}

const TYPING_TTL_MS = 5000;

// POST /api/chat/typing {conversationId, isTyping}
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { conversationId, isTyping } = await req.json();
    if (!conversationId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
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

// GET /api/chat/typing?conversationId= → who is typing right now (excluding me)
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ typing: [] });
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ typing: [] });
    const d = await getDb();
    const cutoff = new Date(Date.now() - TYPING_TTL_MS).toISOString();
    const rows = await d.prepare(
      "SELECT user_id FROM typing_status WHERE conversation_id = ? AND user_id != ? AND typing_at > ?"
    ).all(conversationId, userId, cutoff) as unknown as TypingRow[];
    return NextResponse.json({ typing: rows.map(r => r.user_id) });
  } catch (err) {
    console.error("[chat/typing GET]", err);
    return NextResponse.json({ typing: [] }, { status: 500 });
  }
}
