// Cut — Preview canvas sizing and repaint, and the playback clock.
import * as E from './engine/index.ts';
import { ensureAudioContext, scheduleAllAudioFrom, stopScheduledAudio } from './audio.ts';
import { clearTextLayoutCache, renderFrame } from './compositor.ts';
import { context2d, el } from './dom.ts';
import { pauseAllSlots, syncMediaToTime } from './media-pool.ts';
import { closeTransitionPopover } from './popover.ts';
import { perf, project, S } from './state.ts';
import { updatePlayheadUI, updateTimecodeUI } from './timeline.ts';
import { markActiveTool, showToast } from './ui.ts';

const previewCtx = context2d(el.previewCanvas, { alpha: false });
let previewRafId = 0;
let lastStageEmpty: boolean | null = null;

export function sizePreviewCanvas(): void {
  const dims = E.getCanvasDimensions(project().aspect, '720');
  const box = el.stageViewport.getBoundingClientRect();
  const availW = Math.max(120, box.width - 32);
  const availH = Math.max(120, box.height - 32);
  const ratio = dims.width / dims.height;

  let frameW = availW;
  let frameH = frameW / ratio;
  if (frameH > availH) {
    frameH = availH;
    frameW = frameH * ratio;
  }
  const cssW = Math.floor(frameW);
  el.canvasFrame.style.width = `${cssW}px`;
  el.canvasFrame.style.height = `${Math.floor(frameH)}px`;

  // Backing store = displayed size * min(dpr, 1.5), capped at 720p. Export renders at full size.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  const targetW = E.clamp(Math.round(cssW * scale), Math.min(360, dims.width), dims.width);
  const targetH = Math.max(120, Math.round(targetW / ratio));
  if (el.previewCanvas.width !== targetW || el.previewCanvas.height !== targetH) {
    el.previewCanvas.width = targetW;
    el.previewCanvas.height = targetH;
    clearTextLayoutCache();
  }
  S.cachedTimelineWidth = el.timelineScroll.clientWidth || 720;
}

export function renderPreview(): void {
  const t0 = performance.now();
  const hasClips = project().clips.length > 0;
  if (lastStageEmpty !== hasClips) {
    el.stageEmpty.hidden = hasClips;
    lastStageEmpty = hasClips;
  }
  // Clips end on an exclusive boundary. Hold the last image when playback stops at the end.
  const atEnd = !S.playing && S.playhead > 0 && S.playhead === E.computeProjectDuration(project().clips);
  const frameTime = atEnd ? S.playhead - 0.001 : S.playhead;
  renderFrame(previewCtx, project(), el.previewCanvas.width, el.previewCanvas.height, frameTime, true);
  updateTimecodeUI();
  updatePlayheadUI();
  const dt = performance.now() - t0;
  perf.previewFrames += 1;
  perf.lastFrameMs = Math.round(dt * 100) / 100;
  perf.avgFrameMs = perf.previewFrames === 1
    ? perf.lastFrameMs
    : Math.round((perf.avgFrameMs * 0.9 + dt * 0.1) * 100) / 100;
}

export function schedulePreviewRender(): void {
  if (S.playing || previewRafId) return;
  previewRafId = requestAnimationFrame(() => {
    previewRafId = 0;
    renderPreview();
  });
}

function autoScrollPlayhead(): void {
  const x = S.playhead * S.pxPerSec;
  const viewL = el.timelineScroll.scrollLeft;
  const viewR = viewL + S.cachedTimelineWidth;
  if (x > viewR - 40) el.timelineScroll.scrollLeft = x - 80;
  else if (x < viewL) el.timelineScroll.scrollLeft = Math.max(0, x - 40);
}

function playbackTick(now: number): void {
  if (!S.playing) return;
  const total = E.computeProjectDuration(project().clips);
  S.playhead = S.playStartTime + (now - S.playStartWall) / 1000;
  if (S.playhead >= total) {
    S.playhead = total;
    pausePlayback();
    return;
  }
  syncMediaToTime(S.playhead, true);
  renderPreview();
  autoScrollPlayhead();
  S.rafId = requestAnimationFrame(playbackTick);
}

function setPlayButton(playing: boolean): void {
  el.playBtn.setAttribute('aria-pressed', String(playing));
  el.playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
}

export function startPlayback(): void {
  if (S.exporting) return;
  const total = E.computeProjectDuration(project().clips);
  if (total <= 0) {
    showToast('Add a clip or load the demo reel first');
    return;
  }
  closeTransitionPopover();
  ensureAudioContext();
  if (S.playhead >= total - 0.05) S.playhead = 0;
  S.playing = true;
  S.playStartWall = performance.now();
  S.playStartTime = S.playhead;
  setPlayButton(true);
  scheduleAllAudioFrom(S.playhead);
  syncMediaToTime(S.playhead, true);
  markActiveTool();
  S.rafId = requestAnimationFrame(playbackTick);
}

export function pausePlayback(): void {
  if (!S.playing) return;
  S.playing = false;
  cancelAnimationFrame(S.rafId);
  stopScheduledAudio();
  pauseAllSlots();
  setPlayButton(false);
  syncMediaToTime(S.playhead, false);
  renderPreview();
}

export function togglePlayback(): void {
  if (S.playing) pausePlayback();
  else startPlayback();
}

export function seekTo(sec: number): void {
  const total = Math.max(0, E.computeProjectDuration(project().clips));
  S.playhead = E.roundTime(E.clamp(sec, 0, Math.max(total, sec >= 0 ? sec : 0)));
  if (S.playing) {
    S.playStartWall = performance.now();
    S.playStartTime = S.playhead;
    scheduleAllAudioFrom(S.playhead);
    syncMediaToTime(S.playhead, true);
  } else {
    syncMediaToTime(S.playhead, false);
  }
  renderPreview();
}
