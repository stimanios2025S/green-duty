import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { storyId } = await req.json();
    if (!storyId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    await d.prepare("INSERT OR IGNORE INTO story_views (story_id, user_id) VALUES (?, ?)").run(storyId, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[instagro/stories/view]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
