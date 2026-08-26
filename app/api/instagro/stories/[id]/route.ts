import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

// DELETE /api/instagro/stories/:id — owner only
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing fields." }, { status: 400 });

    const d = await getDb();
    const story = await d.prepare("SELECT user_id FROM stories WHERE id = ?").get(id) as any;
    if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });
    if (story.user_id !== userId) return NextResponse.json({ error: "Not allowed." }, { status: 403 });

    await d.prepare("DELETE FROM story_views WHERE story_id = ?").run(id);
    await d.prepare("DELETE FROM stories WHERE id = ?").run(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[instagro/stories DELETE]", err);
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}
