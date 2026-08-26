"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, ShoppingCart, Truck, Building2, Sprout, Users,
  ArrowRight, Loader2, Leaf
} from "lucide-react";

const PORTALS = [
  { role: "seller", label: "Seller", desc: "List products, manage store, earnings & CRM", icon: Store, color: "from-gd-accent-500 to-gd-accent-600", email: "seller@greenduty.dev" },
  { role: "buyer", label: "Buyer", desc: "Browse marketplace, place orders, track delivery", icon: ShoppingCart, color: "from-gd-olive-500 to-gd-olive-600", email: "buyer@greenduty.dev" },
  { role: "driver", label: "Driver", desc: "View deliveries, confirm shipping & delivery", icon: Truck, color: "from-gd-info to-blue-600", email: "driver@greenduty.dev" },
  { role: "business", label: "Business", desc: "B2B services, CSR, procurement dashboard", icon: Building2, color: "from-purple-500 to-purple-700", email: "business@greenduty.dev" },
  { role: "farmer", label: "Farmer", desc: "Farm CRM, crops, harvests, inventory tracking", icon: Sprout, color: "from-emerald-500 to-emerald-700", email: "farmer@greenduty.dev" },
  { role: "guest", label: "Guest / Citizen", desc: "Report pollution, join cleanups, eco map", icon: Users, color: "from-gray-500 to-gray-700", email: "guest@greenduty.dev" },
];

export default function DevPortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const enterPortal = async (role: string) => {
    setLoading(role);
    try {
      const res = await fetch("/api/auth/dev-bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push(role === "farmer" ? "/farmer" : "/dashboard");
      }
    } catch {}
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-gd-deepest flex flex-col">
      {/* Header */}
      <div className="border-b border-gd-border px-6 py-5">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gd-accent-500/10 border border-gd-accent-500/20">
            <Leaf className="h-5 w-5 text-gd-accent-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gd-text-primary">GreenDuty — Dev Portal</h1>
            <p className="text-xs text-gd-text-muted">Select a role to enter. All accounts are pre-created, no password needed.</p>
          </div>
        </div>
      </div>

      {/* Portal grid */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="mx-auto max-w-4xl w-full">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PORTALS.map(p => {
              const Icon = p.icon;
              const isLoading = loading === p.role;
              return (
                <button
                  key={p.role}
                  onClick={() => enterPortal(p.role)}
                  disabled={!!loading}
                  className="group relative rounded-2xl border border-gd-border bg-gd-card p-6 text-left transition-all hover:border-gd-accent-500/30 hover:bg-gd-elevated hover:shadow-lg hover:shadow-gd-accent-500/5 disabled:opacity-50"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white mb-4`}>
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Icon className="h-6 w-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-gd-text-primary">{p.label}</h3>
                  <p className="mt-1 text-sm text-gd-text-secondary leading-relaxed">{p.desc}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-gd-text-muted font-mono">{p.email}</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-gd-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Enter <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer info */}
          <div className="mt-8 rounded-xl border border-gd-accent-500/10 bg-gd-accent-500/5 p-4 text-center">
            <p className="text-xs text-gd-text-secondary">
              🔧 <strong className="text-gd-text-primary">Dev Mode</strong> — No passwords, no email verification.
              Click any portal to enter instantly. Remove this page before production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
