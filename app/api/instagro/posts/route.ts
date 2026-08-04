import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, title, excerpt, content, tags, coverEmoji, coverGradient, videoUrl, mediaUrl, duration, caption, location } = body;

    if (!userId || !type || !["article", "video", "image"].includes(type)) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const user = await d.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 401 });

    const id = genId("p");
    await d.prepare(`
      INSERT INTO posts (id, user_id, type, title, excerpt, content, tags, cover_emoji, cover_gradient, video_url, media_url, duration, views, caption, location, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?)
    `).run(
      id, userId, type,
      title || null, excerpt || null, content || null,
      Array.isArray(tags) && tags.length ? tags.join(",") : null,
      coverEmoji || null, coverGradient || null,
      videoUrl || null, mediaUrl || null, duration || null,
      caption || null, location || null,
      new Date().toISOString()
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[instagro/posts]", err);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}
