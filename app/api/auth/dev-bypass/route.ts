import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession, publicUser, generateId } from "@/lib/auth-helpers";

/**
 * DEV ONLY — Creates accounts for ALL roles and logs in as requested.
 * POST { role: "seller" | "buyer" | "driver" | "business" | "farmer" | "guest" }
 * REMOVE BEFORE PRODUCTION.
 */

const DEV_ACCOUNTS = [
  { role: "seller",   name: "Seller Dev",     email: "seller@greenduty.dev" },
  { role: "buyer",    name: "Buyer Dev",      email: "buyer@greenduty.dev" },
  { role: "driver",   name: "Driver Dev",     email: "driver@greenduty.dev" },
  { role: "business", name: "Business Dev",   email: "business@greenduty.dev" },
  { role: "farmer",   name: "Farmer Dev",     email: "farmer@greenduty.dev" },
  { role: "guest",    name: "Guest Dev",      email: "guest@greenduty.dev" },
];

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json().catch(() => ({}));
    const role = (body.role as string) || "seller";

    // Seed all dev accounts if not present
    for (const acct of DEV_ACCOUNTS) {
      const existing = await db.prepare("SELECT id FROM users WHERE email = ?").get(acct.email) as any;
      if (!existing) {
        const id = generateId();
        const points = acct.role === "guest" ? 100 : 5000;
        await db.prepare(`
          INSERT INTO users (id, name, email, password, account_type, points, verified, created_at)
          VALUES (?, ?, ?, '', ?, ?, 1, ?)
        `).run(id, acct.name, acct.email, acct.role, points, new Date().toISOString());
      }
    }

    // Find the requested account
    const target = DEV_ACCOUNTS.find(a => a.role === role) || DEV_ACCOUNTS[0];
    const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(target.email) as any;

    const response = NextResponse.json({ ok: true, user: publicUser(user), role: target.role });
    await createSession(response, user);
    return response;
  } catch (err) {
    console.error("[dev-bypass]", err);
    return NextResponse.json({ error: "Dev bypass failed." }, { status: 500 });
  }
}
