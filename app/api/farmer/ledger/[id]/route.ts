import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { type, category, amount, description, date } = body;

  try {
    const d = await getDb();
    const existing = await d.prepare(`SELECT * FROM ledger_entries WHERE id = ? AND user_id = ?`).get(id, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await d.prepare(
      `UPDATE ledger_entries SET type = ?, category = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?`
    ).run(type, category, amount, description, date, id, userId);

    const entry = await d.prepare(`SELECT * FROM ledger_entries WHERE id = ?`).get(id);
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Ledger PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const d = await getDb();
    const existing = await d.prepare(`SELECT * FROM ledger_entries WHERE id = ? AND user_id = ?`).get(id, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await d.prepare(`DELETE FROM ledger_entries WHERE id = ? AND user_id = ?`).run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ledger DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
