import type { BadgeVariant } from "./agency";

/* ────────────────────────────────────────────────────────────────────────
 * The agency's offering catalogue.
 *
 * One source of truth shared by the landing page and /catalogue, so the two
 * can never drift apart. Icons are referenced by key and mapped to real
 * lucide components in the UI layer, which keeps this module free of React.
 * ──────────────────────────────────────────────────────────────────────── */

export const CATALOG_CATEGORIES = ["erp", "mes", "crm", "web", "mobile", "platform", "ai"] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

export const CATALOG_CATEGORY_LABEL: Record<CatalogCategory, string> = {
  erp: "ERP",
  mes: "MES",
  crm: "CRM",
  web: "Web Applications",
  mobile: "Mobile Apps",
  platform: "Platforms",
  ai: "AI",
};

export const CATALOG_CATEGORY_VARIANT: Record<CatalogCategory, BadgeVariant> = {
  erp: "success",
  mes: "warning",
  crm: "info",
  web: "purple",
  mobile: "info",
  platform: "default",
  ai: "success",
};

/** Icon keys resolved to lucide components in the UI. */
export type CatalogIconKey =
  | "erp"
  | "mes"
  | "crm"
  | "web"
  | "mobile"
  | "platform"
  | "ai"
  | "integration"
  | "analytics";

export interface CatalogOffering {
  id: string;
  name: string;
  category: CatalogCategory;
  icon: CatalogIconKey;
  tagline: string;
  description: string;
  modules: string[];
  timeline: string;
  /** Shown in the three-card strip on the landing page. */
  featured?: boolean;
}

