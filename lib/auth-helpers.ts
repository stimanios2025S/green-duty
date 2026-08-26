import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID, randomInt } from "crypto";
import type { DbUser } from "./db";

/* ═══════════════════════════════════════════════════════
 *  JWT Session Management (HttpOnly, SameSite=Lax cookies)
 * ═══════════════════════════════════════════════════════ */

const SESSION_COOKIE = "gd_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.AUTH_SECRET || "greenduty-dev-secret-change-in-production";
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  sub: string;    // user ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/** Issue a signed JWT and set it as an HttpOnly cookie on the response */
export async function createSession(response: Response, user: DbUser): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.account_type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  // We need to set the cookie on the response headers
  const cookieValue = `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}`;
  const existing = response.headers.get("Set-Cookie");
  if (existing) {
    response.headers.set("Set-Cookie", `${existing}, ${cookieValue}`);
  } else {
    response.headers.set("Set-Cookie", cookieValue);
  }
}

/** Clear the session cookie */
export async function destroySession(response: Response): Promise<void> {
  const cookieValue = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  response.headers.set("Set-Cookie", cookieValue);
}

/** Verify and decode the JWT from the request cookie */
export async function verifySession(req: NextRequest): Promise<SessionPayload | null> {
  try {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(decodeURIComponent(token), getSecret(), {
      algorithms: ["HS256"],
    });

    return {
      sub: payload.sub as string,
      email: payload.email as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * Extract userId from the session cookie.
 * Returns null if no valid session exists.
 * This replaces the old getCurrentUserId(req) that read ?userId= query param.
 */
export async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const session = await verifySession(req);
  return session?.sub ?? null;
}

/**
 * Require authentication — returns userId or throws a NextResponse 401.
 * Use this in API routes that MUST have an authenticated user.
 */
export async function requireAuth(req: NextRequest): Promise<string> {
  const userId = await getCurrentUserId(req);
  if (!userId) {
    throw new Response(JSON.stringify({ error: "Unauthorized. Please sign in." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return userId;
}

/* ═══════════════════════════════════════════════════════
 *  Utility helpers (unchanged)
 * ═══════════════════════════════════════════════════════ */

/** Generate a new unique ID */
export function generateId(): string {
  return randomUUID();
}

/** Generate a 6-digit numeric verification code */
export function generateCode(): string {
  return String(randomInt(100000, 999999));
}

/**
 * Strip sensitive fields from a DbUser row and return the public user object
 * that the client stores and uses throughout the app.
 */
export function publicUser(row: DbUser) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: "",
    role: row.account_type as any,
    accountType: row.account_type as any,
    points: row.points,
    badges: [] as string[],
    joinedAt: row.created_at,
    businessName: row.business_name,
    businessAddress: row.business_address,
    idType: row.id_type,
    idNumber: row.id_number,
  };
}
