import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow } from "@/lib/instagro-api";
import { streakEmoji } from "@/lib/chat-utils";
import { getCurrentUserId } from "@/lib/auth-helpers";

interface ConversationRow {
  id: string;
  user_a: string;
  user_b: string;
  type: string;
  name?: string | null;
  streak?: number | null;
  vanish?: number | boolean | null;
  updated_at: string;
  [key: string]: unknown;
}

interface MessageRow {
  id: string;
  text?: string | null;
  media_type?: string | null;
  sender_id: string;
  created_at: string;
  [key: string]: unknown;
}

interface MemberRow {
  user_id: string;
}

interface UnreadRow {
  c?: number | null;
}

// GET /api/chat/conversations → DM threads + group chats (newest first)
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const d = await getDb();

    const directRows = await d.prepare(
      "SELECT * FROM conversations WHERE type = 'direct' AND (user_a = ? OR user_b = ?) ORDER BY updated_at DESC LIMIT 50"
    ).all(userId, userId) as ConversationRow[];

    const groupRows = await d.prepare(`
      SELECT c.* FROM conversations c
      JOIN conversation_members m ON m.conversation_id = c.id
      WHERE c.type = 'group' AND m.user_id = ? ORDER BY c.updated_at DESC LIMIT 50
    `).all(userId) as ConversationRow[];

    const conversations = [];

    for (const c of directRows) {
      const otherId = c.user_a === userId ? c.user_b : c.user_b === userId ? c.user_a : c.user_b;
      const other = await d.prepare("SELECT * FROM users WHERE id = ?").get(otherId);
      if (!other) continue;
      const lastMsg = await d.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1").get(c.id) as MessageRow | undefined;
      const unread = await d.prepare("SELECT COUNT(*) as c FROM messages WHERE conversation_id = ? AND sender_id != ? AND read = 0").get(c.id, userId) as UnreadRow | undefined;
      conversations.push({
        id: c.id,
        type: "direct",
        name: other.name,
        otherUser: await apiUserFromRow(other as any),
        lastMessage: lastMsg ? { text: lastMsg.text || (lastMsg.media_type === "image" ? "📷 Photo" : lastMsg.media_type === "video" ? "🎬 Video" : lastMsg.media_type === "audio" ? "🎤 Voice note" : lastMsg.media_type === "location" ? "📍 Location" : ""), fromMe: lastMsg.sender_id === userId, createdAt: lastMsg.created_at } : null,
        unread: Number((unread as any)?.c || 0),
        streak: Number(c.streak || 0),
        streakEmoji: streakEmoji(Number(c.streak || 0)),
        vanish: !!c.vanish,
        updatedAt: c.updated_at,
      });
    }

    for (const c of groupRows) {
      const lastMsg = await d.prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1").get(c.id) as MessageRow | undefined;
      const members = await d.prepare("SELECT user_id FROM conversation_members WHERE conversation_id = ?").all(c.id) as unknown as MemberRow[];
      const memberUsers = [];
      for (const m of members.slice(0, 3)) {
        const u = await d.prepare("SELECT * FROM users WHERE id = ?").get(m.user_id);
        if (u) memberUsers.push(await apiUserFromRow(u as any));
      }
      const unread = await d.prepare("SELECT COUNT(*) as c FROM messages WHERE conversation_id = ? AND sender_id != ? AND read = 0").get(c.id, userId);
      conversations.push({
        id: c.id,
        type: "group",
        name: c.name || "Group chat",
        otherUser: memberUsers[0] || null,
        memberCount: members.length,
        memberAvatars: memberUsers,
        lastMessage: lastMsg ? { text: lastMsg.text || (lastMsg.media_type === "image" ? "📷 Photo" : lastMsg.media_type === "video" ? "🎬 Video" : lastMsg.media_type === "audio" ? "🎤 Voice note" : lastMsg.media_type === "location" ? "📍 Location" : ""), fromMe: lastMsg.sender_id === userId, createdAt: lastMsg.created_at } : null,
        unread: Number((unread as any)?.c || 0),
        streak: 0,
        streakEmoji: "",
        vanish: !!c.vanish,
        updatedAt: c.updated_at,
      });
    }

    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[chat/conversations]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/chat/conversations → open (or get) a DM thread with another user
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { otherUserId } = await req.json();
    if (!otherUserId || userId === otherUserId) {
      return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
    }
    const d = await getDb();
    const [a, b] = [userId, otherUserId].sort();
    const existing = await d.prepare("SELECT * FROM conversations WHERE type = 'direct' AND user_a = ? AND user_b = ?").get(a, b);
    if (existing) return NextResponse.json({ conversationId: existing.id });

    const id = "c_" + Math.random().toString(36).slice(2, 10);
    await d.prepare("INSERT INTO conversations (id, user_a, user_b, type, updated_at) VALUES (?,?,?,?,?)")
      .run(id, a, b, "direct", new Date().toISOString());
    return NextResponse.json({ conversationId: id }, { status: 201 });
  } catch (err) {
    console.error("[chat/conversations POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
