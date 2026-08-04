import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { createClient } from "@libsql/client";

/**
 * Dual-mode database (async interface):
 * - Production (Vercel): Turso/libSQL via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN.
 *   Serverless filesystems are read-only/ephemeral, so a hosted DB is required.
 * - Local dev: falls back to a SQLite file at ./data/greenduty.db (auto-created).
 *
 * Both backends expose the same minimal async interface used by the routes:
 *   await db.prepare(sql).run(args…) | .get(args…) | .all(args…)
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
`;

/** Split a multi-statement SQL string into individual statements */
function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/** Turso / libSQL adapter (async) */
function createTursoDb(url: string, authToken: string): Db {
  const client = createClient({ url, authToken });
  // libSQL `execute()` allows ONE statement only — use batch for schema
  client.batch(splitStatements(SCHEMA)).catch(err => {
    console.error("[db] Turso schema init failed:", err);
  });
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

export function getDb(): Db {
  if (db) return db;
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl && tursoToken) {
    console.log("[db] Using Turso (hosted)");
    db = createTursoDb(tursoUrl, tursoToken);
  } else {
    console.log("[db] Using local SQLite file");
    db = createLocalDb();
  }
  return db;
}