export const CATALOG_OFFERINGS: CatalogOffering[] = [
  {
    id: "erp-personalized",
    name: "Personalized ERP",
    category: "erp",
    icon: "erp",
    tagline: "Built around your process, not a template",
    description:
      "A full ERP shaped to the way your factory actually runs — your workflows, your terminology, your approval chain. No forcing your operation into someone else's idea of a standard process.",
    modules: [
      "Production planning & scheduling",
      "Bill of materials & routing",
      "Procurement & supplier management",
      "Stock, warehouses & movements",
      "Quality control & non-conformance",
      "Costing & margin analysis",
      "HR, shifts & payroll",
      "Custom reporting",
    ],
    timeline: "3–9 months",
    featured: true,
  },
  {
    id: "mes",
    name: "MES — Manufacturing Execution",
    category: "mes",
    icon: "mes",
    tagline: "See the shop floor as it happens",
    description:
      "Capture what is really happening on the line — production, downtime, scrap and quality — and turn it into numbers you can act on the same shift.",
    modules: [
      "Work order execution",
      "Shop-floor data capture",
      "Machine monitoring & OEE",
      "Downtime & reason codes",
      "Batch traceability",
      "Shift handover",
    ],
    timeline: "2–5 months",
    featured: true,
  },
  {
    id: "crm",
    name: "CRM — Sales & Customers",
    category: "crm",
    icon: "crm",
    tagline: "From first enquiry to repeat order",
    description:
      "Track every lead, quotation and customer conversation in one place, connected to the orders and invoices that follow.",
    modules: [
      "Leads & pipeline",
      "Quotations & price lists",
      "Customer history",
      "After-sales & tickets",
      "Sales reporting",
    ],
    timeline: "1–3 months",
    featured: true,
  },
  {
    id: "web-apps",
    name: "Custom Web Applications",
    category: "web",
    icon: "web",
    tagline: "Internal tools that fit like they were made for you",
    description:
      "Dashboards, portals and back-office tools built for exactly the people who will use them — replacing the spreadsheets that have outgrown the job.",
    modules: [
      "Role-based access control",
      "Operational dashboards",
      "Document management",
      "Approval workflows",
      "Third-party integrations",
    ],
    timeline: "6 weeks – 4 months",
  },
  {
    id: "mobile-apps",
    name: "Mobile Applications",
    category: "mobile",
    icon: "mobile",
    tagline: "The system, in your hand",
    description:
      "Android and iOS apps for the people who aren't sitting at a desk — warehouse, field and delivery teams working with poor connectivity.",
    modules: [
      "Offline-first data capture",
      "Barcode & QR scanning",
      "Photo evidence",
      "Push notifications",
      "Field operations",
    ],
    timeline: "2–4 months",
  },
  {
    id: "platforms",
    name: "Multi-Tenant Platforms",
    category: "platform",
    icon: "platform",
    tagline: "When you are the product, not just a user",
    description:
      "Business platforms that serve many customers at once — subscriptions, tenant isolation and an admin console you control.",
    modules: [
      "Tenant management",
      "Subscriptions & billing",
      "Admin console",
      "Public APIs",
      "Usage analytics",
    ],
    timeline: "3–8 months",
  },
  {
    id: "ai-erp",
    name: "AI-Personalized Systems",
    category: "ai",
    icon: "ai",
    tagline: "Software that learns your operation",
    description:
      "We read your real data to shape the system around you: your terminology, your recurring exceptions, your bottlenecks — and flag problems before they cost you a shift.",
    modules: [
      "Process mining from your records",
      "Adaptive forms & terminology",
      "Demand & stock forecasting",
      "Anomaly detection",
      "Maintenance prediction",
    ],
    timeline: "Add-on to any build",
  },
  {
    id: "integration",
    name: "System Integration & APIs",
    category: "platform",
    icon: "integration",
    tagline: "Make the systems you already own talk",
    description:
      "Your machines, scales, accounting package and legacy tools connected to one another — and to the new system — without re-keying anything twice.",
    modules: [
      "ERP ↔ MES bridge",
      "Legacy system connectors",
      "Machine & PLC data capture",
      "Bank & payment integrations",
      "Data migration",
    ],
    timeline: "3 weeks – 3 months",
  },
  {
    id: "bi",
    name: "Business Intelligence & Reporting",
    category: "ai",
    icon: "analytics",
    tagline: "Numbers your managers will actually open",
    description:
      "KPI dashboards and scheduled reports built on your operational data, so month-end stops being an archaeology exercise.",
    modules: [
      "KPI dashboards",
      "Custom reports",
      "Scheduled exports",
      "Cost & margin analysis",
      "Drill-down by line, product, shift",
    ],
    timeline: "3 weeks – 2 months",
  },
  {
    id: "supplier-portal",
    name: "Customer & Supplier Portals",
    category: "web",
    icon: "web",
    tagline: "Let them serve themselves",
    description:
      "Give customers and suppliers a place to place orders, check status and download documents — so your team stops answering the same email.",
    modules: [
      "Order & delivery tracking",
      "Document download",
      "Self-service requests",
      "Notification preferences",
    ],
    timeline: "4–10 weeks",
  },
  {
    id: "erp-migration",
    name: "ERP Migration & Rescue",
    category: "erp",
    icon: "integration",
    tagline: "When the last system didn't work out",
    description:
      "We migrate you off a system that never fitted, or take over one that has stalled — auditing the data, the process gaps and the code before committing to a plan.",
    modules: [
      "Process & data audit",
      "Historical data migration",
      "Parallel-run planning",
      "Team training & handover",
    ],
    timeline: "1–4 months",
  },
];

export const FEATURED_OFFERINGS = CATALOG_OFFERINGS.filter(o => o.featured);

/* ── Industries served ── */
export interface Industry {
  name: string;
  description: string;
}

export const INDUSTRIES: Industry[] = [
  { name: "Manufacturing", description: "Production planning, shop-floor control and traceability." },
  { name: "Food Processing", description: "Batch traceability, hygiene records and shelf-life control." },
  { name: "Construction & Materials", description: "Project costing, materials and site reporting." },
  { name: "Logistics & Distribution", description: "Fleet visibility, delivery tracking and warehouse control." },
  { name: "Retail & Wholesale", description: "Stock, purchasing and multi-location sales." },
  { name: "Pharmaceuticals & Cosmetics", description: "Compliance records and lot genealogy." },
  { name: "Textiles & Apparel", description: "Style, cut and production-line tracking." },
  { name: "Professional Services", description: "Client work, time and billing." },
];

/* ── The personalized-ERP argument, in the owner's words ── */
export const PERSONALIZED_ERP_POINTS: { title: string; body: string }[] = [
  {
    title: "Your process comes first",
    body: "We document how your factory already works — the steps, the exceptions, the approvals — and build the system to match. You do not re-engineer your operation to satisfy a template.",
  },
  {
    title: "Your language, not ours",
    body: "Every screen, field and report uses the terms your team already says out loud. A 'batch' on your floor is not called a 'lot' because a vendor's manual says so.",
  },
  {
    title: "Your rules, encoded",
    body: "Approval chains, tolerances, shift patterns and costing rules are written into the system as rules — not left to whoever remembers them.",
  },
  {
    title: "Yours to keep",
    body: "You own the code and the data. We hand over documentation and train your team, so you are never locked into us to make a change.",
  },
];

