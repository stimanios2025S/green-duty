import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}
export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
export function timeAgo(dateStr: string): string {
  const now = Date.now(); const then = new Date(dateStr).getTime();
  const s = Math.floor((now - then) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60); if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24); if (d < 30) return d + 'd ago';
  return formatDate(dateStr);
}
export function severityColor(severity: string): string {
  const m: Record<string, string> = { low: '#22C55E', moderate: '#EAB308', severe: '#F97316', critical: '#EF4444' };
  return m[severity] || '#6B7280';
}
export function statusColor(status: string): string {
  const m: Record<string, string> = { pending: '#EAB308', certified: '#22C55E', rejected: '#EF4444', reported: '#F97316', event_created: '#3B82F6', in_progress: '#8B5CF6', cleaned: '#22C55E', resolved: '#22C55E', upcoming: '#3B82F6', ongoing: '#8B5CF6', completed: '#22C55E' };
  return m[status] || '#6B7280';
}
export function statusLabel(status: string): string { return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
export function randomId(): string { return Math.random().toString(36).substring(2, 15); }
