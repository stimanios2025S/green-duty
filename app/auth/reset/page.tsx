"use client";
import { useState, useRef, useEffect, FormEvent, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Mail, Lock, KeyRound, CheckCircle2 } from "lucide-react";

/**
 * Password reset — the standard two-step recovery flow.
 *   Step 1: enter the account email → a 6-digit code is mailed.
 *   Step 2: enter the code + a new password → signed in.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gd-deepest"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>}>
      <ResetInner />
    </Suspense>
  );
}

const CODE_LENGTH = 6;

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [email, setEmail] = useState(params.get("email") || "");
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    const next = [...digits];
    next[idx] = cleaned.slice(-1);
    setDigits(next);
    setError("");
    if (cleaned && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!text) return;
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError("");
    inputRefs.current[Math.min(text.length, CODE_LENGTH - 1)]?.focus();
  };

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      setNotice(data?.message || "If that address has an account, a reset code is on its way.");
      setStep("confirm");
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) { setError("Please enter the 6-digit code."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data?.error || "Could not reset the password."); return; }
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060608]">
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60rem 40rem at 25% 20%, rgba(132,204,22,0.06), transparent 60%), radial-gradient(40rem 30rem at 80% 90%, rgba(212,160,23,0.05), transparent 60%)" }} />
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ boxShadow: "0 0 40px rgba(132,204,22,0.15), 0 8px 32px rgba(0,0,0,0.45)" }}>
              <Image src="/logo.png" alt="GreenDuty" fill sizes="64px" className="object-contain p-1" priority />
            </div>
            <span className="text-2xl font-bold tracking-tight gradient-text">GreenDuty</span>
          </div>

          <div className="rounded-3xl border border-white/[0.07] p-8 shadow-2xl shadow-black/50" style={{ background: "rgba(19,19,24,0.55)", backdropFilter: "blur(24px) saturate(1.2)", WebkitBackdropFilter: "blur(24px) saturate(1.2)" }}>
            <h1 className="text-2xl font-bold tracking-tight text-gd-text-primary">
              {step === "request" ? "Reset your password" : "Enter your reset code"}
            </h1>
            <p className="mt-2 text-sm text-gd-text-secondary">
              {step === "request"
                ? "We'll email you a 6-digit code to set a new password."
                : "Enter the code we emailed you, then choose a new password."}
            </p>

            {step === "request" ? (
              <form onSubmit={requestCode} className="mt-6 space-y-4">
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
                {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-gd-text-inverse/40 border-t-gd-text-inverse" /> : (<>Send reset code <ArrowRight className="h-4 w-4" /></>)}
                </button>
              </form>
            ) : (
              <form onSubmit={submitReset} className="mt-6 space-y-4">
                {notice && (
                  <div className="flex items-start gap-2 rounded-xl border border-gd-accent-500/20 bg-gd-accent-500/5 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gd-accent-400" />
                    <p className="text-[11px] leading-relaxed text-gd-text-secondary">{notice}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gd-text-muted">Reset code</p>
                  <div className="flex justify-between gap-2" onPaste={handlePaste}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoFocus={i === 0}
                        value={d}
                        onChange={e => setDigit(i, e.target.value)}
                        onKeyDown={e => { if (e.key === "Backspace" && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus(); }}
                        maxLength={1}
                        aria-label={`Digit ${i + 1}`}
                        className="h-14 w-12 rounded-xl border border-gd-border bg-gd-elevated text-center text-xl font-bold text-gd-text-primary outline-none transition-all focus:border-gd-accent-500/60 focus:ring-2 focus:ring-gd-accent-500/20"
                      />
                    ))}
                  </div>
                </div>

                <div className="group relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted transition-colors group-focus-within:text-gd-accent-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-xl border border-gd-border bg-gd-card/70 py-3 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20"
                  />
                </div>

                {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-gd-text-inverse/40 border-t-gd-text-inverse" /> : (<><KeyRound className="h-4 w-4" /> Set new password</>)}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("request"); setError(""); }}
                  className="w-full text-center text-[11px] text-gd-text-muted hover:text-gd-text-secondary transition-colors"
                >
                  Use a different email
                </button>
              </form>
            )}

            <div className="mt-6 border-t border-gd-border pt-4 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-gd-text-muted hover:text-gd-text-secondary transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gd-text-muted">© 2026 GreenDuty · Custom ERP, MES &amp; CRM for industry</p>
        </div>
      </div>
    </div>
  );
}