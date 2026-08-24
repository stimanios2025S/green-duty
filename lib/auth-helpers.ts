import { NextRequest } from "next/server";
import { randomUUID, randomInt } from "crypto";
import type { DbUser } from "./db";

/**
 * Extract userId from query parameter (matching existing API pattern).
 * The client stores the user in localStorage and passes userId as a query param.
 */
export async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  return searchParams.get("userId");
}

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
 * that the client stores in localStorage and uses throughout the app.
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
