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
    likes_hidden INTEGER NOT NULL DEFAULT 0,
    comments_disabled INTEGER NOT NULL DEFAULT 0,
    music_id TEXT,
    music_url TEXT,
    music_name TEXT,
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
    media_url TEXT,
    music_id TEXT,
    music_url TEXT,
    music_name TEXT,
    texts TEXT,
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
    media_url TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cleanup_events (
    id TEXT PRIMARY KEY,
    hotspot_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    lat REAL,
    lng REAL,
    date TEXT NOT NULL,
    max_volunteers INTEGER NOT NULL DEFAULT 25,
    reward_points INTEGER NOT NULL DEFAULT 100,
    organizer_id TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cleanup_signups (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    message TEXT,
    joined_at TEXT,
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

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_a TEXT,
    user_b TEXT,
    type TEXT NOT NULL DEFAULT 'direct',
    name TEXT,
    vanish INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    streak_last TEXT,
    streak_trees INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user_a, user_b);

  CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT,
    media_url TEXT,
    media_type TEXT,
    reply_to TEXT,
    reactions TEXT,
    vanish INTEGER NOT NULL DEFAULT 0,
    read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

  CREATE TABLE IF NOT EXISTS calls (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    caller_id TEXT NOT NULL,
    callee_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'audio',
    status TEXT NOT NULL DEFAULT 'ringing',
    sdp_offer TEXT,
    sdp_answer TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_id, status);

  CREATE TABLE IF NOT EXISTS call_candidates (
    call_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    candidate TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_call_candidates ON call_candidates(call_id, user_id);

  CREATE TABLE IF NOT EXISTS typing_status (
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    typing_at TEXT NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
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
  const migrations: [string, string][] = [
    ["posts.media_url", "ALTER TABLE posts ADD COLUMN media_url TEXT"],
    ["users.username", "ALTER TABLE users ADD COLUMN username TEXT"],
    ["users.bio", "ALTER TABLE users ADD COLUMN bio TEXT"],
    ["users.emoji", "ALTER TABLE users ADD COLUMN emoji TEXT"],
    ["users.gradient", "ALTER TABLE users ADD COLUMN gradient TEXT"],
    ["stories.media_url", "ALTER TABLE stories ADD COLUMN media_url TEXT"],
    ["stories.music_id", "ALTER TABLE stories ADD COLUMN music_id TEXT"],
    ["stories.texts", "ALTER TABLE stories ADD COLUMN texts TEXT"],
    ["stories.music_url", "ALTER TABLE stories ADD COLUMN music_url TEXT"],
    ["stories.music_name", "ALTER TABLE stories ADD COLUMN music_name TEXT"],
    ["conversations.type", "ALTER TABLE conversations ADD COLUMN type TEXT NOT NULL DEFAULT 'direct'"],
    ["conversations.name", "ALTER TABLE conversations ADD COLUMN name TEXT"],
    ["conversations.vanish", "ALTER TABLE conversations ADD COLUMN vanish INTEGER NOT NULL DEFAULT 0"],
    ["conversations.streak", "ALTER TABLE conversations ADD COLUMN streak INTEGER NOT NULL DEFAULT 0"],
    ["conversations.streak_last", "ALTER TABLE conversations ADD COLUMN streak_last TEXT"],
    ["conversations.streak_trees", "ALTER TABLE conversations ADD COLUMN streak_trees INTEGER NOT NULL DEFAULT 0"],
    ["messages.media_url", "ALTER TABLE messages ADD COLUMN media_url TEXT"],
    ["messages.media_type", "ALTER TABLE messages ADD COLUMN media_type TEXT"],
    ["messages.reply_to", "ALTER TABLE messages ADD COLUMN reply_to TEXT"],
    ["messages.reactions", "ALTER TABLE messages ADD COLUMN reactions TEXT"],
    ["messages.vanish", "ALTER TABLE messages ADD COLUMN vanish INTEGER NOT NULL DEFAULT 0"],
    ["posts.likes_hidden", "ALTER TABLE posts ADD COLUMN likes_hidden INTEGER NOT NULL DEFAULT 0"],
    ["posts.comments_disabled", "ALTER TABLE posts ADD COLUMN comments_disabled INTEGER NOT NULL DEFAULT 0"],
    ["posts.music_id", "ALTER TABLE posts ADD COLUMN music_id TEXT"],
    ["posts.music_url", "ALTER TABLE posts ADD COLUMN music_url TEXT"],
    ["posts.music_name", "ALTER TABLE posts ADD COLUMN music_name TEXT"],
    ["users.avatar_media", "ALTER TABLE users ADD COLUMN avatar_media TEXT"],
    ["hotspot_reports.media_url", "ALTER TABLE hotspot_reports ADD COLUMN media_url TEXT"],
    ["cleanup_signups.first_name", "ALTER TABLE cleanup_signups ADD COLUMN first_name TEXT"],
    ["cleanup_signups.last_name", "ALTER TABLE cleanup_signups ADD COLUMN last_name TEXT"],
    ["cleanup_signups.phone", "ALTER TABLE cleanup_signups ADD COLUMN phone TEXT"],
    ["cleanup_signups.email", "ALTER TABLE cleanup_signups ADD COLUMN email TEXT"],
    ["cleanup_signups.message", "ALTER TABLE cleanup_signups ADD COLUMN message TEXT"],
    ["cleanup_signups.joined_at", "ALTER TABLE cleanup_signups ADD COLUMN joined_at TEXT"],
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
