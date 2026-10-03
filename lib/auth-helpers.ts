import type { DbUser } from "./db";
import type { User } from "@/types";
import { isOwnerEmail } from "./owner-auth";

/**
 * Serialize a DB row into the public User shape (never exposes password/code).
 */
export function publicUser(u: DbUser): User {
  const user: User = {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: (u as any).avatar_media || "/logo.png",
    role: u.account_type as User["role"],
    accountType: u.account_type as User["accountType"],
    points: u.points,
    badges: ["New Member"],
    joinedAt: u.created_at,
    username: (u as any).username || u.name.toLowerCase().replace(/\s+/g, "."),
    bio: (u as any).bio || "",
    emoji: (u as any).emoji || "",
    gradient: (u as any).gradient || "",
    // Lets the UI route the agency owner to the business dashboard. This is
    // only a hint for which portal to render — every owner API route
    // re-checks the email server-side via `requireOwner`.
    isOwner: isOwnerEmail(u.email),
  };
  if (u.business_name) {
    user.businessProfile = {
      businessName: u.business_name,
      businessAddress: u.business_address || "",
    };
  }
  // Identity documents are no longer collected at signup, so they are not
  // surfaced on the user object. The `id_type` / `id_number` columns remain
  // in the database for accounts created before the agency pivot.
  return user;
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
