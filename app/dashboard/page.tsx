"use client";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { ROLE_LABEL } from "@/lib/nav-config";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import {
  Trees, MapPin, Users, ShieldCheck, Sprout, CalendarCheck, Check,
  Building2, Package, ShoppingCart, Truck, Store, Wallet, BadgeCheck, TrendingUp, Briefcase, Leaf,
  Plus, Upload, X, Image as ImageIcon, Loader2
} from "lucide-react";

interface StatsPayload {
  trees?: number;
  hotspots?: number;
  cleanups?: number;
  volunteers?: number;
  users?: number;
  posts?: number;
  hotspotsResolved?: number;
  likes?: number;
  revenue?: number;
  orders?: number;
  inquiries?: number;
  verifiedUsers?: number;
  deliveredOrders?: number;
  openOrders?: number;
}

/* ── Live platform stats hook (real DB aggregates from /api/stats) ── */
function useLiveStats() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  useEffect(() => {
    fetch("/api/stats").then(r => r.ok ? r.json() : null).then(d => d && setStats(d as StatsPayload)).catch(() => {});
  }, []);
  return stats;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // DEV BYPASS — skip login redirect. REMOVE BEFORE PRODUCTION.
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
  const [hotspots, setHotspots] = useState<Array<{ id: string; title: string; created_at: string }>>([]);

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

