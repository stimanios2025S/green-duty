import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { createClient } from "@libsql/client";

/**
 * Dual-mode database (async interface):
 * - Production (Vercel): Turso/libSQL via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 * - Local dev: SQLite file at ./data/greenduty.db (auto-created).
 */

export interface StatementSync {
  run(...params: unknown[]): Promise<{ changes: number | bigint; lastInsertRowid: number | bigint }>;
  get(...params: unknown[]): Promise<Record<string, unknown> | undefined>;
  all(...params: unknown[]): Promise<Record<string, unknown>[]>;
}

export interface Db {
  prepare(sql: string): StatementSync;
  exec(sql: string): Promise<void>;
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password: string;
  account_type: string;
  business_name: string | null;
  business_address: string | null;
  id_type: string | null;
  id_number: string | null;
  points: number;
  verified: number;
  verification_code: string | null;
  verification_expires: number | null;
  created_at: string;
}

let db: Db | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    account_type TEXT NOT NULL,
    business_name TEXT,
    business_address TEXT,
    id_type TEXT,
    id_number TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 0,
    verification_code TEXT,
    verification_expires INTEGER,
    username TEXT,
    bio TEXT,
    emoji TEXT,
    gradient TEXT,
    avatar_media TEXT,
    password_reset_code TEXT,
    password_reset_expires INTEGER,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);












  CREATE TABLE IF NOT EXISTS b2b_inquiries (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    service TEXT,
    message TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );







  /* ── Agency: B2B clients ── */
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    industry TEXT,
    country TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'lead',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

  /* ── Agency: software projects / orders ── */
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES clients(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'lead',
    total_amount REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'DZD',
    deposit_amount REAL NOT NULL DEFAULT 0,
    start_date TEXT,
    due_date TEXT,
    progress INTEGER NOT NULL DEFAULT 0,
    delivery_target TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

  /* ── Agency: invoices ── */
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    invoice_number TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL DEFAULT 0,
    deposit_received REAL NOT NULL DEFAULT 0,
    amount_paid REAL NOT NULL DEFAULT 0,
    balance_due REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    due_date TEXT,
    issued_at TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

  /* ── Agency: payments & deposits ── */
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id),
    project_id TEXT REFERENCES projects(id),
    amount REAL NOT NULL DEFAULT 0,
    method TEXT NOT NULL DEFAULT 'bank_transfer',
    reference TEXT,
    received_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_payments_project ON payments(project_id);

  /* ── Agency: partners ── */
  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    category TEXT NOT NULL DEFAULT 'technology',
    website TEXT,
    contact_name TEXT,
    email TEXT,
    collaboration_type TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    since TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

  /* ── Design references ──
     A client pastes a link to a design they like (typically Dribbble) plus
     notes on what appeals to them. We store the URL and the notes ONLY —
     the referenced image is never fetched, proxied, cached or embedded.
     See app/api/design-references/route.ts for the validation rules. */
  CREATE TABLE IF NOT EXISTS design_references (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    title TEXT,
    reference_url TEXT NOT NULL,
    client_notes TEXT,
    owner_notes TEXT,
    status TEXT NOT NULL DEFAULT 'suggested',
    created_by TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_design_references_project ON design_references(project_id);

  /* ── Project orders ──
     An order placed from the catalogue, before it becomes a projects row.
     Distinct from the marketplace orders table, which is untouched.
     client_id is nullable because an order can be started before the
     visitor has an account (§3.2). */
  CREATE TABLE IF NOT EXISTS project_orders (
    id TEXT PRIMARY KEY,
    offering_id TEXT,
    offering_name TEXT,
    category TEXT,
    client_id TEXT REFERENCES clients(id),
    status TEXT NOT NULL DEFAULT 'draft',
    budget_range TEXT,
    currency TEXT NOT NULL DEFAULT 'DZD',
    contact_preference TEXT,
    design_style TEXT,
    owner_notes TEXT,
    project_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_project_orders_client ON project_orders(client_id);
  CREATE INDEX IF NOT EXISTS idx_project_orders_status ON project_orders(status);

  /* ── Project specifications ──
     The structured brief, however it was produced (AI interview, written
     form, or the owner typing it up from a phone call). */
  CREATE TABLE IF NOT EXISTS project_specs (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES project_orders(id),
    project_id TEXT REFERENCES projects(id),
    created_by TEXT NOT NULL DEFAULT 'client_form',
    project_name TEXT,
    business_type TEXT,
    industry TEXT,
    company_size TEXT,
    current_process TEXT,
    pain_points TEXT,
    required_modules TEXT,
    roles TEXT,
    data_migration TEXT,
    integrations TEXT,
    languages TEXT,
    reporting_needs TEXT,
    hardware_requirements TEXT,
    security_requirements TEXT,
    deadline TEXT,
    budget_range TEXT,
    definition_of_done TEXT,
    full_summary TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    confirmed_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_project_specs_order ON project_specs(order_id);
  CREATE INDEX IF NOT EXISTS idx_project_specs_project ON project_specs(project_id);

  /* ── AI interview transcript (optional, owner-readable) ── */
  CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES project_orders(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ai_messages_order ON ai_messages(order_id);

  /* ── Generated specification PDFs ──
     Bytes live in the database: Vercel's filesystem is ephemeral, so nothing
     is written to disk. Rows are versioned and never overwritten. */
  CREATE TABLE IF NOT EXISTS spec_documents (
    id TEXT PRIMARY KEY,
    spec_id TEXT REFERENCES project_specs(id),
    project_id TEXT REFERENCES projects(id),
    version INTEGER NOT NULL DEFAULT 1,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL DEFAULT 'application/pdf',
    bytes BLOB,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_spec_documents_spec ON spec_documents(spec_id);
  CREATE INDEX IF NOT EXISTS idx_spec_documents_project ON spec_documents(project_id);

  /* ── Project roadmap ── */
  CREATE TABLE IF NOT EXISTS project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    title TEXT NOT NULL,
    description TEXT,
    phase TEXT NOT NULL DEFAULT 'discovery',
    order_index INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TEXT,
    progress INTEGER NOT NULL DEFAULT 0,
    owner_note TEXT,
    client_visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id, order_index);

  CREATE TABLE IF NOT EXISTS project_deliverables (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES project_milestones(id),
    project_id TEXT REFERENCES projects(id),
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'document',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TEXT,
    completed_at TEXT,
    amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_project_deliverables_project ON project_deliverables(project_id);
  CREATE INDEX IF NOT EXISTS idx_project_deliverables_milestone ON project_deliverables(milestone_id);
`;

/** Split a multi-statement SQL string into individual statements */
function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/** Turso / libSQL adapter (async) — schema must be awaited by getDb() */
function createTursoDb(client: ReturnType<typeof createClient>): Db {
  return {
    prepare(sql: string): StatementSync {
      return {
        async run(...params: unknown[]) {
          const res = await client.execute({ sql, args: params as never[] });
          return { changes: Number(res.rowsAffected), lastInsertRowid: 0 };
        },
        async get(...params: unknown[]) {
          const res = await client.execute({ sql, args: params as never[] });
          const row = res.rows[0];
          return row ? (row as Record<string, unknown>) : undefined;
        },
        async all(...params: unknown[]) {
          const res = await client.execute({ sql, args: params as never[] });
          return res.rows as unknown as Record<string, unknown>[];
        },
      };
    },
    async exec(sql: string) {
      await client.batch(splitStatements(sql));
    },
  };
}

/** Local SQLite adapter (node:sqlite wrapped in async) */
function createLocalDb(): Db {
  const dbDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dbDir, { recursive: true });
  const raw = new DatabaseSync(path.join(dbDir, "greenduty.db"));
  raw.exec(SCHEMA);
  return {
    prepare(sql: string): StatementSync {
      const stmt = raw.prepare(sql);
      return {
        async run(...params: unknown[]) {
          const res = stmt.run(...params);
          return { changes: Number(res.changes), lastInsertRowid: Number(res.lastInsertRowid) };
        },
        async get(...params: unknown[]) {
          return stmt.get(...params) as Record<string, unknown> | undefined;
        },
        async all(...params: unknown[]) {
          return stmt.all(...params) as Record<string, unknown>[];
        },
      };
    },
    async exec(sql: string) {
      raw.exec(sql);
    },
  };
}

/** Run idempotent migrations for tables created before a schema change */
async function migrate(db: Db): Promise<void> {
  const migrations: [string, string][] = [
    ["users.username", "ALTER TABLE users ADD COLUMN username TEXT"],
    ["users.bio", "ALTER TABLE users ADD COLUMN bio TEXT"],
    ["users.emoji", "ALTER TABLE users ADD COLUMN emoji TEXT"],
    ["users.gradient", "ALTER TABLE users ADD COLUMN gradient TEXT"],
    ["users.avatar_media", "ALTER TABLE users ADD COLUMN avatar_media TEXT"],
    ["projects.delivery_target", "ALTER TABLE projects ADD COLUMN delivery_target TEXT"],
    ["project_orders.owner_notes", "ALTER TABLE project_orders ADD COLUMN owner_notes TEXT"],
    ["project_specs.project_name", "ALTER TABLE project_specs ADD COLUMN project_name TEXT"],
    ["project_orders.project_id", "ALTER TABLE project_orders ADD COLUMN project_id TEXT"],
    ["design_references.created_by", "ALTER TABLE design_references ADD COLUMN created_by TEXT"],
    ["users.password_reset_code", "ALTER TABLE users ADD COLUMN password_reset_code TEXT"],
    ["users.password_reset_expires", "ALTER TABLE users ADD COLUMN password_reset_expires INTEGER"],
  ];
  for (const [name, sql] of migrations) {
    try {
      await db.prepare(sql).run();
      console.log(`[db] Migration: added ${name}`);
    } catch {}
  }
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl && tursoToken) {
    console.log("[db] Using Turso (hosted)");
    const client = createClient({ url: tursoUrl, authToken: tursoToken });
    try {
      await client.batch(splitStatements(SCHEMA));
    } catch (err) {
      console.error("[db] Turso schema init failed:", err);
    }
    db = createTursoDb(client);
  } else {
    console.log("[db] Using local SQLite file");
    db = createLocalDb();
  }
  await migrate(db);
  return db;
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const d = await getDb();
  const row = await d.prepare("SELECT * FROM users WHERE id = ?").get(id);
  return (row as unknown as DbUser) || null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const d = await getDb();
  const row = await d.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase());
  return (row as unknown as DbUser) || null;
}
