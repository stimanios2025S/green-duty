"use client";
import { useRef, useEffect } from "react";
import anime from "animejs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { useAuth } from "@/lib/auth-context";
import { roleLabelFor } from "@/lib/nav-config";
import {
  User as UserIcon, Mail, ShieldCheck, ArrowRight, CalendarDays, LogOut, FolderKanban, MessageCircle
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" });
  }, []);

  if (!user) return null;

  const type = user.accountType || "client";
  const roleLabel = roleLabelFor(type);
  const joined = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const infoRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3 rounded-xl border border-gd-border bg-gd-elevated/40 px-3.5 py-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gd-accent-500/10 text-gd-accent-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-gd-text-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-gd-text-primary">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">Settings</h1>
            <p className="text-sm text-gd-text-secondary mt-1">Your account details and workspace</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gd-olive-500/20 bg-gd-olive-500/5 px-3 py-1 text-xs font-medium text-gd-olive-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gd-olive-500 animate-pulse" /> {user.isOwner ? "Agency" : roleLabel}
          </span>
        </div>
      </AnimeWrapper>

      {/* Profile card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gd-accent-500 to-gd-ember-500 text-gd-text-inverse text-xl font-bold shadow-lg shadow-gd-accent-500/20">
            {user.name?.charAt(0)?.toUpperCase() || "G"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-gd-text-primary">{user.name}</h2>
            <p className="truncate text-sm text-gd-text-muted">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated/60 px-4 py-2.5 text-sm font-semibold text-gd-text-secondary transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </Card>

      {/* Account details */}
      <Card>
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gd-text-primary">
          <UserIcon className="h-4 w-4 text-gd-accent-400" /> Account details
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {infoRow(<UserIcon className="h-4 w-4" />, "Full name", user.name)}
          {infoRow(<Mail className="h-4 w-4" />, "Email address", user.email)}
          {infoRow(<ShieldCheck className="h-4 w-4" />, "Account type", user.isOwner ? "Agency owner" : roleLabel)}
          {infoRow(<CalendarDays className="h-4 w-4" />, "Member since", joined)}
        </div>
      </Card>

      {/* Workspace links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gd-text-primary">
            <FolderKanban className="h-4 w-4 text-gd-accent-400" /> Your workspace
          </h3>
          <p className="text-sm text-gd-text-secondary leading-relaxed">
            {user.isOwner
              ? "Open the agency dashboard to manage orders, clients, projects and finance."
              : "Open your portal to see your orders, projects and roadmap."}
          </p>
          <Link href={user.isOwner ? "/dashboard" : "/portal"} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            {user.isOwner ? "Open dashboard" : "Open my portal"} <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gd-text-primary">
            <MessageCircle className="h-4 w-4 text-gd-accent-400" /> Need help?
          </h3>
          <p className="text-sm text-gd-text-secondary leading-relaxed">
            Questions about a project, a quote, or your account? Reach the team through the
            contact page and we will get back to you.
          </p>
          <Link href="/b2b" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            Contact us <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
      </div>
    </div>
  );
}