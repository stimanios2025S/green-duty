"use client";
import { ShoppingCart, Star, ShieldCheck, Leaf as LeafIcon, ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);

  const imageUrl = product.imageUrl || product.images?.[0] || null;
  const showImage = imageUrl && !imgError;

  return (
    <Card hover className="flex cursor-pointer flex-col" onClick={onClick}>
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
        <h3 className="font-semibold text-gd-text-primary line-clamp-1">{product.name}</h3>
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
        <span className="rounded-xl bg-gd-elevated border border-gd-border px-3 py-2 text-xs font-medium text-gd-text-secondary transition-all group-hover:border-gd-accent-500/40 group-hover:text-gd-accent-400">
          View Details
        </span>
      </div>
      {product.warrantyMonths > 0 && (
        <p className="mt-1.5 text-[10px] text-gd-text-muted">{product.warrantyMonths}-month warranty</p>
      )}
    </Card>
  );
}
