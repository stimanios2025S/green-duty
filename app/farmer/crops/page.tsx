"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "../layout";
import { farmerLang } from "@/lib/farmer-i18n";
import {
  Plus, Sprout, Calendar, TrendingUp, X, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";

interface CropBatch {
  id: string;
  name: string;
  crop_type: string;
  area_hectares: number;
  planted_date: string;
  expected_harvest_date: string | null;
  status: string;
  notes: string | null;
  harvest_count: number;
  total_yield: number;
  total_revenue: number;
}

interface HarvestLog {
  id: string;
  batch_id: string;
  date: string;
  yield_kg: number;
  price_per_kg: number;
  sold_to: string;
  revenue: number;
  notes: string | null;
}

const STATUSES = ["growing", "harvested", "failed"] as const;

export default function CropsPage() {
  const { user } = useAuth();
  const { lang } = useFarmerLang();
  const t = farmerLang[lang];
  const uid = user?.id || "";
  const [crops, setCrops] = useState<CropBatch[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const [harvests, setHarvests] = useState<HarvestLog[]>([]);
  const [showHarvestForm, setShowHarvestForm] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", crop_type: "", area_hectares: "", planted_date: "", expected_harvest_date: "", notes: "",
  });
  const [hForm, setHForm] = useState({
    yield_kg: "", price_per_kg: "", sold_to: "", notes: "",
  });

  useEffect(() => { loadCrops(); }, []);

  async function loadCrops() {
    const res = await fetch(`/api/farmer/crops?userId=${uid}`);
    if (res.ok) setCrops(await res.json());
  }

  async function loadHarvests(batchId: string) {
    const res = await fetch(`/api/farmer/harvests?userId=${uid}&batch_id=${batchId}`);
    if (res.ok) setHarvests(await res.json());
  }

  async function handleAddCrop(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/crops?userId=${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, area_hectares: parseFloat(form.area_hectares) || 0 }),
    });
    setForm({ name: "", crop_type: "", area_hectares: "", planted_date: "", expected_harvest_date: "", notes: "" });
    setShowForm(false);
    loadCrops();
  }

  async function handleAddHarvest(batchId: string, e: React.FormEvent) {
    e.preventDefault();
    const yieldKg = parseFloat(hForm.yield_kg) || 0;
    const pricePerKg = parseFloat(hForm.price_per_kg) || 0;
    await fetch(`/api/farmer/harvests?userId=${uid}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch_id: batchId, yield_kg: yieldKg, price_per_kg: pricePerKg, sold_to: hForm.sold_to, revenue: yieldKg * pricePerKg, notes: hForm.notes }),
    });
    setHForm({ yield_kg: "", price_per_kg: "", sold_to: "", notes: "" });
    setShowHarvestForm(null);
    loadHarvests(batchId);
    loadCrops();
  }

  async function handleDeleteCrop(id: string) {
    await fetch(`/api/farmer/crops/${id}?userId=${uid}`, { method: "DELETE" });
    loadCrops();
  }

  async function handleDeleteHarvest(id: string, batchId: string) {
    await fetch(`/api/farmer/harvests/${id}?userId=${uid}`, { method: "DELETE" });
    loadHarvests(batchId);
    loadCrops();
  }

  function toggleExpand(cropId: string) {
    if (expandedCrop === cropId) { setExpandedCrop(null); return; }
    setExpandedCrop(cropId);
    loadHarvests(cropId);
  }

  const statusColor = (s: string) => {
    if (s === "growing") return "bg-gd-primary/20 text-gd-primary";
    if (s === "harvested") return "bg-gd-success/20 text-gd-success";
    return "bg-gd-danger/20 text-gd-danger";
  };

  const statusLabel = (s: string) => {
    if (s === "growing") return t.growing;
    if (s === "harvested") return t.harvested;
    return t.failed;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gd-text-primary">{t.crops}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium hover:bg-gd-primary/90">
          <Plus className="w-4 h-4" /> {t.addCrop}
        </button>
      </div>

      {/* Crop list */}
      <div className="space-y-3">
        {crops.map((crop) => (
          <div key={crop.id} className="rounded-xl border border-gd-border bg-gd-card overflow-hidden">
            {/* Crop header */}
            <div className="p-4 cursor-pointer hover:bg-gd-surface/50" onClick={() => toggleExpand(crop.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gd-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sprout className="w-5 h-5 text-gd-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gd-text-primary">{crop.name}</h3>
                    <p className="text-xs text-gd-text-muted">{crop.crop_type} · {crop.area_hectares} ha</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(crop.status)}`}>{statusLabel(crop.status)}</span>
                      <span className="text-[10px] text-gd-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {crop.planted_date}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCrop(crop.id); }} className="text-gd-text-muted hover:text-gd-danger p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedCrop === crop.id ? <ChevronUp className="w-4 h-4 text-gd-text-muted" /> : <ChevronDown className="w-4 h-4 text-gd-text-muted" />}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gd-text-primary">{crop.harvest_count}</p>
                  <p className="text-[10px] text-gd-text-muted">{lang === "ar" ? "حصادات" : "Récoltes"}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gd-text-primary">{crop.total_yield.toLocaleString()}</p>
                  <p className="text-[10px] text-gd-text-muted">kg {lang === "ar" ? "_prod" : "produit"}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gd-success">{crop.total_revenue.toLocaleString()} {t.currency}</p>
                  <p className="text-[10px] text-gd-text-muted">{lang === "ar" ? "الإيراد" : "Revenu"}</p>
                </div>
              </div>
            </div>

            {/* Expanded: harvest logs */}
            {expandedCrop === crop.id && (
              <div className="border-t border-gd-border bg-gd-surface/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gd-text-secondary uppercase tracking-wide">{lang === "ar" ? "سجل الحصاد" : "Journal de récolte"}</h4>
                  <button onClick={() => setShowHarvestForm(crop.id)} className="flex items-center gap-1 text-xs text-gd-primary font-medium">
                    <Plus className="w-3 h-3" /> {t.addHarvest}
                  </button>
                </div>

                {harvests.length === 0 ? (
                  <p className="text-xs text-gd-text-muted text-center py-4">{t.noData}</p>
                ) : (
                  <div className="space-y-2">
                    {harvests.map((h) => (
                      <div key={h.id} className="flex items-center justify-between bg-gd-card rounded-xl p-3 border border-gd-border">
                        <div>
                          <p className="text-sm font-medium text-gd-text-primary">{h.yield_kg} kg → {h.revenue.toLocaleString()} {t.currency}</p>
                          <p className="text-[10px] text-gd-text-muted">{h.date} · {h.sold_to || "—"}</p>
                        </div>
                        <button onClick={() => handleDeleteHarvest(h.id, crop.id)} className="text-gd-text-muted hover:text-gd-danger">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add harvest form */}
                {showHarvestForm === crop.id && (
                  <form onSubmit={(e) => handleAddHarvest(crop.id, e)} className="bg-gd-card rounded-xl border border-gd-border p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="any" placeholder={t.yield} value={hForm.yield_kg} onChange={(e) => setHForm({ ...hForm, yield_kg: e.target.value })} className="px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
                      <input type="number" step="any" placeholder={t.pricePerKg} value={hForm.price_per_kg} onChange={(e) => setHForm({ ...hForm, price_per_kg: e.target.value })} className="px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
                    </div>
                    <input placeholder={t.soldTo} value={hForm.sold_to} onChange={(e) => setHForm({ ...hForm, sold_to: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowHarvestForm(null)} className="flex-1 py-2 bg-gd-surface text-gd-text-secondary rounded-xl text-sm">{t.cancel}</button>
                      <button type="submit" className="flex-1 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium">{t.save}</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {crops.length === 0 && (
        <div className="text-center py-12 text-gd-text-muted">
          <Sprout className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t.noData}</p>
        </div>
      )}

      {/* Add Crop Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-gd-card rounded-2xl border border-gd-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gd-text-primary">{t.addCrop}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gd-text-muted" /></button>
            </div>
            <form onSubmit={handleAddCrop} className="space-y-3">
              <input placeholder={`${t.cropName}*`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
              <input placeholder={`${t.cropType}*`} value={form.crop_type} onChange={(e) => setForm({ ...form, crop_type: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" required />
              <input type="number" step="any" placeholder={t.area} value={form.area_hectares} onChange={(e) => setForm({ ...form, area_hectares: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gd-text-muted mb-1 block">{t.plantedDate}</label>
                  <input type="date" value={form.planted_date} onChange={(e) => setForm({ ...form, planted_date: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-gd-text-muted mb-1 block">{t.expectedHarvest}</label>
                  <input type="date" value={form.expected_harvest_date} onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary" />
                </div>
              </div>
              <textarea placeholder={t.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 bg-gd-surface border border-gd-border rounded-xl text-sm text-gd-text-primary resize-none h-20" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-gd-surface text-gd-text-secondary rounded-xl text-sm">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 bg-gd-primary text-white rounded-xl text-sm font-medium">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
