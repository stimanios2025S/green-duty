import { NextRequest, NextResponse } from "next/server";
import { verifySession, publicUser } from "@/lib/auth-helpers";
import { getDb, type DbUser } from "@/lib/db";

/** GET /api/auth/session — returns the current user from the session cookie */
export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    if (!session?.sub) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const db = await getDb();
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").get(session.sub) as DbUser | undefined;
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: publicUser(user) });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
