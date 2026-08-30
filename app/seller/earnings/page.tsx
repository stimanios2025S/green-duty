"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet, Clock, CheckCircle2, ArrowDownCircle, Package,
  Shield, Timer, Loader2
} from "lucide-react";

interface EarningsSummary {
  totalRevenue: number;
  totalCommission: number;
  heldInEscrow: number;
  availableForPayout: number;
  totalPaidOut: number;
  totalOrders: number;
}

interface OrderDetail {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  commission: number;
  sellerEarning: number;
  status: string;
  escrowStatus: string;
  hoursUntilRelease: number | null;
  releaseDate: string | null;
  paymentMethod: string;
  createdAt: string;
}

const ESCROW_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  held: { label: "En attente", color: "text-gd-accent-400", bg: "bg-gd-accent-500/10 border-gd-accent-500/20" },
  released: { label: "Disponible", color: "text-gd-success", bg: "bg-gd-success/10 border-gd-success/20" },
  paid: { label: "Payé", color: "text-gd-info", bg: "bg-gd-info/10 border-gd-info/20" },
};

export default function SellerEarningsPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);

  const loadEarnings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seller/earnings");
      if (res.ok) {
        const d = await res.json();
        setSummary(d.summary);
        setOrders(d.orders);
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { void Promise.resolve().then(loadEarnings); }, [loadEarnings]);

  const handlePayout = async (orderId: string) => {
    setPayoutLoading(orderId);
    try {
      const res = await fetch("/api/seller/earnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) loadEarnings();
    } catch {}
    setPayoutLoading(null);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gd-accent-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-gd-deepest p-4 md:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">💰 Mes Gains</h1>
          <p className="mt-1 text-sm text-gd-text-secondary">Revenus, escrow et paiements — argent transféré sous 24h après livraison</p>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard icon={<Wallet className="h-5 w-5" />} label="Chiffre d'affaires" value={formatCurrency(summary.totalRevenue)} color="text-gd-accent-400" />
            <StatCard icon={<Shield className="h-5 w-5" />} label="Commission GreenDuty" value={formatCurrency(summary.totalCommission)} color="text-gd-text-muted" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="En escrow" value={formatCurrency(summary.heldInEscrow)} color="text-gd-accent-400" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Disponible" value={formatCurrency(summary.availableForPayout)} color="text-gd-success" />
            <StatCard icon={<ArrowDownCircle className="h-5 w-5" />} label="Déjà payé" value={formatCurrency(summary.totalPaidOut)} color="text-gd-info" />
          </div>
        )}

        {/* Escrow explanation */}
        <div className="mb-6 rounded-xl border border-gd-accent-500/10 bg-gd-accent-500/5 p-4">
          <div className="flex items-start gap-3">
            <Timer className="mt-0.5 h-5 w-5 flex-shrink-0 text-gd-accent-400" />
            <div>
              <p className="text-sm font-medium text-gd-text-primary">Comment fonctionne l&apos;escrow ?</p>
              <p className="mt-1 text-xs text-gd-text-secondary leading-relaxed">
                L&apos;argent des commandes est d&apos;abord déposé chez GreenDuty. Dès que la commande est <strong className="text-gd-text-primary">livrée</strong>, un compteur de 24h démarre.
                Passé ce délai, les fonds sont automatiquement transférés sur votre compte. Vous pouvez aussi demander le retrait manuellement.
              </p>
            </div>
          </div>
        </div>

        {/* Order list */}
        <div className="rounded-xl border border-gd-border bg-gd-card">
          <div className="border-b border-gd-border px-5 py-3">
            <h2 className="text-sm font-semibold text-gd-text-primary">Détails des commandes</h2>
          </div>
          <div className="divide-y divide-gd-border">
            {orders.length === 0 ? (
              <p className="py-12 text-center text-sm text-gd-text-muted">Aucune commande pour le moment.</p>
            ) : (
              orders.map(o => {
                const escrow = ESCROW_LABELS[o.escrowStatus] || ESCROW_LABELS.held;
                return (
                  <div key={o.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 flex-shrink-0 text-gd-text-muted" />
                        <p className="truncate text-sm font-medium text-gd-text-primary">{o.productName}</p>
                        <span className="rounded-full bg-gd-elevated px-2 py-0.5 text-[10px] text-gd-text-muted">×{o.quantity}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gd-text-muted">
                        <span>Commande {o.id.slice(-8).toUpperCase()}</span>
                        <span>{new Date(o.createdAt).toLocaleDateString("fr-DZ")}</span>
                        <span className="capitalize">{o.paymentMethod || "ccp"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Earning breakdown */}
                      <div className="text-right">
                        <p className="text-sm font-bold text-gd-text-primary">{formatCurrency(o.sellerEarning)}</p>
                        <p className="text-[10px] text-gd-text-muted">− {formatCurrency(o.commission)} commission</p>
                      </div>

                      {/* Escrow badge */}
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${escrow.bg} ${escrow.color}`}>
                        {escrow.label}
                      </span>

                      {/* Countdown or payout button */}
                      {o.escrowStatus === "held" && o.hoursUntilRelease !== null && (
                        <div className="flex items-center gap-1 text-xs text-gd-accent-400">
                          <Clock className="h-3 w-3" />
                          <span>{o.hoursUntilRelease}h restantes</span>
                        </div>
                      )}
                      {o.escrowStatus === "released" && (
                        <button
                          onClick={() => handlePayout(o.id)}
                          disabled={payoutLoading === o.id}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gd-success to-gd-success px-4 py-2 text-xs font-semibold text-gd-text-inverse hover:brightness-110 disabled:opacity-50 transition-all"
                        >
                          {payoutLoading === o.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gd-border bg-gd-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={`${color}`}>{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">{label}</span>
      </div>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
