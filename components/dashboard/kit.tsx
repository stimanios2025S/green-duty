"use client";
import { ReactNode, useEffect } from "react";
import { X, Search, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
 * Owner-dashboard UI kit.
 * Small, shared building blocks so every agency page looks and behaves the
 * same. All styling goes through the existing gd-* design tokens.
 * ──────────────────────────────────────────────────────────────────────── */

/* ── Modal ── */
export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div
        className={cn(
          "relative w-full rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl",
          wide ? "max-w-3xl" : "max-w-lg"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gd-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-gd-text-primary">{title}</h2>
            {subtitle && <p className="mt-1 text-xs text-gd-text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gd-text-muted transition-colors hover:bg-gd-elevated hover:text-gd-text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Form fields ── */
const controlClass =
  "w-full rounded-xl border border-gd-border bg-gd-base px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none transition-colors focus:border-gd-accent-500/50 focus:ring-1 focus:ring-gd-accent-500/20";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gd-text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-gd-text-muted">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-[96px] resize-y", props.className)} />;
}

export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  // No `appearance-none` here on purpose: it would strip the native dropdown
  // arrow and leave the control looking like plain text.
  return (
    <select {...props} className={cn(controlClass, "bg-gd-base", props.className)}>
      {children}
    </select>
  );
}

/* ── Buttons ── */
export function PrimaryButton({
  children,
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary transition-colors hover:border-gd-border-strong hover:bg-gd-elevated hover:text-gd-text-primary disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, "pl-10")}
      />
    </div>
  );
}

/* ── Feedback ── */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gd-border-soft bg-gd-card/40 px-6 py-14 text-center">
      <p className="text-sm font-medium text-gd-text-primary">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-gd-text-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">
      {children}
    </p>
  );
}

export function InlineSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-gd-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-gd-overlay", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ── Confirm dialog ── */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gd-border-soft bg-gd-card p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gd-danger/20 bg-gd-danger/10 text-gd-danger">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold text-gd-text-primary">{title}</h3>
            <p className="mt-1 text-xs text-gd-text-muted">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </GhostButton>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gd-danger/30 bg-gd-danger/10 px-4 py-2.5 text-sm font-semibold text-gd-danger transition-colors hover:bg-gd-danger/20 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Owner dashboard section nav ── */
export const OWNER_SECTIONS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/projects", label: "Projects" },
  { href: "/dashboard/finance", label: "Finance" },
  { href: "/dashboard/partners", label: "Partners" },
] as const;
