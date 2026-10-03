import {
  LayoutDashboard, Briefcase, Package, Handshake, Users, FolderKanban, Wallet, Inbox, type LucideIcon
} from "lucide-react";
import type { AnyAccountType } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Client navigation — the same clean set for every signed-in non-owner,
 * regardless of which account_type the row happens to carry.
 */
export const CLIENT_TABS: NavItem[] = [
  { href: "/portal", label: "My Portal", icon: LayoutDashboard },
  { href: "/catalogue", label: "Catalogue", icon: Package },
  { href: "/partners", label: "Partners", icon: Handshake },
  { href: "/b2b", label: "Start a Project", icon: Briefcase },
];

/**
 * Every account type resolves to the client navigation.
 *
 * Accounts created before the agency pivot still carry legacy values
 * (guest, buyer, seller, driver, business, farmer). They all map here so an
 * existing account never lands on an empty sidebar.
 */
export const TABS_BY_ROLE: Record<AnyAccountType, NavItem[]> = {
  client: CLIENT_TABS,
  partner: CLIENT_TABS,
  guest: CLIENT_TABS,
  buyer: CLIENT_TABS,
  seller: CLIENT_TABS,
  driver: CLIENT_TABS,
  business: CLIENT_TABS,
  farmer: CLIENT_TABS,
};

export const ROLE_LABEL: Record<AnyAccountType, string> = {
  client: "Client",
  partner: "Partner",
  guest: "Client",
  buyer: "Client",
  seller: "Client",
  driver: "Client",
  business: "Client",
  farmer: "Client",
};

export const PORTAL_BY_ROLE: Record<AnyAccountType, string> = {
  client: "/portal",
  partner: "/portal",
  guest: "/portal",
  buyer: "/portal",
  seller: "/portal",
  driver: "/portal",
  business: "/portal",
  farmer: "/portal",
};

/**
 * Resolve nav for any account type that can appear in the database.
 * Unknown values fall back to the client tabs rather than rendering nothing.
 */
export function tabsForAccountType(type: string | undefined | null): NavItem[] {
  if (!type) return CLIENT_TABS;
  return (TABS_BY_ROLE as Record<string, NavItem[]>)[type] || CLIENT_TABS;
}

/** Human label for any account type. Unknown values read as "Client". */
export function roleLabelFor(type: string | undefined | null): string {
  if (!type) return "Client";
  return (ROLE_LABEL as Record<string, string>)[type] || "Client";
}

/**
 * The agency owner's navigation — the internal business dashboard.
 * Replaces the client tabs for whoever signs in with OWNER_EMAIL.
 */
export const OWNER_TABS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: Inbox },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/finance", label: "Finance", icon: Wallet },
  { href: "/dashboard/partners", label: "Partners", icon: Handshake },
];

export const OWNER_LABEL = "Agency";