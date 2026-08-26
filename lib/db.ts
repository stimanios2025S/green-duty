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
    seller_id TEXT,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price REAL NOT NULL,
    items_json TEXT,
    subtotal REAL,
    commission_rate REAL DEFAULT 0.05,
    commission_amount REAL DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    delivery_address TEXT,
    delivery_notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
  CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);

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

  /* ═══════════════════════════════════════════════
   *  Farmer CRM Tables
   * ═══════════════════════════════════════════════ */

  CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    debt_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_entries(user_id);

  CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    party_type TEXT NOT NULL,
    party_name TEXT NOT NULL,
    amount REAL NOT NULL,
    paid REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    description TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);

  CREATE TABLE IF NOT EXISTS inventory_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    low_threshold REAL NOT NULL DEFAULT 5,
    crop_batch_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_items(user_id);

  CREATE TABLE IF NOT EXISTS inventory_transactions (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    delta REAL NOT NULL,
    reason TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_invtx_user ON inventory_transactions(user_id);

  CREATE TABLE IF NOT EXISTS crop_batches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    area_hectares REAL NOT NULL,
    planted_date TEXT NOT NULL,
    expected_harvest_date TEXT,
    status TEXT NOT NULL DEFAULT 'growing',
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_crops_user ON crop_batches(user_id);

  CREATE TABLE IF NOT EXISTS harvest_logs (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    yield_kg REAL NOT NULL,
    price_per_kg REAL NOT NULL,
    sold_to TEXT,
    revenue REAL NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_harvests_user ON harvest_logs(user_id);

  /* ═══════════════════════════════════════════════
   *  Subscriptions, Payments & Commission Tables
   * ═══════════════════════════════════════════════ */

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly REAL NOT NULL,
    price_annual REAL NOT NULL,
    features TEXT NOT NULL,
    max_listings INTEGER NOT NULL DEFAULT 10,
    commission_rate REAL NOT NULL DEFAULT 0.05,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    status TEXT NOT NULL DEFAULT 'active',
    starts_at TEXT NOT NULL,
    expires_at TEXT,
    payment_method TEXT,
    amount_paid REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_subs_user ON user_subscriptions(user_id);

  /* orders_v2 removed — unified into orders table */

  /* ═══════════════════════════════════════════════
   *  Buyer Daily CRM Tables
   * ═══════════════════════════════════════════════ */

  CREATE TABLE IF NOT EXISTS buyer_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    category TEXT NOT NULL DEFAULT 'supplier',
    notes TEXT,
    last_contacted TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_buyer_contacts_user ON buyer_contacts(user_id);

  CREATE TABLE IF NOT EXISTS buyer_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'pending',
    related_contact_id TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_buyer_tasks_user ON buyer_tasks(user_id);

  CREATE TABLE IF NOT EXISTS buyer_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_buyer_notes_user ON buyer_notes(user_id);

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'DZD',
    stock INTEGER NOT NULL DEFAULT 0,
    quality_certified INTEGER NOT NULL DEFAULT 0,
    organic_certified INTEGER NOT NULL DEFAULT 0,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    seller_verified INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    images TEXT,
    rating REAL NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    warranty_months INTEGER NOT NULL DEFAULT 0,
    features TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
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
async function createLocalDb(): Promise<Db> {
  const { DatabaseSync } = await import("node:sqlite");
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
  /* Seed subscription plans if not present */
  try {
    const existing = await db.prepare("SELECT COUNT(*) as c FROM subscription_plans").get();
    if (existing && Number(existing.c) === 0) {
      const now = new Date().toISOString();
      const plans = [
        { id: "plan_basic", name: "Essentiel", price_monthly: 1500, price_annual: 15000, features: JSON.stringify(["10 annonces", "CRM de base", "Support par email", "Paiement sécurisé", "Commission 5%"]), max_listings: 10, commission_rate: 0.05 },
        { id: "plan_pro", name: "Professionnel", price_monthly: 3500, price_annual: 35000, features: JSON.stringify(["50 annonces", "CRM avancé + analytics", "Chat vendeur/acheteur", "Support prioritaire", "Commission 2.5%", "Badge vérifié"]), max_listings: 50, commission_rate: 0.025 },
        { id: "plan_premium", name: "Premium", price_monthly: 7500, price_annual: 75000, features: JSON.stringify(["Annonces illimitées", "CRM complet + rapports", "Chat + appels vidéo", "Support dédié 24/7", "Zéro commission", "Badge premium", "Mise en avant produits"]), max_listings: 999999, commission_rate: 0 },
      ];
      for (const p of plans) {
        await db.prepare("INSERT INTO subscription_plans (id, name, price_monthly, price_annual, features, max_listings, commission_rate, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(p.id, p.name, p.price_monthly, p.price_annual, p.features, p.max_listings, p.commission_rate, now);
      }
      console.log("[db] Seeded 3 subscription plans");
    }
  } catch (e) {
    console.error("[db] Plan seed failed:", e);
  }

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
    /* ── Orders consolidation (orders_v2 → orders) ── */
    ["orders.seller_id", "ALTER TABLE orders ADD COLUMN seller_id TEXT"],
    ["orders.items_json", "ALTER TABLE orders ADD COLUMN items_json TEXT"],
    ["orders.subtotal", "ALTER TABLE orders ADD COLUMN subtotal REAL"],
    ["orders.commission_rate", "ALTER TABLE orders ADD COLUMN commission_rate REAL DEFAULT 0.05"],
    ["orders.commission_amount", "ALTER TABLE orders ADD COLUMN commission_amount REAL DEFAULT 0"],
    ["orders.payment_method", "ALTER TABLE orders ADD COLUMN payment_method TEXT"],
    ["orders.payment_status", "ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'"],
    ["orders.delivery_address", "ALTER TABLE orders ADD COLUMN delivery_address TEXT"],
    ["orders.delivery_notes", "ALTER TABLE orders ADD COLUMN delivery_notes TEXT"],
    ["orders.escrow_status", "ALTER TABLE orders ADD COLUMN escrow_status TEXT DEFAULT 'held'"],
    ["orders.escrow_held_at", "ALTER TABLE orders ADD COLUMN escrow_held_at TEXT"],
    ["orders.escrow_released_at", "ALTER TABLE orders ADD COLUMN escrow_released_at TEXT"],
    ["products.image_url", "ALTER TABLE products ADD COLUMN image_url TEXT"],
    ["products.images", "ALTER TABLE products ADD COLUMN images TEXT"],
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
    db = await createLocalDb();
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
