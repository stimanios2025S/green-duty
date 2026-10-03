import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { recalcInvoice } from "@/lib/agency";

/**
 * DELETE /api/payments/:id?userId=…
 *
 * Removes a payment and immediately recomputes the invoice it was recorded
 * against, so the paid/balance figures stay truthful.
 *
 * Owner-only.
 */

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const db = await getDb();
    const payment = (await db.prepare("SELECT id, invoice_id FROM payments WHERE id = ?").get(id)) as
      | { id: string; invoice_id: string | null }
      | undefined;
    if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });

    await db.prepare("DELETE FROM payments WHERE id = ?").run(id);
    if (payment.invoice_id) await recalcInvoice(db, payment.invoice_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError("payments/[id] DELETE", err);
  }
}
