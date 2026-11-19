// Cut — Export: renders a frozen copy of the project to a canvas + Web Audio stream and records it.
import * as E from './engine/index.ts';
import type { Project, Quality } from './engine/index.ts';
import { AG, ensureAudioContext, scheduleAllAudioFrom, stopScheduledAudio } from './audio.ts';
import { renderFrame } from './compositor.ts';
import { context2d, el, makeCanvas } from './dom.ts';
import { flushPendingEdits } from './history.ts';
import { pauseAllSlots, syncMediaToTime, waitForSlotsReady } from './media-pool.ts';
import { pausePlayback, renderPreview } from './playback.ts';
import { closeTransitionPopover } from './popover.ts';
import { project, S } from './state.ts';
import { markActiveTool, showToast } from './ui.ts';
import type { ExportFormat } from './types.ts';

/** H.264 level for the frame size and rate: 3.1 / 3.2 for 720p, 4.0 / 4.2 for 1080p. */
function avcLevel(res: Quality, fps: number): string {
  if (res === '1080') return fps > 30 ? '2A' : '28';
  return fps > 30 ? '20' : '1F';
}

export function pickExportMimeType(res: Quality = S.exportSettings.res, fps = S.exportSettings.fps): ExportFormat | null {
  if (typeof MediaRecorder === 'undefined') return null;
  const lvl = avcLevel(res, fps);
  const candidates: ExportFormat[] = [
    { mime: `video/mp4;codecs=avc1.6400${lvl},mp4a.40.2`, ext: 'mp4', label: 'MP4 (H.264)' },
    { mime: `video/mp4;codecs=avc1.4D40${lvl},mp4a.40.2`, ext: 'mp4', label: 'MP4 (H.264)' },
    { mime: `video/mp4;codecs=avc1.42E0${lvl},mp4a.40.2`, ext: 'mp4', label: 'MP4 (H.264)' },
    { mime: 'video/mp4', ext: 'mp4', label: 'MP4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm', label: 'WebM (VP9)' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm', label: 'WebM (VP8)' },
    { mime: 'video/webm', ext: 'webm', label: 'WebM' },
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c.mime)) || { mime: '', ext: 'webm', label: 'WebM' };
}

export function updateExportSummary(): void {
  const dims = E.getCanvasDimensions(project().aspect, S.exportSettings.res);
  const fmt = pickExportMimeType();
  el.exportDims.textContent = `${dims.width} × ${dims.height}`;
  el.exportDur.textContent = E.formatTimecode(E.computeProjectDuration(project().clips));
  el.exportFmt.textContent = fmt ? fmt.label : 'Unsupported';
  el.exportStartBtn.disabled = !fmt;
}

export function openExportModal(): void {
  flushPendingEdits();
  if (E.computeProjectDuration(project().clips) <= 0) {
    showToast('Add clips to the timeline before exporting');
    return;
  }
  pausePlayback();
  closeTransitionPopover();
  updateExportSummary();
  el.exportOptions.hidden = false;
  el.exportProgressBox.hidden = true;
  el.exportDoneBox.hidden = true;
  el.exportStartBtn.hidden = false;
  el.exportStartBtn.disabled = false;
  el.exportCancelBtn.textContent = 'Close';
  el.exportModal.hidden = false;
}

/**
 * Closes the export dialog. While a render runs, `confirmFirst` (backdrop click, Escape) asks
 * before throwing the render away; the Cancel button does not.
 */
export function closeExportModal(confirmFirst: boolean): void {
  if (S.exportAbort) {
    if (confirmFirst && !window.confirm('Cancel the export in progress?')) return;
    S.exportAbort();
    return;
  }
  el.exportModal.hidden = true;
}

function setProgress(pct: number): void {
  el.exportBar.style.width = `${pct}%`;
  el.exportPct.textContent = `${pct}%`;
}

function showRenderingUi(): void {
  el.exportOptions.hidden = true;
  el.exportProgressBox.hidden = false;
  el.exportDoneBox.hidden = true;
  el.exportStartBtn.hidden = true;
  el.exportStartBtn.disabled = true;
  el.exportCancelBtn.textContent = 'Cancel';
  setProgress(0);
  el.exportStatus.textContent = 'Preparing media…';
}

function finishDownload(blob: Blob, ext: string): void {
  if (S.lastExportUrl) URL.revokeObjectURL(S.lastExportUrl);
  S.lastExportUrl = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const filename = `cut-${stamp}.${ext}`;
  el.exportDownloadLink.href = S.lastExportUrl;
  el.exportDownloadLink.download = filename;
  const sizeLabel = blob.size >= 1024 * 1024
    ? `${(blob.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(blob.size / 1024))} KB`;
  setProgress(100);
  el.exportStatus.textContent = `Saved ${filename} (${sizeLabel})`;
  el.exportDoneBox.hidden = false;
  el.exportCancelBtn.textContent = 'Done';
  el.exportDownloadLink.click();
  if (blob.size > 0) window.memoToolTelemetry?.converted();
  showToast('Export complete');
}

