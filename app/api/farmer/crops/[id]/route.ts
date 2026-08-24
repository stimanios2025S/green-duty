import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const d = await getDb();
    const existing = await d.prepare(`SELECT * FROM crop_batches WHERE id = ? AND user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { name, crop_type, area_hectares, planted_date, expected_harvest_date, status, notes } = body;

    await d.prepare(
      `UPDATE crop_batches SET name = ?, crop_type = ?, area_hectares = ?, planted_date = ?, expected_harvest_date = ?, status = ?, notes = ? WHERE id = ? AND user_id = ?`
    ).run(
      name ?? existing.name, crop_type ?? existing.crop_type, area_hectares ?? existing.area_hectares,
      planted_date ?? existing.planted_date, expected_harvest_date ?? existing.expected_harvest_date,
      status ?? existing.status, notes ?? existing.notes, id, userId
    );

    const crop = await d.prepare(`SELECT * FROM crop_batches WHERE id = ?`).get(id);
    return NextResponse.json(crop);
  } catch (error) {
    console.error("Crops PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const d = await getDb();
    await d.prepare(`DELETE FROM harvest_logs WHERE batch_id = ? AND user_id = ?`).run(id, userId);
    await d.prepare(`DELETE FROM crop_batches WHERE id = ? AND user_id = ?`).run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Crops DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
