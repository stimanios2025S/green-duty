"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/nav-config";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import {
  Trees, MapPin, Users, ShieldCheck, Sprout, CalendarCheck,
  Building2, Package, ShoppingCart, Truck, Store, Wallet, BadgeCheck, TrendingUp, Briefcase, Leaf
} from "lucide-react";

/* ── Live platform stats hook (real DB aggregates from /api/stats) ── */
function useLiveStats() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/stats").then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
  }, []);
  return stats;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>;
  }

  const type = user.accountType || "guest";

  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-gd-accent-500/20 bg-gd-accent-500/10 px-3 py-1 text-xs font-medium text-gd-accent-400">
              {ROLE_LABEL[type]} Portal
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-gd-success/20 bg-gd-success/5 px-3 py-1 text-xs font-medium text-gd-success">
              <span className="h-1.5 w-1.5 rounded-full bg-gd-success animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
              Live data
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-bold text-gd-text-primary tracking-tight">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-gd-text-secondary">
            {portalGreeting(type)}
          </p>
        </div>
      </AnimeWrapper>

      {type === "business" && <BusinessPortal />}
      {type === "seller" && <SellerPortal />}
      {type === "driver" && <DriverPortal />}
      {type === "buyer" && <BuyerPortal />}
      {type === "guest" && <GuestPortal />}
    </div>
  );
}

function portalGreeting(type: string): string {
  switch (type) {
    case "business": return "Manage your company, CSR impact, and B2B projects.";
    case "seller": return "Track your store performance and listings.";
    case "driver": return "View your deliveries and earnings.";
    case "buyer": return "Browse orders, track deliveries, and shop verified products.";
    default: return "Platform overview, key metrics, and activity summary.";
  }
}

