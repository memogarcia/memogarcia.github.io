// Cut — Timeline rendering: ruler, clip blocks, waveforms, seam diamonds, playhead, and toolbar state.
import * as E from './engine/index.ts';
import type { Clip, Track } from './engine/index.ts';
import { context2d, el } from './dom.ts';
import { openTransitionPopover } from './popover.ts';
import { getSelectedClip, mediaMap, perf, project, S } from './state.ts';
import { onClipPointerDown } from './timeline-drag.ts';

let lastRulerKey = '';
let lastTimeStr = '';
let lastTotalStr = '';
let lastSplitDisabled: boolean | null = null;
let lastPlayheadPx = -1;

function getTimelineDurationSpan(): number {
  const projDur = E.computeProjectDuration(project().clips);
  return Math.max(projDur + 8, S.cachedTimelineWidth / S.pxPerSec, 16);
}

/** Draws only the visible slice of the ruler; the canvas is sticky and as wide as the viewport. */
export function renderRuler(force = false): void {
  const pxPerSec = S.pxPerSec;
  const spanSec = Math.ceil(getTimelineDurationSpan());
  const widthPx = Math.ceil(spanSec * pxPerSec);
  const viewW = Math.max(1, Math.min(widthPx, 4096, Math.ceil(el.timelineScroll.clientWidth || S.cachedTimelineWidth || 720)));
  const scrollLeft = Math.max(0, Math.round(el.timelineScroll.scrollLeft || 0));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const themeAttr = document.documentElement.dataset.theme || '';
  const key = `${widthPx}|${viewW}|${scrollLeft}|${pxPerSec}|${dpr}|${themeAttr}`;
  if (!force && key === lastRulerKey) return;
  lastRulerKey = key;
  perf.rulerRebuilds += 1;

  el.timelineContent.style.width = `${widthPx}px`;

  const h = 28;
  const backingW = Math.max(1, Math.floor(viewW * dpr));
  const backingH = Math.floor(h * dpr);
  if (el.rulerCanvas.width !== backingW || el.rulerCanvas.height !== backingH) {
    el.rulerCanvas.width = backingW;
    el.rulerCanvas.height = backingH;
  }
  el.rulerCanvas.style.width = `${viewW}px`;
  el.rulerCanvas.style.height = `${h}px`;

  const ctx = context2d(el.rulerCanvas);
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, viewW, h);

  const style = getComputedStyle(document.documentElement);
  ctx.strokeStyle = style.getPropertyValue('--line-strong').trim() || '#444';
  ctx.fillStyle = style.getPropertyValue('--ink-soft').trim() || '#888';
  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
  ctx.textBaseline = 'top';

  const majorStep = E.chooseRulerStep(pxPerSec);
  const subDiv = majorStep >= 10 ? 5 : 4;
  const minorStep = majorStep / subDiv;
  const totalSteps = Math.ceil(spanSec / minorStep);
  const firstStep = Math.max(0, Math.floor((scrollLeft - 80) / (minorStep * pxPerSec)));
  const lastStep = Math.min(totalSteps, Math.ceil((scrollLeft + viewW + 80) / (minorStep * pxPerSec)));
  for (let i = firstStep; i <= lastStep; i++) {
    const t = i * minorStep;
    const x = Math.round(t * pxPerSec - scrollLeft) + 0.5;
    const isMajor = i % subDiv === 0;
    ctx.beginPath();
    ctx.moveTo(x, isMajor ? 14 : 20);
    ctx.lineTo(x, h);
    ctx.stroke();
    if (isMajor) ctx.fillText(E.formatTimecode(t, majorStep < 1), x + 4, 4);
  }
  ctx.restore();
}

function drawClipWaveform(canvas: HTMLCanvasElement, peaks: number[], clip: Clip, fillStyle: string): void {
  const ctx = context2d(canvas);
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const mediaDur = Math.max(0.1, Number.isFinite(clip.mediaDuration) ? clip.mediaDuration : 1);
  const startFrac = E.clamp((clip.sourceStart || 0) / mediaDur, 0, 1);
  const endFrac = E.clamp(((clip.sourceStart || 0) + clip.duration * (clip.speed || 1)) / mediaDur, startFrac, 1);

  ctx.fillStyle = fillStyle;
  const barW = 2;
  const gap = 2;
  const count = Math.max(4, Math.floor(w / (barW + gap)));
  for (let i = 0; i < count; i++) {
    const frac = startFrac + (i / count) * (endFrac - startFrac);
    const amp = peaks[Math.min(peaks.length - 1, Math.floor(frac * peaks.length))] || 0.1;
    const barH = Math.max(2, amp * (h - 4));
    ctx.fillRect(i * (barW + gap), (h - barH) / 2, barW, barH);
  }
}

function waveCanvas(className: string, clip: Clip, height: number, peaks: number[], fill: string): HTMLCanvasElement {
  const wave = document.createElement('canvas');
  wave.className = className;
  wave.width = E.clamp(Math.round(clip.duration * S.pxPerSec), 24, 4096);
  wave.height = height;
  drawClipWaveform(wave, peaks, clip, fill);
  return wave;
}

function clipBadges(clip: Clip): string[] {
  const badges: string[] = [];
  if (clip.speed && clip.speed !== 1) badges.push(`${clip.speed}×`);
  if (clip.muted) badges.push('M');
  if (clip.filter && clip.filter !== 'none') badges.push(E.FILTERS[clip.filter]?.label || '');
  if (clip.kenBurns && clip.kenBurns !== 'none') badges.push(E.KEN_BURNS[clip.kenBurns]?.label || '');
  return badges.filter(Boolean);
}

