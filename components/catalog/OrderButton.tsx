import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The Order action shared by the catalogue and the client portal.
 *
 * Always points at /order/new, which is a public path and handles its own
 * sign-in redirect — that is what lets the chosen offering survive the trip
 * through login and email verification.
 */
export function orderHref(offeringId: string): string {
  return `/order/new?offering=${encodeURIComponent(offeringId)}`;
}

export function OrderButton({
  offeringId,
  label = "Order",
  className,
}: {
  offeringId: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={orderHref(offeringId)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-3.5 py-2 text-xs font-semibold text-gd-text-inverse shadow-sm shadow-gd-accent-500/20 transition-all hover:brightness-110",
        className
      )}
    >
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
