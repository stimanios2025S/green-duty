import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { followerId, followingId } = await req.json();
    if (!followerId || !followingId || followerId === followingId) {
      return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
    }
    const d = await getDb();
    const existing = await d.prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?").get(followerId, followingId);
    if (existing) {
      await d.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(followerId, followingId);
      return NextResponse.json({ following: false });
    }
    await d.prepare("INSERT INTO follows (follower_id, following_id, created_at) VALUES (?,?,?)")
      .run(followerId, followingId, new Date().toISOString());
    return NextResponse.json({ following: true });
  } catch (err) {
    console.error("[instagro/follow]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
