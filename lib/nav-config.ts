import {
  Leaf, LayoutDashboard, ShoppingBag, MapPin, BookOpen, Trees, Briefcase, Package, Truck, Building2, Sprout, ClipboardList, CreditCard, type LucideIcon
} from "lucide-react";
import type { AccountType } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ALL_TABS: NavItem[] = [
  { href: "/", label: "Home", icon: Leaf },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/eco-map", label: "Eco Map", icon: MapPin },
  { href: "/feed", label: "InstaGro", icon: BookOpen },
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
    { href: "/buyer/crm", label: "Daily CRM", icon: ClipboardList },
    { href: "/feed", label: "InstaGro", icon: BookOpen },
    { href: "/eco-map", label: "Eco Map", icon: MapPin },
    { href: "/subscriptions", label: "Abonnements", icon: CreditCard },
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
  farmer: [
    { href: "/", label: "Home", icon: Leaf },
    { href: "/farmer", label: "Farm Portal", icon: Sprout },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/eco-map", label: "Eco Map", icon: MapPin },
  ],
};

export const ROLE_LABEL: Record<AccountType, string> = {
  guest: "Guest",
  buyer: "Buyer",
  seller: "Seller",
  driver: "Driver",
  business: "Business",
  farmer: "Farmer",
};

export const PORTAL_BY_ROLE: Record<AccountType, string> = {
  guest: "/dashboard",
  buyer: "/dashboard",
  seller: "/dashboard",
  driver: "/dashboard",
  business: "/dashboard",
  farmer: "/farmer",
};
