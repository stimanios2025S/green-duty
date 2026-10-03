"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Boxes,
  Check,
  Clock,
  FileText,
  Loader2,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OfferingIcon } from "@/components/catalog/OfferingIcon";
import { ErrorNote, Field, Select, TextArea, TextInput } from "@/components/dashboard/kit";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  CATALOG_CATEGORY_LABEL,
  CATALOG_CATEGORY_VARIANT,
  CATALOG_OFFERINGS,
  DESIGN_STYLES,
} from "@/lib/catalog-data";
import {
  BUDGET_RANGES,
  BUDGET_RANGE_LABEL,
  CONTACT_PREFERENCE_LABEL,
  SPEC_MODULES,
  SPEC_MODULE_LABEL,
} from "@/lib/agency";

/**
 * The ordering flow (§3).
 *
 * One page, five clearly separated steps, so a client can see everything they
 * have chosen as they go. The offering is resolved from lib/catalog-data.ts by
 * id — an unknown id shows a clear fallback rather than crashing.
 */

type DescriptionPath = "written_brief" | "sales_email" | "sales_phone";

interface PlacedOrder {
  id: string;
  offering_name: string;
  design_style: string | null;
  budget_range: string | null;
  contact_preference: string | null;
}

const inputClass =
  "rounded-xl border border-gd-border bg-gd-base px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/50";

export default function OrderNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
        </div>
      }
    >
      <OrderInner />
    </Suspense>
  );
}

function OrderInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const initialId = params.get("offering") || "";
  const [offeringId, setOfferingId] = useState(initialId);

  const [designStyle, setDesignStyle] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [path, setPath] = useState<DescriptionPath>("written_brief");

  const [sales, setSales] = useState<{ email: string | null; whatsapp: string | null }>({ email: null, whatsapp: null });

  const [spec, setSpec] = useState({
    projectName: "",
    businessType: "",
    industry: "",
    numberOfUsers: "",
    currentProcess: "",
    mainProblem: "",
    requiredModules: [] as string[],
    languages: "",
    integrations: "",
    deadline: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  const offering = CATALOG_OFFERINGS.find(o => o.id === offeringId) || null;
  const style = DESIGN_STYLES.find(s => s.id === designStyle) || null;

  // /order/new is a public path so that we — not the app shell — control the
  // sign-in redirect, which is what lets the chosen offering survive the trip
  // through login and verification.
  useEffect(() => {
    if (isLoading || user) return;
    const target = `/order/new?offering=${encodeURIComponent(initialId)}`;
    router.replace(`/login?next=${encodeURIComponent(target)}`);
  }, [isLoading, user, initialId, router]);

  // Sales contact details come from the server so unset values hide the
  // options instead of producing broken links.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/sales-contact")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d) setSales({ email: d.email ?? null, whatsapp: d.whatsapp ?? null });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // If the chosen direct-contact route isn't configured, fall back to the
  // written brief. Derived rather than stored, so there is no effect syncing
  // state (react-hooks/set-state-in-effect) and no flash of a dead option.
  const effectivePath: DescriptionPath =
    path === "sales_email" && !sales.email
      ? "written_brief"
      : path === "sales_phone" && !sales.whatsapp
        ? "written_brief"
        : path;

  const toggleModule = (module: string) =>
    setSpec(s => ({
      ...s,
      requiredModules: s.requiredModules.includes(module)
        ? s.requiredModules.filter(m => m !== module)
        : [...s.requiredModules, module],
    }));

  const placeOrder = async () => {
    if (!offering) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/project-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offeringId: offering.id,
          designStyle,
          budgetRange,
          contactPreference: effectivePath,
          spec: effectivePath === "written_brief" ? spec : undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "We couldn't place that order.");
      setPlaced(json.order as PlacedOrder);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't place that order.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Waiting on the session before deciding where the visitor belongs ── */
  if (isLoading || !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" />
      </div>
    );
  }

  /* ── Unknown / missing offering ── */
  if (!offering && !placed) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Card>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gd-warning/20 bg-gd-warning/10 text-gd-warning">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-gd-text-primary">We couldn&apos;t find that offering</h1>
              <p className="mt-1 text-sm text-gd-text-secondary">
                The link you followed doesn&apos;t match anything in our catalogue. Pick what you need and we&apos;ll
                start from there.
              </p>
              <Link
                href="/catalogue"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse"
              >
                <Boxes className="h-4 w-4" /> Back to the catalogue
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ── Confirmation (§3.5) ── */
  if (placed) {
    const mailto = sales.email
      ? `mailto:${sales.email}?subject=${encodeURIComponent(`Order ${placed.id} — ${placed.offering_name}`)}&body=${encodeURIComponent(
          `Hello GreenDuty,\n\nI've placed order ${placed.id} for ${placed.offering_name}.\n\nMy account: ${user?.email ?? ""}\n\nProject details:\n`
        )}`
      : null;
    const wa = sales.whatsapp
      ? `https://wa.me/${sales.whatsapp}?text=${encodeURIComponent(
          `Hello GreenDuty, I've placed order ${placed.id} for ${placed.offering_name}.`
        )}`
      : null;

    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Card>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gd-success/20 bg-gd-success/10 text-gd-success">
            <BadgeCheck className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-gd-text-primary">Order placed</h1>
          <p className="mt-2 text-sm leading-relaxed text-gd-text-secondary">
            We have your request. Adil and the team review every order personally — we&apos;ll read through what
            you&apos;ve told us and come back to you with questions, a plan and a realistic timeline.
          </p>

          <dl className="mt-6 space-y-3">
            <Row label="Order reference" value={placed.id} mono />
            <Row label="Offering" value={placed.offering_name} />
            <Row label="Design direction" value={style?.name || "Not chosen yet"} />
            <Row label="Budget" value={BUDGET_RANGE_LABEL[placed.budget_range || ""] || "Not specified"} />
            <Row label="How you described it" value={CONTACT_PREFERENCE_LABEL[placed.contact_preference || ""] || "—"} />
          </dl>

          {(mailto || wa) && (
            <div className="mt-6 rounded-xl border border-gd-border bg-gd-elevated/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gd-text-muted">
                Send us the detail now (optional)
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {mailto && (
                  <a
                    href={mailto}
                    className="inline-flex items-center gap-2 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-primary hover:border-gd-border-strong"
                  >
                    <Mail className="h-4 w-4" /> Email sales
                  </a>
                )}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-primary hover:border-gd-border-strong"
                  >
                    <Phone className="h-4 w-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse"
            >
              Go to my portal <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary hover:text-gd-text-primary"
            >
              Browse the catalogue
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const categoryVariant = CATALOG_CATEGORY_VARIANT[offering!.category];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm text-gd-text-secondary transition-colors hover:text-gd-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-gd-text-primary">Start your order</h1>
      <p className="mt-2 text-sm leading-relaxed text-gd-text-secondary">
        Five short steps. Nothing is charged here — this tells us what you need so we can come back with a plan.
      </p>

      <div className="mt-8 space-y-6">
        {/* ── Step 1 — what you're ordering ── */}
        <Step n={1} title="What you're ordering">
          <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-gd-accent-500/10 bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400">
                <OfferingIcon icon={offering!.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gd-text-primary">{offering!.name}</p>
                  <Badge variant={categoryVariant}>{CATALOG_CATEGORY_LABEL[offering!.category]}</Badge>
                </div>
                <p className="mt-1 text-xs font-medium text-gd-accent-400">{offering!.tagline}</p>
                <p className="mt-2 text-sm leading-relaxed text-gd-text-secondary">{offering!.description}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-gd-text-muted">
                  <Clock className="h-3 w-3" /> Typical timeline {offering!.timeline} · {offering!.modules.length} modules
                </p>
              </div>
            </div>
          </div>

          <Field label="Changed your mind?" className="mt-4">
            <Select value={offeringId} onChange={e => setOfferingId(e.target.value)}>
              {CATALOG_OFFERINGS.map(o => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
        </Step>

        {/* ── Step 2 — design style ── */}
        <Step n={2} title="Design direction" hint="Optional — you can decide later.">
          <div className="grid gap-3 sm:grid-cols-2">
            {DESIGN_STYLES.map(s => {
              const active = designStyle === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDesignStyle(active ? "" : s.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-all",
                    active
                      ? "border-gd-accent-500/50 bg-gd-accent-500/5 glow-ring"
                      : "border-gd-border bg-gd-card hover:border-gd-border-strong"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm font-semibold", active ? "text-gd-accent-400" : "text-gd-text-primary")}>
                      {s.name}
                    </p>
                    {active && <Check className="h-4 w-4 text-gd-accent-400" />}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-gd-text-secondary">{s.layout}</p>
                  <dl className="mt-2 space-y-0.5 text-[10px] text-gd-text-muted">
                    <div>Nav · {s.navigation}</div>
                    <div>Colour · {s.temperature}</div>
                    <div>Density · {s.density}</div>
                  </dl>
                </button>
              );
            })}
          </div>
          {designStyle && <p className="mt-2 text-[11px] text-gd-text-muted">Best for: {style?.bestFor}</p>}
        </Step>

        {/* ── Step 3 — budget ── */}
        <Step n={3} title="Budget range" hint="Never required — “not sure yet” is a fine answer.">
          <Select value={budgetRange} onChange={e => setBudgetRange(e.target.value)}>
            <option value="">Prefer not to say yet</option>
            {BUDGET_RANGES.map(b => (
              <option key={b} value={b}>
                {BUDGET_RANGE_LABEL[b]}
              </option>
            ))}
          </Select>
        </Step>

        {/* ── Step 4 — how to describe the project ── */}
        <Step n={4} title="How would you like to describe your project?">
          <div className="space-y-2">
            {/* Option A is not built yet — shown as informational, never as a
                control that leads nowhere. */}
            <div className="rounded-xl border border-dashed border-gd-border-soft bg-gd-card/40 p-4">
              <p className="flex items-center gap-2 text-sm font-medium text-gd-text-muted">
                <Sparkles className="h-4 w-4" /> Talk to our AI agent
                <span className="rounded-full border border-gd-border bg-gd-elevated px-2 py-0.5 text-[10px] font-medium">
                  Coming soon
                </span>
              </p>
              <p className="mt-1 text-xs text-gd-text-muted">
                An AI interview that writes your specification for you. Until it&apos;s ready, the written brief
                below captures the same detail.
              </p>
            </div>

            <PathOption
              active={effectivePath === "written_brief"}
              onSelect={() => setPath("written_brief")}
              icon={<FileText className="h-4 w-4" />}
              title="Write it yourself"
              description="A short form covering what you do today and what you want to change."
            />

            {sales.email && (
              <PathOption
                active={effectivePath === "sales_email"}
                onSelect={() => setPath("sales_email")}
                icon={<Mail className="h-4 w-4" />}
                title="Email our sales team"
                description={`Opens your mail client with the details filled in. ${sales.email}`}
              />
            )}

            {sales.whatsapp && (
              <PathOption
                active={effectivePath === "sales_phone"}
                onSelect={() => setPath("sales_phone")}
                icon={<Phone className="h-4 w-4" />}
                title="WhatsApp or phone"
                description={`Message us with the order pre-filled. ${sales.whatsapp}`}
              />
            )}
          </div>

          {effectivePath === "written_brief" && (
            <div className="mt-4 space-y-4 rounded-xl border border-gd-border bg-gd-elevated/40 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Project name">
                  <TextInput
                    value={spec.projectName}
                    onChange={e => setSpec({ ...spec, projectName: e.target.value })}
                    placeholder="e.g. Production planning overhaul"
                    className={inputClass}
                  />
                </Field>
                <Field label="Business type">
                  <TextInput
                    value={spec.businessType}
                    onChange={e => setSpec({ ...spec, businessType: e.target.value })}
                    placeholder="e.g. Manufacturer"
                    className={inputClass}
                  />
                </Field>
                <Field label="Industry">
                  <TextInput
                    value={spec.industry}
                    onChange={e => setSpec({ ...spec, industry: e.target.value })}
                    placeholder="e.g. Food processing"
                    className={inputClass}
                  />
                </Field>
                <Field label="Number of users">
                  <TextInput
                    value={spec.numberOfUsers}
                    onChange={e => setSpec({ ...spec, numberOfUsers: e.target.value })}
                    placeholder="e.g. 25"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="How you work today">
                <TextArea
                  value={spec.currentProcess}
                  onChange={e => setSpec({ ...spec, currentProcess: e.target.value })}
                  placeholder="Which systems and spreadsheets you use, and how work actually flows day to day…"
                  className={inputClass}
                />
              </Field>

              <Field label="The main problem to solve">
                <TextArea
                  value={spec.mainProblem}
                  onChange={e => setSpec({ ...spec, mainProblem: e.target.value })}
                  placeholder="What breaks, what's slow, what you can't see today…"
                  className={inputClass}
                />
              </Field>

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gd-text-muted">
                  Modules you need
                </p>
                <div className="flex flex-wrap gap-2">
                  {SPEC_MODULES.map(m => {
                    const active = spec.requiredModules.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModule(m)}
                        className={cn(
                          "rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                          active
                            ? "border-gd-accent-500/50 bg-gd-accent-500/10 text-gd-accent-400"
                            : "border-gd-border bg-gd-card text-gd-text-secondary hover:border-gd-border-strong"
                        )}
                      >
                        {SPEC_MODULE_LABEL[m]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Languages needed">
                  <TextInput
                    value={spec.languages}
                    onChange={e => setSpec({ ...spec, languages: e.target.value })}
                    placeholder="e.g. French, Arabic, English"
                    className={inputClass}
                  />
                </Field>
                <Field label="Integrations needed">
                  <TextInput
                    value={spec.integrations}
                    onChange={e => setSpec({ ...spec, integrations: e.target.value })}
                    placeholder="e.g. accounting package, scales, payment"
                    className={inputClass}
                  />
                </Field>
                <Field label="Deadline">
                  <TextInput
                    value={spec.deadline}
                    onChange={e => setSpec({ ...spec, deadline: e.target.value })}
                    placeholder="e.g. before the summer shutdown"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          )}

          {effectivePath === "sales_email" && sales.email && (
            <div className="mt-4 rounded-xl border border-gd-border bg-gd-elevated/40 p-4 text-xs text-gd-text-secondary">
              We&apos;ll record your order first, then give you an email link with the reference filled in — so the
              details reach us even if your mail client doesn&apos;t open.
            </div>
          )}
          {effectivePath === "sales_phone" && sales.whatsapp && (
            <div className="mt-4 rounded-xl border border-gd-border bg-gd-elevated/40 p-4 text-xs text-gd-text-secondary">
              We&apos;ll record your order first, then give you a WhatsApp link with the reference filled in. You can
              also reach us on{" "}
              <span className="select-all font-medium text-gd-text-primary">+{sales.whatsapp}</span>.
            </div>
          )}
        </Step>

        {/* ── Step 5 — confirm ── */}
        <Step n={5} title="Confirm">
          <dl className="space-y-3 rounded-xl border border-gd-border bg-gd-elevated/40 p-4">
            <Row label="Offering" value={offering!.name} />
            <Row label="Category" value={CATALOG_CATEGORY_LABEL[offering!.category]} />
            <Row label="Typical timeline" value={offering!.timeline} />
            <Row label="Design direction" value={style?.name || "Not chosen"} />
            <Row label="Budget" value={BUDGET_RANGE_LABEL[budgetRange] || "Not specified"} />
            <Row label="How you'll describe it" value={CONTACT_PREFERENCE_LABEL[effectivePath] || "—"} />
            <Row label="Account" value={user?.email || "—"} />
          </dl>

          <ErrorNote>{error}</ErrorNote>

          <button
            onClick={placeOrder}
            disabled={submitting}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Placing your order…
              </>
            ) : (
              <>
                Place order <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[11px] text-gd-text-muted">
            No payment is taken now. You&apos;ll see this order in your portal straight away.
          </p>
        </Step>
      </div>
    </div>
  );
}

/* ── Small presentational helpers ── */

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gd-accent-500/20 bg-gd-accent-500/10 text-xs font-bold text-gd-accent-400">
          {n}
        </span>
        <div>
          <h2 className="font-semibold text-gd-text-primary">{title}</h2>
          {hint && <p className="text-xs text-gd-text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function PathOption({
  active,
  onSelect,
  icon,
  title,
  description,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
        active ? "border-gd-accent-500/50 bg-gd-accent-500/5 glow-ring" : "border-gd-border bg-gd-card hover:border-gd-border-strong"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border",
          active ? "border-gd-accent-500/20 bg-gd-accent-500/15 text-gd-accent-400" : "border-gd-border bg-gd-elevated text-gd-text-secondary"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-sm font-medium", active ? "text-gd-accent-400" : "text-gd-text-primary")}>
          {title}
        </span>
        <span className="mt-0.5 block text-xs text-gd-text-muted">{description}</span>
      </span>
    </button>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-xs uppercase tracking-wider text-gd-text-muted">{label}</dt>
      <dd className={cn("text-sm font-medium text-gd-text-primary", mono && "font-mono")}>{value}</dd>
    </div>
  );
}
