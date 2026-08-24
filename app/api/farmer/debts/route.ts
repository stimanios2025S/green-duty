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
    const debts = await d.prepare(
      `SELECT * FROM debts WHERE user_id = ? ORDER BY created_at DESC`
    ).all(userId);
    return NextResponse.json(debts);
  } catch (error) {
    console.error("Debts GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = randomUUID();
    const { party_type, party_name, amount, paid, status, description, due_date } = body;

    if (!party_type || !party_name || amount === undefined) {
      return NextResponse.json({ error: "Party type, name, and amount required" }, { status: 400 });
    }

    const d = await getDb();
    const now = new Date().toISOString();
    await d.prepare(
      `INSERT INTO debts (id, user_id, party_type, party_name, amount, paid, status, description, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, party_type, party_name, amount, paid || 0, status || "pending", description || null, due_date || null, now);

    const debt = await d.prepare(`SELECT * FROM debts WHERE id = ?`).get(id);
    return NextResponse.json(debt, { status: 201 });
  } catch (error) {
    console.error("Debts POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
