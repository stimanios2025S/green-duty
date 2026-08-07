"use client";
import { useRef, useState, useEffect } from "react";
import anime from "animejs";
import { X, User, Phone, Mail, MessageSquare, Loader2, CheckCircle2, CalendarCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface CleanupJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined?: () => void;
  event: { id: string; title: string; date?: string; rewardPoints?: number } | null;
}

/**
 * Professional cleanup participation form.
 * The viewer fills their first name, family name and contacts —
 * the signup is saved and the organizer is notified by email instantly.
 */
export function CleanupJoinModal({ isOpen, onClose, onJoined, event }: CleanupJoinModalProps) {
  const { user } = useAuth();
  const boxRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    phone: "",
    email: user?.email || "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setForm({
        firstName: user?.name?.split(" ")[0] || "",
        lastName: user?.name?.split(" ").slice(1).join(" ") || "",
        phone: "",
        email: user?.email || "",
        message: "",
      });
      setDone(false);
      setError("");
      if (boxRef.current) {
        anime({ targets: boxRef.current, opacity: [0, 1], translateY: [24, 0], scale: [0.97, 1], duration: 320, easing: "easeOutCubic" });
      }
    }
  }, [isOpen, user]);

  if (!isOpen || !event) return null;

  const submit = async () => {
    setError("");
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Please enter your first name and family name.");
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError("Add a phone number or an email so the organizer can reach you.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/cleanup/participate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          userId: user?.id || null,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed");
      }
      setDone(true);
      window.dispatchEvent(new CustomEvent("gd:cleanup-updated"));
      setTimeout(() => { onJoined?.(); }, 1600);
    } catch (err: any) {
      setError(err?.message || "Couldn't submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div ref={boxRef} className="w-full max-w-md rounded-2xl bg-gd-card border border-gd-border-soft shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
          {done ? (
            <div className="px-6 py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gd-success/10 border border-gd-success/25">
                <CheckCircle2 className="h-9 w-9 text-gd-success" />
              </div>
              <p className="mt-4 text-xl font-bold text-gd-text-primary">You&apos;re in! 🧹</p>
              <p className="mt-1 text-sm text-gd-text-muted">Your participation for <span className="text-gd-text-secondary font-medium">{event.title}</span> was saved.</p>
              <p className="mx-auto mt-4 max-w-xs rounded-xl border border-gd-accent-500/20 bg-gd-accent-500/5 px-4 py-2.5 text-xs text-gd-text-secondary">
                📧 The organizer has been notified — they&apos;ll confirm the meeting point with you.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gd-border px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gd-olive-500/10 border border-gd-olive-500/20 text-gd-olive-500">
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gd-text-primary">Join the cleanup</h3>
                    <p className="text-xs text-gd-text-muted truncate max-w-[220px]">{event.title}</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3.5 px-6 py-5">
                <p className="text-xs text-gd-text-secondary leading-relaxed">
                  Fill in your details below — the organizer will receive your participation instantly by email and contact you to confirm.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gd-text-secondary mb-1.5">
                      <User className="h-3 w-3 text-gd-accent-400" /> First name *
                    </label>
                    <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="First name" className={inputCls} />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gd-text-secondary mb-1.5">
                      <User className="h-3 w-3 text-gd-accent-400" /> Family name *
                    </label>
                    <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Family name" className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gd-text-secondary mb-1.5">
                    <Phone className="h-3 w-3 text-gd-accent-400" /> Phone number
                  </label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+213 555 12 34 56" className={inputCls} />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gd-text-secondary mb-1.5">
                    <Mail className="h-3 w-3 text-gd-accent-400" /> Email address
                  </label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="you@example.com" className={inputCls} />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gd-text-secondary mb-1.5">
                    <MessageSquare className="h-3 w-3 text-gd-accent-400" /> Message (optional)
                  </label>
                  <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={2} placeholder="Anything the organizer should know?" className={cn(inputCls, "resize-none")} />
                </div>

                {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
              </div>

              <div className="flex gap-3 border-t border-gd-border px-6 py-4">
                <button onClick={onClose} className="rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-olive-600 to-gd-olive-500 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</> : <><CalendarCheck className="h-4 w-4" /> Confirm participation</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