/* ── Seller product creation form with image upload ── */
function SellerProductForm() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "", description: "", category: "seeds", price: "",
    stock: "", qualityCertified: false, organicCertified: false,
    warrantyMonths: "0", features: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImgPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setImageUrl(url);
      }
    } catch {}
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearImage = () => { setImgPreview(null); setImageUrl(""); if (fileRef.current) fileRef.current.value = ""; };

  const submit = async () => {
    if (!form.name || !form.description || !form.price || !form.stock) { setMsg("Fill in all required fields."); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, description: form.description, category: form.category,
          price: Number(form.price), stock: Number(form.stock),
          qualityCertified: form.qualityCertified, organicCertified: form.organicCertified,
          warrantyMonths: Number(form.warrantyMonths),
          features: form.features.split(",").map(f => f.trim()).filter(Boolean),
          imageUrl: imageUrl || undefined,
        }),
      });
      if (res.ok) {
        setMsg("✅ Product listed!");
        setForm({ name: "", description: "", category: "seeds", price: "", stock: "", qualityCertified: false, organicCertified: false, warrantyMonths: "0", features: "" });
        clearImage();
        setTimeout(() => { setMsg(""); setShowForm(false); }, 2000);
      } else {
        const d = await res.json();
        setMsg(d.error || "Failed.");
      }
    } catch { setMsg("Network error."); }
    finally { setSaving(false); }
  };

  if (!user || user.accountType !== "seller") return null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionHead icon={<Package className="h-4 w-4" />} title="My Product Listings" sub="Create and manage your marketplace products" />
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2 text-xs font-semibold text-gd-text-inverse shadow-sm hover:brightness-110 transition-all">
            <Plus className="h-3.5 w-3.5" /> New Product
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-4 space-y-4 rounded-xl border border-gd-border bg-gd-elevated/30 p-5">
          {/* Image upload area */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gd-text-muted">Product Photo</p>
            {imgPreview ? (
              <div className="relative inline-block">
                <img src={imgPreview} alt="Preview" className="h-32 w-32 rounded-xl object-cover border border-gd-border" />
                <button onClick={clearImage} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gd-danger text-white shadow-md">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex h-32 w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
                  dragOver ? "border-gd-accent-500 bg-gd-accent-500/5" : "border-gd-border hover:border-gd-accent-500/30"
                }`}
              >
                <Upload className="h-6 w-6 text-gd-text-muted" />
                <p className="text-xs text-gd-text-muted">Drop image here or click to browse</p>
                <p className="text-[10px] text-gd-text-muted">PNG, JPEG, WebP · Max 5 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-gd-text-muted">or paste image URL:</span>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setImgPreview(e.target.value); }}
                className="flex-1 rounded-lg border border-gd-border bg-gd-elevated px-3 py-1.5 text-xs text-gd-text-primary outline-none focus:border-gd-accent-500/40"
              />
            </div>
          </div>

          {/* Form fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gd-text-secondary">Product Name *</label>
              <input value={form.name} onChange={e => set("name", e.target.value)} className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40" placeholder="e.g. Organic Tomato Seeds" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gd-text-secondary">Category *</label>
              <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40">
                {["seeds","fertilizers","irrigation","tools","organic_produce","smart_farming","bio_pesticides","sensors"].map(c => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gd-text-secondary">Price (DA) *</label>
              <input type="number" value={form.price} onChange={e => set("price", e.target.value)} className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40" placeholder="1500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gd-text-secondary">Stock *</label>
              <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40" placeholder="100" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gd-text-secondary">Description *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 resize-none" placeholder="Detailed product description..." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gd-text-secondary">Features (comma-separated)</label>
            <input value={form.features} onChange={e => set("features", e.target.value)} className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40" placeholder="Non-GMO, Organic, Heirloom" />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gd-text-secondary cursor-pointer">
              <input type="checkbox" checked={form.qualityCertified} onChange={e => set("qualityCertified", e.target.checked)} className="accent-gd-olive-500" /> Quality Certified
            </label>
            <label className="flex items-center gap-2 text-sm text-gd-text-secondary cursor-pointer">
              <input type="checkbox" checked={form.organicCertified} onChange={e => set("organicCertified", e.target.checked)} className="accent-gd-olive-500" /> Organic Certified
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gd-text-secondary">Warranty (months):</label>
              <input type="number" value={form.warrantyMonths} onChange={e => set("warrantyMonths", e.target.value)} className="w-20 rounded-lg border border-gd-border bg-gd-elevated px-2 py-1 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40" />
            </div>
          </div>

          {msg && <p className={`text-sm ${msg.startsWith("✅") ? "text-gd-success" : "text-gd-danger"}`}>{msg}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-gd-border px-4 py-2.5 text-sm text-gd-text-secondary hover:bg-gd-elevated transition-colors">Cancel</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-sm hover:brightness-110 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Saving..." : "List Product"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Seller portal (real stats) ── */
function SellerPortal() {
  const { user } = useAuth();
  const stats = useLiveStats();
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const revenue = stats?.revenue || 0;
  const orders = stats?.orders || 0;
  const delivered = stats?.deliveredOrders || 0;
  const open = stats?.openOrders || 0;
  const trees = stats?.trees || 0;
  const deliveredPct = orders > 0 ? Math.round((delivered / orders) * 100) : 0;

  useEffect(() => {
    if (!user) return;
    fetch("/api/seller/earnings")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setMyOrders(d.orders || []))
      .catch(() => {});
  }, [user]);

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

      {/* Recent orders with escrow status */}
      {myOrders.length > 0 && (
        <Card>
          <SectionHead icon={<Package className="h-4 w-4" />} title="Recent Orders" sub="Escrow status and payout timeline" />
          <div className="space-y-2">
            {myOrders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-gd-border bg-gd-elevated/50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gd-text-primary">{o.productName}</p>
                  <p className="text-xs text-gd-text-muted mt-0.5">{new Date(o.createdAt).toLocaleDateString()} · {o.quantity}× · ${Number(o.totalPrice).toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gd-text-primary">${Number(o.sellerEarning).toFixed(0)}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${
                    o.escrowStatus === "released" ? "border-gd-success/20 bg-gd-success/10 text-gd-success"
                    : o.escrowStatus === "paid" ? "border-gd-info/20 bg-gd-info/10 text-gd-info"
                    : "border-gd-accent-500/20 bg-gd-accent-500/10 text-gd-accent-400"
                  }`}>
                    {o.escrowStatus === "released" ? "Disponible" : o.escrowStatus === "paid" ? "Payé" : o.hoursUntilRelease ? `${o.hoursUntilRelease}h` : "En attente"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <SellerProductForm />
    </>
  );
}

