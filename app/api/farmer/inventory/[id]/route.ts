import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const d = await getDb();
    const existing = await d.prepare(`SELECT * FROM inventory_items WHERE id = ? AND user_id = ?`).get(id, userId) as Record<string, unknown> | undefined;
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Stock transaction (delta +/-)
    if (body.delta !== undefined) {
      const currentQty = Number(existing.quantity) || 0;
      const newQty = currentQty + body.delta;
      if (newQty < 0) return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });

      await d.prepare(`UPDATE inventory_items SET quantity = ? WHERE id = ?`).run(newQty, id);
      await d.prepare(
        `INSERT INTO inventory_transactions (id, item_id, user_id, delta, reason, date) VALUES (?, ?, ?, ?, ?, date('now'))`
      ).run(randomUUID(), id, userId, body.delta, body.reason || null);

      const updated = await d.prepare(`SELECT * FROM inventory_items WHERE id = ?`).get(id);
      return NextResponse.json(updated);
    }

    // Full update
    const { name, category, quantity, unit, low_threshold } = body;
    await d.prepare(
      `UPDATE inventory_items SET name = ?, category = ?, quantity = ?, unit = ?, low_threshold = ? WHERE id = ? AND user_id = ?`
    ).run(name ?? existing.name, category ?? existing.category, quantity ?? existing.quantity, unit ?? existing.unit, low_threshold ?? existing.low_threshold, id, userId);

    const updated = await d.prepare(`SELECT * FROM inventory_items WHERE id = ?`).get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Inventory PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const d = await getDb();
    await d.prepare(`DELETE FROM inventory_transactions WHERE item_id = ?`).run(id);
    await d.prepare(`DELETE FROM inventory_items WHERE id = ? AND user_id = ?`).run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inventory DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
