"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import anime from "animejs";
import {
  X, MapPin, Camera, Loader2, CheckCircle2, Navigation, ImagePlus, Trash2, Sparkles, Leaf
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

/* ── Pollution types (emoji quick-picks — fun + fast) ── */
const POLLUTION_TYPES = [
  { value: "plastics", label: "Plastics", emoji: "🥤" },
  { value: "chemical_waste", label: "Chemicals", emoji: "🧪" },
  { value: "illegal_dumping", label: "Illegal Dumping", emoji: "🚛" },
  { value: "deforestation", label: "Deforestation", emoji: "🌲" },
  { value: "water_pollution", label: "Water Pollution", emoji: "🌊" },
  { value: "air_pollution", label: "Air Pollution", emoji: "💨" },
  { value: "soil_contamination", label: "Soil Damage", emoji: "🌱" },
];

/* ── Smart severity: keyword → suggested level ── */
const SEVERITY_RULES: { level: string; words: string[] }[] = [
  { level: "critical", words: ["oil", "chemical", "toxic", "dead fish", "river", "sea", "ocean", "spill", "factory", "cancer", "poison", "asbestos"] },
  { level: "severe", words: ["burning", "fire", "smoke", "dump", "hospital", "school", "children", "village", "drinking", "urgent"] },
  { level: "moderate", words: ["plastic", "waste", "garbage", "trash", "landfill", "bottle", "bags", "sewage"] },
  { level: "low", words: ["litter", "paper", "bag", "park", "few", "small"] },
];

const SEVERITY_META: Record<string, { label: string; color: string; chip: string }> = {
  low: { label: "Low", color: "#22C55E", chip: "border-gd-success/25 bg-gd-success/10 text-gd-success" },
  moderate: { label: "Moderate", color: "#EAB308", chip: "border-gd-warning/25 bg-gd-warning/10 text-gd-warning" },
  severe: { label: "Severe", color: "#F97316", chip: "border-gd-ember-500/25 bg-gd-ember-500/10 text-gd-ember-500" },
  critical: { label: "Critical", color: "#EF4444", chip: "border-gd-danger/25 bg-gd-danger/10 text-gd-danger" },
};

const STEPS = ["Type", "Details", "Photo", "Review"];
const ECO_POINTS = 50;

/** Downscale an image file to a compact data URL (max 1000px) */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1000;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => reject(new Error("img"));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ReportModal({ isOpen, onClose, onSubmitted, initialLat, initialLng }: ReportModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: "", description: "", pollutionType: "plastics", severity: "moderate",
  });
  const [severityTouched, setSeverityTouched] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [locating, setLocating] = useState(false);
  const [lat, setLat] = useState<number | null>(initialLat || null);
  const [lng, setLng] = useState<number | null>(initialLng || null);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep in sync if the parent passes new coords (map click)
  useEffect(() => {
    if (initialLat != null && initialLng != null) {
      setLat(initialLat);
      setLng(initialLng);
    }
  }, [initialLat, initialLng]);

  // Entrance animation + step transition
  useEffect(() => {
    if (isOpen && boxRef.current) {
      anime({ targets: boxRef.current, opacity: [0, 1], translateY: [24, 0], scale: [0.97, 1], duration: 320, easing: "easeOutCubic" });
    }
  }, [isOpen]);

  // Reset wizard when closed
  const reset = useCallback(() => {
    setStep(0);
    setForm({ title: "", description: "", pollutionType: "plastics", severity: "moderate" });
    setSeverityTouched(false);
    setPhoto(null); setPhotoName("");
    setError(""); setDone(false);
    setLat(null); setLng(null);
  }, []);

  const close = () => { reset(); onClose(); };

  if (!isOpen) return null;

  /* ── Smart severity suggestion (auto-updates while typing) ── */
  const suggestSeverity = (text: string) => {
    if (severityTouched) return;
    const t = text.toLowerCase();
    for (const rule of SEVERITY_RULES) {
      if (rule.words.some(w => t.includes(w))) {
        setForm(f => ({ ...f, severity: rule.level }));
        return;
      }
    }
    setForm(f => ({ ...f, severity: "low" }));
  };

  /* ── Photo upload (real, works) ── */
  const onPickPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG/PNG)."); return; }
    if (file.size > 12 * 1024 * 1024) { setError("Image is too large — please pick one under 12 MB."); return; }
    try {
      const dataUrl = await fileToDataUrl(file);
      setPhoto(dataUrl);
      setPhotoName(file.name);
      setError("");
    } catch {
      setError("Couldn't read that image. Try another one.");
    }
  };

  /* ── Locate me ── */
  const locateMe = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocating(false); },
      () => { setError("Couldn't get your location — click the map to set the spot."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const canNext = step === 0
    ? form.title.trim().length >= 5
    : step === 1
    ? form.description.trim().length >= 20
    : true;

  const handleSubmit = async () => {
    setError("");
    if (!user) { setError("Please sign in to report a hotspot."); return; }
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
          mediaUrl: photo,
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      anime({ targets: ".gd-confetti", translateY: [0, -140], opacity: [1, 0], rotate: () => Math.random() * 360 - 180, duration: 1100, delay: anime.stagger(60), easing: "easeOutQuad", complete: () => {} });
      setTimeout(() => {
        reset();
        onClose();
        onSubmitted?.();
      }, 2600);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const severityMeta = SEVERITY_META[form.severity];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div ref={boxRef} className="w-full max-w-lg rounded-2xl bg-gd-card border border-gd-border-soft shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
          {done ? (
            <div className="relative overflow-hidden px-6 py-10 text-center">
              {/* Confetti */}
              {["#facc15", "#84cc16", "#f97316", "#fde047", "#65a30d"].map((c, i) => (
                <span key={i} className="gd-confetti absolute left-1/2 top-8 h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c, marginLeft: (i - 2) * 22, transform: "rotate(45deg)" }} />
              ))}
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gd-success/10 border border-gd-success/25">
                <CheckCircle2 className="h-9 w-9 text-gd-success" />
              </div>
              <p className="mt-4 text-xl font-bold text-gd-text-primary">Report submitted! 🎉</p>
              <p className="mt-1 text-sm text-gd-text-muted">Community members will see it on the map.</p>
              <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/25 bg-gd-accent-500/10 px-4 py-1.5 text-sm font-semibold text-gd-accent-400">
                <Sparkles className="h-4 w-4" /> +{ECO_POINTS} eco points earned
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gd-border px-6 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-gd-text-primary">Report Pollution Hotspot</h3>
                  <p className="text-xs text-gd-text-muted mt-0.5">Smart report · earn {ECO_POINTS} eco points</p>
                </div>
                <button onClick={close} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Step progress */}
              <div className="flex items-center gap-1.5 px-6 pt-4">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 flex-col items-center gap-1">
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold transition-all", i < step ? "border-gd-olive-500 bg-gd-olive-500/15 text-gd-olive-500" : i === step ? "border-gd-accent-500 bg-gd-accent-500 text-gd-text-inverse" : "border-gd-border-strong text-gd-text-muted")}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    <span className={cn("text-[9px] font-medium uppercase tracking-wider", i === step ? "text-gd-text-secondary" : "text-gd-text-muted")}>{s}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 px-6 py-5">
                {/* STEP 0 — Type */}
                {step === 0 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gd-text-secondary">What did you see?</label>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {POLLUTION_TYPES.map(t => (
                          <button
                            key={t.value}
                            onClick={() => setForm({ ...form, pollutionType: t.value })}
                            className={cn("flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition-all",
                              form.pollutionType === t.value ? "border-gd-accent-500/50 bg-gd-accent-500/10 text-gd-text-primary" : "border-gd-border bg-gd-elevated/50 text-gd-text-secondary hover:border-gd-accent-500/30")}
                          >
                            <span className="text-xl">{t.emoji}</span> {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gd-text-secondary">Give it a short title</label>
                      <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Plastic waste near the riverbank" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                    </div>
                  </>
                )}

                {/* STEP 1 — Details + smart severity */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gd-text-secondary">Describe what you saw</label>
                      <textarea value={form.description} onChange={e => { setForm({ ...form, description: e.target.value }); suggestSeverity(e.target.value); }} rows={3} placeholder="e.g. A large pile of plastic bottles near the river — some are floating into the water..." className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors resize-none" />
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-gd-text-muted">
                        <Sparkles className="h-3 w-3 text-gd-accent-400" /> AI-assisted severity — detected from your words, adjust below
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gd-text-secondary">Severity</label>
                      <div className="mt-2 grid grid-cols-4 gap-2">
                        {Object.entries(SEVERITY_META).map(([key, meta]) => (
                          <button
                            key={key}
                            onClick={() => { setSeverityTouched(true); setForm({ ...form, severity: key }); }}
                            className={cn("rounded-xl border px-2 py-2 text-xs font-semibold transition-all",
                              form.severity === key ? meta.chip : "border-gd-border bg-gd-elevated/50 text-gd-text-muted hover:border-gd-border-strong")}
                          >
                            {meta.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2 — Photo */}
                {step === 2 && (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      aria-label="Upload a photo of the hotspot"
                      onChange={e => {
                        onPickPhoto(e.target.files?.[0]);
                        // Reset so picking the SAME file again re-triggers onChange
                        e.target.value = "";
                      }}
                    />
                    {photo ? (
                      <div className="relative overflow-hidden rounded-2xl border border-gd-border-strong">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo} alt="Report preview" className="max-h-64 w-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                          <span className="truncate text-xs text-white/90">{photoName}</span>
                          <button onClick={() => { setPhoto(null); setPhotoName(""); }} className="rounded-lg bg-black/50 p-1.5 text-white/90 hover:bg-black/70 transition-colors" title="Remove photo">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gd-border-strong bg-gd-elevated/30 px-4 py-10 text-gd-text-muted transition-all hover:border-gd-accent-500/40 hover:text-gd-accent-400 hover:bg-gd-accent-500/5"
                      >
                        <ImagePlus className="h-10 w-10" />
                        <span className="text-sm font-medium">Tap to upload a photo</span>
                        <span className="text-xs">JPG / PNG · the photo is attached to your report</span>
                      </button>
                    )}
                    {photo && (
                      <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gd-border bg-gd-elevated/50 py-2.5 text-xs font-medium text-gd-text-secondary hover:border-gd-accent-500/30 transition-colors">
                        <Camera className="h-3.5 w-3.5" /> Replace photo
                      </button>
                    )}
                  </>
                )}

                {/* STEP 3 — Location + review */}
                {step === 3 && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-gd-border bg-gd-elevated/50 p-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gd-text-secondary uppercase tracking-wider">Location</p>
                        {!lat && !lng && (
                          <button onClick={locateMe} className="flex items-center gap-1.5 text-xs font-medium text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
                            <Navigation className="h-3.5 w-3.5" /> {locating ? "Locating..." : "Use my location"}
                          </button>
                        )}
                      </div>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gd-text-muted">
                        <MapPin className="h-3 w-3 text-gd-ember-500" />
                        {lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : "No exact spot yet — click the map or use my location"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gd-border bg-gd-elevated/50 p-3.5">
                      <p className="text-xs font-semibold text-gd-text-secondary uppercase tracking-wider">Summary</p>
                      <div className="mt-2 flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gd-accent-500/10 border border-gd-accent-500/15 text-lg">
                          {POLLUTION_TYPES.find(t => t.value === form.pollutionType)?.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gd-text-primary truncate">{form.title}</p>
                          <p className="text-xs text-gd-text-muted line-clamp-2 mt-0.5">{form.description}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", severityMeta.chip)}>{severityMeta.label}</span>
                            {photo && <span className="flex items-center gap-1 text-[10px] text-gd-text-muted"><Camera className="h-3 w-3" /> photo attached</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gd-accent-500/20 bg-gradient-to-r from-gd-accent-500/10 to-gd-olive-500/5 px-3.5 py-2.5">
                      <span className="flex items-center gap-2 text-xs font-medium text-gd-text-secondary">
                        <Leaf className="h-4 w-4 text-gd-olive-500" /> Reporting earns you eco points
                      </span>
                      <span className="text-sm font-bold text-gd-accent-400">+{ECO_POINTS} pts</span>
                    </div>
                  </div>
                )}

                {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
              </div>

              {/* Footer nav */}
              <div className="flex gap-3 border-t border-gd-border px-6 py-4">
                {step > 0 ? (
                  <button onClick={() => setStep(s => s - 1)} className="rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">Back</button>
                ) : (
                  <button onClick={close} className="rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">Cancel</button>
                )}
                {step < 3 ? (
                  <button
                    onClick={() => canNext && setStep(s => s + 1)}
                    disabled={!canNext}
                    className="flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-40"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-olive-600 to-gd-olive-500 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Sparkles className="h-4 w-4" /> Submit Report</>}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
