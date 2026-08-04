import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

export async function POST(req: Request) {
  try {
    const { postId, userId, text } = await req.json();
    if (!postId || !userId || !text?.trim()) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
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

// DELETE /api/instagro/comment — only the comment author or the post owner may delete
export async function DELETE(req: Request) {
  try {
    const { commentId, userId } = await req.json();
    if (!commentId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
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
