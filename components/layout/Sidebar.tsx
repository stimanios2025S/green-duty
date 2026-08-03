"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Settings, LogOut, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { TABS_BY_ROLE, ROLE_LABEL } from "@/lib/nav-config";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const type = user?.accountType || "guest";
  const tabs = TABS_BY_ROLE[type] || [];
  const label = ROLE_LABEL[type] || "Guest";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className={cn(
      "flex flex-col border-r border-gd-border transition-all duration-300 glass",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gd-border px-4">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-xl bg-gd-card ring-1 ring-gd-border-strong group-hover:ring-gd-accent-500/40 transition-all">
              <Image src="/logo.png" alt="GreenDuty logo" fill sizes="36px" className="object-contain p-0.5" priority />
            </div>
            <span className="text-lg font-bold tracking-tight gradient-text">GreenDuty</span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gd-card ring-1 ring-gd-border-strong">
              <Image src="/logo.png" alt="GreenDuty logo" fill sizes="36px" className="object-contain p-0.5" priority />
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-border transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation (role-filtered) */}
      <nav className="flex-1 space-y-0.5 p-3">
        {tabs.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-gd-accent-500/10 to-gd-olive-500/5 text-gd-accent-400 glow-ring"
                  : "text-gd-text-secondary hover:text-gd-text-primary hover:bg-gd-elevated"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-gd-accent-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-gd-border p-3 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gd-accent-500 to-gd-ember-500 text-gd-text-inverse text-xs font-bold shadow-md">
              {user?.name?.charAt(0) || "G"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gd-text-primary truncate">{user?.name || "Guest"}</p>
              <p className="text-xs text-gd-accent-400 font-medium">{label} · {(user?.points || 0).toLocaleString()} pts</p>
            </div>
          </div>
        )}
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors">
          <Settings className="h-5 w-5" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gd-text-muted hover:text-red-400 hover:bg-red-500/5 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
