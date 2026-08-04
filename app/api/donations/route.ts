import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

// POST /api/donations → sponsor trees ($5 = 1 tree)
export async function POST(req: Request) {
  try {
    const { userId, amount, name, email } = await req.json();
    const amt = Number(amount);
    if (!amt || amt <= 0) return NextResponse.json({ error: "Enter a valid amount." }, { status: 400 });
    const d = await getDb();
    if (userId) {
      const user = await d.prepare("SELECT id FROM users WHERE id = ?").get(userId);
      if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const trees = Math.floor(amt / 5);
    const id = genId("don");
    await d.prepare("INSERT INTO tree_donations (id, user_id, amount, trees, created_at) VALUES (?,?,?,?,?)")
      .run(id, userId || null, amt, trees, new Date().toISOString());
    return NextResponse.json({ ok: true, id, trees }, { status: 201 });
  } catch (err) {
    console.error("[donations]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
