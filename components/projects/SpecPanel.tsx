"use client";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BUDGET_RANGE_LABEL, SPEC_MODULE_LABEL } from "@/lib/agency";

/**
 * Read-only specification, shared by the owner workspace and the client
 * portal. Neither can edit it here — it is the record of what was agreed.
 */

export interface SpecShape {
  id: string;
  project_name?: string | null;
  business_type?: string | null;
  industry?: string | null;
  company_size?: string | null;
  current_process?: string | null;
  pain_points?: string | null;
  required_modules?: string[];
  roles?: string[];
  data_migration?: string | null;
  integrations?: string[];
  languages?: string[];
  reporting_needs?: string | null;
  hardware_requirements?: string | null;
  security_requirements?: string | null;
  deadline?: string | null;
  budget_range?: string | null;
  definition_of_done?: string | null;
  full_summary?: string | null;
  status?: string;
}

export function SpecPanel({ spec, heading }: { spec: SpecShape | null; heading?: string }) {
  if (!spec) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gd-border bg-gd-elevated text-gd-text-muted">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-semibold text-gd-text-primary">No specification yet</h3>
            <p className="mt-1 text-sm text-gd-text-secondary">
              This project doesn&apos;t have a written specification. It may have come in through a phone call or
              email — the details can be written up later.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gd-text-primary">{heading || spec.project_name || "Specification"}</h3>
        {spec.status && <Badge>{spec.status.replace(/_/g, " ")}</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business type" value={spec.business_type} />
        <Field label="Industry" value={spec.industry} />
        <Field label="Number of users" value={spec.company_size} />
        <Field label="Deadline" value={spec.deadline} />
      </div>

      <div className="mt-4 space-y-4">
        <Block label="How they work today" value={spec.current_process} />
        <Block label="Main problem to solve" value={spec.pain_points} />
        <Block label="Data migration" value={spec.data_migration} />
        <Block label="Reporting needs" value={spec.reporting_needs} />
        <Block label="Hardware requirements" value={spec.hardware_requirements} />
        <Block label="Security &amp; access control" value={spec.security_requirements} />
        <Block label="Definition of done" value={spec.definition_of_done} />
      </div>

      {!!spec.required_modules?.length && (
        <Chips label="Required modules" values={spec.required_modules} map={SPEC_MODULE_LABEL} />
      )}
      {!!spec.roles?.length && <Chips label="Roles" values={spec.roles} />}
      {!!spec.integrations?.length && <Chips label="Integrations" values={spec.integrations} />}
      {!!spec.languages?.length && <Chips label="Languages" values={spec.languages} />}

      {spec.budget_range && (
        <div className="mt-4 border-t border-gd-border pt-4">
          <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">Budget range</p>
          <p className="mt-1 text-sm text-gd-text-primary">
            {BUDGET_RANGE_LABEL[spec.budget_range] || spec.budget_range}
          </p>
        </div>
      )}

      {spec.full_summary && (
        <p className="mt-4 whitespace-pre-wrap border-t border-gd-border pt-4 text-xs leading-relaxed text-gd-text-secondary">
          {spec.full_summary}
        </p>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-xl border border-gd-border bg-gd-elevated/40 p-3.5">
      <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">{label}</p>
      <p className="mt-1 text-sm text-gd-text-primary">{value}</p>
    </div>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-gd-text-muted">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gd-text-secondary">{value}</p>
    </div>
  );
}

function Chips({
  label,
  values,
  map,
}: {
  label: string;
  values: string[];
  map?: Record<string, string>;
}) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] uppercase tracking-wider text-gd-text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {values.map(v => (
          <Badge key={v}>{map?.[v] || v}</Badge>
        ))}
      </div>
    </div>
  );
}
