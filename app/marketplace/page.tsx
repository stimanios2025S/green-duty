"use client";
import { useEffect, useRef } from "react";
import anime from "animejs";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { CartDrawer } from "@/components/marketplace/CartDrawer";
import { CartProvider, useCart } from "@/lib/cart-store";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { ShieldCheck, ShoppingCart } from "lucide-react";

function CartButton() {
  const { count, openCart } = useCart();
  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-2 rounded-xl border border-gd-border bg-gd-card px-4 py-2 text-sm font-medium text-gd-text-secondary hover:border-gd-accent-500/40 hover:text-gd-text-primary transition-colors"
    >
      <ShoppingCart className="h-4 w-4 text-gd-accent-400" />
      Cart
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gd-ember-500 text-[10px] font-bold text-white shadow-md shadow-gd-ember-500/30">
          {count}
        </span>
      )}
    </button>
  );
}

function MarketplaceInner() {
  const titleRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" }); }, []);
  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">Agri-Tech Marketplace</h1>
            <p className="text-sm text-gd-text-secondary mt-1">Quality-assured products for farmers, growers, and agri-businesses</p>
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <div className="flex items-center gap-2 rounded-xl bg-gd-accent-500/5 border border-gd-accent-500/10 px-4 py-2">
              <ShieldCheck className="h-4 w-4 text-gd-accent-400" />
              <span className="text-xs font-medium text-gd-accent-400">Quality-checked</span>
            </div>
            <CartButton />
          </div>
        </div>
      </AnimeWrapper>
      <MarketplaceFilters />
      <CartDrawer />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <CartProvider>
      <MarketplaceInner />
    </CartProvider>
  );
}
