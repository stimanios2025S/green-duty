"use client";
import { useRef, useState, useEffect } from "react";
import anime from "animejs";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { ProfileEditor } from "@/components/instagro/ProfileEditor";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL } from "@/lib/nav-config";
import {
  User as UserIcon, Mail, ShieldCheck, Leaf, Pencil, Globe, Bell,
  Sparkles, ArrowRight, CalendarDays, Award, MessageCircle, ExternalLink
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const titleRef = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" });
  }, []);

  if (!user) return null;

  const type = user.accountType || "guest";
  const roleLabel = ROLE_LABEL[type] || "Guest";
  const joined = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
  const myUsername = user.username || user.name?.toLowerCase().replace(/\s+/g, ".") || "you";

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
            <p className="text-sm text-gd-text-secondary mt-1">Manage your account, profile and preferences</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gd-olive-500/20 bg-gd-olive-500/5 px-3 py-1 text-xs font-medium text-gd-olive-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gd-olive-500 animate-pulse" /> {roleLabel}
          </span>
        </div>
      </AnimeWrapper>

      {/* Profile card */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-gd-accent-500 to-gd-ember-500 text-gd-text-inverse text-xl font-bold shadow-lg shadow-gd-accent-500/20">
            {user.avatarUrl && user.avatarUrl !== "/logo.png" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || "G"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-gd-text-primary">{user.name}</h2>
            <p className="truncate text-sm text-gd-text-muted">@{myUsername}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-gd-accent-500/25 bg-gd-accent-500/10 px-2 py-0.5 text-[11px] font-semibold text-gd-accent-400">
                <Sparkles className="h-3 w-3" /> {(user.points || 0).toLocaleString()} eco points
              </span>
              {(user.badges || []).slice(0, 3).map(b => (
                <span key={b} className="rounded-full border border-gd-border bg-gd-elevated px-2 py-0.5 text-[11px] font-medium text-gd-text-secondary">{b}</span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowEditor(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
          >
            <Pencil className="h-4 w-4" /> Edit profile
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
          {infoRow(<ShieldCheck className="h-4 w-4" />, "Account type", roleLabel)}
          {infoRow(<CalendarDays className="h-4 w-4" />, "Member since", joined)}
          {infoRow(<Award className="h-4 w-4" />, "Eco points", (user.points || 0).toLocaleString())}
          {infoRow(<Leaf className="h-4 w-4" />, "Badges earned", (user.badges || []).length ? user.badges!.join(" · ") : "None yet")}
        </div>
      </Card>

      {/* Preferences & links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gd-text-primary">
            <Bell className="h-4 w-4 text-gd-accent-400" /> Notifications
          </h3>
          <p className="text-sm text-gd-text-secondary leading-relaxed">
            You&apos;ll get notified about cleanups you join, order updates, and new followers.
          </p>
          <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            View my portal <ArrowRight className="h-3 w-3" />
          </Link>
        </Card>
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-gd-text-primary">
            <Globe className="h-4 w-4 text-gd-accent-400" /> Public profile
          </h3>
          <p className="text-sm text-gd-text-secondary leading-relaxed">
            Your profile is visible to the community on InstaGro — posts, stories and eco activity.
          </p>
          <Link href={`/feed/${myUsername}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            View public profile <ExternalLink className="h-3 w-3" />
          </Link>
        </Card>
      </div>

      {/* Support */}
      <Card>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-gd-text-primary">
          <MessageCircle className="h-4 w-4 text-gd-accent-400" /> Need help?
        </h3>
        <p className="text-sm text-gd-text-secondary leading-relaxed">
          Questions about donations, cleanups or the marketplace? Reach us through the
          <span className="mx-1 font-medium text-gd-text-primary">Sponsor Trees</span>
          flow — we reply on WhatsApp or email.
        </p>
        <Link href="/tree-tracker" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
          Go to Tree Tracker <ArrowRight className="h-3 w-3" />
        </Link>
      </Card>

      <ProfileEditor isOpen={showEditor} onClose={() => setShowEditor(false)} onSaved={() => setShowEditor(false)} />
    </div>
  );
}