function sizeMiniPreview(width: number, height: number): CanvasRenderingContext2D {
  const maxPrev = 180;
  const ratio = width / height;
  const prevH = ratio >= 1 ? Math.round(maxPrev / ratio) : maxPrev;
  const prevW = ratio >= 1 ? maxPrev : Math.round(maxPrev * ratio);
  el.exportPreviewCanvas.width = Math.max(80, prevW * 2);
  el.exportPreviewCanvas.height = Math.max(80, prevH * 2);
  return context2d(el.exportPreviewCanvas, { alpha: false });
}

export async function startExport(): Promise<void> {
  if (S.exporting) return;
  // Render a frozen copy: nothing done in the editor can change the file being recorded.
  const p: Project = E.cloneProject(project());
  const total = E.computeProjectDuration(p.clips);
  const fmt = pickExportMimeType();
  if (total <= 0) return;
  if (!fmt) {
    showToast('MediaRecorder is not supported in this browser');
    return;
  }

  S.exporting = true;
  let cancelled = false;
  let exportRaf = 0;
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let exportDest: MediaStreamAudioDestinationNode | null = null;
  const prevSpeakerGain = AG.speakerGain ? AG.speakerGain.gain.value : 1;

  const cleanup = () => {
    cancelAnimationFrame(exportRaf);
    stopScheduledAudio();
    pauseAllSlots();
    if (exportDest && AG.mixBus) {
      try { AG.mixBus.disconnect(exportDest); } catch { /* already disconnected */ }
    }
    if (AG.speakerGain) AG.speakerGain.gain.value = prevSpeakerGain;
    stream?.getTracks().forEach((t) => t.stop());
    S.exportAbort = null;
    S.exporting = false;
    syncMediaToTime(S.playhead, false);
    renderPreview();
  };
  S.exportAbort = () => {
    cancelled = true;
    try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch { /* ignore */ }
    cleanup();
    el.exportModal.hidden = true;
    showToast('Export cancelled');
  };

  showRenderingUi();
  const ctx = ensureAudioContext();
  if (ctx && ctx.state === 'suspended') {
    try { await ctx.resume(); } catch { /* stays suspended */ }
  }
  const dims = E.getCanvasDimensions(p.aspect, S.exportSettings.res);
  const fps = S.exportSettings.fps;
  const exportCanvas = makeCanvas(dims.width, dims.height);
  const exportCtx = context2d(exportCanvas, { alpha: false });
  const miniCtx = sizeMiniPreview(dims.width, dims.height);
  const drawMini = () => miniCtx.drawImage(exportCanvas, 0, 0, el.exportPreviewCanvas.width, el.exportPreviewCanvas.height);

  if (ctx && AG.mixBus && AG.speakerGain) {
    exportDest = ctx.createMediaStreamDestination();
    AG.mixBus.connect(exportDest);
    AG.speakerGain.gain.value = 0;
  }

  syncMediaToTime(0, false, p);
  await waitForSlotsReady();
  if (cancelled) return;

  const tracks = [...exportCanvas.captureStream(fps).getVideoTracks()];
  if (exportDest) tracks.push(...exportDest.stream.getAudioTracks());
  stream = new MediaStream(tracks);
  const opts: MediaRecorderOptions = { videoBitsPerSecond: S.exportSettings.res === '1080' ? 9_500_000 : 5_500_000 };
  if (fmt.mime) opts.mimeType = fmt.mime;
  try {
    recorder = new MediaRecorder(stream, opts);
  } catch {
    recorder = new MediaRecorder(stream);
  }
  const rec = recorder;
  const chunks: Blob[] = [];
  rec.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };
  rec.onstop = () => {
    if (cancelled) return;
    cleanup();
    const mime = rec.mimeType || fmt.mime || 'video/webm';
    finishDownload(new Blob(chunks, { type: mime }), mime.toLowerCase().includes('mp4') ? 'mp4' : 'webm');
  };

  el.exportStatus.textContent = `Rendering ${dims.width}×${dims.height} at ${fps} fps…`;
  renderFrame(exportCtx, p, dims.width, dims.height, 0);
  drawMini();
  rec.start(200);
  markActiveTool();
  scheduleAllAudioFrom(0, AG.mixBus || undefined, p);
  syncMediaToTime(0, true, p);

  const startWall = performance.now();
  let lastMiniDraw = 0;
  let lastPct = -1;
  const tick = (now: number) => {
    if (cancelled) return;
    const t = (now - startWall) / 1000;
    if (t >= total) {
      renderFrame(exportCtx, p, dims.width, dims.height, total - 0.001);
      try { if (rec.state !== 'inactive') rec.stop(); } catch { /* ignore */ }
      return;
    }
    syncMediaToTime(t, true, p);
    renderFrame(exportCtx, p, dims.width, dims.height, t);
    if (now - lastMiniDraw >= 85) {
      drawMini();
      lastMiniDraw = now;
    }
    const pct = Math.min(99, Math.round((t / total) * 100));
    if (pct !== lastPct) {
      setProgress(pct);
      lastPct = pct;
    }
    exportRaf = requestAnimationFrame(tick);
  };
  exportRaf = requestAnimationFrame(tick);
}
