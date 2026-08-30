import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { ledgerEntrySchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const d = await getDb();
    const entries = await d.prepare(
      `SELECT * FROM ledger_entries WHERE user_id = ? ORDER BY date DESC, created_at DESC`
    ).all(userId);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Ledger GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = ledgerEntrySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const id = randomUUID();
    const { type, category, amount, description, date } = parsed.data;

    const d = await getDb();
    const now = new Date().toISOString();
    await d.prepare(
      `INSERT INTO ledger_entries (id, user_id, type, category, amount, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, type, category, amount, description || null, date || now.split("T")[0], now);

    const entry = await d.prepare(`SELECT * FROM ledger_entries WHERE id = ?`).get(id);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Ledger POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
