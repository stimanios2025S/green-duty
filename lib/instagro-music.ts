/**
 * Music library for stories & posts.
 * Tracks are REAL MP3 files (royalty-free sample tracks) streamed from the web,
 * looped like Instagram music. If a track fails to load (offline/CORS), we
 * fall back to a Web Audio generative pad so the story still has sound.
 */

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  emoji: string;
  gradient: string;
  url: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  { id: "m1", name: "Sunrise Groove", artist: "SoundHelix", duration: "6:12", emoji: "🌅", gradient: "from-amber-400 to-orange-600", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "m2", name: "Calm Fields", artist: "SoundHelix", duration: "8:04", emoji: "🌾", gradient: "from-lime-400 to-green-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "m3", name: "Harvest Beat", artist: "SoundHelix", duration: "5:26", emoji: "🎧", gradient: "from-orange-400 to-red-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "m4", name: "Misty Morning", artist: "SoundHelix", duration: "7:31", emoji: "💭", gradient: "from-sky-400 to-blue-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "m5", name: "Forest Walk", artist: "SoundHelix", duration: "5:54", emoji: "🌲", gradient: "from-emerald-500 to-teal-700", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

export interface MusicHandle {
  stop: () => void;
}

let currentHandle: MusicHandle | null = null;
let currentElement: HTMLAudioElement | null = null;

/** Browsers block audio until a user gesture — call on first click/keypress */
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

/** Fallback: generative Web Audio pad if the MP3 can't load */
function fallbackPad(name: string): MusicHandle {
  try {
    const ac = new AudioContext();
    const master = ac.createGain();
    master.gain.value = 0.1;
    master.connect(ac.destination);
    const freqs = name.includes("Misty") || name.includes("Calm")
      ? [261.6, 329.6, 392, 523.3]
      : [220, 261.6, 329.6];
    let t = ac.currentTime + 0.1;
    let i = 0;
    const interval = setInterval(() => {
      const f = freqs[i % freqs.length];
      try {
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.4, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        osc.connect(g); g.connect(master);
        osc.start(t); osc.stop(t + 1.4);
      } catch {}
      t += 0.7;
      i++;
    }, 700);
    return { stop: () => { clearInterval(interval); ac.close().catch(() => {}); } };
  } catch {
    return { stop: () => {} };
  }
}

/** Play a track (looping). Returns a handle to stop it. */
export function playTrack(id: string | null): MusicHandle | null {
  stopMusic();
  if (!id) return null;
  const track = MUSIC_TRACKS.find(t => t.id === id);
  if (!track) return null;

  const el = new Audio();
  el.src = track.url;
  el.loop = true;
  el.volume = 0.9;
  el.preload = "auto";
  el.crossOrigin = "anonymous";

  let failed = false;
  const failTimer = setTimeout(() => {
    if (!failed && el.readyState < 2) {
      failed = true;
      el.src = "";
      currentHandle = fallbackPad(track.name);
    }
  }, 4000);
  el.onerror = () => {
    if (failed) return;
    failed = true;
    clearTimeout(failTimer);
    el.src = "";
    currentHandle = fallbackPad(track.name);
  };
  el.play().catch(() => {
    // Autoplay blocked — try once more after unlockAudio
    unlockAudio();
    el.play().catch(() => {
      if (!failed) {
        failed = true;
        clearTimeout(failTimer);
        el.src = "";
        currentHandle = fallbackPad(track.name);
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

/** Kept for compatibility with older imports */
export function getAudioCtx(): AudioContext {
  try { return new AudioContext(); } catch { return null as unknown as AudioContext; }
}

export function previewTrack(id: string | null): MusicHandle | null {
  return playTrack(id);
}

export function stopPreview() {
  stopMusic();
}
