import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

// GET /api/orders?buyerId=... → list a buyer's orders
// GET /api/orders?all=1 → list all orders (platform-wide view: driver fleet, business ops)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get("buyerId");
    const all = searchParams.get("all") === "1";
    if (!all && !buyerId) return NextResponse.json({ error: "Missing buyerId" }, { status: 400 });
    const d = await getDb();
    const rows = all
      ? await d.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 50").all()
      : await d.prepare("SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC").all(buyerId);
    return NextResponse.json({ orders: rows });
  } catch (err) {
    console.error("[orders]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/orders → place an order
export async function POST(req: Request) {
  try {
    const { buyerId, productId, productName, quantity, totalPrice } = await req.json();
    if (!buyerId || !productId || !productName || !quantity || !totalPrice) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }
    const d = await getDb();
    const user = await d.prepare("SELECT id FROM users WHERE id = ?").get(buyerId);
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const id = genId("ord");
    await d.prepare(`
      INSERT INTO orders (id, buyer_id, product_id, product_name, quantity, total_price, status, created_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(id, buyerId, productId, productName, quantity, totalPrice, "pending", new Date().toISOString());

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[orders]", err);
    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}
