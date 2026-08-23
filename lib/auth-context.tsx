"use client";
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { AccountType, User } from "@/types";

export interface SignupData {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
  businessName?: string;
  businessAddress?: string;
  idType?: "identity_card" | "drivers_license" | "passport";
  idNumber?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /** Email awaiting verification (set right after signup) */
  pendingEmail: string | null;
  /** "email" = real email sent · "console" = no API key · "failed" = delivery failed (fallback shown) */
  verifyMode: "email" | "console" | "failed" | null;
  /** Shown only when delivery failed, so the user can still activate */
  fallbackCode: string | null;
  signup: (data: SignupData) => Promise<void>;
  verify: (code: string) => Promise<{ ok: boolean; error?: string }>;
  resendCode: () => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; needsVerification?: boolean }>;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: Record<string, unknown> = {};
  try { json = await res.json() as Record<string, unknown>; } catch {}
  return { res, json };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("gd_user");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<User> | null;
      return parsed?.id ? (parsed as User) : null;
    } catch {
      return null;
    }
  });
  const [pendingEmail, setPendingEmail] = useState<string | null>(() => typeof window !== "undefined" ? localStorage.getItem("gd_pending_email") : null);
  const [verifyMode, setVerifyMode] = useState<"email" | "console" | "failed" | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("gd_verify_mode") as "email" | "console" | "failed" | null;
  });
  const [fallbackCode, setFallbackCode] = useState<string | null>(() => typeof window !== "undefined" ? localStorage.getItem("gd_fallback_code") : null);
  const [isLoading] = useState(false);

  const persist = useCallback((u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem("gd_user", JSON.stringify(u));
      else localStorage.removeItem("gd_user");
    } catch {}
  }, []);

  /** Step 1 — create account → server hashes password, stores in SQLite, emails the code */
  const signup = useCallback(async (data: SignupData) => {
    const { res, json } = await postJson("/api/auth/signup", data);
    if (!res.ok) throw new Error((json.error as string) || "Signup failed");
    setPendingEmail(json.email as string);
    setVerifyMode(json.mode as "email" | "console" | "failed");
    setFallbackCode((json.fallbackCode as string) || null);
    try {
      localStorage.setItem("gd_pending_email", json.email as string);
      localStorage.setItem("gd_verify_mode", (json.mode as string) || "email");
      if (json.fallbackCode) localStorage.setItem("gd_fallback_code", json.fallbackCode as string);
      else localStorage.removeItem("gd_fallback_code");
    } catch {}
  }, []);

  /** Step 2 — validate the code the user received by email */
  const verify = useCallback(async (code: string) => {
    if (!pendingEmail) return { ok: false, error: "No pending verification." };
    const { res, json } = await postJson("/api/auth/verify", { email: pendingEmail, code });
    if (!res.ok) return { ok: false, error: (json.error as string) || "Verification failed." };
    persist(json.user as User | null);
    setPendingEmail(null);
    setVerifyMode(null);
    setFallbackCode(null);
    try {
      localStorage.removeItem("gd_pending_email");
      localStorage.removeItem("gd_verify_mode");
      localStorage.removeItem("gd_fallback_code");
    } catch {}
    return { ok: true };
  }, [pendingEmail, persist]);

  const resendCode = useCallback(async () => {
    if (!pendingEmail) return { ok: false, error: "No pending verification." };
    const { res, json } = await postJson("/api/auth/resend", { email: pendingEmail });
    if (!res.ok) return { ok: false, error: (json.error as string) || "Failed to resend." };
    setVerifyMode(json.mode as "email" | "console" | "failed");
    setFallbackCode((json.fallbackCode as string) || null);
    try {
      localStorage.setItem("gd_verify_mode", (json.mode as string) || "email");
      if (json.fallbackCode) localStorage.setItem("gd_fallback_code", json.fallbackCode as string);
      else localStorage.removeItem("gd_fallback_code");
    } catch {}
    return { ok: true };
  }, [pendingEmail]);

  /** Real login — checks hashed password against SQLite, rejects unverified accounts */
  const login = useCallback(async (email: string, password: string) => {
    const { res, json } = await postJson("/api/auth/login", { email, password });
    if (!res.ok) {
      if (json.needsVerification as boolean) {
        setPendingEmail(json.email as string);
        try { localStorage.setItem("gd_pending_email", json.email as string); } catch {}
        return { ok: false, error: json.error as string, needsVerification: true };
      }
      return { ok: false, error: (json.error as string) || "Login failed." };
    }
    persist(json.user as User | null);
    return { ok: true };
  }, [persist]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try { localStorage.setItem("gd_user", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const logout = useCallback(() => persist(null), [persist]);

  return (
    <AuthContext.Provider value={{ user, isLoading, pendingEmail, verifyMode, fallbackCode, signup, verify, resendCode, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
