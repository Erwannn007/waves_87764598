// Sons synthétisés (WebAudio) : aucun fichier audio, aucune licence. Déverrouillés au premier geste
// (obligatoire sur iOS ; le bouton silencieux de l'iPhone coupe aussi ces sons).
import { settings } from './settings';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let voices = 0;

export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function voice(dur: number, build: (c: AudioContext, out: GainNode, t: number) => void): void {
  if (!ctx || !master || ctx.state !== 'running' || voices > 24) return;
  master.gain.value = settings.volume;
  const out = ctx.createGain();
  out.connect(master);
  voices++;
  build(ctx, out, ctx.currentTime);
  setTimeout(() => { voices--; out.disconnect(); }, (dur + 0.1) * 1000);
}

function noiseBurst(c: AudioContext, out: GainNode, t: number, freq: number, q: number, peak: number, decay: number, type: BiquadFilterType = 'lowpass'): void {
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  env(g, t, peak, 0.002, decay);
  src.connect(f).connect(g).connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + decay + 0.05);
}

function tone(c: AudioContext, out: GainNode, t: number, type: OscillatorType, f0: number, f1: number, peak: number, decay: number): void {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + decay);
  const g = c.createGain();
  env(g, t, peak, 0.004, decay);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + decay + 0.05);
}

export const sfx = {
  shot_ar: () => voice(0.2, (c, o, t) => { noiseBurst(c, o, t, 2600, 0.7, 0.5, 0.09); tone(c, o, t, 'square', 150, 45, 0.25, 0.1); }),
  empty: () => voice(0.06, (c, o, t) => tone(c, o, t, 'square', 1400, 900, 0.08, 0.03)),
  reloadStart: () => voice(0.1, (c, o, t) => { tone(c, o, t, 'square', 600, 300, 0.1, 0.04); noiseBurst(c, o, t + 0.02, 3000, 2, 0.12, 0.04, 'bandpass'); }),
  reloadEnd: () => voice(0.15, (c, o, t) => { tone(c, o, t, 'square', 900, 500, 0.12, 0.03); tone(c, o, t + 0.07, 'square', 1200, 700, 0.12, 0.04); }),
  hitFlesh: () => voice(0.15, (c, o, t) => { noiseBurst(c, o, t, 700, 1, 0.35, 0.07); tone(c, o, t, 'sine', 180, 60, 0.25, 0.08); }),
  hitWood: () => voice(0.12, (c, o, t) => { tone(c, o, t, 'triangle', 420, 250, 0.3, 0.06); noiseBurst(c, o, t, 1800, 3, 0.15, 0.04, 'bandpass'); }),
  breakWood: () => voice(0.5, (c, o, t) => { noiseBurst(c, o, t, 1200, 0.8, 0.5, 0.35); tone(c, o, t, 'triangle', 200, 60, 0.3, 0.3); }),
  hitWorld: () => voice(0.08, (c, o, t) => noiseBurst(c, o, t, 4000, 2, 0.12, 0.03, 'highpass')),
  groan: () => voice(0.8, (c, o, t) => {
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    const base = 70 + Math.random() * 40;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base * 0.7, t + 0.7);
    const lfo = c.createOscillator();
    lfo.frequency.value = 7;
    const lg = c.createGain();
    lg.gain.value = 8;
    lfo.connect(lg).connect(osc.frequency);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 500;
    const g = c.createGain();
    env(g, t, 0.18, 0.12, 0.6);
    osc.connect(f).connect(g).connect(o);
    osc.start(t); lfo.start(t);
    osc.stop(t + 0.8); lfo.stop(t + 0.8);
  }),
  swipe: () => voice(0.25, (c, o, t) => noiseBurst(c, o, t, 900, 1.5, 0.25, 0.18, 'bandpass')),
  hurt: () => voice(0.25, (c, o, t) => { tone(c, o, t, 'square', 260, 110, 0.2, 0.18); noiseBurst(c, o, t, 600, 1, 0.2, 0.1); }),
  death: () => voice(0.6, (c, o, t) => { tone(c, o, t, 'sawtooth', 120, 40, 0.2, 0.5); noiseBurst(c, o, t, 400, 1, 0.2, 0.4); }),
  ui: () => voice(0.06, (c, o, t) => tone(c, o, t, 'square', 700, 900, 0.07, 0.03)),
} as const;
export type SfxName = keyof typeof sfx;

export function vibrate(ms: number): void {
  // Android uniquement : navigator.vibrate n'existe pas sur iOS Safari.
  if (settings.vibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
}
