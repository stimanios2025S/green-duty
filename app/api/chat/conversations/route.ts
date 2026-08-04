import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow } from "@/lib/instagro-api";

// GET /api/chat/conversations?userId=... → list the user's DM threads (newest first)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    const d = await getDb();

    const rows = await d.prepare(
      "SELECT * FROM conversations WHERE user_a = ? OR user_b = ? ORDER BY updated_at DESC LIMIT 50"
    ).all(userId, userId);

    const conversations = [];
    for (const c of rows as any[]) {
      const otherId = c.user_a === userId ? c.user_b : c.user_a;
      const other = await d.prepare("SELECT * FROM users WHERE id = ?").get(otherId);
      if (!other) continue;
      const lastMsg = await d.prepare(
        "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1"
      ).get(c.id) as any;
      const unread = await d.prepare(
        "SELECT COUNT(*) as c FROM messages WHERE conversation_id = ? AND sender_id != ? AND read = 0"
      ).get(c.id, userId);
      conversations.push({
        id: c.id,
        otherUser: await apiUserFromRow(other),
        lastMessage: lastMsg ? { text: lastMsg.text, fromMe: lastMsg.sender_id === userId, createdAt: lastMsg.created_at } : null,
        unread: Number((unread as any)?.c || 0),
        updatedAt: c.updated_at,
      });
    }

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[chat/conversations]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/chat/conversations → open (or get) a DM thread with another user
export async function POST(req: Request) {
  try {
    const { userId, otherUserId } = await req.json();
    if (!userId || !otherUserId || userId === otherUserId) {
      return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
    }
    const d = await getDb();
    const [a, b] = [userId, otherUserId].sort();
    const existing = await d.prepare("SELECT * FROM conversations WHERE user_a = ? AND user_b = ?").get(a, b);
    if (existing) return NextResponse.json({ conversationId: existing.id });

    const id = "c_" + Math.random().toString(36).slice(2, 10);
    await d.prepare("INSERT INTO conversations (id, user_a, user_b, updated_at) VALUES (?,?,?,?)")
      .run(id, a, b, new Date().toISOString());
    return NextResponse.json({ conversationId: id }, { status: 201 });
  } catch (err) {
    console.error("[chat/conversations POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
