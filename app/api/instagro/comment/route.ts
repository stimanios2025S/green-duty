import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { postId, text } = await req.json();
    if (!postId || !text?.trim()) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const id = genId("c");
    await d.prepare("INSERT INTO comments (id, post_id, user_id, text, created_at) VALUES (?,?,?,?,?)")
      .run(id, postId, userId, text.trim(), new Date().toISOString());
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[instagro/comment]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { commentId } = await req.json();
    if (!commentId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const comment = await d.prepare("SELECT * FROM comments WHERE id = ?").get(commentId) as any;
    if (!comment) return NextResponse.json({ error: "Comment not found." }, { status: 404 });

    const post = await d.prepare("SELECT user_id FROM posts WHERE id = ?").get(comment.post_id) as any;
    const isAuthor = comment.user_id === userId;
    const isPostOwner = post && post.user_id === userId;
    if (!isAuthor && !isPostOwner) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    await d.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[instagro/comment DELETE]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