/* ── Driver portal (real delivery queue from the DB) ── */
function DriverPortal() {
  const stats = useLiveStats();
  const [queue, setQueue] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadQueue = () => {
    fetch("/api/orders?all=1")
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setQueue((d.orders || []).filter((o: any) => ["pending", "confirmed", "shipped"].includes(o.status))))
      .catch(() => {});
  };

  useEffect(() => { loadQueue(); }, []);

  const markDelivered = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "delivered" }),
      });
      loadQueue();
    } catch {}
    setUpdating(null);
  };

  const markShipped = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: "shipped" }),
      });
      loadQueue();
    } catch {}
    setUpdating(null);
  };

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
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                    o.status === "shipped"
                      ? "border-gd-info/20 bg-gd-info/10 text-gd-info"
                      : o.status === "confirmed"
                      ? "border-gd-success/20 bg-gd-success/10 text-gd-success"
                      : "border-gd-accent-500/20 bg-gd-accent-500/10 text-gd-accent-400"
                  }`}>{o.status}</span>
                  {o.status === "confirmed" && (
                    <button onClick={() => markShipped(o.id)} disabled={updating === o.id}
                      className="rounded-lg bg-gd-info/20 px-3 py-1.5 text-xs font-medium text-gd-info hover:bg-gd-info/30 transition-colors disabled:opacity-50">
                      {updating === o.id ? "..." : "Ship"}
                    </button>
                  )}
                  {o.status === "shipped" && (
                    <button onClick={() => markDelivered(o.id)} disabled={updating === o.id}
                      className="rounded-lg bg-gd-success/20 px-3 py-1.5 text-xs font-medium text-gd-success hover:bg-gd-success/30 transition-colors disabled:opacity-50">
                      {updating === o.id ? "..." : "Deliver ✓"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

/* ── Delivery roadmap step indicator ── */
function DeliveryRoadmap({ status }: { status: string }) {
  const steps = [
    { key: "pending", label: "Order Placed", icon: Package },
    { key: "confirmed", label: "Confirmed", icon: BadgeCheck },
    { key: "shipped", label: "In Transit", icon: Truck },
    { key: "delivered", label: "Delivered", icon: Check },
  ];

  const statusOrder = ["pending", "confirmed", "shipped", "delivered"];
  const currentIdx = statusOrder.indexOf(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5">
        <X className="h-4 w-4 text-gd-danger" />
        <span className="text-xs font-medium text-gd-danger">Order Canceled</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, i) => {
        const isCompleted = i <= currentIdx;
        const isCurrent = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                isCompleted
                  ? "border-gd-success bg-gd-success/15 text-gd-success"
                  : "border-gd-border-strong bg-gd-elevated text-gd-text-muted"
              } ${isCurrent ? "ring-2 ring-gd-success/30 shadow-[0_0_12px_rgba(34,197,94,0.2)]" : ""}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight ${isCompleted ? "text-gd-text-primary" : "text-gd-text-muted"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all -mt-4 ${i < currentIdx ? "bg-gd-success" : "bg-gd-border-strong"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Single order card with product info + roadmap ── */
function OrderCard({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  const statusColors: Record<string, string> = {
    pending: "border-gd-accent-500/20 bg-gd-accent-500/10 text-gd-accent-400",
    confirmed: "border-gd-info/20 bg-gd-info/10 text-gd-info",
    shipped: "border-gd-olive-500/20 bg-gd-olive-500/10 text-gd-olive-500",
    delivered: "border-gd-success/20 bg-gd-success/10 text-gd-success",
    cancelled: "border-gd-danger/20 bg-gd-danger/10 text-gd-danger",
  };

  // Parse items from cart orders or single product orders
  const items: Array<{ productName: string; quantity: number; price: number }> = (() => {
    try {
      if (order.items_json) return JSON.parse(order.items_json);
    } catch {}
    return [{ productName: order.product_name, quantity: order.quantity, price: order.total_price }];
  })();

  return (
    <div className="rounded-xl border border-gd-border bg-gd-card overflow-hidden transition-all hover:border-gd-border-strong">
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-gd-elevated/30 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gd-accent-500/10 border border-gd-accent-500/10 text-gd-accent-400 shrink-0">
          <Package className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gd-text-primary truncate">{order.product_name}</p>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[order.status] || statusColors.pending}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-gd-text-muted mt-0.5">
            Order #{order.id.slice(-8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString()} · {items.length} item{items.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gd-text-primary">${Number(order.total_price).toFixed(2)}</p>
          {order.payment_method && (
            <p className="text-[10px] text-gd-text-muted uppercase">{order.payment_method}</p>
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gd-border px-4 py-4 space-y-4 bg-gd-elevated/20">
          {/* Delivery Roadmap */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted mb-3">Delivery Progress</p>
            <DeliveryRoadmap status={order.status} />
          </div>

          {/* Product items */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted mb-2">Products</p>
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-gd-elevated/50 border border-gd-border px-3 py-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-olive-500/10 text-sm font-bold text-gd-olive-500 shrink-0">
                    {item.productName?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gd-text-primary truncate">{item.productName}</p>
                    <p className="text-[10px] text-gd-text-muted">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-semibold text-gd-text-primary shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order details grid */}
          <div className="grid grid-cols-2 gap-3">
            {order.delivery_address && (
              <div className="rounded-xl bg-gd-elevated/50 border border-gd-border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">Delivery Address</p>
                <p className="mt-1 text-xs text-gd-text-primary">{order.delivery_address}</p>
              </div>
            )}
            {order.delivery_notes && (
              <div className="rounded-xl bg-gd-elevated/50 border border-gd-border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">Delivery Notes</p>
                <p className="mt-1 text-xs text-gd-text-primary">{order.delivery_notes}</p>
              </div>
            )}
            <div className="rounded-xl bg-gd-elevated/50 border border-gd-border p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">Payment Method</p>
              <p className="mt-1 text-xs text-gd-text-primary uppercase">{order.payment_method || "CCP"}</p>
            </div>
            {order.commission_amount > 0 && (
              <div className="rounded-xl bg-gd-elevated/50 border border-gd-border p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">Platform Fee</p>
                <p className="mt-1 text-xs text-gd-text-primary">${Number(order.commission_amount).toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Escrow info */}
          {order.escrow_status && (
            <div className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-2 ${
              order.escrow_status === "released"
                ? "border-gd-success/20 bg-gd-success/5"
                : "border-gd-accent-500/20 bg-gd-accent-500/5"
            }`}>
              <ShieldCheck className={`h-4 w-4 ${order.escrow_status === "released" ? "text-gd-success" : "text-gd-accent-400"}`} />
              <span className={`text-xs font-medium ${order.escrow_status === "released" ? "text-gd-success" : "text-gd-text-secondary"}`}>
                Escrow: {order.escrow_status === "released" ? "Funds released to seller" : order.escrow_status === "paid" ? "Payment confirmed" : "Held in escrow"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
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
  const inTransit = orders.filter(o => o.status === "shipped" || o.status === "confirmed").length;
  const delivered = orders.filter(o => o.status === "delivered").length;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={orders.length} icon={<ShoppingCart className="h-5 w-5" />} />
        <StatCard label="In Transit" value={inTransit} icon={<Truck className="h-5 w-5" />} trend={inTransit > 0 ? { value: inTransit, isPositive: true } : undefined} />
        <StatCard label="Delivered" value={delivered} icon={<BadgeCheck className="h-5 w-5" />} />
        <StatCard label="Total Spent" value={`$${totalSpent.toLocaleString()}`} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <Card>
        <SectionHead icon={<ShoppingCart className="h-4 w-4" />} title="My Purchases" sub="Track all your orders and delivery status" />
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gd-text-muted/30" />
            <p className="mt-3 text-sm text-gd-text-muted">No orders yet</p>
            <p className="mt-1 text-xs text-gd-text-muted">Browse the marketplace and make your first purchase!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
