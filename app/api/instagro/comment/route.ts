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
