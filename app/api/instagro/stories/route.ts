import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

export async function POST(req: Request) {
  try {
    const { userId, emoji, gradient, caption, mediaUrl, musicId, texts } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing user." }, { status: 400 });
    const d = await getDb();
    const user = await d.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 401 });

    const id = genId("s");
    await d.prepare(`
      INSERT INTO stories (id, user_id, emoji, gradient, caption, media_url, music_id, texts, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      id, userId,
      emoji || "🌿", gradient || "from-amber-400 to-orange-600",
      caption || null, mediaUrl || null, musicId || null,
      Array.isArray(texts) && texts.length ? JSON.stringify(texts) : null,
      new Date().toISOString()
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[instagro/stories]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
