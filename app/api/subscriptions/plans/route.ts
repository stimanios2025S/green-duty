import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const d = await getDb();
    const plans = await d.prepare("SELECT * FROM subscription_plans ORDER BY price_monthly ASC").all();
    return NextResponse.json({ plans });
  } catch (e) {
    return NextResponse.json({ plans: [], error: String(e) }, { status: 500 });
  }
}
