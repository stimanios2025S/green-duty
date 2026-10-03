import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { requireOwner, serverError } from "@/lib/owner-auth";
import { CATALOG_OFFERINGS, DESIGN_STYLES } from "@/lib/catalog-data";
import {
  BUDGET_RANGES,
  CONTACT_PREFERENCES,
  ensureClientRecord,
  genId,
  oneOf,
  ORDER_STATUSES,
  str,
} from "@/lib/agency";

/**
 * POST /api/project-orders — place an order from the catalogue.
 * GET  /api/project-orders — owner-only list of incoming orders.
 *
 * Identity comes from the signed session cookie. Nothing here accepts a
 * userId or clientId from the caller.
 */

/** JSON-encode a list field for storage in a TEXT column. */
function toJson(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(v => str(v)).filter(Boolean));
  const single = str(value);
  return single ? JSON.stringify([single]) : JSON.stringify([]);
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Please sign in to place an order." }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    // The offering is resolved from our own catalogue rather than trusted from
    // the request, so a client cannot invent an offering or its category.
    const offeringId = str(body.offeringId);
    const offering = CATALOG_OFFERINGS.find(o => o.id === offeringId);
    if (!offering) {
      return NextResponse.json(
        { error: "That offering is no longer available. Please choose another from the catalogue." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = (await db
      .prepare("SELECT id, name, email, account_type, business_name FROM users WHERE id = ?")
      .get(session.userId)) as
      | { id: string; name: string; email: string; account_type: string; business_name: string | null }
      | undefined;
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    // Reuse the single client-linking path rather than inventing a second one.
    const clientId = await ensureClientRecord(db, {
      name: user.name,
      email: user.email,
      businessName: user.business_name,
    });

    const contactPreference = oneOf(body.contactPreference, CONTACT_PREFERENCES, "written_brief");
    const budgetRange = oneOf(body.budgetRange, BUDGET_RANGES, "not_sure");
    const requestedStyle = str(body.designStyle);
    const designStyle = DESIGN_STYLES.some(s => s.id === requestedStyle) ? requestedStyle : "";

    const now = new Date().toISOString();
    const orderId = genId("ord");

    // Status depends on whether a specification already exists. The written
    // brief produces one immediately, so that client has effectively confirmed
    // it. The direct-contact paths have no spec yet, so they really are still
    // waiting for one.
    const orderStatus = contactPreference === "written_brief" ? "awaiting_confirmation" : "awaiting_spec";

    await db
      .prepare(
        `INSERT INTO project_orders
           (id, offering_id, offering_name, category, client_id, status, budget_range,
            currency, contact_preference, design_style, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'DZD', ?, ?, ?, ?)`
      )
      .run(
        orderId,
        offering.id,
        offering.name,
        offering.category,
        clientId,
        orderStatus,
        budgetRange,
        contactPreference,
        designStyle,
        now,
        now
      );

    /* ── Option B: the written brief becomes a spec draft ──
       Only created when the client actually filled the form in. The AI and
       direct-contact paths leave the spec for a later stage. */
    let specId: string | null = null;
    const raw = body.spec && typeof body.spec === "object" ? (body.spec as Record<string, unknown>) : null;

    if (contactPreference === "written_brief" && raw) {
      const projectName = str(raw.projectName);
      const currentProcess = str(raw.currentProcess);
      const painPoints = str(raw.mainProblem);

      if (projectName || currentProcess || painPoints) {
        specId = genId("spec");
        await db
          .prepare(
            `INSERT INTO project_specs
               (id, order_id, project_id, created_by, project_name, business_type, industry, company_size,
                current_process, pain_points, required_modules, roles, data_migration, integrations,
                languages, reporting_needs, hardware_requirements, security_requirements, deadline,
                budget_range, definition_of_done, full_summary, status, confirmed_at, created_at)
             VALUES (?, ?, NULL, 'client_form', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'client_review', NULL, ?)`
          )
          .run(
            specId,
            orderId,
            projectName,
            str(raw.businessType),
            str(raw.industry),
            str(raw.numberOfUsers),
            currentProcess,
            painPoints,
            toJson(raw.requiredModules),
            toJson(raw.roles),
            str(raw.dataMigration),
            toJson(raw.integrations),
            toJson(raw.languages),
            str(raw.reportingNeeds),
            str(raw.hardwareRequirements),
            str(raw.securityRequirements),
            str(raw.deadline),
            budgetRange,
            str(raw.definitionOfDone),
            // Prose only — the project name has its own column now.
            str(raw.fullSummary),
            now
          );
      }
    }

    const order = await db.prepare("SELECT * FROM project_orders WHERE id = ?").get(orderId);
    return NextResponse.json({ order, specId }, { status: 201 });
  } catch (err) {
    return serverError("project-orders POST", err);
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireOwner();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = str(searchParams.get("status"));
    const search = str(searchParams.get("search"));

    const where: string[] = [];
    const args: unknown[] = [];

    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
      where.push("o.status = ?");
      args.push(status);
    }
    if (search) {
      where.push("(c.company_name LIKE ? OR c.contact_name LIKE ? OR o.offering_name LIKE ?)");
      const like = `%${search}%`;
      args.push(like, like, like);
    }

    const db = await getDb();
    const orders = (await db
      .prepare(
        `SELECT o.*, c.company_name AS client_company, c.contact_name AS client_contact, c.email AS client_email
           FROM project_orders o
           LEFT JOIN clients c ON c.id = o.client_id
           ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
          ORDER BY o.created_at DESC`
      )
      .all(...args)) as Record<string, unknown>[];

    return NextResponse.json({ orders });
  } catch (err) {
    return serverError("project-orders GET", err);
  }
}
