"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { OWNER_SECTIONS } from "./kit";

/**
 * Chrome shared by every owner-dashboard page: the heading, the section tabs
 * and the agency badge. Keeps the four pages visually identical.
 */
export function OwnerShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/10 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Building2 className="h-3 w-3" />
              Agency Dashboard
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gd-text-primary">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gd-text-secondary">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-gd-border bg-gd-card p-1">
        {OWNER_SECTIONS.map(section => {
          const active = pathname === section.href;
          return (
            <Link
              key={section.href}
              href={section.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400 glow-ring"
                  : "text-gd-text-secondary hover:bg-gd-elevated hover:text-gd-text-primary"
              )}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

/** Shown when a signed-in non-owner opens an owner-only page. */
export function OwnerDenied() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gd-border-soft bg-gd-card px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gd-warning/20 bg-gd-warning/10 text-gd-warning">
        <ShieldAlert className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-gd-text-primary">Owner access required</h2>
      <p className="mt-1 max-w-sm text-sm text-gd-text-muted">
        This area is limited to the agency owner account. You&apos;re signed in as a client.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary transition-colors hover:border-gd-border-strong hover:text-gd-text-primary"
      >
        Back to my portal
      </Link>
    </div>
  );
}
