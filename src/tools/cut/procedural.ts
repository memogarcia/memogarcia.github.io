// Cut — Procedural demo scenes, the lo-fi demo track synth, and waveform peaks.
import * as E from './engine/index.ts';
import { audioContextClass, ensureAudioContext } from './audio.ts';
import { drawNightRoute } from './demo-route.ts';
import { context2d, makeCanvas } from './dom.ts';
import type { SceneId } from './types.ts';

type Ctx = CanvasRenderingContext2D;

function drawTokyoRain(ctx: Ctx, t: number, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a1020');
  grad.addColorStop(0.55, '#191933');
  grad.addColorStop(1, '#2d1522');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const bokeh = [
    { x: 0.22, y: 0.34, r: 0.14, c: 'rgba(235, 87, 72, 0.26)', s: 0.3 },
    { x: 0.78, y: 0.28, r: 0.17, c: 'rgba(84, 198, 224, 0.22)', s: -0.22 },
    { x: 0.56, y: 0.58, r: 0.2, c: 'rgba(245, 185, 84, 0.2)', s: 0.18 },
    { x: 0.18, y: 0.72, r: 0.12, c: 'rgba(235, 110, 145, 0.22)', s: 0.26 },
    { x: 0.84, y: 0.76, r: 0.15, c: 'rgba(98, 212, 175, 0.2)', s: -0.15 },
  ];
  for (const b of bokeh) {
    const bx = (b.x + Math.sin(t * b.s + b.r * 20) * 0.04) * w;
    const by = (b.y + Math.cos(t * b.s * 1.2) * 0.03) * h;
    const br = b.r * Math.min(w, h);
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    rg.addColorStop(0, b.c);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(215, 232, 255, 0.28)';
  ctx.lineWidth = Math.max(1, w * 0.0022);
  for (let i = 0; i < 48; i++) {
    const seed = i * 97.13;
    const rx = ((seed * 3.17) % 1) * w;
    const speed = 0.65 + (i % 5) * 0.14;
    const ry = (((seed * 0.19 + t * speed) % 1.2) - 0.1) * h;
    const len = (0.045 + (i % 4) * 0.015) * h;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - len * 0.12, ry + len);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 175, 120, 0.07)';
  for (let i = 0; i < 10; i++) {
    const y = h * (0.76 + i * 0.024);
    const bw = w * (0.18 + Math.sin(t * 2.1 + i) * 0.08);
    ctx.fillRect((w - bw) / 2 + Math.sin(t + i * 1.7) * w * 0.15, y, bw, 3);
  }
}

function drawGoldenHour(ctx: Ctx, t: number, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#222b45');
  grad.addColorStop(0.36, '#87434d');
  grad.addColorStop(0.62, '#de8250');
  grad.addColorStop(0.72, '#f7c57c');
  grad.addColorStop(1, '#1d2233');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const sunX = w * 0.5;
  const sunY = h * (0.44 + t * 0.018);
  const sunR = Math.min(w, h) * 0.17;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.5);
  halo.addColorStop(0, 'rgba(255, 240, 196, 0.72)');
  halo.addColorStop(0.45, 'rgba(247, 165, 92, 0.25)');
  halo.addColorStop(1, 'rgba(247, 165, 92, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff3d1';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  const seaY = h * 0.64;
  const seaGrad = ctx.createLinearGradient(0, seaY, 0, h);
  seaGrad.addColorStop(0, '#362637');
  seaGrad.addColorStop(1, '#141724');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, seaY, w, h - seaY);

  ctx.fillStyle = 'rgba(255, 224, 166, 0.45)';
  for (let i = 0; i < 16; i++) {
    const p = i / 16;
    const y = seaY + 8 + p * p * (h - seaY - 16);
    const rw = sunR * (1.7 - p * 1.0) + Math.sin(t * 3 + i * 1.4) * 18;
    const ox = Math.sin(t * 2 + i) * 10;
    ctx.fillRect(sunX - rw / 2 + ox, y, rw, 2.5 + p * 3);
  }
}

