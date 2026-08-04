import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/chat/reaction → toggle an eco-reaction (🌱🤝💧🔥🌿) on a message
export async function POST(req: Request) {
  try {
    const { messageId, userId, emoji } = await req.json();
    if (!messageId || !userId || !emoji) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const msg = await d.prepare("SELECT reactions FROM messages WHERE id = ?").get(messageId) as any;
    if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    let reactions: Record<string, string[]> = {};
    try { reactions = msg.reactions ? JSON.parse(msg.reactions) : {}; } catch {}
    const users = reactions[emoji] || [];
    if (users.includes(userId)) {
      reactions[emoji] = users.filter(u => u !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      // one reaction per user — remove from others first (like IG/WhatsApp)
      for (const k of Object.keys(reactions)) {
        reactions[k] = reactions[k].filter(u => u !== userId);
        if (reactions[k].length === 0) delete reactions[k];
      }
      reactions[emoji] = [...users.filter(u => u !== userId), userId];
    }

    await d.prepare("UPDATE messages SET reactions = ? WHERE id = ?").run(JSON.stringify(reactions), messageId);
    return NextResponse.json({ ok: true, reactions });
  } catch (err) {
    console.error("[chat/reaction]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
