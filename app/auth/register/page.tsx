"use client";
import { useState, FormEvent, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { safeNextPath, withNext } from "@/lib/utils";
import type { AccountType } from "@/types";
import {
  ArrowLeft, ArrowRight, Building2, Handshake, User as UserIcon,
  BadgeCheck, MapPin, Check
} from "lucide-react";

const ROLE_OPTIONS: {
  value: AccountType;
  icon: typeof UserIcon;
  title: string;
  desc: string;
  needs: string;
}[] = [
  {
    value: "client",
    icon: Building2,
    title: "Client / Company",
    desc: "Custom ERP, MES, CRM, web and mobile applications built around your processes, language and terminology.",
    needs: "Commission software",
  },
  {
    value: "partner",
    icon: Handshake,
    title: "Partner",
    desc: "Technology, integration, logistics or reseller partners who work with us on client projects.",
    needs: "Collaborate & resell",
  },
];

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gd-deepest"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>}>
      <RegisterInner />
    </Suspense>
  );
}

function RegisterInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { signup } = useAuth();

  const initialType = (params.get("type") as AccountType | null) || null;
  const [accountType, setAccountType] = useState<AccountType | null>(initialType);
  const [name, setName] = useState(params.get("name") || "");
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!accountType) { setError("Please select an account type."); return; }
    if (!name.trim() || !email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }

    setLoading(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        accountType,
        businessName: businessName.trim(),
        businessAddress: businessAddress.trim(),
      });
      router.push(withNext("/auth/verify", safeNextPath(params.get("next"))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gd-deepest">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gd-text-secondary hover:text-gd-text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gd-card ring-1 ring-gd-border-strong">
            <Image src="/logo.png" alt="GreenDuty" fill sizes="32px" className="object-contain p-0.5" />
          </div>
          <span className="text-sm font-bold tracking-tight gradient-text">GreenDuty</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pb-16">
        {/* Stepper */}
        <div className="mb-10 flex items-center justify-center gap-3">
          {[1, 2].map(step => (
            <div key={step} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step === 1 ? "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse" : "bg-gd-card text-gd-text-secondary border border-gd-border"
              }`}>{step}</div>
              <span className={`text-sm ${step === 1 ? "text-gd-text-primary font-medium" : "text-gd-text-muted"}`}>
                {step === 1 ? "Choose account type" : "Complete details"}
              </span>
              {step === 1 && <div className="h-px w-16 bg-gd-border-strong" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: role selection */}
          <div>
            <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">How will you work with us?</h1>
            <p className="mt-2 text-sm text-gd-text-secondary">Choose the account type that fits you — you can add company details in the next step.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {ROLE_OPTIONS.map(opt => {
                const active = accountType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAccountType(opt.value)}
                    className={`group relative rounded-2xl border p-5 text-left transition-all ${
                      active
                        ? "border-gd-accent-500/50 bg-gd-accent-500/5 glow-ring"
                        : "border-gd-border bg-gd-card hover:border-gd-border-strong hover:bg-gd-elevated"
                    }`}
                  >
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gd-accent-500 text-gd-text-inverse">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                        active ? "bg-gd-accent-500/15 text-gd-accent-400 border-gd-accent-500/20" : "bg-gd-elevated text-gd-text-secondary border-gd-border"
                      }`}>
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-semibold ${active ? "text-gd-accent-400" : "text-gd-text-primary"}`}>{opt.title}</p>
                        <p className="text-xs text-gd-text-muted">{opt.needs}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gd-text-secondary leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: details */}
          {accountType && (
            <div className="space-y-6 rounded-2xl border border-gd-border bg-gd-card p-6">
              <h2 className="text-lg font-semibold text-gd-text-primary flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-gd-accent-400" /> Your details
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Full name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="mt-1.5 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="mt-1.5 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" className="mt-1.5 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>

              {/* Company details — optional for both account types */}
              <div className="space-y-4 rounded-xl border border-gd-accent-500/15 bg-gd-accent-500/3 p-4">
                <p className="text-sm font-medium text-gd-accent-400 flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Company details
                  <span className="text-[11px] font-normal text-gd-text-muted">optional</span>
                </p>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Company name</label>
                  <input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Tlemcen Foods SPA" className="mt-1.5 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Company address</label>
                  <input value={businessAddress} onChange={e => setBusinessAddress(e.target.value)} placeholder="Street, city, country" className="mt-1.5 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gd-text-inverse/40 border-t-gd-text-inverse" />
                ) : (
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
