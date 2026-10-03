import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Server-side access control (Next.js 16 Proxy — formerly Middleware).
 *
 * ── The rule ──────────────────────────────────────────────────────────────
 *   Public, no account needed:  /  /catalogue  /partners  /b2b
 *                               /login  /auth/register  /auth/verify
 *   Everything else needs a signed-in account:  /order/new  /portal  /dashboard  /settings
 *
 * Visitors can browse the whole client-facing site freely. Sign-in is only
 * asked for when someone orders, contacts us about a project, or opens their
 * own workspace.
 *
 * ── Why this file exists ──────────────────────────────────────────────────
 * Before this, protection was applied in a client component: the HTML for
 * /portal and /dashboard was served to anyone (HTTP 200) and only redirected
 * once React ran in the browser. This runs on the server before the page is
 * rendered, so an unauthenticated visitor is redirected at the edge and the
 * page shell is never sent.
 *
 * ── What it does and does not do ──────────────────────────────────────────
 * This is an optimistic gate: it verifies the session cookie's signature and
 * age, then redirects. The authoritative check for every piece of data still
 * happens inside each route handler via getSession() / requireOwner(), which
 * re-read the user row from the database. Proxy decides *which page renders*;
 * the API decides *what data is returned*.
 */

const COOKIE_NAME = "gd_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** Exact public paths — no account required. */
const PUBLIC_EXACT = new Set(["/", "/catalogue", "/partners", "/b2b"]);

/** Public prefixes — the authentication flow itself. */
const PUBLIC_PREFIXES = ["/login", "/auth/register", "/auth/verify"];

/** Prefixes that must never be intercepted. */
const ALWAYS_PASS = ["/_next", "/api", "/favicon", "/logo", "/images", "/landing-pages"];

interface SessionPayload {
  userId: string;
  email: string;
  issuedAt: number;
}

/** base64url → bytes. Proxy runs on the Edge runtime, so Web Crypto + atob. */
function b64urlToBytes(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Verify the cookie the same way lib/session.ts signs it:
 *   <base64url(payload)>.<base64url(HMAC-SHA256(payload))>
 * Returns the payload only when the signature is valid and unexpired.
 */
async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;
  // No usable secret means nothing can be trusted. (Production throws in
  // lib/session.ts; here we simply treat the request as unauthenticated.)
  if (!secret || secret.length < 16) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const sigBytes = b64urlToBytes(signature);
  if (!sigBytes || sigBytes.length !== 32) return null;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(body)
    );
    if (!valid) return null;

    const payloadBytes = b64urlToBytes(body);
    if (!payloadBytes) return null;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as SessionPayload;

    if (!payload?.userId || !payload?.email) return null;
    const ageSeconds = (Date.now() - Number(payload.issuedAt || 0)) / 1000;
    if (!Number.isFinite(ageSeconds) || ageSeconds < 0 || ageSeconds > MAX_AGE_SECONDS) return null;

    return payload;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Never touch assets or the API surface.
  if (ALWAYS_PASS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get(COOKIE_NAME)?.value);
  const signedIn = Boolean(session);

  // Signed-in users do not need the sign-in screen — send them to their workspace.
  // The owner (OWNER_EMAIL) gets the agency dashboard; everyone else their portal.
  if (signedIn && (pathname === "/login" || pathname.startsWith("/auth/"))) {
    const owner = (process.env.OWNER_EMAIL || "").trim().toLowerCase();
    const isOwner = Boolean(owner) && session!.email === owner;
    return NextResponse.redirect(new URL(isOwner ? "/dashboard" : "/portal", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Protected from here on.
  if (!signedIn) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|css|js|map|woff|woff2|ttf|otf|txt|xml)$).*)",
  ],
};