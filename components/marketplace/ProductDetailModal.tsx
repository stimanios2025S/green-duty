"use client";
import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import {
  X, Star, ShieldCheck, Leaf, ShoppingCart, Check, ChevronLeft, ChevronRight,
  Truck, Clock, BadgeCheck, Package, ImageIcon, Heart, Zap, ArrowRight
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const { add, openCart, openCheckout } = useCart();
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && boxRef.current) {
      anime({ targets: boxRef.current, opacity: [0, 1], translateY: [30, 0], scale: [0.96, 1], duration: 350, easing: "easeOutCubic" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setAdded(false);
      setBuying(false);
      setQuantity(1);
      setActiveImg(0);
      setWishlisted(false);
      setImgError(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const images = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];
  const hasImages = images.length > 0 && !imgError;
  const features: string[] = (() => { try { return typeof product.features === "string" ? JSON.parse(product.features) : product.features || []; } catch { return []; } })();
  const line = { productId: product.id, name: product.name, price: product.price, image: product.imageUrl || undefined };

  /** Add to cart and stay browsing — opens cart drawer so user sees confirmation */
  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) add(line);
    setAdded(true);
    // After brief confirmation, close modal and open cart drawer
    setTimeout(() => {
      onClose();
      openCart();
    }, 800);
  };

  /** Add to cart and jump straight to payment */
  const handleBuyNow = () => {
    setBuying(true);
    for (let i = 0; i < quantity; i++) add(line);
    onClose();
    // Open cart drawer directly on payment step
    setTimeout(() => openCheckout(), 150);
  };

  const nextImg = () => setActiveImg(i => (i + 1) % images.length);
  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length);

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
        <div ref={boxRef} className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gd-card border border-gd-border-soft shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
          {/* Close */}
          <button onClick={onClose} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gd-deepest/80 text-gd-text-muted backdrop-blur-sm hover:text-gd-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: Images */}
            <div className="relative bg-gd-elevated/50 p-6 flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px]">
              {hasImages ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[activeImg]} alt={product.name} className="max-h-72 w-full object-contain rounded-xl" onError={() => setImgError(true)} />
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-gd-deepest/70 text-gd-text-secondary backdrop-blur-sm hover:text-gd-text-primary transition-colors">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-gd-deepest/70 text-gd-text-secondary backdrop-blur-sm hover:text-gd-text-primary transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      <div className="flex gap-1.5 mt-3">
                        {images.map((_, i) => (
                          <button key={i} onClick={() => setActiveImg(i)} className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-6 bg-gd-accent-400" : "w-1.5 bg-gd-text-muted/40"}`} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="h-16 w-16 text-gd-accent-400/15" />
                  <div className="text-5xl font-bold text-gd-accent-400/15">{product.name[0]}</div>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.qualityCertified && (
                  <span className="flex items-center gap-1 rounded-full bg-gd-olive-500/20 border border-gd-olive-500/30 px-2 py-0.5 text-[10px] font-semibold text-gd-olive-400">
                    <ShieldCheck className="h-3 w-3" /> Quality Certified
                  </span>
                )}
                {product.organicCertified && (
                  <span className="flex items-center gap-1 rounded-full bg-gd-success/15 border border-gd-success/25 px-2 py-0.5 text-[10px] font-semibold text-gd-success">
                    <Leaf className="h-3 w-3" /> Organic
                  </span>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">{product.category.replace(/_/g, " ")}</span>
                  <h2 className="mt-1 text-xl font-bold text-gd-text-primary leading-tight">{product.name}</h2>
                </div>
                <button onClick={() => setWishlisted(!wishlisted)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gd-border bg-gd-elevated/50 transition-all hover:border-gd-danger/30">
                  <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-gd-danger text-gd-danger" : "text-gd-text-muted"}`} />
                </button>
              </div>

              {/* Seller */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gd-text-secondary">{product.sellerName}</span>
                {product.sellerVerified && (
                  <span className="flex items-center gap-0.5 rounded-full bg-gd-accent-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-gd-accent-400">
                    <BadgeCheck className="h-2.5 w-2.5" /> Verified
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? "fill-gd-accent-400 text-gd-accent-400" : "text-gd-text-muted/30"}`} />
                  ))}
                </div>
                <span className="text-sm font-medium text-gd-text-secondary">{product.rating}</span>
                <span className="text-xs text-gd-text-muted">({product.reviewCount} reviews)</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-gd-text-primary">{formatCurrency(product.price)}</span>
                {product.warrantyMonths > 0 && (
                  <span className="text-[10px] text-gd-text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {product.warrantyMonths}-month warranty
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-3 text-sm text-gd-text-secondary leading-relaxed">{product.description}</p>

              {/* Features */}
              {features.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gd-text-muted mb-2">Features</p>
                  <div className="flex flex-wrap gap-1.5">
                    {features.map((f, i) => (
                      <span key={i} className="rounded-full border border-gd-border bg-gd-elevated/50 px-2.5 py-1 text-[11px] font-medium text-gd-text-secondary">{f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock + delivery info */}
              <div className="mt-4 flex items-center gap-4 text-xs text-gd-text-muted">
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Free delivery on orders over 10,000 DA
                </span>
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Quantity + Actions */}
              <div className="mt-5 space-y-3">
                {/* Quantity selector */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gd-text-muted uppercase tracking-wider">Qty</span>
                  <div className="flex items-center rounded-xl border border-gd-border bg-gd-elevated/50">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 text-sm text-gd-text-secondary hover:text-gd-text-primary transition-colors"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-bold text-gd-text-primary">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                      className="px-3 py-2 text-sm text-gd-text-secondary hover:text-gd-text-primary transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gd-text-muted">
                    Total: <span className="font-bold text-gd-text-primary">{formatCurrency(product.price * quantity)}</span>
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0 || added}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      added
                        ? "border-gd-success/40 bg-gd-success/10 text-gd-success"
                        : "border-gd-border bg-gd-elevated/50 text-gd-text-secondary hover:border-gd-accent-500/30 hover:text-gd-accent-400 hover:bg-gd-accent-500/5"
                    }`}
                  >
                    {added ? (
                      <><Check className="h-4 w-4" /> Added!</>
                    ) : (
                      <><ShoppingCart className="h-4 w-4" /> Add to Cart</>
                    )}
                  </button>

                  {/* Buy Now */}
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock <= 0 || buying}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 px-5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:shadow-gd-accent-500/40 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {buying ? (
                      <><Zap className="h-4 w-4" /> Redirecting...</>
                    ) : (
                      <><Zap className="h-4 w-4" /> Buy Now <ArrowRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-1">
                  <span className="flex items-center gap-1 text-[10px] text-gd-text-muted">
                    <ShieldCheck className="h-3 w-3 text-gd-success" /> Secure payment
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gd-text-muted">
                    <Truck className="h-3 w-3 text-gd-info" /> Fast delivery
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gd-text-muted">
                    <Clock className="h-3 w-3 text-gd-accent-400" /> 24h support
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
