"use client";
import { useState, useEffect, useRef } from "react";
import { Droplets, Thermometer, Wind, Sprout, ToggleLeft, ToggleRight, Radio, Waves } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { farmTelemetry as initialTelemetry } from "@/lib/mock-data";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

const metricConfig = [
  { key: "soilMoisture", label: "Soil Moisture", unit: "%", icon: Droplets, color: "bg-blue-500", textColor: "text-blue-400", min: 20, max: 95 },
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, color: "bg-gd-ember-500", textColor: "text-gd-ember-400", min: 18, max: 35, normalize: (v: number) => ((v - 18) / 17) * 100 },
  { key: "humidity", label: "Humidity", unit: "%", icon: Wind, color: "bg-cyan-500", textColor: "text-cyan-400", min: 35, max: 85 },
  { key: "nutrientLevel", label: "Nutrients", unit: "%", icon: Sprout, color: "bg-gd-olive-500", textColor: "text-gd-olive-400", min: 40, max: 95, decimals: 0 },
] as const;

export function IoTSimulator() {
  const [telemetry, setTelemetry] = useState(initialTelemetry[0]);
  const [history, setHistory] = useState<number[]>([62, 64, 61, 66, 63, 67, 65, 68, 64, 66]);
  const sparkRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => {
        const next = {
          ...prev,
          soilMoisture: Math.max(20, Math.min(95, prev.soilMoisture + (Math.random() - 0.5) * 3)),
          temperature: Math.max(18, Math.min(35, prev.temperature + (Math.random() - 0.5) * 0.8)),
          humidity: Math.max(35, Math.min(85, prev.humidity + (Math.random() - 0.5) * 2)),
          nutrientLevel: Math.max(40, Math.min(95, prev.nutrientLevel + (Math.random() - 0.5) * 1.5)),
        };
        setHistory(h => [...h.slice(-19), next.soilMoisture]);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Animate the sparkline
  useEffect(() => {
    if (!sparkRef.current) return;
    const pts = history.map((v, i) => `${(i / (history.length - 1)) * 100},${100 - v}`).join(" ");
    sparkRef.current.setAttribute("points", pts);
  }, [history]);

  const toggleIrrigation = () => {
    setTelemetry(prev => ({
      ...prev,
      irrigationStatus: prev.irrigationStatus === 'on' ? 'off' : 'on',
      pumpStatus: prev.pumpStatus === 'running' ? 'idle' : 'running'
    }));
  };

  const isOn = telemetry.irrigationStatus === 'on';
  const isRunning = telemetry.pumpStatus === 'running';

  return (
    <section data-perch className="relative overflow-hidden bg-gd-base py-20">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-olive-500/15 bg-gd-olive-500/5 px-3 py-1 text-xs font-medium text-gd-olive-400 mb-4">
            <Radio className="h-3 w-3" /> Live Telemetry
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight">Farm IoT Dashboard</h2>
          <p className="mt-3 text-gd-text-secondary">
            Real-time telemetry monitoring for{" "}
            <span className="font-semibold text-gd-accent-400">{telemetry.farmName}</span>
            <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-gd-success/20 bg-gd-success/5 px-2.5 py-0.5 text-[10px] font-medium text-gd-success">
              <span className="h-1.5 w-1.5 rounded-full bg-gd-success glow-breathe" /> streaming
            </span>
          </p>
        </div>

        <ScrollReveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {metricConfig.map((m) => {
            const raw = telemetry[m.key as keyof typeof telemetry] as number;
            const display = 'decimals' in m ? raw.toFixed(m.decimals!) : raw.toFixed(1);
            const pct = 'normalize' in m ? m.normalize!(raw) : raw;
            return (
              <Card key={m.key} className="relative overflow-hidden text-center group">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gd-olive-500/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <m.icon className={`mx-auto h-8 w-8 ${m.textColor}`} />
                <p className="mt-3 text-xs font-medium text-gd-text-muted uppercase tracking-wider">{m.label}</p>
                <p className="mt-1 text-2xl font-bold text-gd-text-primary tracking-tight tabular-nums">{display}{m.unit}</p>
                <div className="mt-3 h-2 w-full rounded-full bg-gd-overlay">
                  <div className={`h-full rounded-full ${m.color} transition-all duration-1000`} style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
                </div>
              </Card>
            );
          })}
        </ScrollReveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Irrigation control */}
          <Card className="flex items-center justify-between lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-gd-olive-500 animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.5)]' : 'bg-gd-border-strong'}`} />
              <div>
                <p className="font-medium text-gd-text-primary">Irrigation System</p>
                <p className="text-sm text-gd-text-secondary">
                  Status:{" "}
                  <span className={isOn ? "text-gd-olive-400" : telemetry.irrigationStatus === "scheduled" ? "text-gd-accent-400" : "text-gd-text-muted"}>
                    {isOn ? "Active" : telemetry.irrigationStatus === "scheduled" ? "Scheduled" : "Idle"}
                  </span>
                  {" · "}Flow: <span className="tabular-nums">{telemetry.waterFlowRate.toFixed(1)} L/min</span>
                </p>
              </div>
            </div>
            <button
              onClick={toggleIrrigation}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                isOn
                  ? "bg-gd-danger/10 text-gd-danger border border-gd-danger/20 hover:bg-gd-danger/20"
                  : "bg-gd-olive-500/10 text-gd-olive-400 border border-gd-olive-500/20 hover:bg-gd-olive-500/20"
              }`}
            >
              {isOn ? <><ToggleRight className="h-5 w-5" /> Turn Off</> : <><ToggleLeft className="h-5 w-5" /> Turn On</>}
            </button>
          </Card>

          {/* Live soil-moisture sparkline */}
          <Card className="relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Waves className="h-4 w-4 text-gd-accent-400" />
              <p className="text-xs font-medium text-gd-text-muted uppercase tracking-wider">Soil Moisture · Live</p>
            </div>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-20 w-full">
              <defs>
                <linearGradient id="gdSparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d4a017" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#d4a017" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={`0,100 ${history.map((v, i) => `${(i / (history.length - 1)) * 100},${100 - v}`).join(" ")} 100,100`} fill="url(#gdSparkFill)" />
              <polyline ref={sparkRef} points="0,100" fill="none" stroke="#facc15" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <p className="mt-1 text-[10px] text-gd-text-muted">last 60s · {telemetry.soilMoisture.toFixed(1)}% current</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
