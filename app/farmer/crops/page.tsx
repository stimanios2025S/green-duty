"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFarmerLang } from "../layout";
import { farmerLang } from "@/lib/farmer-i18n";
import { Plus, Sprout, Calendar, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const C = {
  card: "#131318", surface: "#1e1e27", border: "rgba(255,255,255,0.05)",
  primary: "#84cc16", success: "#22c55e", danger: "#ef4444", warning: "#f59e0b",
  text: "#f4f4f5", textSec: "#a1a1aa", textMuted: "#71717a",
};

interface CropBatch { id: string; name: string; crop_type: string; area_hectares: number; planted_date: string; expected_harvest_date: string | null; status: string; notes: string | null; harvest_count: number; total_yield: number; total_revenue: number; }
interface HarvestLog { id: string; batch_id: string; date: string; yield_kg: number; price_per_kg: number; sold_to: string; revenue: number; notes: string | null; }

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
  const [form, setForm] = useState({ name: "", crop_type: "", area_hectares: "", planted_date: "", expected_harvest_date: "", notes: "" });
  const [hForm, setHForm] = useState({ yield_kg: "", price_per_kg: "", sold_to: "", notes: "" });

  useEffect(() => { if (uid) loadCrops(); }, [uid]);

  async function loadCrops() { const r = await fetch(`/api/farmer/crops?userId=${uid}`); if (r.ok) setCrops(await r.json()); }
  async function loadHarvests(batchId: string) { const r = await fetch(`/api/farmer/harvests?userId=${uid}&batch_id=${batchId}`); if (r.ok) setHarvests(await r.json()); }
  async function handleAddCrop(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/farmer/crops?userId=${uid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, area_hectares: parseFloat(form.area_hectares) || 0 }) });
    setForm({ name: "", crop_type: "", area_hectares: "", planted_date: "", expected_harvest_date: "", notes: "" });
    setShowForm(false); loadCrops();
  }
  async function handleAddHarvest(batchId: string, e: React.FormEvent) {
    e.preventDefault();
    const yk = parseFloat(hForm.yield_kg) || 0, pk = parseFloat(hForm.price_per_kg) || 0;
    await fetch(`/api/farmer/harvests?userId=${uid}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ batch_id: batchId, yield_kg: yk, price_per_kg: pk, sold_to: hForm.sold_to, revenue: yk * pk, notes: hForm.notes }) });
    setHForm({ yield_kg: "", price_per_kg: "", sold_to: "", notes: "" });
    setShowHarvestForm(null); loadHarvests(batchId); loadCrops();
  }
  async function handleDeleteCrop(id: string) { await fetch(`/api/farmer/crops/${id}?userId=${uid}`, { method: "DELETE" }); loadCrops(); }
  async function handleDeleteHarvest(id: string, batchId: string) { await fetch(`/api/farmer/harvests/${id}?userId=${uid}`, { method: "DELETE" }); loadHarvests(batchId); loadCrops(); }
  function toggleExpand(cropId: string) { if (expandedCrop === cropId) { setExpandedCrop(null); return; } setExpandedCrop(cropId); loadHarvests(cropId); }

  const statusColor = (s: string) => s === "growing" ? C.primary : s === "harvested" ? C.success : C.danger;
  const statusLabel = (s: string) => s === "growing" ? t.growing : s === "harvested" ? t.harvested : t.failed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: C.text }}>{t.crops}</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>
          <Plus className="w-4 h-4" /> {t.addCrop}
        </button>
      </div>

      <div className="space-y-3">
        {crops.map((crop) => (
          <div key={crop.id} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.card }}>
            <div className="p-4 cursor-pointer" style={{ background: expandedCrop === crop.id ? "rgba(255,255,255,0.02)" : "transparent" }} onClick={() => toggleExpand(crop.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(132,204,22,0.15)" }}>
                    <Sprout className="w-5 h-5" style={{ color: C.primary }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: C.text }}>{crop.name}</h3>
                    <p className="text-xs" style={{ color: C.textMuted }}>{crop.crop_type} · {crop.area_hectares} ha</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${statusColor(crop.status)}20`, color: statusColor(crop.status) }}>{statusLabel(crop.status)}</span>
                      <span className="text-[10px] flex items-center gap-1" style={{ color: C.textMuted }}><Calendar className="w-3 h-3" /> {crop.planted_date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCrop(crop.id); }} style={{ color: C.textMuted }} className="p-1 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  {expandedCrop === crop.id ? <ChevronUp className="w-4 h-4" style={{ color: C.textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: C.textMuted }} />}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {[
                  { val: crop.harvest_count, label: lang === "ar" ? "حصادات" : "Récoltes" },
                  { val: crop.total_yield.toLocaleString(), label: "kg" },
                  { val: `${crop.total_revenue.toLocaleString()} ${t.currency}`, label: lang === "ar" ? "الإيراد" : "Revenu", color: C.success },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-lg font-bold" style={{ color: s.color || C.text }}>{s.val}</p>
                    <p className="text-[10px]" style={{ color: C.textMuted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {expandedCrop === crop.id && (
              <div className="p-4 space-y-3" style={{ borderTop: `1px solid ${C.border}`, background: "rgba(255,255,255,0.015)" }}>
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.textSec }}>{lang === "ar" ? "سجل الحصاد" : "Journal de récolte"}</h4>
                  <button onClick={() => setShowHarvestForm(crop.id)} className="flex items-center gap-1 text-xs font-medium" style={{ color: C.primary }}>
                    <Plus className="w-3 h-3" /> {t.addHarvest}
                  </button>
                </div>
                {harvests.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: C.textMuted }}>{t.noData}</p>
                ) : (
                  <div className="space-y-2">
                    {harvests.map((h) => (
                      <div key={h.id} className="flex items-center justify-between rounded-xl p-3" style={{ border: `1px solid ${C.border}`, background: C.card }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: C.text }}>{h.yield_kg} kg → {h.revenue.toLocaleString()} {t.currency}</p>
                          <p className="text-[10px]" style={{ color: C.textMuted }}>{h.date} · {h.sold_to || "—"}</p>
                        </div>
                        <button onClick={() => handleDeleteHarvest(h.id, crop.id)} style={{ color: C.textMuted }} className="hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {showHarvestForm === crop.id && (
                  <form onSubmit={(e) => handleAddHarvest(crop.id, e)} className="rounded-xl p-3 space-y-2" style={{ border: `1px solid ${C.border}`, background: C.card }}>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" step="any" placeholder={t.yield} value={hForm.yield_kg} onChange={(e) => setHForm({ ...hForm, yield_kg: e.target.value })}
                        className="px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
                      <input type="number" step="any" placeholder={t.pricePerKg} value={hForm.price_per_kg} onChange={(e) => setHForm({ ...hForm, price_per_kg: e.target.value })}
                        className="px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                    </div>
                    <input placeholder={t.soldTo} value={hForm.sold_to} onChange={(e) => setHForm({ ...hForm, sold_to: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowHarvestForm(null)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: C.surface, color: C.textSec }}>{t.cancel}</button>
                      <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>{t.save}</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {crops.length === 0 && (
        <div className="text-center py-12" style={{ color: C.textMuted }}>
          <Sprout className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t.noData}</p>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: C.card, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: C.text }}>{t.addCrop}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: C.textMuted }} /></button>
            </div>
            <form onSubmit={handleAddCrop} className="space-y-3">
              <input placeholder={`${t.cropName}*`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
              <input placeholder={`${t.cropType}*`} value={form.crop_type} onChange={(e) => setForm({ ...form, crop_type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} required />
              <input type="number" step="any" placeholder={t.area} value={form.area_hectares} onChange={(e) => setForm({ ...form, area_hectares: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] mb-1 block" style={{ color: C.textMuted }}>{t.plantedDate}</label>
                  <input type="date" value={form.planted_date} onChange={(e) => setForm({ ...form, planted_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
                <div>
                  <label className="text-[10px] mb-1 block" style={{ color: C.textMuted }}>{t.expectedHarvest}</label>
                  <input type="date" value={form.expected_harvest_date} onChange={(e) => setForm({ ...form, expected_harvest_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
              </div>
              <textarea placeholder={t.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none h-20" style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl text-sm" style={{ background: C.surface, color: C.textSec }}>{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-medium" style={{ background: C.primary, color: "#060608" }}>{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
