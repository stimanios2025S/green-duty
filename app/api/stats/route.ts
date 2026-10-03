import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// GET /api/stats → live agency figures straight from the database.
//
// Public and deliberately non-financial: these are the only figures the
// client-facing site is allowed to show. Revenue, balances and client names
// are owner-only and never appear here.
export async function GET() {
  try {
    const d = await getDb();
    const one = async (sql: string, ...args: unknown[]) => {
      const r = await d.prepare(sql).get(...args);
      return Number((r as { c?: number })?.c || 0);
    };

    const [systemsDelivered, projectsActive, clientsServed, industriesServed, partners, verifiedUsers] =
      await Promise.all([
        one("SELECT COUNT(*) as c FROM projects WHERE status = 'delivered'"),
        one("SELECT COUNT(*) as c FROM projects WHERE status IN ('in_progress','review')"),
        one("SELECT COUNT(*) as c FROM clients"),
        one("SELECT COUNT(DISTINCT industry) as c FROM clients WHERE industry IS NOT NULL AND industry <> ''"),
        one("SELECT COUNT(*) as c FROM partners WHERE status = 'active'"),
        one("SELECT COUNT(*) as c FROM users WHERE verified = 1"),
      ]);

    return NextResponse.json({
      agency: {
        systemsDelivered,
        projectsActive,
        clientsServed,
        industriesServed,
        partners,
      },
      verifiedUsers,
    });
  } catch (err) {
    console.error("[stats]", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}