function clipBlockEl(clip: Clip, selectedId: string | null): HTMLDivElement {
  const block = document.createElement('div');
  block.className = 'clip-block';
  if (clip.id === selectedId) block.classList.add('selected');
  block.dataset.clipId = clip.id;
  block.dataset.track = clip.track;
  block.style.left = `${clip.start * S.pxPerSec}px`;
  block.style.width = `${Math.max(14, clip.duration * S.pxPerSec)}px`;

  const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
  if (clip.track === 'video' && media?.thumbs?.length) {
    const thumbs = media.thumbs;
    const strip = document.createElement('div');
    strip.className = 'clip-strip';
    const thumbCount = Math.max(1, Math.min(12, Math.ceil((clip.duration * S.pxPerSec) / 56)));
    for (let i = 0; i < thumbCount; i++) {
      const img = document.createElement('img');
      img.src = thumbs[Math.floor((i / thumbCount) * thumbs.length)];
      img.alt = '';
      img.draggable = false;
      strip.appendChild(img);
    }
    block.appendChild(strip);
    if (media.peaks && !clip.muted) {
      block.appendChild(waveCanvas('clip-mini-wave', clip, 16, media.peaks, 'rgba(255, 255, 255, 0.48)'));
    }
  }
  if (clip.track === 'audio' && media?.peaks) {
    block.appendChild(waveCanvas('clip-wave', clip, 42, media.peaks, 'rgba(229, 241, 252, 0.45)'));
  }

  const label = document.createElement('div');
  label.className = 'clip-label';
  const nameSpan = document.createElement('span');
  nameSpan.className = 'clip-name';
  nameSpan.textContent = clip.track === 'text' ? clip.text || 'Text' : clip.name;
  label.appendChild(nameSpan);
  const badges = clipBadges(clip);
  if (badges.length) {
    const pill = document.createElement('span');
    pill.className = 'clip-pill';
    pill.textContent = badges.join(' · ');
    label.appendChild(pill);
  }
  block.appendChild(label);

  for (const side of ['left', 'right'] as const) {
    const handle = document.createElement('div');
    handle.className = `trim-handle trim-${side}`;
    handle.dataset.handle = side;
    block.appendChild(handle);
  }
  block.addEventListener('pointerdown', (ev) => onClipPointerDown(ev, clip.id));
  return block;
}

function seamButtons(): HTMLButtonElement[] {
  return E.getAdjacentVideoSeams(project().clips).map((seam) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'seam-btn';
    if (seam.transition.type !== 'none') btn.classList.add('active');
    btn.style.left = `${seam.time * S.pxPerSec}px`;
    const trLabel = E.TRANSITIONS[seam.transition.type]?.label || 'Cut';
    btn.title = `Transition: ${trLabel} (click to edit)`;
    btn.setAttribute('aria-label', `Edit transition (${trLabel})`);
    btn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openTransitionPopover(seam.nextId, btn);
    });
    return btn;
  });
}

export function renderTimelineClips(): void {
  perf.timelineRebuilds += 1;
  const lanes: Record<Track, HTMLDivElement> = { text: el.laneText, video: el.laneVideo, audio: el.laneAudio };
  const children: Record<Track, HTMLElement[]> = { text: [], video: [], audio: [] };
  const selectedId = project().selectedClipId;
  for (const clip of project().clips) {
    if (lanes[clip.track]) children[clip.track].push(clipBlockEl(clip, selectedId));
  }
  children.video.push(...seamButtons());
  for (const track of ['text', 'video', 'audio'] as const) {
    lanes[track].replaceChildren(...children[track]);
    lanes[track].classList.toggle('is-muted', S.trackMuted[track]);
  }
  updateTimelineButtons();
}

export function renderTrackToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-toggle-track]').forEach((btn) => {
    const track = btn.dataset.toggleTrack as Track;
    btn.setAttribute('aria-pressed', String(Boolean(S.trackMuted[track])));
  });
}

export function updatePlayheadUI(): void {
  const x = Math.round(S.playhead * S.pxPerSec * 2) / 2;
  if (x !== lastPlayheadPx) {
    el.playhead.style.transform = `translate3d(${x}px, 0, 0)`;
    lastPlayheadPx = x;
  }
  const splitDisabled = !E.findClipToSplit(project().clips, project().selectedClipId, S.playhead);
  if (splitDisabled !== lastSplitDisabled) {
    el.splitBtn.disabled = splitDisabled;
    lastSplitDisabled = splitDisabled;
  }
}

export function updateTimecodeUI(): void {
  const curStr = E.formatTimecode(S.playhead);
  if (curStr !== lastTimeStr) {
    el.timeCurrent.textContent = curStr;
    lastTimeStr = curStr;
  }
  const totStr = E.formatTimecode(E.computeProjectDuration(project().clips));
  if (totStr !== lastTotalStr) {
    el.timeTotal.textContent = totStr;
    lastTotalStr = totStr;
  }
}

export function updateTimelineButtons(): void {
  const sel = getSelectedClip();
  lastSplitDisabled = !E.findClipToSplit(project().clips, project().selectedClipId, S.playhead);
  el.splitBtn.disabled = lastSplitDisabled;
  el.dupBtn.disabled = !sel;
  el.delBtn.disabled = !sel;
  el.closeGapsBtn.disabled = !project().clips.some((c) => c.track === 'video');
}
