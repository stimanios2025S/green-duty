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
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    excerpt TEXT,
    content TEXT,
    tags TEXT,
    cover_emoji TEXT,
    cover_gradient TEXT,
    video_url TEXT,
    media_url TEXT,
    duration TEXT,
    views INTEGER NOT NULL DEFAULT 0,
    caption TEXT,
    location TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);

  CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

  CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    emoji TEXT,
    gradient TEXT,
    caption TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS story_views (
    story_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (story_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS hotspot_reports (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    pollution_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    address TEXT,
    lat REAL,
    lng REAL,
    reporter_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reported',
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cleanup_signups (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (event_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tree_donations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    trees INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

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
  try {
    await db.prepare("ALTER TABLE posts ADD COLUMN media_url TEXT").run();
    console.log("[db] Migration: added posts.media_url");
  } catch {}
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
