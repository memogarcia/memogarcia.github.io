// Cut — Canvas compositor shared by the preview and the export: video layer, transitions, captions.
import * as E from './engine/index.ts';
import type { Clip, Project, Rect, TextPreset } from './engine/index.ts';
import { context2d, makeCanvas } from './dom.ts';
import { slotForClip } from './media-pool.ts';
import { drawProceduralClip } from './procedural.ts';
import { mediaMap, S } from './state.ts';

type Ctx = CanvasRenderingContext2D;
type Drawable = CanvasImageSource;

// Offscreen scratch canvases for transitions and the 1/8-scale blurred backdrop
const scratchA = makeCanvas();
const scratchCtxA = context2d(scratchA, { alpha: false });
const scratchB = makeCanvas();
const scratchCtxB = context2d(scratchB, { alpha: false });
const blurCanvas = makeCanvas();
const blurCtx = context2d(blurCanvas, { alpha: false });

const textLayoutCache = new Map<string, { lines: string[]; textWidth: number }>();

export function clearTextLayoutCache(): void {
  textLayoutCache.clear();
}

function drawTransformedDrawable(ctx: Ctx, drawable: Drawable, rect: Rect, rotate = 0, flipH = false): void {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (flipH) ctx.scale(-1, 1);
  if (rotate) ctx.rotate((rotate * Math.PI) / 180);
  const rotated = rotate === 90 || rotate === 270;
  const drawW = rotated ? rect.h : rect.w;
  const drawH = rotated ? rect.w : rect.h;
  ctx.drawImage(drawable, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawRoundedRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** The current picture for a clip, falling back to the last decoded frame while its element seeks. */
function pickDrawable(clip: Clip, fallbackW: number, fallbackH: number): { drawable: Drawable; w: number; h: number } | null {
  const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
  if (!media) return null;
  if (media.kind === 'image') {
    return media.img && media.img.complete ? { drawable: media.img, w: media.width || fallbackW, h: media.height || fallbackH } : null;
  }
  if (media.kind !== 'video') return null;
  const slot = slotForClip(clip.id);
  const video = slot?.el;
  if (!slot || !(video instanceof HTMLVideoElement)) return null;
  const w = video.videoWidth || media.width || fallbackW;
  const h = video.videoHeight || media.height || fallbackH;
  if (video.readyState >= 2) return { drawable: video, w, h };
  if (slot.lastFrame) return { drawable: slot.lastFrame, w, h };
  return null;
}

function drawBlurredBackdrop(ctx: Ctx, p: Project, clip: Clip, drawable: Drawable, srcW: number, srcH: number, w: number, h: number): void {
  // A 1/8-scale blur pass looks the same as a full-resolution one and costs a fraction of it.
  const bw = Math.max(48, Math.round(w / 8));
  const bh = Math.max(48, Math.round(h / 8));
  if (blurCanvas.width !== bw || blurCanvas.height !== bh) {
    blurCanvas.width = bw;
    blurCanvas.height = bh;
  }
  blurCtx.save();
  blurCtx.fillStyle = p.bgColor || '#0e0f12';
  blurCtx.fillRect(0, 0, bw, bh);
  blurCtx.filter = 'blur(4px) brightness(0.55) saturate(1.15)';
  const smallCover = E.computeDrawRect(srcW, srcH, bw, bh, 'cover', 1.12, 0, 0);
  drawTransformedDrawable(blurCtx, drawable, smallCover, clip.rotate, clip.flipH);
  blurCtx.restore();

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(blurCanvas, 0, 0, w, h);
  ctx.restore();
}

function drawVideoClipToCtx(ctx: Ctx, p: Project, clip: Clip, w: number, h: number, localTime: number): void {
  const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
  if (!media) return;
  const opacity = E.computeClipOpacity(clip, localTime);
  if (opacity <= 0.001) return;

  const kb = clip.kind === 'image' ? E.evalKenBurns(clip, localTime) : { scale: 1, panX: 0, panY: 0 };
  const zoom = (clip.zoom || 1) * kb.scale;
  const offX = (clip.offsetX || 0) + kb.panX;
  const offY = (clip.offsetY || 0) + kb.panY;
  const filterStr = E.buildCanvasFilter(clip);

  ctx.save();
  ctx.globalAlpha *= opacity;

  if (media.kind === 'procedural') {
    if (filterStr !== 'none') ctx.filter = filterStr;
    ctx.translate(w / 2 + offX * w, h / 2 + offY * h);
    if (clip.flipH) ctx.scale(-1, 1);
    if (clip.rotate) ctx.rotate((clip.rotate * Math.PI) / 180);
    if (zoom !== 1) ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2);
    const sourceTime = (clip.sourceStart || 0) + localTime * (clip.speed || 1);
    drawProceduralClip(ctx, media.sceneId, sourceTime, w, h);
  } else {
    const picked = pickDrawable(clip, w, h);
    if (picked) {
      const rotated = clip.rotate === 90 || clip.rotate === 270;
      const srcW = rotated ? picked.h : picked.w;
      const srcH = rotated ? picked.w : picked.h;
      if (clip.fit === 'contain' && clip.blurBg) {
        drawBlurredBackdrop(ctx, p, clip, picked.drawable, srcW, srcH, w, h);
      }
      if (filterStr !== 'none') ctx.filter = filterStr;
      const rect = E.computeDrawRect(srcW, srcH, w, h, clip.fit || 'cover', zoom, offX, offY);
      drawTransformedDrawable(ctx, picked.drawable, rect, clip.rotate, clip.flipH);
    }
  }
  ctx.restore();
}

function ensureScratchSize(w: number, h: number): void {
  if (scratchA.width !== w || scratchA.height !== h) {
    scratchA.width = w;
    scratchA.height = h;
    scratchB.width = w;
    scratchB.height = h;
  }
}

function drawTransitionLayer(ctx: Ctx, p: Project, tr: E.TransitionState, w: number, h: number, time: number): void {
  ensureScratchSize(w, h);
  const bg = p.bgColor || '#0e0f12';
  scratchCtxA.fillStyle = bg;
  scratchCtxA.fillRect(0, 0, w, h);
  drawVideoClipToCtx(scratchCtxA, p, tr.outgoing, w, h, Math.max(0, tr.outgoing.duration - 0.02));
  scratchCtxB.fillStyle = bg;
  scratchCtxB.fillRect(0, 0, w, h);
  drawVideoClipToCtx(scratchCtxB, p, tr.incoming, w, h, Math.max(0, time - tr.incoming.start));

  const prog = tr.progress;
  ctx.save();
  if (tr.type === 'dissolve') {
    ctx.drawImage(scratchA, 0, 0);
    ctx.globalAlpha = prog;
    ctx.drawImage(scratchB, 0, 0);
  } else if (tr.type === 'slide-left') {
    ctx.drawImage(scratchA, -prog * w, 0);
    ctx.drawImage(scratchB, (1 - prog) * w, 0);
  } else if (tr.type === 'slide-up') {
    ctx.drawImage(scratchA, 0, -prog * h);
    ctx.drawImage(scratchB, 0, (1 - prog) * h);
  } else if (tr.type === 'zoom') {
    // Outgoing pushes out while the incoming clip punches in
    const outScale = 1 + 0.16 * prog;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(outScale, outScale);
    ctx.drawImage(scratchA, -w / 2, -h / 2);
    ctx.restore();

    const inScale = 0.86 + 0.14 * prog;
    ctx.save();
    ctx.globalAlpha = prog;
    ctx.translate(w / 2, h / 2);
    ctx.scale(inScale, inScale);
    ctx.drawImage(scratchB, -w / 2, -h / 2);
    ctx.restore();
  }
  ctx.restore();
}

function layoutText(ctx: Ctx, key: string, textStr: string, maxLineWidth: number) {
  let layout = textLayoutCache.get(key);
  if (!layout) {
    const lines = E.wrapTextLines(textStr, maxLineWidth, (s) => ctx.measureText(s).width);
    let textWidth = 0;
    for (const line of lines) textWidth = Math.max(textWidth, ctx.measureText(line).width);
    layout = { lines, textWidth };
    if (textLayoutCache.size > 120) textLayoutCache.clear();
    textLayoutCache.set(key, layout);
  }
  return layout;
}

function drawTextClip(ctx: Ctx, p: Project, clip: Clip, w: number, h: number, time: number, isPreview: boolean): void {
  const anim = E.evalTextAnim(clip, Math.max(0, time - clip.start));
  if (anim.alpha <= 0.001) return;

  const scaleUnit = Math.min(w, h) / 720;
  const preset: TextPreset = E.TEXT_PRESETS[clip.preset || 'caption'] || E.TEXT_PRESETS.caption;
  const rawText = (clip.text || '').trim() || ' ';
  const textStr = preset.uppercase ? rawText.toUpperCase() : rawText;
  const fontSize = Math.round((clip.fontSize || 44) * scaleUnit);
  const lineHeight = Math.round(fontSize * 1.22);

  ctx.save();
  ctx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const { lines, textWidth } = layoutText(ctx, `${clip.preset}|${fontSize}|${w}|${textStr}`, textStr, w * 0.86);
  const padX = preset.padX * scaleUnit;
  const padY = preset.padY * scaleUnit;
  const boxW = textWidth + padX * 2;
  const boxH = lines.length * lineHeight + padY * 2;
  const cx = (clip.x ?? 0.5) * w;
  const cy = (clip.y ?? 0.78) * h + anim.offsetY * scaleUnit;

  ctx.globalAlpha = anim.alpha;
  ctx.translate(cx, cy);
  ctx.scale(anim.scale, anim.scale);

  const bg = clip.bgColor || preset.bgColor;
  if (bg && bg !== 'transparent') {
    ctx.fillStyle = bg;
    drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, Math.min(preset.radius * scaleUnit, boxH / 2));
    ctx.fill();
  }

  const startY = -((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    const ly = startY + i * lineHeight;
    if (preset.strokeColor && preset.strokeWidth > 0) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = preset.strokeWidth * scaleUnit;
      ctx.strokeStyle = preset.strokeColor;
      ctx.strokeText(lines[i], 0, ly);
    }
    ctx.fillStyle = clip.color || preset.color;
    ctx.fillText(lines[i], 0, ly);
  }

  if (isPreview && p.selectedClipId === clip.id) {
    ctx.strokeStyle = 'rgba(239, 83, 67, 0.9)';
    ctx.lineWidth = Math.max(2, 2 * scaleUnit);
    ctx.setLineDash([6 * scaleUnit, 4 * scaleUnit]);
    ctx.strokeRect(-boxW / 2 - 4, -boxH / 2 - 4, boxW + 8, boxH + 8);
  }
  ctx.restore();

  if (isPreview) {
    S.renderedTextBoxes.push({ clipId: clip.id, x: cx - boxW / 2 - 8, y: cy - boxH / 2 - 8, w: boxW + 16, h: boxH + 16 });
  }
}

function drawSnapGuides(ctx: Ctx, w: number, h: number): void {
  const drag = S.canvasDrag;
  if (!drag) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(240, 177, 75, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 5]);
  if (drag.snapX) {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();
  }
  if (drag.snapY) {
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draws project `p` at `time`. The preview also records caption hit boxes and drag guides. */
export function renderFrame(ctx: Ctx, p: Project, w: number, h: number, time: number, isPreview = false): void {
  if (isPreview) S.renderedTextBoxes = [];
  ctx.save();
  ctx.fillStyle = p.bgColor || '#0e0f12';
  ctx.fillRect(0, 0, w, h);

  const active = E.getActiveClipsAt(p.clips, time);
  const transition = E.getTransitionStateAt(p.clips, time);
  if (transition) {
    drawTransitionLayer(ctx, p, transition, w, h, time);
  } else if (active.video) {
    drawVideoClipToCtx(ctx, p, active.video, w, h, Math.max(0, time - active.video.start));
  }

  if (!S.trackMuted.text) {
    for (const clip of active.texts) drawTextClip(ctx, p, clip, w, h, time, isPreview);
  }
  if (isPreview) drawSnapGuides(ctx, w, h);
  ctx.restore();
}
