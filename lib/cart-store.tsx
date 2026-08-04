"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartValue {
  lines: CartLine[];
  count: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (line: Omit<CartLine, "quantity">) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const add = useCallback((line: Omit<CartLine, "quantity">) => {
    setLines(prev => {
      const existing = prev.find(l => l.productId === line.productId);
      if (existing) return prev.map(l => (l.productId === line.productId ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { ...line, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const remove = useCallback((productId: string) => {
    setLines(prev => prev.filter(l => l.productId !== productId));
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines(prev => qty <= 0 ? prev.filter(l => l.productId !== productId) : prev.map(l => (l.productId === productId ? { ...l, quantity: qty } : l)));
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, count, total, isOpen, openCart, closeCart, add, remove, setQty, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
