"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ROLE_LABEL } from "@/lib/nav-config";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import {
  Trees, MapPin, Users, ShieldCheck, Sprout, Droplets, CalendarCheck,
  Building2, Package, ShoppingCart, Truck, Store, Wallet, BadgeCheck, TrendingUp, Briefcase
} from "lucide-react";
import { products } from "@/lib/mock-data";

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
  const [stats, setStats] = useState<any>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/stats").then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
    fetch("/api/hotspots").then(r => r.ok ? r.json() : null).then(d => d && setHotspots(d.hotspots || [])).catch(() => {});
  }, []);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Trees Planted" value={(stats?.trees || 0).toLocaleString()} icon={<Trees className="h-5 w-5" />} />
        <StatCard label="Hotspots Reported" value={(stats?.hotspots || 0).toLocaleString()} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Community Members" value={(stats?.users || 0).toLocaleString()} icon={<Users className="h-5 w-5" />} />
        <StatCard label="InstaGro Posts" value={(stats?.posts || 0).toLocaleString()} icon={<ShieldCheck className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionHead icon={<Sprout className="h-4 w-4" />} title="Community Impact" />
          <div className="space-y-5">
            {[
              { label: "Trees Planted", value: (stats?.trees || 0).toLocaleString(), unit: "trees", color: "bg-gd-olive-500", pct: Math.min(100, ((stats?.trees || 0) / 20000) * 100) },
              { label: "Articles Shared", value: (stats?.articles || 0).toLocaleString(), unit: "posts", color: "bg-gd-accent-500", pct: Math.min(100, (stats?.articles || 0) * 5) },
              { label: "Videos Published", value: (stats?.videos || 0).toLocaleString(), unit: "videos", color: "bg-blue-500", pct: Math.min(100, (stats?.videos || 0) * 5) },
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

/* ── Business portal ── */
function BusinessPortal() {
  const { user } = useAuth();
  const biz = user?.businessProfile;
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/stats").then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
  }, []);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Company Revenue" value="$48.2K" icon={<Wallet className="h-5 w-5" />} trend={{ value: 18, isPositive: true }} />
        <StatCard label="Active Projects" value="7" icon={<Briefcase className="h-5 w-5" />} trend={{ value: 3, isPositive: true }} />
        <StatCard label="CSR Trees Planted" value={(stats?.trees || 0).toLocaleString()} icon={<Trees className="h-5 w-5" />} />
        <StatCard label="B2B Inquiries" value={(stats?.inquiries || 0).toLocaleString()} icon={<Sprout className="h-5 w-5" />} />
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
              { label: "B2B Projects", value: "7 active" },
              { label: "Team Members", value: "12" },
              { label: "Marketplace Orders", value: "86" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4 text-center">
                <p className="text-lg font-bold text-gd-text-primary">{s.value}</p>
                <p className="text-xs text-gd-text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHead icon={<TrendingUp className="h-4 w-4" />} title="B2B Pipeline" />
          <div className="space-y-3">
            {[
              { name: "IoT Greenhouse", stage: "In progress", pct: 68 },
              { name: "Farm Dashboard", stage: "Proposal", pct: 30 },
              { name: "Irrigation Automation", stage: "Contract", pct: 85 },
            ].map((p, i) => (
              <div key={i} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-3.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gd-text-primary">{p.name}</span>
                  <span className="text-xs text-gd-accent-400">{p.stage}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gd-overlay">
                  <div className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500" style={{ width: p.pct + '%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ── Seller portal ── */
function SellerPortal() {
  const myProducts = products.filter(p => p.sellerVerified).length;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Listings" value={myProducts} icon={<Package className="h-5 w-5" />} trend={{ value: 6, isPositive: true }} />
        <StatCard label="Orders This Month" value="34" icon={<ShoppingCart className="h-5 w-5" />} trend={{ value: 14, isPositive: true }} />
        <StatCard label="Revenue" value="$12.8K" icon={<Wallet className="h-5 w-5" />} trend={{ value: 9, isPositive: true }} />
        <StatCard label="Rating" value="4.8" icon={<BadgeCheck className="h-5 w-5" />} />
      </div>
      <Card>
        <SectionHead icon={<Store className="h-4 w-4" />} title="Store Performance" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Seeds & Fertilizers", value: "45%" },
            { label: "Irrigation & Sensors", value: "35%" },
            { label: "Other", value: "20%" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-4 text-center">
              <p className="text-xl font-bold text-gd-accent-400">{s.value}</p>
              <p className="text-xs text-gd-text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ── Driver portal ── */
function DriverPortal() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Deliveries" value="3" icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Completed" value="128" icon={<BadgeCheck className="h-5 w-5" />} trend={{ value: 11, isPositive: true }} />
        <StatCard label="This Week" value="$540" icon={<Wallet className="h-5 w-5" />} trend={{ value: 7, isPositive: true }} />
        <StatCard label="Rating" value="4.9" icon={<ShieldCheck className="h-5 w-5" />} />
      </div>
      <Card>
        <SectionHead icon={<Truck className="h-4 w-4" />} title="Delivery Queue" />
        <div className="space-y-2">
          {[
            { id: "#1042", dest: "Santos Organic Farm", eta: "30 min", status: "Pickup" },
            { id: "#1043", dest: "GreenField Acres", eta: "55 min", status: "En route" },
            { id: "#1044", dest: "Valley View Farm", eta: "1h 20m", status: "Pending" },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-gd-border bg-gd-elevated/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gd-text-primary">Order {d.id}</p>
                <p className="text-xs text-gd-text-muted mt-0.5">{d.dest} · ETA {d.eta}</p>
              </div>
              <span className="rounded-full border border-gd-accent-500/20 bg-gd-accent-500/10 px-3 py-1 text-xs font-medium text-gd-accent-400">{d.status}</span>
            </div>
          ))}
        </div>
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
