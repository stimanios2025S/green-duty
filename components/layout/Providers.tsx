"use client";
import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AuthProvider, useAuth } from "@/lib/auth-context";

const PUBLIC_PATHS = ["/login", "/auth/register", "/auth/verify"];

function Shell({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some(p => pathname?.startsWith(p));

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
  return (
    <div className="flex h-screen overflow-hidden bg-gd-deepest">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gd-base p-6">{children}</main>
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
