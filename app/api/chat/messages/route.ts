import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow } from "@/lib/instagro-api";

// GET /api/chat/messages?conversationId=...&userId=... → thread + mark read
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const userId = searchParams.get("userId");
    if (!conversationId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();

    const rows = await d.prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 200"
    ).all(conversationId);

    // Mark incoming as read
    await d.prepare("UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?").run(conversationId, userId);

    const messages = (rows as any[]).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      fromMe: m.sender_id === userId,
      createdAt: m.created_at,
    }));

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[chat/messages]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/chat/messages → send a message
export async function POST(req: Request) {
  try {
    const { conversationId, senderId, text } = await req.json();
    if (!conversationId || !senderId || !text?.trim()) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const id = "m_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
    await d.prepare("INSERT INTO messages (id, conversation_id, sender_id, text, read, created_at) VALUES (?,?,?,?,0,?)")
      .run(id, conversationId, senderId, text.trim(), new Date().toISOString());
    await d.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(new Date().toISOString(), conversationId);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[chat/messages POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
