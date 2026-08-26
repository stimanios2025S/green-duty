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
  signup: (data: SignupData) => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check for an existing session cookie
  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.ok ? r.json() : { user: null })
      .then(d => {
        if (d.user) setUser(d.user);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  /** Create account → server creates user (verified) + sets session cookie */
  const signup = useCallback(async (data: SignupData) => {
    const { res, json } = await postJson("/api/auth/signup", data);
    if (!res.ok) throw new Error((json.error as string) || "Signup failed");
    // User is already logged in via session cookie
    if (json.user) setUser(json.user as User);
  }, []);

  /** Login — session cookie set by server */
  const login = useCallback(async (email: string, password: string) => {
    const { res, json } = await postJson("/api/auth/login", { email, password });
    if (!res.ok) {
      return { ok: false, error: (json.error as string) || "Login failed." };
    }
    setUser(json.user as User | null);
    return { ok: true };
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      return { ...prev, ...patch };
    });
  }, []);

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
