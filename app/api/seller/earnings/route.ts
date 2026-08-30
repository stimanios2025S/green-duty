import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { payoutSchema } from "@/lib/validations";

/**
 * GET /api/seller/earnings
 * Returns the seller's earnings summary and order details.
 *
 * Escrow flow:
 * - Buyer pays → money held by GreenDuty (escrow_status = "held")
 * - Order delivered → 24h countdown starts
 * - After 24h → escrow_status = "released" (seller can withdraw)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const d = await getDb();

    // Get all orders where this seller is the seller
    const orders = await d.prepare(
      "SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC LIMIT 100"
    ).all(userId) as any[];

    // Compute earnings breakdown
    let totalRevenue = 0;
    let heldInEscrow = 0;
    let availableForPayout = 0;
    let totalPaidOut = 0;
    let totalCommission = 0;
    const orderDetails: any[] = [];

    for (const o of orders) {
      const amount = Number(o.total_price || 0);
      const commission = Number(o.commission_amount || 0);
      const sellerEarning = amount - commission;
      totalRevenue += amount;
      totalCommission += commission;

      let escrowStatus = o.escrow_status || "held";
      let hoursUntilRelease: number | null = null;
      let releaseDate: string | null = null;

      // Auto-release logic: if delivered and 24h have passed
      if (o.status === "delivered" && escrowStatus === "held") {
        const deliveredAt = new Date(o.created_at).getTime();
        const now = Date.now();
        const hoursElapsed = (now - deliveredAt) / (1000 * 60 * 60);

        if (hoursElapsed >= 24) {
          // Auto-release
          escrowStatus = "released";
          await d.prepare("UPDATE orders SET escrow_status = 'released', escrow_released_at = ? WHERE id = ?")
            .run(new Date().toISOString(), o.id);
        } else {
          hoursUntilRelease = Math.ceil(24 - hoursElapsed);
          releaseDate = new Date(deliveredAt + 24 * 60 * 60 * 1000).toISOString();
        }
      }

      if (escrowStatus === "released") {
        availableForPayout += sellerEarning;
      } else if (escrowStatus === "paid") {
        totalPaidOut += sellerEarning;
      } else {
        // held
        if (o.status === "delivered" || o.status === "shipped") {
          heldInEscrow += sellerEarning;
        }
      }

      orderDetails.push({
        id: o.id,
        productName: o.product_name,
        quantity: o.quantity,
        totalPrice: amount,
        commission,
        sellerEarning,
        status: o.status,
        escrowStatus,
        hoursUntilRelease,
        releaseDate,
        paymentMethod: o.payment_method,
        createdAt: o.created_at,
      });
    }

    return NextResponse.json({
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalCommission: Math.round(totalCommission),
        heldInEscrow: Math.round(heldInEscrow),
        availableForPayout: Math.round(availableForPayout),
        totalPaidOut: Math.round(totalPaidOut),
        totalOrders: orders.length,
      },
      orders: orderDetails,
    });
  } catch (err) {
    console.error("[seller/earnings]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

/**
 * POST /api/seller/earnings — request payout (release escrow manually)
 * Body: { orderId: string }
 * Only works for orders with escrow_status = "released"
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = payoutSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    const { orderId } = parsed.data;

    const d = await getDb();
    const order = await d.prepare("SELECT * FROM orders WHERE id = ? AND seller_id = ?").get(orderId, userId) as any;
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.escrow_status !== "released") {
      return NextResponse.json({ error: "Escrow not yet released for this order." }, { status: 400 });
    }

    // Mark as paid out
    await d.prepare("UPDATE orders SET escrow_status = 'paid' WHERE id = ?").run(orderId);

    const earning = Number(order.total_price || 0) - Number(order.commission_amount || 0);
    return NextResponse.json({ ok: true, amount: Math.round(earning), message: "Payout processed." });
  } catch (err) {
    console.error("[seller/earnings:post]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
