import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow, serializePost } from "@/lib/instagro-api";

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username: usernameParam } = await params;
    const username = (usernameParam || "").toLowerCase();
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId") || undefined;
    const d = await getDb();

    const userRows = await d.prepare("SELECT * FROM users").all();
    const row = (userRows as any[]).find(u => (u.name.toLowerCase().replace(/\s+/g, ".") === username));
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await apiUserFromRow(row, viewerId);
    const isFollowing = viewerId
      ? await d.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?").get(viewerId, row.id)
      : undefined;

    const postRows = await d.prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC").all(row.id);
    const posts = [];
    for (const p of postRows as any[]) posts.push(await serializePost(p, viewerId));

    return NextResponse.json({ user, posts, isFollowing: !!isFollowing });
  } catch (err) {
    console.error("[instagro/users]", err);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}
