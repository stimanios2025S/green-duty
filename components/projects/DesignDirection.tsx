"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Link2, Palette, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, PrimaryButton, ErrorNote, Select, TextArea, TextInput } from "@/components/dashboard/kit";
import { DESIGN_REFERENCE_STATUS_LABEL, DESIGN_REFERENCE_STATUS_VARIANT } from "@/lib/agency";
import { DESIGN_STYLES } from "@/lib/catalog-data";

/**
 * Design direction — the client's chosen style plus any specific references.
 *
 * References are outbound links ONLY. The referenced page or image is never
 * fetched, proxied, cached or embedded (see app/api/design-references/route.ts
 * for the full rule). They render as <a target="_blank" rel="noopener
 * noreferrer"> and nothing else.
 */

interface Reference {
  id: string;
  title: string | null;
  reference_url: string;
  client_notes: string | null;
  owner_notes?: string | null;
  status: string;
  created_at: string;
}

export function DesignDirection({
  projectId,
  owner,
  designStyle,
}: {
  projectId: string;
  owner: boolean;
  designStyle?: string | null;
}) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = () => setReloadKey(k => k + 1);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/design-references?projectId=${encodeURIComponent(projectId)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d) setReferences(d.references || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadKey]);

  const addReference = async () => {
    setError("");
    if (!url.trim()) {
      setError("Paste a link to the design you like.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/design-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, referenceUrl: url, clientNotes: notes }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Couldn't save that reference.");
      setTitle("");
      setUrl("");
      setNotes("");
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that reference.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    const res = await fetch("/api/design-references", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) refresh();
    else setError("Couldn't update that reference.");
  };

  const remove = async (id: string) => {
    const res = await fetch("/api/design-references", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) refresh();
    else setError("Couldn't remove that reference.");
  };

  const agreed = references.find(r => r.status === "agreed");
  const chosenStyle = DESIGN_STYLES.find(s => s.id === designStyle) || null;

  return (
    <div className="space-y-6">
      {/* The style picked at order time, so both sides can see it next to the
          specific inspirations. */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gd-accent-500/10 bg-gd-accent-500/10 text-gd-accent-400">
            <Palette className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-gd-text-primary">
              {chosenStyle ? chosenStyle.name : "No direction chosen yet"}
            </h3>
            {chosenStyle ? (
              <>
                <p className="mt-1 text-sm text-gd-text-secondary">{chosenStyle.layout}</p>
                <p className="mt-1 text-[11px] text-gd-text-muted">
                  Nav · {chosenStyle.navigation} — Colour · {chosenStyle.temperature} — Density · {chosenStyle.density}
                </p>
                <p className="mt-1 text-[11px] text-gd-text-muted">Best for: {chosenStyle.bestFor}</p>
              </>
            ) : (
              <p className="mt-1 text-sm text-gd-text-secondary">
                No starting style was picked when this project was ordered. References below still apply.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Add */}
      <Card>
        <h3 className="font-semibold text-gd-text-primary">Add a design reference</h3>
        <p className="mt-1 text-xs text-gd-text-muted">
          Found a layout, colour mood or navigation pattern you like? Paste the link and tell us what appeals to you.
          We design something original from it — we don&apos;t copy it.
        </p>

        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The dashboard layout" />
            </Field>
            <Field label="Link" hint="Must start with https://">
              <TextInput
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://…"
                inputMode="url"
              />
            </Field>
          </div>
          <Field label="What do you like about it?">
            <TextArea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="The sidebar, the density, the way the numbers are grouped…"
            />
          </Field>
          <ErrorNote>{error}</ErrorNote>
          <PrimaryButton onClick={addReference} loading={saving}>
            <Plus className="h-4 w-4" /> Save reference
          </PrimaryButton>
        </div>
      </Card>

      {/* List */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-gd-text-primary">References</h3>
          {agreed && <Badge variant="success">Agreed direction: {agreed.title || "reference"}</Badge>}
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-gd-text-muted">Loading…</p>
        ) : references.length === 0 ? (
          <p className="py-6 text-center text-sm text-gd-text-muted">
            No references yet. They&apos;re optional — a chosen style is often enough.
          </p>
        ) : (
          <div className="space-y-3">
            {references.map(ref => (
              <div key={ref.id} className="rounded-xl border border-gd-border bg-gd-elevated/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gd-text-primary">
                      {ref.title || "Untitled reference"}
                    </p>
                    {/* Outbound link only — never an iframe, never a proxy. */}
                    <a
                      href={ref.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-gd-accent-400 hover:underline"
                    >
                      <Link2 className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{ref.reference_url}</span>
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={DESIGN_REFERENCE_STATUS_VARIANT[ref.status] || "default"}>
                      {DESIGN_REFERENCE_STATUS_LABEL[ref.status] || ref.status}
                    </Badge>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => remove(ref.id)}
                        className="rounded-lg p-1.5 text-gd-text-muted transition-colors hover:bg-gd-danger/10 hover:text-gd-danger"
                        title="Delete reference"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {ref.client_notes && (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-gd-text-secondary">{ref.client_notes}</p>
                )}

                {owner && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gd-border pt-3">
                    <Select
                      value={ref.status}
                      onChange={e => setStatus(ref.id, e.target.value)}
                      className="w-40 px-2 py-1 text-xs"
                    >
                      <option value="suggested">Suggested</option>
                      <option value="agreed">Agreed</option>
                      <option value="rejected">Rejected</option>
                    </Select>
                    {ref.owner_notes && (
                      <span className="text-[11px] text-gd-text-muted">Your note: {ref.owner_notes}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
