import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

let db: DatabaseSync | null = null;

/**
 * Real SQLite database (Node's built-in `node:sqlite`, zero native deps).
 * The database file lives at ./data/greenduty.db and persists on disk.
 */
export function getDb(): DatabaseSync {
  if (db) return db;
  const dbDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dbDir, { recursive: true });
  const dbPath = path.join(dbDir, "greenduty.db");
  db = new DatabaseSync(dbPath);
  db.exec(`
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
  `);
  return db;
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
