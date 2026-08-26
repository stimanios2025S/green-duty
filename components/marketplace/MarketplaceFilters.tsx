"use client";
import { useState, useEffect } from "react";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductDetailModal } from "@/components/marketplace/ProductDetailModal";
import { products as mockProducts } from "@/lib/mock-data";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Product, ProductCategory } from "@/types";

const categories = [
  { label: "All", value: "all" as const },
  { label: "Seeds", value: "seeds" as const },
  { label: "Fertilizers", value: "fertilizers" as const },
  { label: "Irrigation", value: "irrigation" as const },
  { label: "Tools", value: "tools" as const },
  { label: "Organic", value: "organic_produce" as const },
  { label: "Smart Farming", value: "smart_farming" as const },
  { label: "Bio Pesticides", value: "bio_pesticides" as const },
  { label: "Sensors", value: "sensors" as const },
];

export function MarketplaceFilters() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    fetch(`/api/products?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setDbProducts(d.products || []))
      .catch(() => {});
  }, [category, search]);

  // Merge DB products with mock data (DB products take priority by id)
  const allProducts = [...dbProducts, ...mockProducts.filter(m => !dbProducts.some(d => d.id === m.id))];

  const filtered = allProducts.filter(p => {
    if (category !== "all" && p.category !== category) return false;
    if (certifiedOnly && !p.qualityCertified) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openDetail = (product: Product) => {
    setSelectedProduct(product);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      {/* Search + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gd-text-muted" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gd-border bg-gd-card py-2.5 pl-10 pr-4 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gd-text-muted" />
          <label className="flex items-center gap-2 text-sm text-gd-text-secondary cursor-pointer">
            <input type="checkbox" checked={certifiedOnly} onChange={e => setCertifiedOnly(e.target.checked)} className="rounded border-gd-border-strong bg-gd-elevated accent-gd-accent-500" />
            Quality Certified Only
          </label>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(c => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
              category === c.value
                ? 'bg-gd-accent-500 text-gd-text-inverse border-gd-accent-500'
                : 'bg-gd-card text-gd-text-secondary border-gd-border hover:border-gd-accent-500/30'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <AnimeWrapper animate="stagger" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map(p => (
          <ProductCard key={p.id} product={p} onClick={() => openDetail(p)} />
        ))}
      </AnimeWrapper>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-gd-text-muted text-sm">No products found matching your filters.</p>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedProduct(null); }}
      />
    </div>
  );
}
