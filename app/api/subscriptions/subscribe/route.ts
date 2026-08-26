import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { generateId, getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { planId, billingCycle } = await req.json();
    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const d = await getDb();
    const plan = await d.prepare("SELECT * FROM subscription_plans WHERE id = ?").get(planId);
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const cycle = billingCycle === "annual" ? "annual" : "monthly";
    const amount = cycle === "annual" ? Number(plan.price_annual) : Number(plan.price_monthly);
    const now = new Date();
    const expiresAt = new Date(now);
    if (cycle === "annual") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Deactivate any existing active subscription
    await d.prepare("UPDATE user_subscriptions SET status = 'replaced' WHERE user_id = ? AND status = 'active'").run(userId);

    // Create new subscription
    const subId = generateId();
    await d.prepare(
      "INSERT INTO user_subscriptions (id, user_id, plan_id, billing_cycle, status, starts_at, expires_at, payment_method, amount_paid, created_at) VALUES (?, ?, ?, ?, 'active', ?, ?, 'pending', ?, ?)"
    ).run(subId, userId, planId, cycle, now.toISOString(), expiresAt.toISOString(), amount, now.toISOString());

    return NextResponse.json({ ok: true, subscriptionId: subId, plan: plan.name, expiresAt: expiresAt.toISOString() });
  } catch (e) {
    console.error("[subscribe]", e);
    return NextResponse.json({ error: "Failed to subscribe." }, { status: 500 });
  }
}
