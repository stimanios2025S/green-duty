import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface CandidateRow {
  user_id: string;
  candidate: string;
}

// GET /api/chat/calls/candidates?callId=&userId= → ICE candidates from the other side
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");
    const userId = searchParams.get("userId");
    if (!callId || !userId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const rows = await d.prepare(
      "SELECT user_id, candidate FROM call_candidates WHERE call_id = ? AND user_id != ? ORDER BY created_at ASC"
    ).all(callId, userId) as CandidateRow[];
    return NextResponse.json({ candidates: rows.map(r => ({ userId: r.user_id, candidate: JSON.parse(r.candidate as string) })) });
  } catch (err) {
    console.error("[chat/calls/candidates]", err);
    return NextResponse.json({ candidates: [] }, { status: 500 });
  }
}

// POST /api/chat/calls/candidates {callId, userId, candidate}
export async function POST(req: Request) {
  try {
    const { callId, userId, candidate } = await req.json();
    if (!callId || !userId || !candidate) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    await d.prepare("INSERT INTO call_candidates (call_id, user_id, candidate, created_at) VALUES (?,?,?,?)")
      .run(callId, userId, JSON.stringify(candidate), new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/calls/candidates POST]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
