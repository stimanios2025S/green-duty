"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { roleLabelFor } from "@/lib/nav-config";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { ClientPortal } from "@/components/portal/ClientPortal";

/**
 * The client's home. Anyone signed in who is not the agency owner lands here,
 * including accounts created before the agency pivot.
 *
 * The owner is sent to /dashboard, which is their workspace.
 */
export default function PortalPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user?.isOwner) router.replace("/dashboard");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  const type = user.accountType || "client";
  const partner = type === "partner";

  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gd-accent-500/20 bg-gd-accent-500/10 px-3 py-1 text-xs font-medium text-gd-accent-400">
              {roleLabelFor(type)} Portal
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-gd-success/20 bg-gd-success/5 px-3 py-1 text-xs font-medium text-gd-success">
              <span className="h-1.5 w-1.5 rounded-full bg-gd-success animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
              Live data
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-gd-text-primary">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-gd-text-secondary">
            {partner
              ? "Your partner account — collaborations and how we work together."
              : "Your account with the studio, and the work we're delivering for you."}
          </p>
        </div>
      </AnimeWrapper>

      <ClientPortal partner={partner} />
    </div>
  );
}
