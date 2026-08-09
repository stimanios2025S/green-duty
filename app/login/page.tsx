"use client";
import { useState, useEffect, useRef, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { AccountType } from "@/types";
import {
  ArrowRight, Lock, Mail, User as UserIcon, Sparkles, ShieldCheck, Globe, ShoppingBag,
  Building2, ShoppingCart, Truck, Check
} from "lucide-react";

const ACCOUNT_TYPES: { value: AccountType; icon: typeof UserIcon; label: string; hint: string }[] = [
  { value: "guest", icon: UserIcon, label: "Guest / Citizen", hint: "Report, learn, donate" },
  { value: "buyer", icon: ShoppingCart, label: "Buyer", hint: "Shop verified goods" },
  { value: "seller", icon: Building2, label: "Seller", hint: "Sell on the marketplace" },
  { value: "driver", icon: Truck, label: "Driver", hint: "Deliver orders" },
  { value: "business", icon: Building2, label: "Business", hint: "B2B + CSR" },
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
  const gridRef = useRef<HTMLDivElement>(null);

  // Ambient glow drift
  useEffect(() => {
    if (!gridRef.current) return;
    const el = gridRef.current;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", x + "%");
      el.style.setProperty("--my", y + "%");
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
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); return; }
        if (!accountType) { setError("Please choose an account type."); return; }
        // carry the chosen type + basic info into the detailed signup step
        router.push(`/auth/register?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&type=${accountType}`);
      } else {
        const result = await login(email, password);
        if (result.ok) {
          router.push("/dashboard");
        } else if (result.needsVerification) {
          router.push("/auth/verify");
        } else {
          setError(result.error || "Login failed.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: ShieldCheck, label: "Verified identity" },
    { icon: Globe, label: "Eco-action network" },
    { icon: ShoppingBag, label: "Agri marketplace" },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-gd-deepest">
      {/* ── Left: brand panel ── */}
      <div
        ref={gridRef}
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12"
        style={{ background: "radial-gradient(60rem 40rem at var(--mx, 30%) var(--my, 20%), rgba(212,160,23,0.08), transparent 60%), radial-gradient(40rem 30rem at 80% 90%, rgba(132,204,22,0.06), transparent 60%), #0b0b0f" }}
      >
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gd-accent-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gd-olive-500/5 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gd-card ring-1 ring-gd-border-strong">
            <Image src="/logo.png" alt="GreenDuty" fill sizes="48px" className="object-contain p-1" />
          </div>
          <span className="text-2xl font-bold tracking-tight gradient-text">GreenDuty</span>
        </div>

        <div className="relative max-w-md">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-4 py-1.5 text-sm text-gd-accent-300">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to the future of agri-tech
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gd-text-primary">
            One platform for agriculture,{" "}
            <span className="gradient-text">sustainability</span> &amp;{" "}
            <span className="gradient-text">commerce</span>.
          </h1>
          <p className="mt-5 text-lg text-gd-text-secondary leading-relaxed">
            Report pollution, buy farm goods, sponsor trees, and grow your business — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-gd-border bg-gd-card/60 px-3.5 py-2 text-xs text-gd-text-secondary">
                <f.icon className="h-3.5 w-3.5 text-gd-accent-400" /> {f.label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gd-text-muted">
          © 2026 GreenDuty Platform · Uniting Agriculture, Technology &amp; Environmental Action
        </p>
      </div>

      {/* ── Right: form panel ── */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gd-card ring-1 ring-gd-border-strong">
              <Image src="/logo.png" alt="GreenDuty" fill sizes="40px" className="object-contain p-0.5" />
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">GreenDuty</span>
          </div>

          <h2 className="text-2xl font-bold text-gd-text-primary tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-2 text-sm text-gd-text-secondary">
            {mode === "login"
              ? "Sign in to continue to your portal."
              : "Choose your path — or continue with a quick login."}
          </p>

          {/* Toggle */}
          <div className="mt-6 flex rounded-xl border border-gd-border bg-gd-card p-1">
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
              <>
                {/* Account type selection */}
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
                              : "border-gd-border bg-gd-card hover:border-gd-border-strong hover:bg-gd-elevated"
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
                  {accountType === "business" && (
                    <p className="mt-2 text-[11px] text-gd-text-muted">
                      🏢 Business accounts will be asked for their business name &amp; address in the next step.
                    </p>
                  )}
                  {(accountType === "buyer" || accountType === "driver") && (
                    <p className="mt-2 text-[11px] text-gd-text-muted">
                      🪪 {accountType === "buyer" ? "Buyer" : "Driver"} accounts will verify with an ID card, driver's license, or passport in the next step.
                    </p>
                  )}
                </div>
              </>
            )}
            {mode === "signup" && (
              <div className="group relative">
                <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted transition-colors group-focus-within:text-gd-accent-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-xl border border-gd-border bg-gd-card py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
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
                className="w-full rounded-xl border border-gd-border bg-gd-card py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
              />
            </div>
            <div className="group relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted transition-colors group-focus-within:text-gd-accent-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-gd-border bg-gd-card py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
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
            By continuing you agree to GreenDuty's{" "}
            <span className="text-gd-accent-400 cursor-pointer hover:underline">Terms</span> &amp;{" "}
            <span className="text-gd-accent-400 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
