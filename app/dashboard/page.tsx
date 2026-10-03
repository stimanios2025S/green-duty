"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OwnerShell } from "@/components/dashboard/OwnerShell";
import { OwnerOverview } from "@/components/dashboard/OwnerOverview";
import { ownerGet } from "@/lib/agency-client";
import type { OverviewResponse } from "@/lib/agency";

/**
 * The owner's business dashboard. Owner-only.
 *
 * Identity is settled by the server, not the browser: we simply ask for the
 * owner overview and see whether we are allowed to have it. Anything other
 * than a 200 means this is a client, who is redirected to /portal.
 *
 * `user.isOwner` in localStorage is only a UI cache and is deliberately not
 * consulted here — it decides which navigation renders, never what data loads.
 */
export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [identity, setIdentity] = useState<"checking" | "owner" | "client">("checking");

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  const userId = user?.id;
  useEffect(() => {
    if (isLoading || !userId) return;
    let cancelled = false;
    ownerGet<OverviewResponse>("/api/dashboard/overview").then(res => {
      if (cancelled) return;
      if (res.ok) {
        setOverview(res.data);
        setIdentity("owner");
      } else {
        setIdentity("client");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, userId]);

  useEffect(() => {
    if (identity === "client") router.replace("/portal");
  }, [identity, router]);

  if (isLoading || !user || identity !== "owner" || !overview) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <OwnerShell
      title={`Welcome back, ${user.name.split(" ")[0]}`}
      subtitle="Your agency at a glance — clients, projects, money and partners."
    >
      <OwnerOverview data={overview} />
    </OwnerShell>
  );
}
