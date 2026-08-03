import type { DbUser } from "./db";
import type { User } from "@/types";

/**
 * Serialize a DB row into the public User shape (never exposes password/code).
 */
export function publicUser(u: DbUser): User {
  const user: User = {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: "/logo.png",
    role: u.account_type as User["role"],
    accountType: u.account_type as User["accountType"],
    points: u.points,
    badges: ["New Member"],
    joinedAt: u.created_at,
  };
  if (u.business_name) {
    user.businessProfile = {
      businessName: u.business_name,
      businessAddress: u.business_address || "",
    };
  }
  if (u.id_type && u.id_number) {
    user.idDocument = {
      type: u.id_type as "identity_card" | "drivers_license" | "passport",
      number: u.id_number,
    };
  }
  return user;
}

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateId(): string {
  return "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
