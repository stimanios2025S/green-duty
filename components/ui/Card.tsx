import { cn } from "@/lib/utils";
import { MouseEventHandler } from "react";
interface CardProps { children: React.ReactNode; className?: string; hover?: boolean; id?: string; onClick?: MouseEventHandler<HTMLDivElement>; }
export function Card({ children, className, hover = false, id, onClick }: CardProps) {
  return <div id={id} onClick={onClick} className={cn(
    "rounded-2xl border border-gd-border-soft bg-gd-card p-5 transition-all duration-300",
    hover && "hover:border-gd-border-strong hover:bg-gd-elevated hover:glow-ring",
    onClick && "cursor-pointer",
    className
  )}>{children}</div>;
}
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn("mb-4", className)}>{children}</div>; }
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) { return <h3 className={cn("text-lg font-semibold text-gd-text-primary", className)}>{children}</h3>; }
