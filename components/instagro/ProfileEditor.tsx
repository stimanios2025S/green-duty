"use client";
import { useRef, useState } from "react";
import { X, Loader2, CheckCircle2, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { InstaAvatar } from "./InstaAvatar";
import { EMOJI_OPTIONS, GRADIENT_OPTIONS } from "@/lib/instagro-editor";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ProfileEditor({ isOpen, onClose, onSaved }: Props) {
  const { user, updateUser } = useAuth();
  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(myUsername);
  const [bio, setBio] = useState(user?.bio || "");
  const [emoji, setEmoji] = useState(user?.emoji || user?.name?.charAt(0) || "🌿");
  const [gradient, setGradient] = useState(user?.gradient || "from-amber-400 to-orange-600");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Compress the chosen photo to a small JPEG data URL (persistent, like posts) */
  const handleAvatarFile = (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Choose an image file."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 400 / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        setAvatarUrl(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => setError("Couldn't read that image.");
      img.src = String(reader.result);
    };
    reader.onerror = () => setError("Couldn't read that file.");
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const save = async () => {
    if (!user) return;
    setError("");
    if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/instagro/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username, bio, emoji, gradient, name, avatarUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Failed to save."); return; }
      updateUser({ name: name.trim(), bio, avatarUrl, ...(data.user ? {} : {}) });
      setDone(true);
      setTimeout(() => { setDone(false); onClose(); onSaved?.(); }, 1300);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
            <h3 className="text-base font-semibold text-gd-text-primary">Edit profile</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors"><X className="h-5 w-5" /></button>
          </div>

          {done ? (
            <div className="flex flex-col items-center py-14 text-center">
              <CheckCircle2 className="h-14 w-14 text-gd-success" />
              <p className="mt-4 text-lg font-semibold text-gd-text-primary">Profile updated!</p>
            </div>
          ) : (
            <div className="space-y-5 overflow-y-auto p-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <InstaAvatar user={{ username, name, emoji, gradient, avatarUrl }} size={96} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 ring-2 ring-gd-card hover:brightness-110 transition-all"
                    title="Change photo"
                  >
                    <Camera className="h-4 w-4 text-gd-text-inverse" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleAvatarFile(e.target.files?.[0])}
                />
                <button
                  onClick={() => { setAvatarUrl(undefined); setEmoji(user?.emoji || user?.name?.charAt(0) || "🌿"); }}
                  className="text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors"
                >
                  {avatarUrl ? "Remove photo" : "Add photo"}
                </button>
                {avatarUrl && (
                  <p className="text-[11px] text-gd-text-muted">Using your uploaded photo — click Save to apply.</p>
                )}
                <div>
                  <p className="text-center text-xs font-medium text-gd-text-secondary">Or pick an avatar icon</p>
                  <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                    {EMOJI_OPTIONS.slice(0, 10).map(e => (
                      <button key={e} onClick={() => { setEmoji(e); setAvatarUrl(undefined); }} className={`flex h-8 w-8 items-center justify-center rounded-lg border text-base transition-all ${!avatarUrl && emoji === e ? "border-gd-accent-500/60 bg-gd-accent-500/10" : "border-gd-border bg-gd-elevated hover:border-gd-border-strong"}`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {GRADIENT_OPTIONS.slice(0, 6).map(g => (
                    <button key={g} onClick={() => setGradient(g)} className={`h-7 w-10 rounded-lg bg-gradient-to-br ${g} transition-all ${gradient === g ? "ring-2 ring-white/60 ring-offset-2 ring-offset-gd-card" : "opacity-70 hover:opacity-100"}`} />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Username</label>
                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gd-text-muted">@</span>
                  <input value={username} onChange={e => setUsername(e.target.value.replace(/[^a-z0-9._]/gi, ""))} className="w-full rounded-xl border border-gd-border bg-gd-elevated py-2.5 pl-8 pr-3.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
                <p className="mt-1 text-[11px] text-gd-text-muted">Only letters, numbers, periods and underscores.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell your story..." className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                <p className="mt-1 text-right text-[11px] text-gd-text-muted">{bio.length}/150</p>
              </div>

              {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}

              <button
                onClick={save}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
