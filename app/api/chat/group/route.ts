import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST /api/chat/group → create a group conversation with members
export async function POST(req: Request) {
  try {
    const { creatorId, name, memberIds } = await req.json();
    if (!creatorId || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const id = "cg_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
    const now = new Date().toISOString();

    await d.prepare(`
      INSERT INTO conversations (id, user_a, user_b, type, name, updated_at)
      VALUES (?,?,?,?,?,?)
    `).run(id, creatorId, null, "group", name?.trim() || "Group chat", now);

    // creator + members
    const all = Array.from(new Set([creatorId, ...memberIds]));
    for (const uid of all) {
      await d.prepare("INSERT OR IGNORE INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?,?,?)")
        .run(id, uid, now);
    }
    return NextResponse.json({ conversationId: id }, { status: 201 });
  } catch (err) {
    console.error("[chat/group]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
