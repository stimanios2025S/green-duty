"use client";
import { useState, useEffect } from "react";
import { X, MapPin, Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface ReportModalProps { isOpen: boolean; onClose: () => void; onSubmitted?: () => void; initialLat?: number | null; initialLng?: number | null; }
export function ReportModal({ isOpen, onClose, onSubmitted, initialLat, initialLng }: ReportModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", pollutionType: "plastics", severity: "moderate" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [lat, setLat] = useState<number | null>(initialLat || null);
  const [lng, setLng] = useState<number | null>(initialLng || null);

  // Keep in sync if the parent passes new coords (map click)
  useEffect(() => {
    if (initialLat != null && initialLng != null) {
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [initialLat, initialLng]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    if (!user) { setError("Please sign in to report a hotspot."); return; }
    if (form.title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
    if (form.description.trim().length < 20) { setError("Please provide a detailed description."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hotspots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          pollutionType: form.pollutionType,
          severity: form.severity,
          address: lat && lng ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Unknown location",
          lat: lat,
          lng: lng,
          reporterId: user.id,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setTimeout(() => {
        setDone(false);
        setForm({ title: "", description: "", pollutionType: "plastics", severity: "moderate" });
        setLat(null); setLng(null);
        onClose();
        onSubmitted?.();
      }, 1800);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-14 w-14 text-gd-success" />
              <p className="mt-4 text-lg font-semibold text-gd-text-primary">Report submitted!</p>
              <p className="mt-1 text-sm text-gd-text-muted">Community members will see it on the map.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gd-text-primary">Report Pollution Hotspot</h3>
                <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gd-text-secondary">Title</label>
                  <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Plastic waste near river" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gd-text-secondary">Pollution Type</label>
                  <select value={form.pollutionType} onChange={e => setForm({...form, pollutionType: e.target.value})} className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 transition-colors">
                    <option value="plastics">Plastics</option>
                    <option value="chemical_waste">Chemical Waste</option>
                    <option value="illegal_dumping">Illegal Dumping</option>
                    <option value="deforestation">Deforestation</option>
                    <option value="water_pollution">Water Pollution</option>
                    <option value="air_pollution">Air Pollution</option>
                    <option value="soil_contamination">Soil Contamination</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gd-text-secondary">Severity</label>
                  <div className="mt-1 flex gap-2">
                    {["low","moderate","severe","critical"].map(s => (
                      <button
                        key={s}
                        onClick={() => setForm({...form, severity: s})}
                        className={`rounded-xl px-4 py-2 text-xs font-medium border transition-all ${
                          form.severity === s
                            ? 'bg-gd-accent-500 text-gd-text-inverse border-gd-accent-500'
                            : 'bg-gd-card text-gd-text-secondary border-gd-border hover:border-gd-accent-500/30'
                        }`}
                      >
                        {s.charAt(0).toUpperCase()+s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gd-text-secondary">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} placeholder="Describe the pollution..." className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 rounded-xl border border-dashed border-gd-border-strong px-4 py-3 text-sm text-gd-text-muted hover:border-gd-accent-500/40 hover:text-gd-accent-400 transition-colors">
                    <Camera className="h-4 w-4" /> Add Photo
                  </button>
                  <span className="text-xs text-gd-text-muted">Optional</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gd-text-muted">
                  <MapPin className="h-3 w-3" />
                  {lat && lng
                    ? `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)} (clicked on map)`
                    : "Click the map to set an exact location, or it defaults to your area"}
                </div>
              </div>

              {error && <p className="mt-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}

              <div className="mt-6 flex gap-3">
                <button onClick={onClose} className="flex-1 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">Cancel</button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit Report"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
