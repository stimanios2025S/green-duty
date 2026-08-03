"use client";
import { useState, useEffect } from "react";
import { Droplets, Thermometer, Wind, Sprout, ToggleLeft, ToggleRight, Radio } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { farmTelemetry as initialTelemetry } from "@/lib/mock-data";

const metricConfig = [
  { key: "soilMoisture", label: "Soil Moisture", unit: "%", icon: Droplets, color: "bg-blue-500", textColor: "text-blue-400", min: 20, max: 95 },
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, color: "bg-gd-ember-500", textColor: "text-gd-ember-400", min: 18, max: 35, normalize: (v: number) => ((v - 18) / 17) * 100 },
  { key: "humidity", label: "Humidity", unit: "%", icon: Wind, color: "bg-cyan-500", textColor: "text-cyan-400", min: 35, max: 85 },
  { key: "nutrientLevel", label: "Nutrients", unit: "%", icon: Sprout, color: "bg-gd-olive-500", textColor: "text-gd-olive-400", min: 40, max: 95, decimals: 0 },
] as const;

export function IoTSimulator() {
  const [telemetry, setTelemetry] = useState(initialTelemetry[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        soilMoisture: Math.max(20, Math.min(95, prev.soilMoisture + (Math.random() - 0.5) * 3)),
        temperature: Math.max(18, Math.min(35, prev.temperature + (Math.random() - 0.5) * 0.8)),
        humidity: Math.max(35, Math.min(85, prev.humidity + (Math.random() - 0.5) * 2)),
        nutrientLevel: Math.max(40, Math.min(95, prev.nutrientLevel + (Math.random() - 0.5) * 1.5)),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <section data-perch className="py-20 bg-gd-deepest">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-olive-500/15 bg-gd-olive-500/5 px-3 py-1 text-xs font-medium text-gd-olive-400 mb-4">
            <Radio className="h-3 w-3" /> Live Telemetry
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight">Farm IoT Dashboard</h2>
          <p className="mt-3 text-gd-text-secondary">
            Real-time telemetry monitoring for{" "}
            <span className="font-semibold text-gd-accent-400">{telemetry.farmName}</span>
          </p>
        </div>

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {metricConfig.map((m) => {
            const raw = telemetry[m.key as keyof typeof telemetry] as number;
            const display = 'decimals' in m ? raw.toFixed(m.decimals!) : raw.toFixed(1);
            const pct = 'normalize' in m ? m.normalize!(raw) : raw;
            return (
              <Card key={m.key} className="text-center group">
                <m.icon className={`mx-auto h-8 w-8 ${m.textColor}`} />
                <p className="mt-3 text-xs font-medium text-gd-text-muted uppercase tracking-wider">{m.label}</p>
                <p className="mt-1 text-2xl font-bold text-gd-text-primary tracking-tight">{display}{m.unit}</p>
                <div className="mt-3 h-2 w-full rounded-full bg-gd-overlay">
                  <div className={`h-full rounded-full ${m.color} transition-all duration-1000`} style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* Irrigation control */}
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-gd-olive-500 animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.5)]' : 'bg-gd-border-strong'}`} />
            <div>
              <p className="font-medium text-gd-text-primary">Irrigation System</p>
              <p className="text-sm text-gd-text-secondary">
                Status:{" "}
                <span className={isOn ? "text-gd-olive-400" : telemetry.irrigationStatus === "scheduled" ? "text-gd-accent-400" : "text-gd-text-muted"}>
                  {isOn ? "Active" : telemetry.irrigationStatus === "scheduled" ? "Scheduled" : "Idle"}
                </span>
                {" · "}Flow: {telemetry.waterFlowRate.toFixed(1)} L/min
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
      </div>
    </section>
  );
}
