"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

/**
 * Chrome for the public, client-facing pages (/, /catalogue, /partners).
 *
 * These pages render outside the app Shell, so they carry their own
 * navigation — and they must work for a visitor who has never signed in.
 */

export const PUBLIC_LINKS = [
  { href: "/catalogue", label: "Catalogue" },
  { href: "/partners", label: "Partners" },
  { href: "/b2b", label: "Contact" },
];

export function PublicNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gd-border bg-gd-deepest/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <span className="relative h-9 w-9 overflow-hidden rounded-xl bg-gd-card ring-1 ring-gd-border-strong">
            <Image src="/logo.png" alt="GreenDuty" fill sizes="36px" className="object-contain p-0.5" priority />
          </span>
          <span className="text-lg font-bold tracking-tight gradient-text">GreenDuty</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {PUBLIC_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-gd-accent-400"
                  : "text-gd-text-secondary hover:bg-gd-elevated hover:text-gd-text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2">
          {!isLoading && user ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-gd-text-secondary transition-colors hover:text-gd-text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/b2b"
                className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
              >
                Start a project
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile links — the desktop nav is hidden below md */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-gd-border px-4 py-2 md:hidden">
        {PUBLIC_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              pathname === link.href ? "text-gd-accent-400" : "text-gd-text-secondary"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-gd-border bg-gd-card py-14 text-center text-sm text-gd-text-muted">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gd-accent-500/30 to-transparent" />
      <div className="relative mx-auto mb-4 h-12 w-12 overflow-hidden rounded-xl bg-gd-deepest ring-1 ring-gd-border-strong">
        <Image src="/logo.png" alt="GreenDuty logo" fill sizes="48px" className="object-contain p-1" />
      </div>
      <p className="mb-1 text-lg font-semibold text-gd-text-primary">
        <span className="gradient-text">GreenDuty</span>
      </p>
      <p>Personalized ERP, MES &amp; CRM for factories and industrial businesses</p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
        {PUBLIC_LINKS.map(link => (
          <Link key={link.href} href={link.href} className="text-gd-text-secondary transition-colors hover:text-gd-accent-400">
            {link.label}
          </Link>
        ))}
        <Link href="/login" className="text-gd-text-secondary transition-colors hover:text-gd-accent-400">
          Sign in
        </Link>
      </div>

      <p className="mt-5 text-gd-text-muted">© {new Date().getFullYear()} GreenDuty. All rights reserved.</p>
    </footer>
  );
}
