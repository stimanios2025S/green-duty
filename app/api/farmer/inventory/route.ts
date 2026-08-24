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
    const items = await d.prepare(
      `SELECT * FROM inventory_items WHERE user_id = ? ORDER BY name ASC`
    ).all(userId);
    return NextResponse.json(items);
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = randomUUID();
    const { name, category, quantity, unit, low_threshold } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category required" }, { status: 400 });
    }

    const d = await getDb();
    const now = new Date().toISOString();
    await d.prepare(
      `INSERT INTO inventory_items (id, user_id, name, category, quantity, unit, low_threshold, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, name, category, quantity || 0, unit || "kg", low_threshold || 10, now);

    const item = await d.prepare(`SELECT * FROM inventory_items WHERE id = ?`).get(id);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
