import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { emoji, gradient, caption, mediaUrl, musicId, musicUrl, musicName, texts } = await req.json();
    const d = await getDb();

    const id = genId("s");
    await d.prepare(`
      INSERT INTO stories (id, user_id, emoji, gradient, caption, media_url, music_id, music_url, music_name, texts, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, userId,
      emoji || "🌿", gradient || "from-amber-400 to-orange-600",
      caption || null, mediaUrl || null, musicId || null, musicUrl || null, musicName || null,
      Array.isArray(texts) && texts.length ? JSON.stringify(texts) : null,
      new Date().toISOString()
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[instagro/stories]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
