import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/chat/vanish → toggle vanish mode on a conversation (Snapchat-style)
export async function POST(req: Request) {
  try {
    const { conversationId, userId, on } = await req.json();
    if (!conversationId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const conv = await d.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId) as any;
    if (!conv) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    // membership check
    const isMember = conv.type === "group"
      ? await d.prepare("SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?").get(conversationId, userId)
      : conv.user_a === userId || conv.user_b === userId;
    if (!isMember) return NextResponse.json({ error: "Not a member." }, { status: 403 });

    await d.prepare("UPDATE conversations SET vanish = ? WHERE id = ?").run(on ? 1 : 0, conversationId);
    return NextResponse.json({ ok: true, vanish: !!on });
  } catch (err) {
    console.error("[chat/vanish]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
