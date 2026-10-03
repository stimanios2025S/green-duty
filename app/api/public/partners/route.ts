import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { str } from "@/lib/agency";

/**
 * GET /api/public/partners
 *
 * The public partner list for /partners. Deliberately:
 *  - only `active` partners (negotiating/past deals are not advertised),
 *  - only the fields that are safe to publish.
 *
 * Contact names and email addresses are owner-only and are never selected
 * here, so they cannot leak into the public page or its network response.
 */
export async function GET() {
  try {
    const db = await getDb();
    const partners = (await db
      .prepare(
        `SELECT id, name, logo_url, category, website, collaboration_type, description, since
           FROM partners
          WHERE status = 'active'
          ORDER BY created_at DESC`
      )
      .all()) as Record<string, unknown>[];

    return NextResponse.json({
      partners: partners.map(p => ({
        id: str(p.id),
        name: str(p.name),
        logo_url: str(p.logo_url),
        category: str(p.category, "technology"),
        website: str(p.website),
        collaboration_type: str(p.collaboration_type),
        description: str(p.description),
        since: str(p.since),
      })),
    });
  } catch (err) {
    console.error("[public/partners]", err);
    return NextResponse.json({ error: "Failed to load partners." }, { status: 500 });
  }
}
