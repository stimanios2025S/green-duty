import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

// GET /api/hotspots → all reports
export async function GET() {
  try {
    const d = await getDb();
    const rows = await d.prepare("SELECT * FROM hotspot_reports ORDER BY created_at DESC").all();
    return NextResponse.json({ hotspots: rows });
  } catch (err) {
    console.error("[hotspots]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/hotspots → create a report (with optional photo + eco points reward)
export async function POST(req: Request) {
  try {
    const { title, description, pollutionType, severity, address, lat, lng, reporterId, mediaUrl } = await req.json();
    if (!title?.trim() || !description?.trim() || !pollutionType || !severity || !reporterId) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const user = await d.prepare("SELECT id, points FROM users WHERE id = ?").get(reporterId);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const id = genId("h");
    await d.prepare(`
      INSERT INTO hotspot_reports (id, title, description, pollution_type, severity, address, lat, lng, reporter_id, status, media_url, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, title.trim(), description.trim(), pollutionType, severity, address || null, lat ?? null, lng ?? null, reporterId, "reported", mediaUrl || null, new Date().toISOString());

    // Reward the reporter with eco points (50 pts per verified report)
    const POINTS = 50;
    await d.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(POINTS, reporterId);

    return NextResponse.json({ ok: true, id, pointsEarned: POINTS }, { status: 201 });
  } catch (err) {
    console.error("[hotspots]", err);
    return NextResponse.json({ error: "Failed to report." }, { status: 500 });
  }
}
