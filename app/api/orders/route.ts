import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { orderSchema } from "@/lib/validations";

// GET /api/orders → list the authenticated user's orders
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const d = await getDb();
    const rows = await d.prepare("SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC").all(userId);
    return NextResponse.json({ orders: rows });
  } catch (err) {
    console.error("[orders]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/orders → place an order (supports both single-item and cart checkout)
export async function POST(req: NextRequest) {
  try {
    const buyerId = await getCurrentUserId(req);
    if (!buyerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { productId, productName, quantity, totalPrice, items, paymentMethod, deliveryAddress, sellerId, deliveryNotes, commissionRate, commissionAmount } = parsed.data;

    // Cart checkout: items array with multiple products
    if (items && items.length > 0) {
      const d = await getDb();
      const id = genId("ord");
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const rate = commissionRate ?? 0.05;
      const commission = commissionAmount ?? Math.round(subtotal * rate);
      const total = subtotal + commission;

      await d.prepare(`
        INSERT INTO orders (id, buyer_id, seller_id, product_id, product_name, quantity, total_price, items_json, subtotal, commission_rate, commission_amount, payment_method, delivery_address, delivery_notes, status, escrow_status, escrow_held_at, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        id, buyerId, sellerId || null,
        items[0].productId || "cart",
        `Cart (${items.length} items)`,
        items.reduce((sum, item) => sum + item.quantity, 0),
        total,
        JSON.stringify(items),
        subtotal, rate, commission,
        paymentMethod || "ccp",
        deliveryAddress || null,
        deliveryNotes || null,
        "pending", "held", new Date().toISOString(),
        new Date().toISOString()
      );
      return NextResponse.json({ ok: true, id, total, commission }, { status: 201 });
    }

    // Single item order (backward compat)
    if (!productId || !productName || !quantity || !totalPrice) {
      return NextResponse.json({ error: "Provide items array or single product fields." }, { status: 400 });
    }
    const d = await getDb();
    const id = genId("ord");
    await d.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, product_id, product_name, quantity, total_price, payment_method, delivery_address, delivery_notes, status, escrow_status, escrow_held_at, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(id, buyerId, sellerId || null, productId, productName, quantity, totalPrice,
      paymentMethod || "ccp", deliveryAddress || null, deliveryNotes || null,
      "pending", "held", new Date().toISOString(), new Date().toISOString());

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[orders]", err);
    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}

// PATCH /api/orders → update order status (only the buyer or assigned driver can update)
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { orderId, status } = body;
    if (!orderId || !status) return NextResponse.json({ error: "Missing orderId or status." }, { status: 400 });

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const d = await getDb();
    const order = await d.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as { buyer_id: string } | undefined;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    // Authorization: only the buyer who placed this order can update it
    if (order.buyer_id !== userId) {
      return NextResponse.json({ error: "You can only update your own orders." }, { status: 403 });
    }

    // When delivered, set escrow_held_at to now (starts 24h countdown)
    if (status === "delivered") {
      await d.prepare("UPDATE orders SET status = ?, escrow_held_at = ? WHERE id = ?")
        .run(status, new Date().toISOString(), orderId);
    } else {
      await d.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
    }

    return NextResponse.json({ ok: true, orderId, status });
  } catch (err) {
    console.error("[orders:patch]", err);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
