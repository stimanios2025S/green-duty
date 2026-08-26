"use client";
import { ShoppingCart, Star, ShieldCheck, Leaf as LeafIcon, Check, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { useState } from "react";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = product.imageUrl || product.images?.[0] || null;
  const showImage = imageUrl && !imgError;

  const handleAdd = () => {
    add({ productId: product.id, name: product.name, price: product.price });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Card hover className="flex flex-col">
      <div className="relative mb-3 flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-gd-accent-500/8 to-gd-olive-500/5 border border-gd-border overflow-hidden">
        {showImage ? (
          <img
            src={imageUrl!}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ImageIcon className="h-8 w-8 text-gd-accent-400/20" />
            <div className="text-4xl font-bold text-gd-accent-400/20">{product.name[0]}</div>
          </div>
        )}
        {product.qualityCertified && (
          <div className="absolute right-2 top-2 rounded-full bg-gd-olive-500/20 border border-gd-olive-500/30 p-1.5">
            <ShieldCheck className="h-3 w-3 text-gd-olive-400" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1 mb-1">
          {product.organicCertified && (
            <Badge variant="success"><LeafIcon className="h-3 w-3 mr-0.5" />Organic</Badge>
          )}
          <Badge variant="default">{product.category.replace(/_/g, ' ')}</Badge>
        </div>
        <h3 className="font-semibold text-gd-text-primary">{product.name}</h3>
        <p className="mt-1 text-xs text-gd-text-secondary line-clamp-2 leading-relaxed">{product.description}</p>
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3 w-3 fill-gd-accent-400 text-gd-accent-400" />
          <span className="text-xs font-medium text-gd-text-secondary">{product.rating}</span>
          <span className="text-xs text-gd-text-muted">({product.reviewCount})</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gd-border">
        <div>
          <p className="text-lg font-bold text-gd-text-primary">{formatCurrency(product.price)}</p>
          <p className="text-xs text-gd-text-muted">{product.stock} in stock</p>
        </div>
        <button
          onClick={handleAdd}
          className={`rounded-xl p-2.5 transition-all ${
            added
              ? "bg-gd-success text-white"
              : "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse hover:brightness-110 shadow-sm shadow-gd-accent-500/10"
          }`}
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        </button>
      </div>
      {product.warrantyMonths > 0 && (
        <p className="mt-1.5 text-[10px] text-gd-text-muted">{product.warrantyMonths}-month warranty</p>
      )}
    </Card>
  );
}
