import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

// GET /api/cleanup → list cleanup events with volunteer counts + joined state
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    const d = await getDb();
    const rows = await d.prepare("SELECT * FROM cleanup_events ORDER BY date ASC LIMIT 30").all() as any[];

    const events = [];
    for (const e of rows) {
      const count = await d.prepare("SELECT COUNT(*) as c FROM cleanup_signups WHERE event_id = ?").get(e.id);
      const joined = userId
        ? await d.prepare("SELECT 1 FROM cleanup_signups WHERE event_id = ? AND user_id = ?").get(e.id, userId)
        : undefined;
      events.push({
        id: e.id,
        hotspotId: e.hotspot_id,
        title: e.title,
        description: e.description,
        lat: e.lat,
        lng: e.lng,
        date: e.date,
        maxVolunteers: Number(e.max_volunteers),
        rewardPoints: Number(e.reward_points),
        volunteerCount: Number((count as any)?.c || 0),
        joined: !!joined,
      });
    }
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[cleanup]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/cleanup → create an event (from a hotspot)
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { hotspotId, title, description, lat, lng, date, maxVolunteers, rewardPoints } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const id = "e_" + Math.random().toString(36).slice(2, 10);
    await d.prepare(`
      INSERT INTO cleanup_events (id, hotspot_id, title, description, lat, lng, date, max_volunteers, reward_points, organizer_id, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, hotspotId || null, title.trim(), description?.trim() || "",
      lat ?? null, lng ?? null, date || new Date(Date.now() + 7 * 86400000).toISOString(),
      maxVolunteers || 25, rewardPoints || 100, userId,
      new Date().toISOString()
    );
    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[cleanup POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
