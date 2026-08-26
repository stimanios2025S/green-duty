import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

interface CandidateRow {
  user_id: string;
  candidate: string;
}

// GET /api/chat/calls/candidates?callId= → ICE candidates from the other side
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ candidates: [] });
    const callId = req.nextUrl.searchParams.get("callId");
    if (!callId) return NextResponse.json({ candidates: [] });
    const d = await getDb();
    const rows = await d.prepare(
      "SELECT user_id, candidate FROM call_candidates WHERE call_id = ? AND user_id != ? ORDER BY created_at ASC"
    ).all(callId, userId) as unknown as CandidateRow[];
    return NextResponse.json({ candidates: rows.map(r => ({ userId: r.user_id, candidate: JSON.parse(r.candidate as string) })) });
  } catch (err) {
    console.error("[chat/calls/candidates]", err);
    return NextResponse.json({ candidates: [] }, { status: 500 });
  }
}

// POST /api/chat/calls/candidates {callId, candidate}
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { callId, candidate } = await req.json();
    if (!callId || !candidate) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    await d.prepare("INSERT INTO call_candidates (call_id, user_id, candidate, created_at) VALUES (?,?,?,?)")
      .run(callId, userId, JSON.stringify(candidate), new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/calls/candidates POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
