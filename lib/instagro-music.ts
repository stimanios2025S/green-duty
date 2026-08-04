/**
 * Music library for stories & posts.
 * Tracks are generated live with the Web Audio API (real, playable, loopable,
 * zero licensing issues) — each "track" is a small generative pattern.
 */

export interface MusicTrack {
  id: string;
  name: string;
  artist: string;
  duration: string;
  emoji: string;
  gradient: string;
  start(ctx: AudioContext): { stop: () => void };
}

let ctx: AudioContext | null = null;

export function getAudioCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Simple helper: schedule an oscillator note */
function note(ctx: AudioContext, oscType: OscillatorType, freq: number, start: number, dur: number, gain: number, dest: GainNode) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = oscType;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.1);
}

function softPad(ctx: AudioContext, freqs: number[], stepDur = 0.5, masterGain = 0.08) {
  const master = ctx.createGain();
  master.gain.value = masterGain;
  master.connect(ctx.destination);
  let t = ctx.currentTime + 0.1;
  let i = 0;
  const interval = setInterval(() => {
    const f = freqs[i % freqs.length];
    note(ctx, "sine", f, t, stepDur * 1.4, 0.5, master);
    note(ctx, "sine", f * 1.5, t + 0.01, stepDur * 1.2, 0.2, master);
    t += stepDur;
    i++;
  }, stepDur * 1000);
  return { stop: () => clearInterval(interval) };
}

function chillChords(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.07;
  master.connect(ctx.destination);
  const chords: number[][] = [
    [220, 261.6, 329.6],   // Am
    [174.6, 220, 261.6],   // F
    [196, 246.9, 293.7],   // G
    [164.8, 207.6, 246.9], // Em
  ];
  let t = ctx.currentTime + 0.1;
  let i = 0;
  const interval = setInterval(() => {
    const chord = chords[i % chords.length];
    chord.forEach(f => note(ctx, "triangle", f, t, 2.2, 0.4, master));
    t += 2.4;
    i++;
  }, 2400);
  return { stop: () => clearInterval(interval) };
}

function natureAmbient(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.09;
  master.connect(ctx.destination);
  // gentle birdsong-like chirps + low drone
  const drone = ctx.createOscillator();
  drone.type = "sine";
  drone.frequency.value = 130.8;
  const dg = ctx.createGain();
  dg.gain.value = 0.05;
  drone.connect(dg); dg.connect(master);
  drone.start();
  let t = ctx.currentTime + 0.1;
  let i = 0;
  const chirps = [880, 1046, 1318, 1174, 1568];
  const interval = setInterval(() => {
    if (i % 2 === 0) {
      const f = chirps[Math.floor(Math.random() * chirps.length)];
      note(ctx, "sine", f, t, 0.25, 0.25, master);
      note(ctx, "sine", f * 1.005, t + 0.06, 0.2, 0.12, master);
    }
    t += 0.9;
    i++;
  }, 900);
  return { stop: () => { clearInterval(interval); drone.stop(); } };
}

function lofiBeat(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.1;
  master.connect(ctx.destination);
  // kick on beats
  const bassline = [55, 55, 65.4, 55, 49, 49, 61.7, 55];
  let t = ctx.currentTime + 0.1;
  let i = 0;
  const interval = setInterval(() => {
    // kick
    note(ctx, "sine", 120, t, 0.12, 0.7, master);
    // bass note
    const f = bassline[i % bassline.length];
    note(ctx, "triangle", f, t, 0.4, 0.3, master);
    // hat (short noise-ish high osc)
    note(ctx, "square", 8000, t + 0.3, 0.03, 0.05, master);
    t += 0.6;
    i++;
  }, 600);
  return { stop: () => clearInterval(interval) };
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "m1", name: "Calm Sunrise", artist: "InstaGro Originals", duration: "Loop",
    emoji: "🌅", gradient: "from-amber-400 to-orange-600",
    start: ctx => chillChords(ctx),
  },
  {
    id: "m2", name: "Forest Birds", artist: "InstaGro Originals", duration: "Loop",
    emoji: "🌲", gradient: "from-emerald-500 to-teal-700",
    start: ctx => natureAmbient(ctx),
  },
  {
    id: "m3", name: "Dreamy Pad", artist: "InstaGro Originals", duration: "Loop",
    emoji: "💭", gradient: "from-sky-400 to-blue-700",
    start: ctx => softPad(ctx, [261.6, 329.6, 392, 523.3]),
  },
  {
    id: "m4", name: "Lo-Fi Groove", artist: "InstaGro Originals", duration: "Loop",
    emoji: "🎧", gradient: "from-purple-500 to-indigo-700",
    start: ctx => lofiBeat(ctx),
  },
];

export function previewTrack(id: string | null): { stop: () => void } | null {
  stopPreview();
  if (!id) return null;
  const track = MUSIC_TRACKS.find(t => t.id === id);
  if (!track) return null;
  const ac = getAudioCtx();
  const handle = track.start(ac);
  previewHandle = handle;
  return handle;
}

let previewHandle: { stop: () => void } | null = null;

export function stopPreview() {
  if (previewHandle) { previewHandle.stop(); previewHandle = null; }
}
