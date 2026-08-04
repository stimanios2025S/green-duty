"use client";
import { X, Trash2, Minus, Plus, ShoppingCart, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";

export function CartDrawer() {
  const { lines, total, isOpen, closeCart, setQty, remove, clear } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const checkout = async () => {
    if (!user) { setError("Please sign in to checkout."); return; }
    if (lines.length === 0) return;
    setPlacing(true);
    setError("");
    try {
      // Place one order per line (or a single order; here: one per line for tracking)
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
          }),
        });
        if (!res.ok) throw new Error("Order failed");
      }
      clear();
      setPlaced(true);
      setTimeout(() => { setPlaced(false); closeCart(); }, 2200);
    } catch (e) {
      setError("Checkout failed. Please try again.");
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
            <ShoppingCart className="h-5 w-5 text-gd-accent-400" /> Cart
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
            <p className="text-lg font-semibold text-gd-text-primary">Order placed! 🎉</p>
            <p className="text-sm text-gd-text-muted">Track it in your portal.</p>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingCart className="h-12 w-12 text-gd-text-muted" />
            <p className="text-gd-text-muted">Your cart is empty</p>
            <button onClick={closeCart} className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse">
              Browse marketplace
            </button>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {lines.map(l => (
              <div key={l.productId} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gd-accent-500/10 text-sm font-bold text-gd-accent-400">
                  {l.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gd-text-primary">{l.name}</p>
                  <p className="text-xs text-gd-text-muted">${l.price.toFixed(2)}</p>
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
        )}

        {/* Footer */}
        {!placed && lines.length > 0 && (
          <div className="border-t border-gd-border p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-gd-text-secondary">Total</span>
              <span className="text-xl font-bold text-gd-text-primary">${total.toFixed(2)}</span>
            </div>
            {error && <p className="mb-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
            <button
              onClick={checkout}
              disabled={placing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50"
            >
              {placing ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing order...</> : "Checkout"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
