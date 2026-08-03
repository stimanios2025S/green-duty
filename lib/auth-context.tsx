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
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let json: any = {};
  try { json = await res.json(); } catch {}
  return { res, json };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [verifyMode, setVerifyMode] = useState<"email" | "console" | "failed" | null>(null);
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gd_user");
      if (raw) setUser(JSON.parse(raw));
      setPendingEmail(sessionStorage.getItem("gd_pending_email"));
      const mode = sessionStorage.getItem("gd_verify_mode") as "email" | "console" | "failed" | null;
      setVerifyMode(mode);
      setFallbackCode(sessionStorage.getItem("gd_fallback_code"));
    } catch {}
    setIsLoading(false);
  }, []);

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
    if (!res.ok) throw new Error(json.error || "Signup failed");
    setPendingEmail(json.email);
    setVerifyMode(json.mode);
    setFallbackCode(json.fallbackCode || null);
    try {
      sessionStorage.setItem("gd_pending_email", json.email);
      sessionStorage.setItem("gd_verify_mode", json.mode || "email");
      if (json.fallbackCode) sessionStorage.setItem("gd_fallback_code", json.fallbackCode);
      else sessionStorage.removeItem("gd_fallback_code");
    } catch {}
  }, []);

  /** Step 2 — validate the code the user received by email */
  const verify = useCallback(async (code: string) => {
    if (!pendingEmail) return { ok: false, error: "No pending verification." };
    const { res, json } = await postJson("/api/auth/verify", { email: pendingEmail, code });
    if (!res.ok) return { ok: false, error: json.error || "Verification failed." };
    persist(json.user);
    setPendingEmail(null);
    setVerifyMode(null);
    setFallbackCode(null);
    try {
      sessionStorage.removeItem("gd_pending_email");
      sessionStorage.removeItem("gd_verify_mode");
      sessionStorage.removeItem("gd_fallback_code");
    } catch {}
    return { ok: true };
  }, [pendingEmail, persist]);

  const resendCode = useCallback(async () => {
    if (!pendingEmail) return { ok: false, error: "No pending verification." };
    const { res, json } = await postJson("/api/auth/resend", { email: pendingEmail });
    if (!res.ok) return { ok: false, error: json.error || "Failed to resend." };
    setVerifyMode(json.mode);
    setFallbackCode(json.fallbackCode || null);
    try {
      sessionStorage.setItem("gd_verify_mode", json.mode || "email");
      if (json.fallbackCode) sessionStorage.setItem("gd_fallback_code", json.fallbackCode);
      else sessionStorage.removeItem("gd_fallback_code");
    } catch {}
    return { ok: true };
  }, [pendingEmail]);

  /** Real login — checks hashed password against SQLite, rejects unverified accounts */
  const login = useCallback(async (email: string, password: string) => {
    const { res, json } = await postJson("/api/auth/login", { email, password });
    if (!res.ok) {
      if (json.needsVerification) {
        setPendingEmail(json.email);
        try { sessionStorage.setItem("gd_pending_email", json.email); } catch {}
        return { ok: false, error: json.error, needsVerification: true };
      }
      return { ok: false, error: json.error || "Login failed." };
    }
    persist(json.user);
    return { ok: true };
  }, [persist]);

  const logout = useCallback(() => persist(null), [persist]);

  return (
    <AuthContext.Provider value={{ user, isLoading, pendingEmail, verifyMode, fallbackCode, signup, verify, resendCode, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
