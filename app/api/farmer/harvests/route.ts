import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const batchId = req.nextUrl.searchParams.get("batch_id");

  try {
    const d = await getDb();
    let harvests;
    if (batchId) {
      harvests = await d.prepare(
        `SELECT * FROM harvest_logs WHERE user_id = ? AND batch_id = ? ORDER BY date DESC`
      ).all(userId, batchId);
    } else {
      harvests = await d.prepare(
        `SELECT * FROM harvest_logs WHERE user_id = ? ORDER BY date DESC`
      ).all(userId);
    }
    return NextResponse.json(harvests);
  } catch (error) {
    console.error("Harvests GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = randomUUID();
    const { batch_id, date, yield_kg, price_per_kg, sold_to, revenue, notes } = body;

    if (!batch_id || yield_kg === undefined) {
      return NextResponse.json({ error: "Batch ID and yield required" }, { status: 400 });
    }

    const d = await getDb();
    const now = new Date().toISOString();
    await d.prepare(
      `INSERT INTO harvest_logs (id, batch_id, user_id, date, yield_kg, price_per_kg, sold_to, revenue, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, batch_id, userId, date || now.split("T")[0], yield_kg, price_per_kg || 0, sold_to || null, revenue || 0, notes || null, now);

    const harvest = await d.prepare(`SELECT * FROM harvest_logs WHERE id = ?`).get(id);
    return NextResponse.json(harvest, { status: 201 });
  } catch (error) {
    console.error("Harvests POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
