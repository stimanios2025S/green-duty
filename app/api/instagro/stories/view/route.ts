import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { storyId, userId } = await req.json();
    if (!storyId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    await d.prepare("INSERT OR IGNORE INTO story_views (story_id, user_id) VALUES (?, ?)").run(storyId, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[instagro/stories/view]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
