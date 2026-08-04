import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { apiUserFromRow } from "@/lib/instagro-api";

// PATCH /api/instagro/users → update profile (username, bio, emoji, gradient, name)
export async function PATCH(req: Request) {
  try {
    const { userId, username, bio, emoji, gradient, name } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    const d = await getDb();
    const existing = await d.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!existing) return NextResponse.json({ error: "User not found." }, { status: 401 });

    // Username uniqueness (if provided and changed)
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
        name = COALESCE(?, name)
      WHERE id = ?
    `).run(
      username?.trim().toLowerCase() || null,
      bio?.trim() || null,
      emoji || null,
      gradient || null,
      name?.trim() || null,
      userId
    );

    const updated = await d.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    return NextResponse.json({ user: updated ? await apiUserFromRow(updated as any) : null });
  } catch (err) {
    console.error("[instagro/users PATCH]", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