/* ── Partnership model ── */
export interface PartnershipType {
  name: string;
  description: string;
}

export const PARTNERSHIP_TYPES: PartnershipType[] = [
  {
    name: "Technology Partners",
    description:
      "Infrastructure, database, cloud and hardware vendors whose products we build on and recommend without reservation.",
  },
  {
    name: "Integration Partners",
    description:
      "Specialists who connect machinery, PLCs, scales and legacy systems — so the data reaches the ERP intact.",
  },
  {
    name: "Resellers",
    description:
      "Regional partners who introduce us to factories and handle first-line local support on installations.",
  },
  {
    name: "Finance Partners",
    description:
      "Banks and leasing companies that help clients fund an ERP or MES rollout across instalments.",
  },
  {
    name: "Logistics Partners",
    description:
      "Fulfilment and distribution operators whose services plug directly into our clients' dispatch modules.",
  },
  {
    name: "Consulting Partners",
    description:
      "Process, quality and compliance consultancies who help prepare a factory before the software arrives.",
  },
];

/* ── Design directions (§2.4) ──────────────────────────────────────────────
 * Our own vocabulary for interface mood, written from scratch. A client picks
 * a starting point — or skips — and we design something original from it.
 * Deliberately NOT a gallery of other people's screenshots: nothing here is
 * borrowed, embedded, proxied or referenced from a third party.
 * ────────────────────────────────────────────────────────────────────────── */

export interface DesignStyle {
  id: string;
  name: string;
  /** How the screen is organised. */
  layout: string;
  /** How people move around it. */
  navigation: string;
  /** Colour temperature and contrast. */
  temperature: string;
  /** How much is on screen at once. */
  density: string;
  /** Who it suits. */
  bestFor: string;
}

export const DESIGN_STYLES: DesignStyle[] = [
  {
    id: "minimal-dashboard",
    name: "Minimal Dashboard",
    layout: "One question answered per screen, with generous white space and a single dominant figure.",
    navigation: "A short left rail of top-level areas, plus a global search.",
    temperature: "Light, cool neutrals with one restrained accent for actions.",
    density: "Low — few elements, large type, plenty of breathing room.",
    bestFor: "Executives and owners who check a handful of numbers rather than work in the system.",
  },
  {
    id: "data-dense-operations",
    name: "Data-Dense Operations",
    layout: "Full-width tables and grids, with filters pinned above and detail opening beside the list.",
    navigation: "A collapsible rail plus breadcrumbs, tuned for keyboard-only use.",
    temperature: "Light background, strong borders, colour reserved for status.",
    density: "High — many rows visible at once, compact type, tight row heights.",
    bestFor: "Planners, buyers and warehouse teams processing hundreds of records a day.",
  },
  {
    id: "dark-control-room",
    name: "Dark Control Room",
    layout: "A wall of live panels sized by importance, designed to be read from a distance.",
    navigation: "Persistent top-level tabs with drill-down panels rather than page changes.",
    temperature: "Dark surfaces with high-contrast accent indicators.",
    density: "Medium — panel-based, each tile holding one live measure.",
    bestFor: "Supervisors monitoring a line or a fleet where the screen is always on.",
  },
  {
    id: "soft-saas-panels",
    name: "Soft SaaS Panels",
    layout: "Rounded cards on a calm canvas, grouped into a clear visual hierarchy.",
    navigation: "A left rail with nested sections and a top bar for account actions.",
    temperature: "Warm off-whites with muted pastel status colours.",
    density: "Medium-low — comfortable cards, scannable headings.",
    bestFor: "Sales, HR and admin teams who live in the system all day and value calm over speed.",
  },
  {
    id: "industrial-hmi",
    name: "Industrial HMI",
    layout: "Large touch targets laid out in the shape of the process, left to right.",
    navigation: "Flat, purpose-built screens switched by tabs rather than deep menus.",
    temperature: "High-contrast with safety-signal colours used strictly and consistently.",
    density: "Medium — big controls, big readouts, no ambiguity about state.",
    bestFor: "Operators on a shop-floor terminal, sometimes wearing gloves.",
  },
];
