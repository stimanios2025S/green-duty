import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { type, title, excerpt, content, tags, coverEmoji, coverGradient, videoUrl, mediaUrl, duration, caption, location, likesHidden, commentsDisabled, musicId, musicUrl, musicName } = body;

    if (!type || !["article", "video", "image"].includes(type)) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const id = genId("p");
    await d.prepare(`
      INSERT INTO posts (id, user_id, type, title, excerpt, content, tags, cover_emoji, cover_gradient, video_url, media_url, duration, views, caption, location, likes_hidden, comments_disabled, music_id, music_url, music_name, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?)
    `).run(
      id, userId, type,
      title || null, excerpt || null, content || null,
      Array.isArray(tags) && tags.length ? tags.join(",") : null,
      coverEmoji || null, coverGradient || null,
      videoUrl || null, mediaUrl || null, duration || null,
      caption || null, location || null,
      likesHidden ? 1 : 0, commentsDisabled ? 1 : 0,
      musicId || null, musicUrl || null, musicName || null,
      new Date().toISOString()
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[instagro/posts]", err);
    return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const post = await d.prepare("SELECT user_id FROM posts WHERE id = ?").get(postId) as any;
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (post.user_id !== userId) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

    await d.prepare("DELETE FROM comments WHERE post_id = ?").run(postId);
    await d.prepare("DELETE FROM post_likes WHERE post_id = ?").run(postId);
    await d.prepare("DELETE FROM posts WHERE id = ?").run(postId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[instagro/posts DELETE]", err);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
