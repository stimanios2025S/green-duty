import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const d = await getDb();
    const one = async (sql: string, ...args: unknown[]) => {
      const r = await d.prepare(sql).get(...args);
      return Number((r as any)?.c || 0);
    };

    const [users, posts, likes, comments, stories, follows, orders, hotspots, trees, inquiries, verifiedUsers] = await Promise.all([
      one("SELECT COUNT(*) as c FROM users"),
      one("SELECT COUNT(*) as c FROM posts"),
      one("SELECT COUNT(*) as c FROM post_likes"),
      one("SELECT COUNT(*) as c FROM comments"),
      one("SELECT COUNT(*) as c FROM stories"),
      one("SELECT COUNT(*) as c FROM follows"),
      one("SELECT COUNT(*) as c FROM orders"),
      one("SELECT COUNT(*) as c FROM hotspot_reports"),
      one("SELECT COALESCE(SUM(trees),0) as c FROM tree_donations"),
      one("SELECT COUNT(*) as c FROM b2b_inquiries"),
      one("SELECT COUNT(*) as c FROM users WHERE verified = 1"),
    ]);

    const articles = await one("SELECT COUNT(*) as c FROM posts WHERE type = 'article'");
    const videos = posts - articles;

    return NextResponse.json({
      users,
      verifiedUsers,
      posts,
      articles,
      videos,
      likes,
      comments,
      stories,
      follows,
      orders,
      hotspots,
      trees,
      inquiries,
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
