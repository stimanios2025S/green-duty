"use client";
import { useState, FormEvent, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { AccountType } from "@/types";
import {
  ArrowRight, Lock, Mail, User as UserIcon,
  Building2, ShoppingCart, Truck, Check, Sprout
} from "lucide-react";

import dynamic from "next/dynamic";

const LoginBg = dynamic(() => import("@/components/auth/SylvaLoginBg"), { ssr: false });

const ACCOUNT_TYPES: { value: AccountType; icon: typeof UserIcon; label: string; hint: string }[] = [
  { value: "guest", icon: UserIcon, label: "Guest / Citizen", hint: "Report, learn, donate" },
  { value: "buyer", icon: ShoppingCart, label: "Buyer", hint: "Shop verified goods" },
  { value: "seller", icon: Building2, label: "Seller", hint: "Sell on the marketplace" },
  { value: "driver", icon: Truck, label: "Driver", hint: "Deliver orders" },
  { value: "business", icon: Building2, label: "Business", hint: "B2B + CSR" },
  { value: "farmer", icon: Sprout, label: "Farmer", hint: "Track crops & inventory" },
];

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); return; }
        if (!accountType) { setError("Please choose an account type."); return; }
        await signup({
          name: name.trim(),
          email: email.trim(),
          password,
          accountType,
        });
        router.push("/dashboard");
      } else {
        const result = await login(email, password);
        if (result.ok) {
          router.push("/dashboard");
        } else {
          setError(result.error || "Login failed.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflow: "hidden", background: "#060608" }}>

      {/* ── Full-viewport Three.js background ── */}
      <Suspense fallback={null}>
        <LoginBg />
      </Suspense>

      {/* ── Gradient overlays for depth ── */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(6,6,8,0.2) 0%, rgba(6,6,8,0.05) 35%, rgba(6,6,8,0.4) 75%, #060608 100%)",
      }} />
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "radial-gradient(ellipse at 30% 40%, rgba(132,204,22,0.05) 0%, transparent 55%)",
      }} />

      {/* ── Centered content ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", padding: "2rem 1rem",
      }}>

        {/* ── Logo + brand ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginBottom: "2.5rem" }}>
          <div style={{
            width: "5rem", height: "5rem", position: "relative",
            borderRadius: "1.25rem", overflow: "hidden",
            boxShadow: "0 0 40px rgba(132,204,22,0.15), 0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <Image src="/logo.png" alt="GreenDuty" fill sizes="80px" style={{ objectFit: "contain", padding: "0.25rem" }} priority />
          </div>
          <span style={{
            fontFamily: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "2rem", fontWeight: 300, letterSpacing: "-0.03em", color: "#f4f4f5",
          }}>
            Green<span style={{ color: "#84cc16" }}>Duty</span>
          </span>
        </div>

        {/* ── Glassmorphic card ── */}
        <div style={{
          width: "100%", maxWidth: "28rem",
          background: "rgba(19, 19, 24, 0.55)",
          backdropFilter: "blur(24px) saturate(1.2)",
          WebkitBackdropFilter: "blur(24px) saturate(1.2)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1.5rem",
          padding: "2.5rem 2rem 2rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.04) inset",
        }}>

          {/* ── Heading ── */}
          <h2 style={{
            fontFamily: "'Lexend', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "1.625rem", fontWeight: 300, letterSpacing: "-0.02em", color: "#f4f4f5", marginBottom: "0.375rem",
          }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#71717a", marginBottom: "1.5rem", lineHeight: 1.6 }}>
            {mode === "login"
              ? "Sign in to continue to your portal."
              : "Choose your path — or continue with a quick login."}
          </p>

          {/* ── Login / Signup toggle ── */}
          <div style={{
            display: "flex", borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.03)",
            padding: "3px", marginBottom: "1.5rem",
          }}>
            {(["login", "signup"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                style={{
                  flex: 1, borderRadius: "0.625rem", padding: "0.5rem 0",
                  fontSize: "0.8125rem", fontWeight: 500, border: "none", cursor: "pointer",
                  transition: "all 0.25s ease",
                  fontFamily: "'Lexend', -apple-system, sans-serif",
                  ...(mode === m
                    ? { background: "linear-gradient(135deg, #84cc16, #65a30d)", color: "#060608", boxShadow: "0 2px 12px rgba(132,204,22,0.25)" }
                    : { background: "transparent", color: "#71717a" }),
                }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Account type grid (signup only) */}
            {mode === "signup" && (
              <div>
                <p style={{
                  fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.08em", color: "#71717a", marginBottom: "0.5rem",
                }}>
                  I am creating an account as
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {ACCOUNT_TYPES.map(t => {
                    const active = accountType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setAccountType(t.value)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.625rem",
                          borderRadius: "0.75rem", padding: "0.625rem 0.75rem",
                          textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
                          border: `1px solid ${active ? "rgba(132,204,22,0.3)" : "rgba(255,255,255,0.06)"}`,
                          background: active ? "rgba(132,204,22,0.08)" : "rgba(255,255,255,0.02)",
                          position: "relative",
                        }}
                      >
                        <span style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "2rem", height: "2rem", borderRadius: "0.5rem", flexShrink: 0,
                          border: `1px solid ${active ? "rgba(132,204,22,0.2)" : "rgba(255,255,255,0.06)"}`,
                          background: active ? "rgba(132,204,22,0.1)" : "rgba(255,255,255,0.03)",
                          color: active ? "#84cc16" : "#71717a",
                        }}>
                          <t.icon style={{ width: "1rem", height: "1rem" }} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={{
                            display: "block", fontSize: "0.6875rem", fontWeight: 600,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            color: active ? "#84cc16" : "#f4f4f5",
                            fontFamily: "'Lexend', -apple-system, sans-serif",
                          }}>{t.label}</span>
                          <span style={{ display: "block", fontSize: "0.625rem", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.hint}
                          </span>
                        </span>
                        {active && (
                          <Check style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", width: "0.875rem", height: "0.875rem", color: "#84cc16" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                {accountType === "business" && (
                  <p style={{ fontSize: "0.6875rem", color: "#71717a", marginTop: "0.5rem" }}>
                    🏢 You can complete your business profile after signup.
                  </p>
                )}
              </div>
            )}

            {/* Name (signup only) */}
            {mode === "signup" && (
              <div style={{ position: "relative" }}>
                <UserIcon style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#71717a", pointerEvents: "none" }} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  style={{
                    width: "100%", borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.03)",
                    padding: "0.75rem 0.875rem 0.75rem 2.75rem",
                    fontSize: "0.8125rem", color: "#f4f4f5", outline: "none",
                    fontFamily: "'Lexend', -apple-system, sans-serif",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = "rgba(132,204,22,0.3)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#71717a", pointerEvents: "none" }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                style={{
                  width: "100%", borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "0.75rem 0.875rem 0.75rem 2.75rem",
                  fontSize: "0.8125rem", color: "#f4f4f5", outline: "none",
                  fontFamily: "'Lexend', -apple-system, sans-serif",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(132,204,22,0.3)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              />
            </div>

            {/* Password */}
            <div style={{ position: "relative" }}>
              <Lock style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "1rem", height: "1rem", color: "#71717a", pointerEvents: "none" }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: "100%", borderRadius: "0.75rem",
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "0.75rem 0.875rem 0.75rem 2.75rem",
                  fontSize: "0.8125rem", color: "#f4f4f5", outline: "none",
                  fontFamily: "'Lexend', -apple-system, sans-serif",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(132,204,22,0.3)")}
                onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                borderRadius: "0.75rem", padding: "0.625rem 1rem",
                border: "1px solid rgba(239,68,68,0.15)",
                background: "rgba(239,68,68,0.05)",
                fontSize: "0.75rem", color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                width: "100%", borderRadius: "0.75rem",
                border: "none", cursor: "pointer",
                padding: "0.75rem 0",
                fontSize: "0.8125rem", fontWeight: 600,
                fontFamily: "'Lexend', -apple-system, sans-serif",
                background: "linear-gradient(135deg, #84cc16, #65a30d)",
                color: "#060608",
                boxShadow: "0 4px 20px rgba(132,204,22,0.2)",
                transition: "all 0.25s ease",
                opacity: loading ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 6px 28px rgba(132,204,22,0.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(132,204,22,0.2)"; }}
            >
              {loading ? (
                <span style={{
                  width: "1rem", height: "1rem", borderRadius: "50%",
                  border: "2px solid rgba(6,6,8,0.3)", borderTopColor: "#060608",
                  animation: "spin 0.6s linear infinite", display: "inline-block",
                }} />
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                </>
              )}
            </button>
          </form>

          {/* ── Terms ── */}
          <p style={{ marginTop: "1.25rem", textAlign: "center", fontSize: "0.6875rem", color: "#71717a", lineHeight: 1.6 }}>
            By continuing you agree to GreenDuty&apos;s{" "}
            <span style={{ color: "#84cc16", cursor: "pointer" }}>Terms</span> &amp;{" "}
            <span style={{ color: "#84cc16", cursor: "pointer" }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* ── Spin keyframe ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
