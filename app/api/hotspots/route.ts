import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";
import { hotspotReportSchema } from "@/lib/validations";
import { getCurrentUserId } from "@/lib/auth-helpers";

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
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await req.json();
    const { mediaUrl } = body;
    const parsed = hotspotReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { title, description, pollutionType, severity, address, lat, lng } = parsed.data;

    const d = await getDb();
    const id = genId("h");
    await d.prepare(`
      INSERT INTO hotspot_reports (id, title, description, pollution_type, severity, address, lat, lng, reporter_id, status, media_url, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, title, description, pollutionType, severity, address, lat, lng, userId, "reported", mediaUrl || null, new Date().toISOString());

    const POINTS = 50;
    await d.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(POINTS, userId);

    return NextResponse.json({ ok: true, id, pointsEarned: POINTS }, { status: 201 });
  } catch (err) {
    console.error("[hotspots]", err);
    return NextResponse.json({ error: "Failed to report." }, { status: 500 });
  }
}
