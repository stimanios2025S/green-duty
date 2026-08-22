import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { recomputeStreak, applyStreakTrees } from "@/lib/chat-utils";

interface MessageRow {
  id: string;
  sender_id: string;
  text?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  reply_to?: string | null;
  reactions?: string | null;
  vanish?: number | boolean | null;
  read?: number | boolean | null;
  created_at: string;
  [key: string]: unknown;
}

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  type: string;
  name?: string | null;
  vanish?: number | boolean | null;
  [key: string]: unknown;
}

interface MemberRow {
  user_id: string;
}

// GET /api/chat/messages?conversationId=...&userId=... → thread + mark read (+ vanish cleanup)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const userId = searchParams.get("userId");
    if (!conversationId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();

    const rows = await d.prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 300"
    ).all(conversationId) as MessageRow[];

    // Vanish mode: delete any vanish messages the other user already read
    const vanishIds: string[] = [];
    const messages = rows.map(m => {
      const isVanish = !!m.vanish;
      if (isVanish && m.read && m.sender_id !== userId) vanishIds.push(m.id);
      let reactions: Record<string, string[]> = {};
      try { reactions = m.reactions ? JSON.parse(m.reactions) : {}; } catch {}
      return {
        id: m.id,
        senderId: m.sender_id,
        text: m.text || "",
        mediaUrl: m.media_url || null,
        mediaType: m.media_type || null,
        replyTo: m.reply_to || null,
        reactions,
        vanish: !!m.vanish,
        fromMe: m.sender_id === userId,
        createdAt: m.created_at,
      };
    }).filter(m => !vanishIds.includes(m.id));

    // Clean up vanished messages + mark incoming as read
    for (const id of vanishIds) {
      await d.prepare("DELETE FROM messages WHERE id = ?").run(id);
    }
    await d.prepare("UPDATE messages SET read = 1 WHERE conversation_id = ? AND sender_id != ?").run(conversationId, userId);

    // Refresh the streak
    const { streakTrees } = await recomputeStreak(conversationId);
    await applyStreakTrees(userId, conversationId, streakTrees);

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[chat/messages]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/chat/messages → send (text, photo/video snap, voice, location, reply)
export async function POST(req: Request) {
  try {
    const { conversationId, senderId, text, mediaUrl, mediaType, replyTo } = await req.json();
    if (!conversationId || !senderId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    if (!text?.trim() && !mediaUrl) return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
    const d = await getDb();

    const conv = await d.prepare("SELECT * FROM conversations WHERE id = ?").get(conversationId) as ConversationRow | undefined;
    if (!conv) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

    const id = "m_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
    await d.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, text, media_url, media_type, reply_to, reactions, vanish, read, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,0,?)
    `).run(
      id, conversationId, senderId,
      text?.trim() || null,
      mediaUrl || null, mediaType || null, replyTo || null,
      null, conv.vanish ? 1 : 0,
      new Date().toISOString()
    );
    await d.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(new Date().toISOString(), conversationId);

    // Recompute streak on send
    const { streak, streakTrees } = await recomputeStreak(conversationId);
    await applyStreakTrees(senderId, conversationId, streakTrees);

    // Push notification to the other party (powers the bell + unread badge)
    const sender = await d.prepare("SELECT name FROM users WHERE id = ?").get(senderId) as { name?: string | null } | undefined;
    const senderName = sender?.name || "Someone";
    const preview = mediaType === "image" ? "📷 sent a photo" : mediaType === "video" ? "🎬 sent a video" : mediaType === "audio" ? "🎤 sent a voice note" : mediaType === "location" ? "📍 shared a location" : (text?.trim() || "").slice(0, 80);
    if (conv.type === "direct") {
      const otherId = conv.user_a === senderId ? conv.user_b : conv.user_b === senderId ? conv.user_a : conv.user_b;
      if (otherId) {
        await d.prepare("INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES (?,?,?,?,?,0,?)")
          .run("n_" + Math.random().toString(36).slice(2, 10), otherId, `💬 ${senderName}`, preview, "message", new Date().toISOString());
      }
    } else {
      const members = await d.prepare("SELECT user_id FROM conversation_members WHERE conversation_id = ? AND user_id != ?").all(conversationId, senderId) as MemberRow[];
      for (const m of members) {
        await d.prepare("INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES (?,?,?,?,?,0,?)")
          .run("n_" + Math.random().toString(36).slice(2, 10), m.user_id, `💬 ${senderName} (${conv.name})`, preview, "message", new Date().toISOString());
      }
    }

    return NextResponse.json({ ok: true, id, streak });
  } catch (err) {
    console.error("[chat/messages POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
