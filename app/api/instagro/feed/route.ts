import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { serializePost, serializeStory } from "@/lib/instagro-api";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get("viewerId") || undefined;
    const d = await getDb();

    const postRows = await d.prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT 50").all();
    const storyRows = await d.prepare("SELECT * FROM stories ORDER BY created_at DESC LIMIT 20").all();

    const posts = [];
    for (const p of postRows as any[]) posts.push(await serializePost(p, viewerId));
    const stories = [];
    for (const s of storyRows as any[]) stories.push(await serializeStory(s, viewerId));

    // Suggestions: other verified/real users, excluding viewer, limit 5
    const suggestRows = viewerId
      ? await d.prepare("SELECT * FROM users WHERE id != ? ORDER BY created_at ASC LIMIT 6").all(viewerId)
      : await d.prepare("SELECT * FROM users ORDER BY created_at ASC LIMIT 6").all();
    const { apiUserFromRow } = await import("@/lib/instagro-api");
    const suggestions = [];
    for (const s of suggestRows as any[]) suggestions.push(await apiUserFromRow(s, viewerId));

    return NextResponse.json({ posts, stories, suggestions });
  } catch (err) {
    console.error("[instagro/feed]", err);
    return NextResponse.json({ error: "Failed to load feed." }, { status: 500 });
  }
}
