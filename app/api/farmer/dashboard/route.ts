import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const d = await getDb();

    const incomeRow = await d.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE user_id = ? AND type = 'income'`
    ).get(userId) as { total: number };
    const expenseRow = await d.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE user_id = ? AND type = 'expense'`
    ).get(userId) as { total: number };

    const totalIncome = Number(incomeRow?.total) || 0;
    const totalExpenses = Number(expenseRow?.total) || 0;
    const netProfit = totalIncome - totalExpenses;
    const roi = totalExpenses > 0 ? Math.round(((totalIncome - totalExpenses) / totalExpenses) * 100) : 0;

    const lowStockItems = await d.prepare(
      `SELECT id, name, category, quantity, unit, low_threshold FROM inventory_items WHERE user_id = ? AND quantity <= low_threshold`
    ).all(userId);

    const activeCrops = await d.prepare(
      `SELECT COUNT(*) as count FROM crop_batches WHERE user_id = ? AND status = 'growing'`
    ).get(userId) as { count: number };

    const unpaidDebts = await d.prepare(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount - paid), 0) as total FROM debts WHERE user_id = ? AND status != 'paid'`
    ).get(userId) as { count: number; total: number };

    const recentHarvests = await d.prepare(
      `SELECT h.*, cb.name as batch_name, cb.crop_type FROM harvest_logs h LEFT JOIN crop_batches cb ON h.batch_id = cb.id WHERE h.user_id = ? ORDER BY h.date DESC LIMIT 5`
    ).all(userId);

    const monthlyPnl = await d.prepare(`
      SELECT
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM ledger_entries
      WHERE user_id = ? AND date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all(userId);

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netProfit,
      roi,
      lowStockItems,
      activeCropCount: Number(activeCrops?.count) || 0,
      unpaidDebts: { count: Number(unpaidDebts?.count) || 0, total: Number(unpaidDebts?.total) || 0 },
      recentHarvests,
      monthlyPnl,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
