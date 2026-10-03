"use client";
import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, Handshake, Briefcase } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

/** Prefix-matched public routes (the auth flow). */
const PUBLIC_PATHS = ["/login", "/auth/register", "/auth/verify"];

/**
 * Exactly-matched public routes — the client-facing marketing pages.
 *
 * These must be exact rather than prefix matches: "/" as a prefix would match
 * every path in the app and silently open the whole thing to visitors.
 */
const PUBLIC_EXACT = ["/", "/catalogue", "/partners", "/b2b", "/order/new"];

/** Mobile bottom nav — the same destinations as the desktop sidebar. */
function MobileNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  const items = [
    { href: "/portal", label: "Portal", icon: LayoutDashboard },
    { href: "/catalogue", label: "Catalogue", icon: Package },
    { href: "/partners", label: "Partners", icon: Handshake },
    { href: "/b2b", label: "Start", icon: Briefcase },
  ];

  const ownerItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/orders", label: "Orders", icon: Package },
    { href: "/dashboard/projects", label: "Projects", icon: Briefcase },
    { href: "/dashboard/finance", label: "Finance", icon: Handshake },
  ];

  const links = user?.isOwner ? ownerItems : items;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gd-border bg-gd-deepest/95 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {links.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium transition-colors",
                active ? "text-gd-accent-400" : "text-gd-text-muted hover:text-gd-text-secondary"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_EXACT.includes(pathname || "") || PUBLIC_PATHS.some(p => pathname?.startsWith(p));

  // Gate: not logged in + not on a public page → login
  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [user, isLoading, isPublic, router]);

  // Auth / public pages render standalone (no sidebar/header)
  if (isPublic || (!isLoading && !user)) {
    return <>{children}</>;
  }
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gd-deepest">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  // App pages: sidebar + header (desktop), mobile nav (mobile)
  return (
    <div className="flex h-screen overflow-hidden bg-gd-deepest">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gd-base p-6 pb-20 md:pb-6">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}