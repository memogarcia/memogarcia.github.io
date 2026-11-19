// Cut — Per-frame math: fades, photo motion, caption animation, CSS filters, framing, timecodes.
import { clamp } from './core.ts';
import { ASPECTS, FILTERS, isKeyOf } from './presets.ts';
import type { AspectKey, Clip, Fit, Quality, Rect } from './types.ts';

export interface KenBurnsState {
  scale: number;
  panX: number;
  panY: number;
}

export interface TextAnimState {
  alpha: number;
  scale: number;
  offsetY: number;
}

const STILL: KenBurnsState = { scale: 1, panX: 0, panY: 0 };
const DEFAULT_TEXT_FADE = 0.25;

export function computeClipOpacity(clip: Pick<Clip, 'duration' | 'fadeIn' | 'fadeOut'>, localTime: number): number {
  const dur = Math.max(0.001, clip.duration);
  let alpha = 1;
  if (clip.fadeIn > 0 && localTime < clip.fadeIn) {
    alpha = Math.min(alpha, clamp(localTime / clip.fadeIn, 0, 1));
  }
  const remaining = dur - localTime;
  if (clip.fadeOut > 0 && remaining < clip.fadeOut) {
    alpha = Math.min(alpha, clamp(remaining / clip.fadeOut, 0, 1));
  }
  return alpha;
}

export function evalKenBurns(clip: Pick<Clip, 'duration' | 'kenBurns'>, localTime: number): KenBurnsState {
  const mode = clip.kenBurns || 'none';
  if (mode === 'none') return { ...STILL };
  const p = clamp(localTime / Math.max(0.001, clip.duration), 0, 1);
  if (mode === 'zoom-in') return { scale: 1 + 0.14 * p, panX: 0, panY: 0 };
  if (mode === 'zoom-out') return { scale: 1.14 - 0.14 * p, panX: 0, panY: 0 };
  return { ...STILL };
}

const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function evalTextAnim(
  clip: Pick<Clip, 'duration' | 'animation'> & Partial<Pick<Clip, 'fadeIn' | 'fadeOut'>>,
  localTime: number,
): TextAnimState {
  const dur = Math.max(0.001, clip.duration);
  // `??` keeps an explicit 0 (the cut side of a split caption) instead of animating it.
  const inDur = Math.min(clip.fadeIn ?? DEFAULT_TEXT_FADE, dur * 0.45);
  const outDur = Math.min(clip.fadeOut ?? DEFAULT_TEXT_FADE, dur * 0.45);
  const anim = clip.animation || 'none';

  let scale = 1;
  if (anim === 'none') return { alpha: 1, scale, offsetY: 0 };

  const pIn = inDur > 0 ? clamp(localTime / inDur, 0, 1) : 1;
  const pOut = outDur > 0 ? clamp((dur - localTime) / outDur, 0, 1) : 1;
  const alpha = Math.min(pIn, pOut);
  if (anim === 'pop') {
    scale = pIn < 1 ? 0.72 + 0.28 * easeOutBack(pIn) : 1;
    if (pOut < 1) scale *= 0.9 + 0.1 * pOut;
  }
  return { alpha: clamp(alpha, 0, 1), scale, offsetY: 0 };
}

export function buildCanvasFilter(clip: Pick<Clip, 'filter' | 'brightness' | 'contrast' | 'saturation'>): string {
  const parts: string[] = [];
  const preset = isKeyOf(FILTERS, clip.filter) ? FILTERS[clip.filter] : null;
  if (preset && preset.css) parts.push(preset.css);
  if (clip.brightness !== undefined && clip.brightness !== 100) {
    parts.push(`brightness(${(clip.brightness / 100).toFixed(2)})`);
  }
  if (clip.contrast !== undefined && clip.contrast !== 100) {
    parts.push(`contrast(${(clip.contrast / 100).toFixed(2)})`);
  }
  if (clip.saturation !== undefined && clip.saturation !== 100) {
    parts.push(`saturate(${(clip.saturation / 100).toFixed(2)})`);
  }
  return parts.length ? parts.join(' ') : 'none';
}

export function computeDrawRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  fit: Fit = 'cover',
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
): Rect {
  if (!srcW || !srcH || !dstW || !dstH) {
    return { x: 0, y: 0, w: dstW || 0, h: dstH || 0 };
  }
  const scaleX = dstW / srcW;
  const scaleY = dstH / srcH;
  const baseScale = fit === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
  const finalScale = baseScale * clamp(zoom, 0.25, 4);
  const w = srcW * finalScale;
  const h = srcH * finalScale;
  return {
    x: (dstW - w) / 2 + clamp(offsetX, -1, 1) * dstW,
    y: (dstH - h) / 2 + clamp(offsetY, -1, 1) * dstH,
    w,
    h,
  };
}

/** `MM:SS.t`. Works in integer milliseconds so 61.3 shows `01:01.3`, not `01:01.2`. */
export function formatTimecode(sec: number, includeTenths = true): string {
  const ms = Math.round(Math.max(0, Number.isFinite(sec) ? sec : 0) * 1000);
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  if (!includeTenths) return `${mm}:${ss}`;
  return `${mm}:${ss}.${Math.floor((ms % 1000) / 100)}`;
}

export function chooseRulerStep(pxPerSec: number): number {
  for (const step of [0.5, 1, 2, 5, 10, 15, 30, 60]) {
    if (step * pxPerSec >= 68) return step;
  }
  return 60;
}

export function getCanvasDimensions(aspectKey: AspectKey | string, quality: Quality = '720'): { width: number; height: number } {
  const preset = isKeyOf(ASPECTS, aspectKey) ? ASPECTS[aspectKey] : ASPECTS['9:16'];
  return quality === '1080'
    ? { width: preset.w1080, height: preset.h1080 }
    : { width: preset.w720, height: preset.h720 };
}
