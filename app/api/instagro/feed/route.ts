import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { batchSerializePosts, serializeStory } from "@/lib/instagro-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId") || undefined;
    const d = await getDb();

    // Instagram-style: stories auto-expire after 24h
    const expiry = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await d.prepare("DELETE FROM stories WHERE created_at < ?").run(expiry);
    await d.prepare("DELETE FROM story_views WHERE story_id NOT IN (SELECT id FROM stories)").run();

    const postRows = await d.prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT 50").all();
    const storyRows = await d.prepare("SELECT * FROM stories ORDER BY created_at DESC LIMIT 20").all();

    const posts = await batchSerializePosts(postRows as any[], viewerId);
    const stories = [];
    for (const s of storyRows as any[]) stories.push(await serializeStory(s, viewerId));

    // Suggestions: other verified/real users, excluding viewer, limit 6
    const suggestRows = viewerId
      ? await d.prepare("SELECT * FROM users WHERE id != ? ORDER BY created_at ASC LIMIT 6").all(viewerId)
      : await d.prepare("SELECT * FROM users ORDER BY created_at ASC LIMIT 6").all();

    // Batch-load suggestion user data (followers/following counts)
    const suggestIds = (suggestRows as any[]).map(s => s.id);
    const sFollowerCounts = suggestIds.length > 0
      ? await d.prepare(`SELECT following_id, COUNT(*) as c FROM follows WHERE following_id IN (${suggestIds.map(() => "?").join(",")}) GROUP BY following_id`).all(...suggestIds) as { following_id: string; c: number }[]
      : [];
    const sFollowingCounts = suggestIds.length > 0
      ? await d.prepare(`SELECT follower_id, COUNT(*) as c FROM follows WHERE follower_id IN (${suggestIds.map(() => "?").join(",")}) GROUP BY follower_id`).all(...suggestIds) as { follower_id: string; c: number }[]
      : [];
    const sFollowerMap = new Map(sFollowerCounts.map(f => [f.following_id, f.c]));
    const sFollowingMap = new Map(sFollowingCounts.map(f => [f.follower_id, f.c]));

    const suggestions = (suggestRows as any[]).map(s => ({
      id: s.id,
      username: (s.username || s.name.toLowerCase().replace(/\s+/g, ".")),
      name: s.name,
      role: s.account_type,
      bio: s.bio || "",
      emoji: s.emoji || "🌿",
      gradient: s.gradient || "from-amber-400 to-orange-600",
      avatarUrl: s.avatar_media || undefined,
      verified: !!s.verified,
      followers: sFollowerMap.get(s.id) || 0,
      following: sFollowingMap.get(s.id) || 0,
    }));

    return NextResponse.json({ posts, stories, suggestions });
  } catch (err) {
    console.error("[instagro/feed]", err);
    return NextResponse.json({ error: "Failed to load feed." }, { status: 500 });
  }
}
