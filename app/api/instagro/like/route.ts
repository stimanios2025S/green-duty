import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { postId, userId } = await req.json();
    if (!postId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const existing = await d.prepare("SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?").get(postId, userId);
    if (existing) {
      await d.prepare("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?").run(postId, userId);
      return NextResponse.json({ liked: false });
    }
    await d.prepare("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)").run(postId, userId);
    const likes = await d.prepare("SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?").get(postId);
    return NextResponse.json({ liked: true, likes: Number((likes as any)?.c || 0) });
  } catch (err) {
    console.error("[instagro/like]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
