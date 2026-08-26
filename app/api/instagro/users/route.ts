import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow } from "@/lib/instagro-api";
import { getCurrentUserId } from "@/lib/auth-helpers";

// PATCH /api/instagro/users → update profile
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { username, bio, emoji, gradient, name, avatarUrl } = await req.json();
    const d = await getDb();
    const existing = await d.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!existing) return NextResponse.json({ error: "User not found." }, { status: 401 });

    if (username?.trim()) {
      const dup = await d.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(username.trim().toLowerCase(), userId);
      if (dup) return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    await d.prepare(`
      UPDATE users SET
        username = COALESCE(?, username),
        bio = COALESCE(?, bio),
        emoji = COALESCE(?, emoji),
        gradient = COALESCE(?, gradient),
        name = COALESCE(?, name),
        avatar_media = COALESCE(?, avatar_media)
      WHERE id = ?
    `).run(
      username?.trim().toLowerCase() || null,
      bio?.trim() || null,
      emoji || null,
      gradient || null,
      name?.trim() || null,
      avatarUrl || null,
      userId
    );

    const updated = await d.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    return NextResponse.json({ user: updated ? await apiUserFromRow(updated as any) : null });
  } catch (err) {
    console.error("[instagro/users PATCH]", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
