import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Signed, HttpOnly session cookie — the server's own record of who is calling.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * The app previously identified callers by a `userId` the client sent up in
 * the query string or JSON body. That is forgeable: anyone who knew another
 * user's id could act as them, and the owner routes expose invoices, deposits
 * and client data. Identity is now taken from a cookie the client cannot read
 * or modify, signed with SESSION_SECRET.
 *
 * `localStorage.gd_user` still exists as a UI cache (it decides which portal
 * renders and what the header shows), but the server never trusts it.
 *
 * ── Format ────────────────────────────────────────────────────────────────
 *   <base64url(json payload)>.<base64url(HMAC-SHA256 of that payload)>
 *
 * Stateless, so it works unchanged on Vercel's serverless instances.
 */

const COOKIE_NAME = "gd_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  email: string;
  /** Epoch ms — enforced on read so a stale token stops working. */
  issuedAt: number;
}

/**
 * The signing secret.
 *
 * In production a real secret is required — refusing to sign is far safer than
 * quietly falling back to a value anyone can read in this repository. In
 * development we fall back to a fixed string so the app runs out of the box,
 * with a warning.
 */
function secret(): string {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 16) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 16 characters. Generate one with: openssl rand -base64 32"
    );
  }

  console.warn(
    "[session] SESSION_SECRET is not set — using an insecure development fallback. " +
      "Sessions will not survive a restart and are not safe for production."
  );
  return "greenduty-insecure-development-fallback-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(user: { id: string; email: string }): string {
  const payload: SessionPayload = {
    userId: user.id,
    email: String(user.email || "").trim().toLowerCase(),
    issuedAt: Date.now(),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verify a token's signature and age. Returns null for anything untrusted. */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  let expected: string;
  try {
    expected = sign(body);
  } catch {
    // SESSION_SECRET missing in production — treat as unauthenticated.
    return null;
  }

  const provided = Buffer.from(signature);
  const computed = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so check first.
  if (provided.length !== computed.length) return null;
  if (!timingSafeEqual(provided, computed)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload?.userId || !payload?.email) return null;

    const ageSeconds = (Date.now() - Number(payload.issuedAt || 0)) / 1000;
    if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > MAX_AGE_SECONDS) return null;

    return {
      userId: String(payload.userId),
      email: String(payload.email).toLowerCase(),
      issuedAt: Number(payload.issuedAt),
    };
  } catch {
    return null;
  }
}

/** Issue the session cookie. Route Handler / Server Action only. */
export async function setSessionCookie(user: { id: string; email: string }): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Clear the session cookie — used by logout. */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** The verified caller, or null. This is the only trusted source of identity. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
