"use client";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string; value: string | number; icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean }; className?: string;
}
export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-gd-border-soft bg-gd-card p-5 transition-all duration-300 hover:border-gd-border-strong hover:glow-ring",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gd-text-muted uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gd-text-primary tracking-tight">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1.5">
              {trend.isPositive ? <TrendingUp className="h-3.5 w-3.5 text-gd-success" /> : <TrendingDown className="h-3.5 w-3.5 text-gd-danger" />}
              <span className={cn("text-xs font-semibold", trend.isPositive ? "text-gd-success" : "text-gd-danger")}>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gd-accent-500/10 to-gd-olive-500/5 text-gd-accent-400 border border-gd-accent-500/10">
          {icon}
        </div>
      </div>
    </div>
  );
}
