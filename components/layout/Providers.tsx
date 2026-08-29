"use client";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, Search, PlusSquare, Send, User as UserIcon } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SearchModal } from "@/components/instagro/SearchModal";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const PUBLIC_PATHS = ["/", "/login", "/auth/register", "/auth/verify", "/dev"];

function MobileNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";
  const isFeed = pathname === "/feed" || pathname?.startsWith("/feed/");

  const items = [
    { href: "/feed", icon: Home, active: isFeed && pathname === "/feed" },
    { href: "/feed", icon: Search, active: false, search: true },
    { href: "/feed", icon: PlusSquare, active: false, create: true },
    { href: "/feed/messages", icon: Send, active: pathname?.startsWith("/feed/messages") },
    { href: `/feed/${myUsername}`, icon: UserIcon, active: pathname === `/feed/${myUsername}` },
  ];

  const openSearch = () => window.dispatchEvent(new CustomEvent("gd:open-search"));
  const openCreate = () => window.dispatchEvent(new CustomEvent("gd:open-create"));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gd-border bg-gd-deepest/95 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {items.map((item, i) =>
          item.create ? (
            <button key={i} onClick={openCreate} className="text-gd-text-secondary hover:text-gd-text-primary transition-colors" title="Create">
              <PlusSquare className="h-7 w-7" />
            </button>
          ) : item.search ? (
            <button key={i} onClick={openSearch} className="text-gd-text-muted hover:text-gd-text-secondary transition-colors" title="Search">
              <Search className="h-7 w-7" />
            </button>
          ) : (
            <Link
              key={i}
              href={item.href}
              className={`${item.active ? "text-gd-text-primary" : "text-gd-text-muted hover:text-gd-text-secondary"} transition-colors`}
              title={item.href}
            >
              <item.icon className="h-7 w-7" />
            </Link>
          )
        )}
      </div>
    </nav>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some(p => pathname?.startsWith(p));
  const [showSearch, setShowSearch] = useState(false);

  // Global search — works from the header search box & mobile nav on ANY page
  useEffect(() => {
    const onSearch = () => setShowSearch(true);
    window.addEventListener("gd:open-search", onSearch);
    return () => window.removeEventListener("gd:open-search", onSearch);
  }, []);

  // Redirect unauthenticated users away from protected pages
  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.replace("/login");
    }
  }, [isLoading, user, isPublic, router]);

  // Auth / public pages render standalone (no sidebar/header)
  if (isPublic) {
    return <>{children}</>;
  }

  // Not logged in on a protected page — show spinner while redirect happens
  if (!isLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gd-deepest">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gd-deepest">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  // InstaGro pages (feed + all /feed/*) render full-width with the mobile nav —
  // the IG-style pages manage their own top nav.
  const isInstaGro = pathname?.startsWith("/feed");
  // Landing page renders full-bleed (hero sections span edge-to-edge)
  const isLanding = pathname === "/";

  if (isInstaGro) {
    return (
      <div className="flex min-h-screen flex-col bg-gd-deepest pb-16 md:pb-0">
        <main className="flex-1">{children}</main>
        <MobileNav />
      </div>
    );
  }

  // Other app pages: sidebar + header (desktop), mobile nav (mobile)
  return (
    <div className="flex h-screen overflow-hidden bg-gd-deepest">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className={`flex-1 overflow-y-auto bg-gd-base ${isLanding ? "" : "p-6 pb-20 md:pb-6"}`}>{children}</main>
        <MobileNav />
      </div>
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
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
