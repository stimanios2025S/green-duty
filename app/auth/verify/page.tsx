"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { MailCheck, RefreshCw, ArrowLeft, CheckCircle2, Terminal } from "lucide-react";

const CODE_LENGTH = 6;

export default function VerifyPage() {
  const { user, pendingEmail, verifyMode, fallbackCode, verify, resendCode } = useAuth();
  const router = useRouter();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already logged in, go straight to the dashboard (no loop)
  useEffect(() => {
    if (user) router.replace("/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (idx: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    const next = [...digits];
    next[idx] = cleaned.slice(-1);
    setDigits(next);
    setError("");
    if (cleaned && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== CODE_LENGTH) { setError("Please enter the 6-digit code."); return; }
    setLoading(true);
    setError("");
    try {
      const result = await verify(code);
      if (result.ok) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Verification failed.");
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const result = await resendCode();
      if (!result.ok) setError(result.error || "Failed to resend.");
      setCooldown(30);
    } finally {
      setResending(false);
    }
  };

  // No pending verification — show a friendly screen instead of looping to register
  if (!pendingEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gd-deepest px-6 py-12">
        <div className="relative w-full max-w-md rounded-2xl border border-gd-border-soft bg-gd-card p-8 text-center shadow-2xl shadow-black/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gd-accent-500/10 border border-gd-accent-500/20">
            <MailCheck className="h-8 w-8 text-gd-accent-400" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-gd-text-primary">Nothing to verify</h1>
          <p className="mt-2 text-sm text-gd-text-secondary leading-relaxed">
            We don't have a pending verification for this device.
            If you already verified, try signing in. If not, create an account first.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/login" className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-2.5 text-sm font-semibold text-gd-text-inverse text-center hover:brightness-110 transition-all">
              Go to sign in
            </Link>
            <Link href="/auth/register" className="rounded-xl border border-gd-border py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors text-center">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gd-deepest px-6 py-12">
      <div className="pointer-events-none fixed -top-24 right-0 h-96 w-96 rounded-full bg-gd-accent-500/5 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 left-0 h-72 w-72 rounded-full bg-gd-olive-500/5 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gd-card ring-1 ring-gd-border-strong">
            <Image src="/logo.png" alt="GreenDuty" fill sizes="40px" className="object-contain p-0.5" />
          </div>
          <span className="text-xl font-bold tracking-tight gradient-text">GreenDuty</span>
        </div>

        <div className="rounded-2xl border border-gd-border-soft bg-gd-card p-8 shadow-2xl shadow-black/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gd-accent-500/10 border border-gd-accent-500/20">
            <MailCheck className="h-8 w-8 text-gd-accent-400" />
          </div>

          <h1 className="mt-5 text-center text-2xl font-bold text-gd-text-primary tracking-tight">
            Verify your email
          </h1>
          <p className="mt-2 text-center text-sm text-gd-text-secondary leading-relaxed">
            We sent a <span className="font-semibold text-gd-text-primary">6-digit code</span> to{" "}
            <span className="font-semibold text-gd-accent-400">{pendingEmail || "your email"}</span>.
            <br />
            Enter it below to activate your account.
          </p>

          {/* Console-mode notice (only shown when no email API key is configured) */}
          {verifyMode === "console" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-gd-accent-500/20 bg-gd-accent-500/5 p-3">
              <Terminal className="mt-0.5 h-4 w-4 flex-shrink-0 text-gd-accent-400" />
              <p className="text-[11px] text-gd-text-secondary leading-relaxed">
                Email delivery isn't configured yet. The code was printed to your{" "}
                <span className="font-mono text-gd-accent-400">server terminal</span> — add a{" "}
                <span className="font-mono">RESEND_API_KEY</span> to{" "}
                <span className="font-mono">.env.local</span> to send real emails.
              </p>
            </div>
          )}

          {/* Delivery-failed notice — temporary fallback so users can still activate */}
          {verifyMode === "failed" && fallbackCode && (
            <div className="mt-4 rounded-xl border border-gd-warning/30 bg-gd-warning/5 p-3">
              <p className="text-[11px] font-semibold text-gd-warning">
                ⚠️ The verification email couldn't be delivered right now.
              </p>
              <p className="mt-1 text-[11px] text-gd-text-secondary leading-relaxed">
                Your account was created. Use this temporary code to activate it:
              </p>
              <p className="mt-2 text-center font-mono text-2xl font-bold tracking-[0.35em] text-gd-warning">
                {fallbackCode}
              </p>
              <p className="mt-2 text-[10px] text-gd-text-muted leading-relaxed">
                This happens when the sender isn't verified yet. The platform owner should verify a domain in Resend (Domains → Add → DNS records) so codes go straight to every inbox.
              </p>
            </div>
          )}

          {/* OTP inputs */}
          <form onSubmit={handleSubmit} className="mt-6">
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
                  onKeyDown={e => handleKeyDown(i, e)}
                  maxLength={1}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-12 rounded-xl border border-gd-border bg-gd-elevated text-center text-xl font-bold text-gd-text-primary outline-none transition-all focus:border-gd-accent-500/60 focus:ring-2 focus:ring-gd-accent-500/20"
                />
              ))}
            </div>

            {error && (
              <p className="mt-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gd-text-inverse/40 border-t-gd-text-inverse" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Activate Account
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs">
            <span className="text-gd-text-muted">Didn't get the code?</span>
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="inline-flex items-center gap-1 font-medium text-gd-accent-400 hover:text-gd-accent-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>

          <div className="mt-6 border-t border-gd-border pt-4 text-center">
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-xs text-gd-text-muted hover:text-gd-text-secondary transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to registration
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-gd-text-muted">
          Protected by GreenDuty's verification system · Your details stay private
        </p>
      </div>
    </div>
  );
}
