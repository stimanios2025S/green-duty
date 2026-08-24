"use client";
import { X, Trash2, Minus, Plus, ShoppingCart, Loader2, CreditCard, Banknote, Wallet } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const PAYMENT_METHODS = [
  { id: "ccp", label: "CCP", sublabel: "Compte Courant Postal", icon: Wallet },
  { id: "edahabia", label: "Carte Edahabia", sublabel: "BNA / CPA", icon: CreditCard },
  { id: "bea", label: "BEA Carte", sublabel: "Banque de l'Agriculture", icon: CreditCard },
  { id: "delivery", label: "Paiement à la livraison", sublabel: "Cash upon delivery", icon: Banknote },
];

export function CartDrawer() {
  const { lines, total, isOpen, closeCart, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ccp");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [step, setStep] = useState<"cart" | "payment">("cart");

  if (!isOpen) return null;

  const checkout = async () => {
    if (!user) { setError("Veuillez vous connecter pour passer commande."); return; }
    if (lines.length === 0) return;
    setPlacing(true);
    setError("");
    try {
      for (const l of lines) {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buyerId: user.id,
            productId: l.productId,
            productName: l.name,
            quantity: l.quantity,
            totalPrice: l.price * l.quantity,
            paymentMethod,
            deliveryAddress,
          }),
        });
        if (!res.ok) throw new Error("Order failed");
      }
      clear();
      setPlaced(true);
      setTimeout(() => { setPlaced(false); setStep("cart"); closeCart(); }, 2500);
    } catch {
      setError("La commande a échoué. Veuillez réessayer.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeCart} />
      <div className="fixed right-0 top-0 z-[55] flex h-full w-full max-w-md flex-col border-l border-gd-border bg-gd-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gd-border px-5 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gd-text-primary">
            <ShoppingCart className="h-5 w-5 text-gd-accent-400" />
            {step === "cart" ? "Mon Panier" : "Paiement"}
          </h3>
          <button onClick={closeCart} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {placed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gd-success/10">
              <ShoppingCart className="h-8 w-8 text-gd-success" />
            </div>
            <p className="text-lg font-semibold text-gd-text-primary">Commande passée ! 🎉</p>
            <p className="text-sm text-gd-text-muted">Suivez-la dans votre portail.</p>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingCart className="h-12 w-12 text-gd-text-muted" />
            <p className="text-gd-text-muted">Votre panier est vide</p>
            <button onClick={closeCart} className="rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse">
              Parcourir le marché
            </button>
          </div>
        ) : step === "cart" ? (
          /* ── Cart Items ── */
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {lines.map(l => (
                <div key={l.productId} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gd-olive-500/10 text-sm font-bold text-gd-olive-500">
                    {l.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gd-text-primary">{l.name}</p>
                    <p className="text-xs text-gd-text-muted">{formatCurrency(l.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(l.productId, l.quantity - 1)} className="rounded-lg border border-gd-border p-1 text-gd-text-secondary hover:bg-gd-elevated"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center text-sm font-semibold text-gd-text-primary">{l.quantity}</span>
                    <button onClick={() => setQty(l.productId, l.quantity + 1)} className="rounded-lg border border-gd-border p-1 text-gd-text-secondary hover:bg-gd-elevated"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => remove(l.productId)} className="rounded-lg p-1.5 text-gd-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="border-t border-gd-border p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gd-text-secondary">Sous-total</span>
                <span className="text-xl font-bold text-gd-text-primary">{formatCurrency(total)}</span>
              </div>
              <button
                onClick={() => setStep("payment")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-olive-500/20 transition-all hover:shadow-gd-olive-500/40 hover:brightness-110"
              >
                Continuer vers le paiement
              </button>
            </div>
          </div>
        ) : (
          /* ── Payment Step ── */
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Delivery address */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gd-text-muted">Adresse de livraison</p>
                <textarea
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  placeholder="Adresse complète, wilaya..."
                  rows={2}
                  className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-olive-500/40 transition-colors resize-none"
                />
              </div>

              {/* Payment method */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gd-text-muted">Mode de paiement</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => {
                    const active = paymentMethod === pm.id;
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                          active
                            ? "border-gd-olive-500/40 bg-gd-olive-500/8"
                            : "border-gd-border bg-gd-elevated/50 hover:border-gd-border-strong"
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                          active ? "border-gd-olive-500/20 bg-gd-olive-500/15 text-gd-olive-500" : "border-gd-border bg-gd-card text-gd-text-secondary"
                        }`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-medium ${active ? "text-gd-olive-500" : "text-gd-text-primary"}`}>{pm.label}</span>
                          <span className="block text-[10px] text-gd-text-muted">{pm.sublabel}</span>
                        </span>
                        {active && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gd-olive-500">
                            <svg className="h-3 w-3 text-gd-text-inverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Commission info */}
              <div className="rounded-xl border border-gd-accent-500/10 bg-gd-accent-500/5 p-3">
                <p className="text-[11px] text-gd-text-secondary">
                  💡 Souscrivez à un plan pour réduire la commission de 5% à 0%.{" "}
                  <a href="/subscriptions" className="text-gd-olive-500 underline">Voir les plans</a>
                </p>
              </div>

              {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
            </div>

            {/* Footer */}
            <div className="border-t border-gd-border p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gd-text-secondary">Sous-total</span>
                <span className="text-sm font-medium text-gd-text-primary">{formatCurrency(total)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gd-text-secondary">Commission (5%)</span>
                <span className="text-sm font-medium text-gd-text-primary">{formatCurrency(total * 0.05)}</span>
              </div>
              <div className="mb-4 flex items-center justify-between border-t border-gd-border pt-2">
                <span className="text-sm font-semibold text-gd-text-primary">Total à payer</span>
                <span className="text-xl font-bold text-gd-text-primary">{formatCurrency(total * 1.05)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep("cart")}
                  className="rounded-xl border border-gd-border px-4 py-3 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={checkout}
                  disabled={placing}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-olive-500/20 transition-all hover:shadow-gd-olive-500/40 hover:brightness-110 disabled:opacity-50"
                >
                  {placing ? <><Loader2 className="h-4 w-4 animate-spin" /> Traitement...</> : "Confirmer la commande"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
