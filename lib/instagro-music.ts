/**
 * InstaGro Music — search the whole world's music.
 *
 * Two sources:
 *  1. JAMENDO API (free, 100k+ real songs, all genres) when JAMENDO_CLIENT_ID
 *     is set in .env — proxied via /api/music so the key stays server-side.
 *  2. Built-in catalog (SoundHelix royalty-free MP3s) as an always-working
 *     fallback so search/preview still function without a key.
 */

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration: string;
  emoji: string;
  gradient: string;
  url: string;
  albumImage?: string;
  genre?: string;
}

export const MUSIC_CATEGORIES = [
  { key: "all", label: "All", emoji: "🎵" },
  { key: "ambient", label: "Ambient", emoji: "🌙" },
  { key: "acoustic", label: "Acoustic", emoji: "🎸" },
  { key: "electronic", label: "Electronic", emoji: "🎧" },
  { key: "jazz", label: "Jazz", emoji: "🎷" },
  { key: "pop", label: "Pop", emoji: "✨" },
  { key: "rock", label: "Rock", emoji: "🎸" },
  { key: "world", label: "World", emoji: "🌍" },
  { key: "folk", label: "Folk", emoji: "🪕" },
  { key: "chill", label: "Chill", emoji: "💆" },
];

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "m1", name: "Sunrise Groove", artist: "SoundHelix", duration: "6:12", emoji: "🌅", gradient: "from-amber-400 to-orange-600", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", genre: "chill" },
  { id: "m2", name: "Calm Fields", artist: "SoundHelix", duration: "8:04", emoji: "🌾", gradient: "from-lime-400 to-green-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", genre: "ambient" },
  { id: "m3", name: "Harvest Beat", artist: "SoundHelix", duration: "5:26", emoji: "🎧", gradient: "from-orange-400 to-red-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", genre: "electronic" },
  { id: "m4", name: "Misty Morning", artist: "SoundHelix", duration: "7:31", emoji: "💭", gradient: "from-sky-400 to-blue-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", genre: "ambient" },
  { id: "m5", name: "Forest Walk", artist: "SoundHelix", duration: "5:54", emoji: "🌲", gradient: "from-emerald-500 to-teal-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", genre: "world" },
  { id: "m6", name: "Ocean Drift", artist: "SoundHelix", duration: "6:03", emoji: "🌊", gradient: "from-blue-400 to-indigo-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", genre: "chill" },
  { id: "m7", name: "Desert Wind", artist: "SoundHelix", duration: "5:47", emoji: "🏜️", gradient: "from-yellow-400 to-orange-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", genre: "world" },
  { id: "m8", name: "Night Piano", artist: "SoundHelix", duration: "6:58", emoji: "🎹", gradient: "from-purple-400 to-indigo-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", genre: "jazz" },
  { id: "m9", name: "Mountain Air", artist: "SoundHelix", duration: "7:20", emoji: "🏔️", gradient: "from-slate-400 to-blue-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", genre: "folk" },
  { id: "m10", name: "Golden Hour", artist: "SoundHelix", duration: "6:41", emoji: "🌇", gradient: "from-amber-500 to-rose-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", genre: "acoustic" },
  { id: "m11", name: "River Flow", artist: "SoundHelix", duration: "5:39", emoji: "🏞️", gradient: "from-cyan-400 to-blue-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", genre: "folk" },
  { id: "m12", name: "Star Field", artist: "SoundHelix", duration: "7:12", emoji: "🌌", gradient: "from-indigo-500 to-purple-800", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", genre: "ambient" },
  { id: "m13", name: "Firelight", artist: "SoundHelix", duration: "6:35", emoji: "🔥", gradient: "from-orange-500 to-red-800", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", genre: "acoustic" },
  { id: "m14", name: "Winter Dawn", artist: "SoundHelix", duration: "5:28", emoji: "❄️", gradient: "from-slate-300 to-sky-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", genre: "chill" },
  { id: "m15", name: "Spring Blossom", artist: "SoundHelix", duration: "6:19", emoji: "🌸", gradient: "from-pink-400 to-rose-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", genre: "pop" },
  { id: "m16", name: "Neon Sky", artist: "SoundHelix", duration: "7:44", emoji: "🌃", gradient: "from-fuchsia-500 to-purple-800", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", genre: "electronic" },
];

export function searchLocalTracks(query: string, genre?: string): MusicTrack[] {
  return MUSIC_TRACKS.filter(t => {
    const q = query.trim().toLowerCase();
    const matchesQ = !q || t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || (t.genre || "").toLowerCase().includes(q);
    const matchesG = !genre || genre === "all" || t.genre === genre;
    return matchesQ && matchesG;
  });
}

/* ── Playback ── */

export interface MusicHandle {
  stop: () => void;
}

let currentHandle: MusicHandle | null = null;
let currentElement: HTMLAudioElement | null = null;

export function unlockAudio() {
  try {
    const ac = new AudioContext();
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const buf = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.connect(ac.destination);
    src.start(0);
  } catch {}
}

function fallbackPad(): MusicHandle {
  try {
    const ac = new AudioContext();
    const master = ac.createGain();
    master.gain.value = 0.09;
    master.connect(ac.destination);
    let t = ac.currentTime + 0.1;
    let i = 0;
    const freqs = [261.6, 329.6, 392, 523.3];
    const interval = setInterval(() => {
      const f = freqs[i % freqs.length];
      try {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.3, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + 1.3);
      } catch {}
      t += 0.7;
      i++;
    }, 700);
    return { stop: () => { clearInterval(interval); ac.close().catch(() => {}); } };
  } catch {
    return { stop: () => {} };
  }
}

export function playTrack(idOrUrl: string | null): MusicHandle | null {
  stopMusic();
  if (!idOrUrl) return null;

  // Resolve: either a catalog id (m1..) or a direct URL (from Jamendo search)
  let url = idOrUrl;
  let isId = /^m\d+$/.test(idOrUrl);
  if (isId) {
    const track = MUSIC_TRACKS.find(t => t.id === idOrUrl);
    if (!track) return null;
    url = track.url;
  }

  const el = new Audio();
  el.src = url;
  el.loop = true;
  el.volume = 0.9;
  el.preload = "auto";
  el.crossOrigin = "anonymous";

  let failed = false;
  const failTimer = setTimeout(() => {
    if (!failed && el.readyState < 2) {
      failed = true;
      el.src = "";
      currentHandle = fallbackPad();
    }
  }, 5000);
  el.onerror = () => {
    if (failed) return;
    failed = true;
    clearTimeout(failTimer);
    el.src = "";
    currentHandle = fallbackPad();
  };
  el.play().catch(() => {
    unlockAudio();
    el.play().catch(() => {
      if (!failed) {
        failed = true;
        clearTimeout(failTimer);
        el.src = "";
        currentHandle = fallbackPad();
      }
    });
  });

  currentElement = el;
  const handle: MusicHandle = {
    stop: () => {
      clearTimeout(failTimer);
      try { el.pause(); el.src = ""; } catch {}
      currentElement = null;
      if (currentHandle === handle) currentHandle = null;
    },
  };
  currentHandle = handle;
  return handle;
}

export function stopMusic() {
  if (currentHandle) { currentHandle.stop(); currentHandle = null; }
  if (currentElement) { try { currentElement.pause(); currentElement.src = ""; } catch {} currentElement = null; }
}

export function previewTrack(idOrUrl: string | null): MusicHandle | null {
  return playTrack(idOrUrl);
}

export function stopPreview() {
  stopMusic();
}