/* ── Shared section headings ── */
function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gd-accent-500/10 text-gd-accent-400 border border-gd-accent-500/10">{icon}</span>
      <div>
        <h3 className="font-semibold text-gd-text-primary">{title}</h3>
        {sub && <p className="text-xs text-gd-text-muted">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Guest / Citizen portal ── */
function GuestPortal() {
  const stats = useLiveStats();
  const [hotspots, setHotspots] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/hotspots").then(r => r.ok ? r.json() : null).then(d => d && setHotspots(d.hotspots || [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Trees Planted" value={(stats?.trees || 0).toLocaleString()} icon={<Trees className="h-5 w-5" />} />
        <StatCard label="Hotspots Reported" value={(stats?.hotspots || 0).toLocaleString()} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Cleanups Organized" value={(stats?.cleanups || 0).toLocaleString()} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard label="Volunteers Joined" value={(stats?.volunteers || 0).toLocaleString()} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Community Members" value={(stats?.users || 0).toLocaleString()} icon={<ShieldCheck className="h-5 w-5" />} />
        <StatCard label="InstaGro Posts" value={(stats?.posts || 0).toLocaleString()} icon={<Leaf className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHead icon={<Sprout className="h-4 w-4" />} title="Community Impact" sub="Live from the database — updates with every action" />
          <div className="space-y-5">
            {[
              { label: "Trees Planted", value: (stats?.trees || 0).toLocaleString(), unit: "trees", color: "bg-gd-olive-500", pct: Math.min(100, ((stats?.trees || 0) / 20000) * 100) },
              { label: "Cleanup Volunteers", value: (stats?.volunteers || 0).toLocaleString(), unit: "volunteers", color: "bg-gd-info", pct: Math.min(100, ((stats?.volunteers || 0) / 1000) * 100) },
              { label: "Hotspots Resolved", value: (stats?.hotspotsResolved || 0).toLocaleString(), unit: "resolved", color: "bg-gd-success", pct: Math.min(100, (stats?.hotspotsResolved || 0) * 20) },
              { label: "Total Likes", value: (stats?.likes || 0).toLocaleString(), unit: "likes", color: "bg-gd-ember-500", pct: Math.min(100, (stats?.likes || 0) / 5) },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gd-text-secondary">{item.label}</span>
                  <span className="font-medium text-gd-text-primary">{item.value} {item.unit}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gd-overlay">
                  <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: item.pct + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead icon={<CalendarCheck className="h-4 w-4" />} title="Recent Hotspot Reports" />
          <div className="space-y-2">
            {hotspots.length === 0 ? (
              <p className="py-8 text-center text-sm text-gd-text-muted">No reports yet. Be the first!</p>
            ) : (
              hotspots.slice(0, 5).map(h => (
                <div key={h.id} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-3 hover:bg-gd-elevated transition-colors">
                  <div className="h-2 w-2 rounded-full bg-gd-ember-500" />
                  <p className="text-sm text-gd-text-secondary flex-1 truncate">{h.title}</p>
                  <span className="text-[10px] text-gd-text-muted whitespace-nowrap">{new Date(h.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ── Business portal (100% real stats) ── */
function BusinessPortal() {
  const { user } = useAuth();
  const biz = user?.businessProfile;
  const stats = useLiveStats();

  const revenue = stats?.revenue || 0;
  const orders = stats?.orders || 0;
  const trees = stats?.trees || 0;
  const inquiries = stats?.inquiries || 0;
  const members = stats?.users || 0;
  const verified = stats?.verifiedUsers || 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Verified Commerce" value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Marketplace Orders" value={orders.toLocaleString()} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard label="CSR Trees Planted" value={trees.toLocaleString()} icon={<Trees className="h-5 w-5" />} />
        <StatCard label="B2B Inquiries" value={inquiries.toLocaleString()} icon={<Briefcase className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHead icon={<Building2 className="h-4 w-4" />} title="Company Overview" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4">
              <p className="text-xs text-gd-text-muted uppercase tracking-wider">Business</p>
              <p className="mt-1 font-semibold text-gd-text-primary">{biz?.businessName || user?.companyDetails?.companyName || "—"}</p>
            </div>
            <div className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4">
              <p className="text-xs text-gd-text-muted uppercase tracking-wider">Address</p>
              <p className="mt-1 font-semibold text-gd-text-primary">{biz?.businessAddress || "—"}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Community Members", value: members.toLocaleString() },
              { label: "Verified Accounts", value: verified.toLocaleString() },
              { label: "Marketplace Orders", value: orders.toLocaleString() },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4 text-center">
                <p className="text-lg font-bold text-gd-text-primary">{s.value}</p>
                <p className="text-xs text-gd-text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead icon={<TrendingUp className="h-4 w-4" />} title="Real Impact Pipeline" sub="Live progress toward community goals" />
          <div className="space-y-3">
            {[
              { name: "Verified Commerce", value: revenue, goal: 50000, suffix: "$" },
              { name: "Trees Planted", value: trees, goal: 20000, suffix: "" },
              { name: "B2B Inquiries", value: inquiries, goal: 100, suffix: "" },
              { name: "Verified Members", value: verified, goal: 1000, suffix: "" },
            ].map((p, i) => {
              const pct = Math.min(100, (p.value / p.goal) * 100);
              return (
                <div key={i} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-3.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gd-text-primary">{p.name}</span>
                    <span className="text-xs text-gd-accent-400">{p.suffix}{Math.round(p.value).toLocaleString()} / {p.suffix}{p.goal.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-gd-overlay">
                    <div className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500 transition-all duration-700" style={{ width: pct + '%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ── Seller portal (real stats) ── */
function SellerPortal() {
  const stats = useLiveStats();
  const revenue = stats?.revenue || 0;
  const orders = stats?.orders || 0;
  const delivered = stats?.deliveredOrders || 0;
  const open = stats?.openOrders || 0;
  const trees = stats?.trees || 0;
  const deliveredPct = orders > 0 ? Math.round((delivered / orders) * 100) : 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Marketplace Revenue" value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Orders Placed" value={orders.toLocaleString()} icon={<ShoppingCart className="h-5 w-5" />} trend={{ value: deliveredPct, isPositive: true }} />
        <StatCard label="Open Orders" value={open.toLocaleString()} icon={<Package className="h-5 w-5" />} />
        <StatCard label="Delivered" value={delivered.toLocaleString()} icon={<BadgeCheck className="h-5 w-5" />} />
      </div>
      <Card>
        <SectionHead icon={<Store className="h-4 w-4" />} title="Store Performance" sub="Live fulfillment metrics across the platform" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Delivered Rate", value: deliveredPct + "%", sub: `${delivered} of ${orders} orders delivered` },
            { label: "Fulfillment Queue", value: open.toLocaleString(), sub: `${open} orders awaiting delivery` },
            { label: "CSR Trees", value: trees.toLocaleString(), sub: "planted by the community" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4 text-center">
              <p className="text-xl font-bold text-gd-accent-400">{s.value}</p>
              <p className="text-xs text-gd-text-muted mt-0.5">{s.label}</p>
              <p className="text-[10px] text-gd-text-muted mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ── Driver portal (real delivery queue from the DB) ── */
function DriverPortal() {
  const stats = useLiveStats();
  const [queue, setQueue] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/orders?all=1")
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setQueue((d.orders || []).filter((o: any) => ["pending", "confirmed", "shipped"].includes(o.status))))
      .catch(() => {});
  }, []);

  const revenue = stats?.revenue || 0;
  const delivered = stats?.deliveredOrders || 0;
  const open = stats?.openOrders || 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Deliveries" value={open.toLocaleString()} icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Completed" value={delivered.toLocaleString()} icon={<BadgeCheck className="h-5 w-5" />} />
        <StatCard label="Platform Volume" value={`$${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="CSR Trees" value={(stats?.trees || 0).toLocaleString()} icon={<Trees className="h-5 w-5" />} />
      </div>
      <Card>
        <SectionHead icon={<Truck className="h-4 w-4" />} title="Delivery Queue" sub="Real orders currently in the fulfillment pipeline" />
        {queue.length === 0 ? (
          <p className="py-8 text-center text-sm text-gd-text-muted">No active deliveries right now. Orders appear here in real time.</p>
        ) : (
          <div className="space-y-2">
            {queue.map(o => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-gd-border bg-gd-elevated/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gd-text-primary">Order {o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gd-text-muted mt-0.5">{o.product_name} ×{o.quantity} · ${Number(o.total_price).toFixed(2)} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                  o.status === "shipped"
                    ? "border-gd-info/20 bg-gd-info/10 text-gd-info"
                    : o.status === "confirmed"
                    ? "border-gd-success/20 bg-gd-success/10 text-gd-success"
                    : "border-gd-accent-500/20 bg-gd-accent-500/10 text-gd-accent-400"
                }`}>{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ── Buyer portal ── */
function BuyerPortal() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/orders?buyerId=${encodeURIComponent(user.id)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setOrders(d.orders || []))
      .catch(() => {});
  }, [user]);

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_price || 0), 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={orders.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard label="In Transit" value={orders.filter(o => o.status === "shipped" || o.status === "confirmed").length} icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Total Spent" value={`$${totalSpent.toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Pending" value={orders.filter(o => o.status === "pending").length} icon={<BadgeCheck className="h-5 w-5" />} />
      </div>
      <Card>
        <SectionHead icon={<ShoppingCart className="h-4 w-4" />} title="Order Tracking" />
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-gd-text-muted">No orders yet — shop the marketplace!</p>
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-gd-border bg-gd-elevated/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gd-text-primary">{o.product_name} ×{o.quantity}</p>
                  <p className="text-xs text-gd-text-muted mt-0.5">${Number(o.total_price).toFixed(2)} · {new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  o.status === "delivered"
                    ? "bg-gd-success/10 text-gd-success border border-gd-success/20"
                    : o.status === "shipped"
                    ? "bg-gd-info/10 text-gd-info border border-gd-info/20"
                    : "bg-gd-accent-500/10 text-gd-accent-400 border border-gd-accent-500/20"
                }`}>{o.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
