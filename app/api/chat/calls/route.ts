import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";

interface CallRow {
  id: string;
  caller_id: string;
  callee_id: string;
  status: string;
  sdp_offer?: string | null;
  sdp_answer?: string | null;
  [key: string]: unknown;
}

// POST /api/chat/calls {conversationId, calleeId, type} → start a ringing call
export async function POST(req: NextRequest) {
  try {
    const callerId = await getCurrentUserId(req);
    if (!callerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { conversationId, calleeId, type } = await req.json();
    if (!conversationId || !calleeId) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    await d.prepare("DELETE FROM calls WHERE caller_id = ? AND callee_id = ? AND status = 'ringing'").run(callerId, calleeId);
    const id = "call_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
    const now = new Date().toISOString();
    await d.prepare(`
      INSERT INTO calls (id, conversation_id, caller_id, callee_id, type, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(id, conversationId, callerId, calleeId, type || "audio", "ringing", now, now);
    return NextResponse.json({ callId: id }, { status: 201 });
  } catch (err) {
    console.error("[chat/calls]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// GET /api/chat/calls → active calls for this user
export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ calls: [] });
    const d = await getDb();
    const rows = await d.prepare(
      "SELECT * FROM calls WHERE (callee_id = ? OR caller_id = ?) AND status IN ('ringing','accepted') ORDER BY updated_at DESC LIMIT 10"
    ).all(userId, userId);
    return NextResponse.json({ calls: rows });
  } catch (err) {
    console.error("[chat/calls GET]", err);
    return NextResponse.json({ calls: [] }, { status: 500 });
  }
}

// PATCH /api/chat/calls {callId, action, sdpOffer, sdpAnswer}
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { callId, action, sdpOffer, sdpAnswer } = await req.json();
    if (!callId || !action) return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    const d = await getDb();
    const call = await d.prepare("SELECT * FROM calls WHERE id = ?").get(callId) as CallRow | undefined;
    if (!call) return NextResponse.json({ error: "Call not found." }, { status: 404 });
    const now = new Date().toISOString();

    switch (action) {
      case "offer":
        await d.prepare("UPDATE calls SET sdp_offer = ?, status = 'ringing', updated_at = ? WHERE id = ?").run(sdpOffer, now, callId);
        break;
      case "accept":
        await d.prepare("UPDATE calls SET sdp_answer = ?, status = 'accepted', updated_at = ? WHERE id = ?").run(sdpAnswer, now, callId);
        break;
      case "decline":
        await d.prepare("UPDATE calls SET status = 'declined', updated_at = ? WHERE id = ?").run(now, callId);
        break;
      case "end":
        await d.prepare("UPDATE calls SET status = 'ended', updated_at = ? WHERE id = ?").run(now, callId);
        break;
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[chat/calls PATCH]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
