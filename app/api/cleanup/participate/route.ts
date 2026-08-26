import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendParticipantNotification } from "@/lib/email";
import { getCurrentUserId } from "@/lib/auth-helpers";

interface CleanupEventRow {
  id: string;
  title: string;
}

// POST /api/cleanup/participate
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    const { eventId, firstName, lastName, phone, email, message } = await req.json();

    if (!eventId) return NextResponse.json({ error: "Missing event." }, { status: 400 });
    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "First and family name are required." }, { status: 400 });
    }
    if (!phone?.trim() && !email?.trim()) {
      return NextResponse.json({ error: "Please provide a phone number or an email so we can reach you." }, { status: 400 });
    }

    const d = await getDb();
    const event = await d.prepare("SELECT id, title FROM cleanup_events WHERE id = ?").get(eventId) as CleanupEventRow | undefined;
    if (!event) return NextResponse.json({ error: "Cleanup event not found." }, { status: 404 });

    await d.prepare(`
      INSERT OR REPLACE INTO cleanup_signups
        (event_id, user_id, first_name, last_name, phone, email, message, joined_at)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(
      eventId,
      userId || null,
      firstName.trim(),
      lastName.trim(),
      phone?.trim() || null,
      email?.trim() || null,
      message?.trim() || null,
      new Date().toISOString()
    );

    const result = await sendParticipantNotification({
      eventTitle: event.title,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim(),
      email: email?.trim(),
      message: message?.trim(),
      date: new Date().toLocaleDateString(),
    });

    return NextResponse.json({ ok: true, notified: result.mode === "email" }, { status: 201 });
  } catch (err) {
    console.error("[cleanup participate]", err);
    return NextResponse.json({ error: "Failed to join. Please try again." }, { status: 500 });
  }
}
