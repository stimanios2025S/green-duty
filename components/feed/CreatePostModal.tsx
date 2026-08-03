"use client";
import { useState } from "react";
import { X, FileText } from "lucide-react";

interface CreatePostModalProps { isOpen: boolean; onClose: () => void; }
export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [form, setForm] = useState({ title: "", content: "", tags: "", sourceVerified: false });
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gd-text-primary">Submit Educational Content</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-gd-text-secondary">Title</label><input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Sustainable Soil Management" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" /></div>
            <div><label className="text-sm font-medium text-gd-text-secondary">Content</label><textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} rows={6} placeholder="Write your educational content..." className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors resize-none" /></div>
            <div><label className="text-sm font-medium text-gd-text-secondary">Tags (comma separated)</label><input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="soil, organic, farming" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.sourceVerified} onChange={e => setForm({...form, sourceVerified: e.target.checked})} className="rounded border-gd-border-strong bg-gd-elevated accent-gd-accent-500" /><span className="text-sm text-gd-text-secondary">I confirm my sources are verified</span></label>
            <div className="rounded-xl bg-gd-accent-500/5 border border-gd-accent-500/10 p-3"><p className="text-xs text-gd-accent-400"><strong>📋 Note:</strong> Posts are subject to a 24-hour agronomy review before receiving &quot;Certified Green Content&quot; badge.</p></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl border border-gd-border bg-gd-card px-4 py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">Cancel</button>
            <button className="flex-1 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all"><FileText className="h-4 w-4 inline mr-1.5" />Submit for Review</button>
          </div>
        </div>
      </div>
    </>
  );
}