function drawKineticGrid(ctx: Ctx, t: number, w: number, h: number): void {
  ctx.fillStyle = '#f2ede1';
  ctx.fillRect(0, 0, w, h);

  const step = Math.max(36, Math.round(Math.min(w, h) / 10));
  ctx.strokeStyle = 'rgba(27, 27, 30, 0.09)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  const baseR = Math.min(w, h) * 0.25;
  ctx.save();
  ctx.translate(w * 0.5, h * 0.46);
  ctx.rotate(t * 0.55);
  ctx.strokeStyle = '#1b1b1e';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.arc(0, 0, baseR * 1.25, 0, Math.PI * 1.45);
  ctx.stroke();

  const pulse = 1 + Math.sin(t * Math.PI * 1.6) * 0.06;
  ctx.fillStyle = '#c84231';
  ctx.beginPath();
  ctx.arc(Math.cos(t * 0.9) * baseR * 0.28, Math.sin(t * 0.9) * baseR * 0.28, baseR * 0.56 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1b1b1e';
  ctx.beginPath();
  ctx.arc(-Math.cos(t * 0.9) * baseR * 0.65, -Math.sin(t * 0.9) * baseR * 0.65, baseR * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(27, 27, 30, 0.45)';
  ctx.font = `600 ${Math.round(Math.min(w, h) * 0.024)}px ui-monospace, Menlo, monospace`;
  ctx.fillText(`FRAME ${String(Math.floor(t * 30)).padStart(3, '0')}`, w * 0.07, h * 0.08);
}

export function drawProceduralClip(ctx: Ctx, sceneId: SceneId | null | undefined, t: number, w: number, h: number): void {
  if (sceneId === 'tokyo-rain') drawTokyoRain(ctx, t, w, h);
  else if (sceneId === 'night-route') drawNightRoute(ctx, t, w, h);
  else if (sceneId === 'golden-hour') drawGoldenHour(ctx, t, w, h);
  else drawKineticGrid(ctx, t, w, h);
}

export function makeProceduralThumbs(sceneId: SceneId | null | undefined, duration: number): string[] {
  const c = makeCanvas(96, 64);
  const g = context2d(c);
  const frames: string[] = [];
  for (let i = 0; i < 5; i++) {
    drawProceduralClip(g, sceneId, (i / 4) * duration, 96, 64);
    frames.push(c.toDataURL('image/jpeg', 0.72));
  }
  return frames;
}

export function extractPeaks(data: Float32Array, count = 120): number[] {
  const step = Math.max(1, Math.floor(data.length / count));
  const stride = Math.max(1, Math.floor(step / 24));
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    let max = 0;
    const start = i * step;
    const end = Math.min(data.length, start + step);
    for (let j = start; j < end; j += stride) {
      const a = Math.abs(data[j]);
      if (a > max) max = a;
    }
    peaks.push(E.clamp(max, 0.05, 1));
  }
  return peaks;
}

/** A four-chord lo-fi loop with kick and hats. `buffer` is null when Web Audio is unavailable. */
export function synthesizeDemoAudio(durationSec = 11.6): { buffer: AudioBuffer | null; peaks: number[] } {
  const ctx = audioContextClass() ? ensureAudioContext() : null;
  const sampleRate = ctx ? ctx.sampleRate : 44100;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  const chords = [
    [174.61, 220.0, 261.63, 329.63],
    [164.81, 196.0, 246.94, 293.66],
    [146.83, 174.61, 220.0, 261.63],
    [130.81, 164.81, 196.0, 246.94],
  ];
  const barDur = 2.9;
  const beatDur = barDur / 4;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const localBar = t % barDur;
    const env = Math.min(1, localBar / 0.04) * Math.exp(-localBar * 0.62);
    const notes = chords[Math.floor(t / barDur) % chords.length];

    let sL = 0;
    let sR = 0;
    for (let n = 0; n < notes.length; n++) {
      const freq = notes[n];
      const tone = Math.sin(2 * Math.PI * freq * t) + 0.22 * Math.sin(4 * Math.PI * freq * t);
      const pan = (n / (notes.length - 1)) * 0.5 - 0.25;
      sL += tone * (0.5 - pan);
      sR += tone * (0.5 + pan);
    }
    sL *= env * 0.14;
    sR *= env * 0.14;

    const bass = Math.sin(2 * Math.PI * notes[0] * 0.5 * t) * Math.exp(-localBar * 1.1) * 0.16;
    const beatInBar = localBar % (beatDur * 2);
    const kickFreq = 52 + 78 * Math.exp(-beatInBar * 28);
    const kick = Math.sin(2 * Math.PI * kickFreq * beatInBar) * Math.exp(-beatInBar * 18) * 0.2;
    const halfBeat = localBar % (beatDur * 0.5);
    const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const hat = noise * Math.exp(-halfBeat * 45) * 0.03;
    const endFade = t > durationSec - 0.6 ? Math.max(0, (durationSec - t) / 0.6) : 1;

    left[i] = Math.tanh((sL + bass + kick + hat) * endFade);
    right[i] = Math.tanh((sR + bass + kick - hat * 0.7) * endFade);
  }

  let buffer: AudioBuffer | null = null;
  if (ctx) {
    buffer = ctx.createBuffer(2, totalSamples, sampleRate);
    buffer.copyToChannel(left, 0);
    buffer.copyToChannel(right, 1);
  }
  return { buffer, peaks: extractPeaks(left, 120) };
}
