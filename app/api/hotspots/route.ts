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

// POST /api/hotspots → create a report
export async function POST(req: Request) {
  try {
    const { title, description, pollutionType, severity, address, lat, lng, reporterId } = await req.json();
    if (!title?.trim() || !description?.trim() || !pollutionType || !severity || !reporterId) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const user = await d.prepare("SELECT id FROM users WHERE id = ?").get(reporterId);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const id = genId("h");
    await d.prepare(`
      INSERT INTO hotspot_reports (id, title, description, pollution_type, severity, address, lat, lng, reporter_id, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, title.trim(), description.trim(), pollutionType, severity, address || null, lat ?? null, lng ?? null, reporterId, "reported", new Date().toISOString());

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[hotspots]", err);
    return NextResponse.json({ error: "Failed to report." }, { status: 500 });
  }
}
