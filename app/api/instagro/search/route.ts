import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow, serializePost } from "@/lib/instagro-api";

/**
 * GET /api/instagro/search?q=...&viewerId=...
 * Searches users (by name/username), posts (by caption/title), and hashtags
 * (from post tags + captions) — like Instagram's explore search.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const viewerId = searchParams.get("viewerId") || undefined;
    const d = await getDb();

    if (q.length < 2) return NextResponse.json({ users: [], posts: [], hashtags: [] });

    const like = `%${q.toLowerCase()}%`;

    // Users (name or username) — all users, no verified filter
    const userRows = await d.prepare(
      "SELECT * FROM users WHERE LOWER(name) LIKE ? OR LOWER(COALESCE(username, name)) LIKE ? OR LOWER(email) LIKE ? LIMIT 8"
    ).all(like, like, like);
    const users = [];
    for (const u of userRows as any[]) users.push(await apiUserFromRow(u, viewerId));

    // Posts (caption or title)
    const postRows = await d.prepare(
      "SELECT * FROM posts WHERE (LOWER(COALESCE(caption,'')) LIKE ? OR LOWER(COALESCE(title,'')) LIKE ?) ORDER BY created_at DESC LIMIT 8"
    ).all(like, like);
    const posts = [];
    for (const p of postRows as any[]) posts.push(await serializePost(p, viewerId));

    // Hashtags (from stored tags column)
    const tagRows = await d.prepare(
      "SELECT DISTINCT tags FROM posts WHERE tags IS NOT NULL"
    ).all() as any[];
    const seen = new Set<string>();
    const hashtags: { tag: string; count: number }[] = [];
    for (const r of tagRows) {
      const tags = String(r.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
      for (const t of tags) {
        if (t.includes(q.toLowerCase()) && !seen.has(t)) {
          seen.add(t);
          const count = await d.prepare("SELECT COUNT(*) as c FROM posts WHERE tags LIKE ?").get(`%${t}%`);
          hashtags.push({ tag: t, count: Number((count as any)?.c || 0) });
          if (hashtags.length >= 6) break;
        }
      }
      if (hashtags.length >= 6) break;
    }

    return NextResponse.json({ users, posts, hashtags });
  } catch (err) {
    console.error("[instagro/search]", err);
    return NextResponse.json({ users: [], posts: [], hashtags: [] }, { status: 500 });
  }
}
