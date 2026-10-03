"use client";
import { formatCompact, formatMoney } from "@/lib/agency";

/**
 * Revenue received per month — plain CSS bars, no charting dependency.
 *
 * Bars are sized against the busiest month so the shape of the year is
 * readable even when the absolute numbers are large. Each bar carries its
 * exact figure in a tooltip and in an accessible label.
 */
export function RevenueChart({
  data,
  currency = "DZD",
}: {
  data: { month: string; label: string; amount: number }[];
  currency?: string;
}) {
  const max = Math.max(...data.map(d => d.amount), 0);
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const hasRevenue = total > 0;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gd-text-muted">
            Received · last 12 months
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-gd-text-primary">
            {formatMoney(total, currency)}
          </p>
        </div>
        <p className="text-xs text-gd-text-muted">
          Peak month {hasRevenue ? formatMoney(max, currency) : "—"}
        </p>
      </div>

      {!hasRevenue ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-gd-border-soft bg-gd-card/40">
          <p className="text-sm text-gd-text-muted">No payments recorded yet.</p>
        </div>
      ) : (
        <div className="flex h-48 items-end gap-1.5" role="img" aria-label="Revenue received per month over the last 12 months">
          {data.map(point => {
            const pct = max > 0 ? (point.amount / max) * 100 : 0;
            return (
              <div key={point.month} className="group relative flex h-full flex-1 flex-col justify-end">
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gd-border-strong bg-gd-elevated px-2.5 py-1.5 text-[11px] shadow-xl group-hover:block">
                  <span className="font-semibold text-gd-text-primary">{formatMoney(point.amount, currency)}</span>
                  <span className="ml-1.5 text-gd-text-muted">{point.label}</span>
                </div>

                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-gd-accent-600/40 to-gd-accent-500 transition-all duration-300 group-hover:from-gd-accent-500 group-hover:to-gd-accent-400"
                  style={{ height: `${Math.max(pct, point.amount > 0 ? 3 : 0)}%` }}
                  title={`${point.label}: ${formatMoney(point.amount, currency)}`}
                />
                {/* Zero months keep a hairline so the axis reads as continuous */}
                {point.amount === 0 && <div className="h-px w-full bg-gd-border-strong" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-2 flex gap-1.5">
        {data.map(point => (
          <div key={point.month} className="flex-1 truncate text-center text-[10px] text-gd-text-muted">
            {point.label.split(" ")[0]}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-gd-text-muted">
        Monthly totals of payments actually received · peak {formatCompact(max)}
      </p>
    </div>
  );
}
