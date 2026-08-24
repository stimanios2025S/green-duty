"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import { Check, Zap, Crown, Star, ArrowRight } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  max_listings: number;
  commission_rate: number;
}

const PLAN_ICONS: Record<string, typeof Check> = {
  plan_basic: Zap,
  plan_pro: Star,
  plan_premium: Crown,
};

const PLAN_COLORS: Record<string, { gradient: string; border: string; glow: string; badge: string }> = {
  plan_basic: {
    gradient: "from-gd-olive-500/10 to-gd-olive-600/5",
    border: "border-gd-olive-500/20",
    glow: "shadow-gd-olive-500/10",
    badge: "bg-gd-olive-500/15 text-gd-olive-500",
  },
  plan_pro: {
    gradient: "from-gd-accent-400/10 to-gd-accent-600/5",
    border: "border-gd-accent-400/25",
    glow: "shadow-gd-accent-400/15",
    badge: "bg-gd-accent-400/15 text-gd-accent-400",
  },
  plan_premium: {
    gradient: "from-purple-500/10 to-purple-600/5",
    border: "border-purple-400/25",
    glow: "shadow-purple-400/15",
    badge: "bg-purple-400/15 text-purple-400",
  },
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions/plans")
      .then(r => r.json())
      .then(d => { setPlans(d.plans || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const subscribe = async (planId: string) => {
    if (!user) { window.location.href = "/login"; return; }
    setSubscribing(planId);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, planId, billingCycle: cycle }),
      });
      if (res.ok) {
        alert("Abonnement activé avec succès !");
      } else {
        const d = await res.json();
        alert(d.error || "Erreur lors de l'abonnement");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060608", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", borderRadius: "9999px", padding: "0.375rem 1rem", background: "rgba(132,204,22,0.08)", border: "1px solid rgba(132,204,22,0.2)", marginBottom: "1rem" }}>
            <Zap style={{ width: "0.875rem", height: "0.875rem", color: "#84cc16" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#84cc16" }}>Plans d'abonnement</span>
          </div>
          <h1 style={{ fontFamily: "'Lexend', sans-serif", fontSize: "2.25rem", fontWeight: 300, color: "#f4f4f5", letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
            Travaillez <span style={{ color: "#84cc16" }}>intelligemment</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "#71717a", maxWidth: "32rem", margin: "0 auto", lineHeight: 1.7 }}>
            Choisissez le plan qui correspond à vos besoins. Économisez en réduisant la commission et en débloquant des fonctionnalités avancées.
          </p>

          {/* Cycle toggle */}
          <div style={{ display: "inline-flex", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", padding: "3px", marginTop: "1.5rem" }}>
            {(["monthly", "annual"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "0.625rem", border: "none", cursor: "pointer",
                  fontSize: "0.8125rem", fontWeight: 500, fontFamily: "'Lexend', sans-serif",
                  transition: "all 0.25s ease",
                  ...(cycle === c
                    ? { background: "linear-gradient(135deg, #84cc16, #65a30d)", color: "#060608", boxShadow: "0 2px 12px rgba(132,204,22,0.25)" }
                    : { background: "transparent", color: "#71717a" }),
                }}
              >
                {c === "monthly" ? "Mensuel" : "Annuel (éco)"}
              </button>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
            <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", border: "2px solid rgba(132,204,22,0.2)", borderTopColor: "#84cc16", animation: "spin 0.8s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
            {plans.map((plan, i) => {
              const Icon = PLAN_ICONS[plan.id] || Zap;
              const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.plan_basic;
              const price = cycle === "monthly" ? plan.price_monthly : plan.price_annual;
              const monthlyEquiv = cycle === "annual" ? Math.round(plan.price_annual / 12) : plan.price_monthly;
              const savings = cycle === "annual" ? plan.price_monthly * 12 - plan.price_annual : 0;
              const features: string[] = (() => { try { return JSON.parse(plan.features as any); } catch { return []; } })();

              return (
                <div
                  key={plan.id}
                  style={{
                    position: "relative",
                    borderRadius: "1.25rem",
                    border: `1px solid ${i === 1 ? "rgba(250,204,21,0.25)" : "rgba(255,255,255,0.06)"}`,
                    background: `linear-gradient(180deg, rgba(${i === 0 ? "132,204,22" : i === 1 ? "250,204,21" : "168,85,247"},0.04) 0%, rgba(19,19,24,0.95) 100%)`,
                    padding: "2rem",
                    boxShadow: i === 1 ? "0 0 40px rgba(250,204,21,0.08)" : "none",
                  }}
                >
                  {i === 1 && (
                    <div style={{
                      position: "absolute", top: "-0.75rem", left: "50%", transform: "translateX(-50%)",
                      borderRadius: "9999px", padding: "0.25rem 1rem",
                      background: "linear-gradient(135deg, #facc15, #f59e0b)",
                      fontSize: "0.6875rem", fontWeight: 600, color: "#060608",
                    }}>
                      ⭐ Le plus populaire
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <span style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "2.75rem", height: "2.75rem", borderRadius: "0.75rem",
                      background: `rgba(${i === 0 ? "132,204,22" : i === 1 ? "250,204,21" : "168,85,247"},0.1)`,
                      color: i === 0 ? "#84cc16" : i === 1 ? "#facc15" : "#a855f7",
                    }}>
                      <Icon style={{ width: "1.25rem", height: "1.25rem" }} />
                    </span>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#f4f4f5", fontFamily: "'Lexend', sans-serif" }}>{plan.name}</h3>
                      {plan.commission_rate === 0 ? (
                        <span style={{ fontSize: "0.6875rem", color: "#84cc16", fontWeight: 500 }}>Zéro commission</span>
                      ) : (
                        <span style={{ fontSize: "0.6875rem", color: "#71717a" }}>Commission {plan.commission_rate * 100}%</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                      <span style={{ fontSize: "2rem", fontWeight: 300, color: "#f4f4f5", fontFamily: "'Lexend', sans-serif" }}>
                        {formatCurrency(monthlyEquiv)}
                      </span>
                      <span style={{ fontSize: "0.8125rem", color: "#71717a" }}>/mois</span>
                    </div>
                    {cycle === "annual" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.375rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "#71717a", textDecoration: "line-through" }}>
                          {formatCurrency(plan.price_monthly * 12)}/an
                        </span>
                        <span style={{ fontSize: "0.6875rem", color: "#84cc16", fontWeight: 600, borderRadius: "9999px", padding: "0.125rem 0.5rem", background: "rgba(132,204,22,0.1)" }}>
                          Économisez {formatCurrency(savings)}
                        </span>
                      </div>
                    )}
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {features.map((f, fi) => (
                      <li key={fi} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "0.8125rem", color: "#a1a1aa" }}>
                        <Check style={{ width: "1rem", height: "1rem", color: i === 0 ? "#84cc16" : i === 1 ? "#facc15" : "#a855f7", flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => subscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      borderRadius: "0.75rem", padding: "0.75rem", border: "none", cursor: "pointer",
                      fontSize: "0.8125rem", fontWeight: 600, fontFamily: "'Lexend', sans-serif",
                      transition: "all 0.25s ease",
                      ...(i === 1
                        ? { background: "linear-gradient(135deg, #facc15, #f59e0b)", color: "#060608", boxShadow: "0 4px 16px rgba(250,204,21,0.2)" }
                        : { background: `rgba(${i === 0 ? "132,204,22" : "168,85,247"},0.12)`, color: i === 0 ? "#84cc16" : "#a855f7", border: `1px solid rgba(${i === 0 ? "132,204,22" : "168,85,247"},0.2)` }),
                      opacity: subscribing === plan.id ? 0.5 : 1,
                    }}
                  >
                    {subscribing === plan.id ? "Traitement..." : "Souscrire maintenant"}
                    <ArrowRight style={{ width: "1rem", height: "1rem" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust section */}
        <div style={{ marginTop: "4rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.8125rem", color: "#71717a" }}>
            🔒 Paiement sécurisé · Annulation à tout moment · Support 24/7
          </p>
        </div>
      </div>
    </div>
  );
}
