import {
  Leaf, LayoutDashboard, ShoppingBag, MapPin, BookOpen, Trees, Briefcase, Package, Truck, Building2
} from "lucide-react";
import type { AccountType } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: any;
}

export const ALL_TABS: NavItem[] = [
  { href: "/", label: "Home", icon: Leaf },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/eco-map", label: "Eco Map", icon: MapPin },
  { href: "/feed", label: "Knowledge Feed", icon: BookOpen },
  { href: "/tree-tracker", label: "Tree Tracker", icon: Trees },
  { href: "/b2b", label: "B2B Services", icon: Briefcase },
];

/**
 * Role-specific tab sets:
 * - Business & seller get commerce/B2B focused tabs
 * - Buyers & drivers get marketplace + logistics tabs
 * - Guest/citizen gets the full citizen experience
 */
export const TABS_BY_ROLE: Record<AccountType, NavItem[]> = {
  guest: ALL_TABS,
  buyer: [
    { href: "/", label: "Home", icon: Leaf },
    { href: "/dashboard", label: "My Portal", icon: LayoutDashboard },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/feed", label: "Knowledge Feed", icon: BookOpen },
    { href: "/eco-map", label: "Eco Map", icon: MapPin },
    { href: "/tree-tracker", label: "Tree Tracker", icon: Trees },
  ],
  seller: [
    { href: "/", label: "Home", icon: Leaf },
    { href: "/dashboard", label: "My Store", icon: LayoutDashboard },
    { href: "/marketplace", label: "Sell Products", icon: Package },
    { href: "/b2b", label: "B2B Services", icon: Briefcase },
  ],
  driver: [
    { href: "/", label: "Home", icon: Leaf },
    { href: "/dashboard", label: "My Deliveries", icon: LayoutDashboard },
    { href: "/marketplace", label: "Orders", icon: Truck },
    { href: "/eco-map", label: "Eco Map", icon: MapPin },
  ],
  business: [
    { href: "/", label: "Home", icon: Leaf },
    { href: "/dashboard", label: "Business Portal", icon: Building2 },
    { href: "/b2b", label: "B2B Services", icon: Briefcase },
    { href: "/marketplace", label: "Procurement", icon: ShoppingBag },
    { href: "/tree-tracker", label: "CSR & Trees", icon: Trees },
  ],
};

export const ROLE_LABEL: Record<AccountType, string> = {
  guest: "Guest",
  buyer: "Buyer",
  seller: "Seller",
  driver: "Driver",
  business: "Business",
};

export const PORTAL_BY_ROLE: Record<AccountType, string> = {
  guest: "/dashboard",
  buyer: "/dashboard",
  seller: "/dashboard",
  driver: "/dashboard",
  business: "/dashboard",
};
