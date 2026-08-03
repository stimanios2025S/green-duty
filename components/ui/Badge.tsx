import { cn } from "@/lib/utils";

interface BadgeProps { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info" | "purple"; className?: string; }
export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-gd-elevated text-gd-text-secondary border border-gd-border",
    success: "bg-gd-success/10 text-gd-success border border-gd-success/20",
    warning: "bg-gd-warning/10 text-gd-warning border border-gd-warning/20",
    danger: "bg-gd-danger/10 text-gd-danger border border-gd-danger/20",
    info: "bg-gd-info/10 text-gd-info border border-gd-info/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>{children}</span>;
}
