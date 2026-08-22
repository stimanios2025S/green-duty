import type { DbUser } from "./db";
import type { User } from "@/types";

type DbUserWithExtras = DbUser & {
  avatar_media?: string | null;
  username?: string | null;
  bio?: string | null;
  emoji?: string | null;
  gradient?: string | null;
};

/**
 * Serialize a DB row into the public User shape (never exposes password/code).
 */
export function publicUser(u: DbUser): User {
  const row = u as DbUserWithExtras;
  const user: User = {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: row.avatar_media || "/logo.png",
    role: u.account_type as User["role"],
    accountType: u.account_type as User["accountType"],
    points: u.points,
    badges: ["New Member"],
    joinedAt: u.created_at,
    username: row.username || u.name.toLowerCase().replace(/\s+/g, "."),
    bio: row.bio || "",
    emoji: row.emoji || "",
    gradient: row.gradient || "",
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
