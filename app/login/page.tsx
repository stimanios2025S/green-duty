"use client";
import { useState, useEffect, useRef, FormEvent, Suspense } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { currentNextPath, withNext } from "@/lib/utils";
import type { AccountType } from "@/types";
import {
  ArrowRight, Lock, Mail, User as UserIcon, Sparkles, Building2, Handshake, Check
} from "lucide-react";

/* The Three.js "Living Green" background — kept exactly as designed.
   Rendered as a full-viewport layer behind the sign-in card. */
const LoginBg = dynamic(() => import("@/components/auth/SylvaLoginBg"), { ssr: false });

const ACCOUNT_TYPES: { value: AccountType; icon: typeof UserIcon; label: string; hint: string }[] = [
  { value: "client", icon: Building2, label: "Client / Company", hint: "Custom software & ERP" },
  { value: "partner", icon: Handshake, label: "Partner", hint: "Collaborate & resell" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);

  // Ambient glow follows the pointer across the panel
  useEffect(() => {
    const el = glowRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const next = currentNextPath();
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); return; }
        if (!accountType) { setError("Please choose an account type."); return; }
        router.push(
          withNext(
            `/auth/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&type=${accountType}`,
            next
          )
        );
      } else {
        const result = await login(email, password);
        if (result.ok) {
          router.push(next || "/dashboard");
        } else if (result.needsVerification) {
          router.push(withNext("/auth/verify", next));
        } else {
          setError(result.error || "Login failed.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060608]">
      {/* ── Three.js background (unchanged design) ── */}
      <Suspense fallback={null}>
        <LoginBg />
      </Suspense>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: "linear-gradient(180deg, rgba(6,6,8,0.35) 0%, rgba(6,6,8,0.15) 30%, rgba(6,6,8,0.65) 72%, #060608 100%)" }} />

      {/* ── Content on top of the scene ── */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-white/10"
              style={{ boxShadow: "0 0 40px rgba(132,204,22,0.15), 0 8px 32px rgba(0,0,0,0.45)" }}>
              <Image src="/logo.png" alt="GreenDuty" fill sizes="64px" className="object-contain p-1" priority />
            </div>
            <span className="text-2xl font-bold tracking-tight gradient-text">GreenDuty</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-3 py-1 text-[11px] text-gd-accent-300">
              <Sparkles className="h-3 w-3" /> Software studio for industry
            </span>
          </div>

          {/* Glass card */}
          <div className="rounded-3xl border border-white/[0.07] p-8 shadow-2xl shadow-black/50"
            style={{ background: "rgba(19,19,24,0.55)", backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}>
            <h2 className="text-2xl font-bold text-gd-text-primary tracking-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-gd-text-secondary">
              {mode === "login"
                ? "Sign in to continue to your portal."
                : "Choose your path — or continue with a quick login."}
            </p>

            {/* Toggle */}
            <div className="mt-6 flex rounded-xl border border-gd-border bg-gd-card/60 p-1">
              {(["login", "signup"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                    mode === m ? "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse shadow-sm" : "text-gd-text-secondary hover:text-gd-text-primary"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gd-text-muted">
                    I am creating an account as
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {ACCOUNT_TYPES.map(t => {
                      const active = accountType === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setAccountType(t.value)}
                          className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all ${
                            active
                              ? "border-gd-accent-500/50 bg-gd-accent-500/10 glow-ring"
                              : "border-gd-border bg-gd-card/70 hover:border-gd-border-strong hover:bg-gd-elevated"
                          }`}
                        >
                          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${
                            active ? "bg-gd-accent-500/15 text-gd-accent-400 border-gd-accent-500/20" : "bg-gd-elevated text-gd-text-secondary border-gd-border"
                          }`}>
                            <t.icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className={`block truncate text-xs font-semibold ${active ? "text-gd-accent-400" : "text-gd-text-primary"}`}>{t.label}</span>
                            <span className="block truncate text-[10px] text-gd-text-muted">{t.hint}</span>
                          </span>
                          {active && (
                            <Check className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gd-accent-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {accountType === "client" && (
                    <p className="mt-2 text-[11px] text-gd-text-muted">
                      🏢 You can add your company name &amp; address in the next step.
                    </p>
                  )}
                  {accountType === "partner" && (
                    <p className="mt-2 text-[11px] text-gd-text-muted">
                      🤝 Partner accounts work with us on client projects — company details come next.
                    </p>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <div className="group relative">
                  <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted transition-colors group-focus-within:text-gd-accent-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-gd-border bg-gd-card/70 py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
                  />
                </div>
              )}

              <div className="group relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted transition-colors group-focus-within:text-gd-accent-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-xl border border-gd-border bg-gd-card/70 py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
                />
              </div>

              <div className="group relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted transition-colors group-focus-within:text-gd-accent-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-gd-border bg-gd-card/70 py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gd-text-inverse/40 border-t-gd-text-inverse" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Continue"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gd-text-muted">
              By continuing you agree to GreenDuty&apos;s{" "}
              <span className="text-gd-accent-400 cursor-pointer hover:underline">Terms</span> &amp;{" "}
              <span className="text-gd-accent-400 cursor-pointer hover:underline">Privacy Policy</span>.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gd-text-muted">
            © 2026 GreenDuty · Custom ERP, MES &amp; CRM for industry
          </p>
        </div>
      </div>

      <div ref={glowRef} className="pointer-events-none absolute inset-0 z-[2]" style={{ background: "radial-gradient(45rem 30rem at var(--mx, 50%) var(--my, 40%), rgba(132,204,22,0.05), transparent 65%)" }} />
    </div>
  );
}