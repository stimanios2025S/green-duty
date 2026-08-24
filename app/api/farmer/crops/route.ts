import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const d = await getDb();
    const crops = await d.prepare(
      `SELECT cb.*,
        (SELECT COUNT(*) FROM harvest_logs WHERE batch_id = cb.id) as harvest_count,
        (SELECT COALESCE(SUM(yield_kg), 0) FROM harvest_logs WHERE batch_id = cb.id) as total_yield,
        (SELECT COALESCE(SUM(revenue), 0) FROM harvest_logs WHERE batch_id = cb.id) as total_revenue
      FROM crop_batches cb WHERE cb.user_id = ? ORDER BY cb.planted_date DESC`
    ).all(userId);
    return NextResponse.json(crops);
  } catch (error) {
    console.error("Crops GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = randomUUID();
    const { name, crop_type, area_hectares, planted_date, expected_harvest_date, status, notes } = body;

    if (!name || !crop_type) {
      return NextResponse.json({ error: "Name and crop type required" }, { status: 400 });
    }

    const d = await getDb();
    const now = new Date().toISOString();
    await d.prepare(
      `INSERT INTO crop_batches (id, user_id, name, crop_type, area_hectares, planted_date, expected_harvest_date, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, name, crop_type, area_hectares || 0, planted_date || now.split("T")[0], expected_harvest_date || null, status || "growing", notes || null, now);

    const crop = await d.prepare(`SELECT * FROM crop_batches WHERE id = ?`).get(id);
    return NextResponse.json(crop, { status: 201 });
  } catch (error) {
    console.error("Crops POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
