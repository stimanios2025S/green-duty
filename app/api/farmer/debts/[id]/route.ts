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
    const existing = await d.prepare(`SELECT * FROM debts WHERE id = ? AND user_id = ?`).get(id, userId);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { party_type, party_name, amount, paid, status, description, due_date } = body;

    await d.prepare(
      `UPDATE debts SET party_type = ?, party_name = ?, amount = ?, paid = ?, status = ?, description = ?, due_date = ? WHERE id = ? AND user_id = ?`
    ).run(party_type, party_name, amount, paid || 0, status || "pending", description, due_date, id, userId);

    const debt = await d.prepare(`SELECT * FROM debts WHERE id = ?`).get(id);
    return NextResponse.json(debt);
  } catch (error) {
    console.error("Debts PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const d = await getDb();
    await d.prepare(`DELETE FROM debts WHERE id = ? AND user_id = ?`).run(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Debts DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
