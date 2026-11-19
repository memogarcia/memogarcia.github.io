// Cut — Direct manipulation on the preview: drag captions, reframe video, wheel to zoom.
import * as E from './engine/index.ts';
import { el } from './dom.ts';
import { commitFromSnapshot, flushPendingEdits, patchClipLive, selectClip, snapshotForUndo } from './history.ts';
import { renderPreview } from './playback.ts';
import { closeTransitionPopover } from './popover.ts';
import { findClip, project, S } from './state.ts';
import type { TextBox } from './types.ts';

/** A wheel gesture becomes one undo step once the wheel has been idle this long. */
const WHEEL_COMMIT_MS = 350;

function canvasEventToCoords(ev: MouseEvent): { x: number; y: number } {
  const rect = el.previewCanvas.getBoundingClientRect();
  const sx = el.previewCanvas.width / Math.max(1, rect.width);
  const sy = el.previewCanvas.height / Math.max(1, rect.height);
  return { x: (ev.clientX - rect.left) * sx, y: (ev.clientY - rect.top) * sy };
}

const hits = (b: TextBox, pt: { x: number; y: number }) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h;

function topTextBoxAt(pt: { x: number; y: number }): TextBox | null {
  for (let i = S.renderedTextBoxes.length - 1; i >= 0; i--) {
    if (hits(S.renderedTextBoxes[i], pt)) return S.renderedTextBoxes[i];
  }
  return null;
}

const activeVideoClip = () => E.getActiveClipsAt(project().clips, S.playhead).video;

function onPointerDown(ev: PointerEvent): void {
  if (ev.button !== 0 || !project().clips.length) return;
  closeTransitionPopover();
  flushPendingEdits();
  const pt = canvasEventToCoords(ev);

  // 1. The top-most caption under the pointer
  const box = topTextBoxAt(pt);
  const textClip = box ? findClip(box.clipId) : null;
  if (textClip) {
    selectClip(textClip.id);
    S.canvasDrag = {
      mode: 'text',
      clipId: textClip.id,
      offsetX: pt.x - (textClip.x ?? 0.5) * el.previewCanvas.width,
      offsetY: pt.y - (textClip.y ?? 0.78) * el.previewCanvas.height,
      snapX: false,
      snapY: false,
      moved: false,
      beforeSnapshot: snapshotForUndo(),
    };
    el.previewCanvas.setPointerCapture?.(ev.pointerId);
    return;
  }

  // 2. Otherwise reframe the visible video or photo
  const video = activeVideoClip();
  if (!video) return;
  selectClip(video.id);
  S.canvasDrag = {
    mode: 'video',
    clipId: video.id,
    startPtX: pt.x,
    startPtY: pt.y,
    origOffX: video.offsetX || 0,
    origOffY: video.offsetY || 0,
    snapX: false,
    snapY: false,
    moved: false,
    beforeSnapshot: snapshotForUndo(),
  };
  el.previewCanvas.setPointerCapture?.(ev.pointerId);
}

function onPointerMove(ev: PointerEvent): void {
  const pt = canvasEventToCoords(ev);
  const drag = S.canvasDrag;
  if (!drag) {
    el.previewCanvas.style.cursor = topTextBoxAt(pt) ? 'move' : activeVideoClip() ? 'grab' : 'default';
    return;
  }

  drag.moved = true;
  const { width, height } = el.previewCanvas;
  if (drag.mode === 'text') {
    let nx = E.clamp((pt.x - drag.offsetX) / width, 0.06, 0.94);
    let ny = E.clamp((pt.y - drag.offsetY) / height, 0.06, 0.94);
    drag.snapX = Math.abs(nx - 0.5) < 0.025;
    drag.snapY = Math.abs(ny - 0.5) < 0.025;
    if (drag.snapX) nx = 0.5;
    if (drag.snapY) ny = 0.5;
    patchClipLive(drag.clipId, (c) => ({ ...c, x: nx, y: ny }));
  } else {
    el.previewCanvas.style.cursor = 'grabbing';
    let ox = E.clamp(drag.origOffX + (pt.x - drag.startPtX) / width, -0.8, 0.8);
    let oy = E.clamp(drag.origOffY + (pt.y - drag.startPtY) / height, -0.8, 0.8);
    drag.snapX = Math.abs(ox) < 0.025;
    drag.snapY = Math.abs(oy) < 0.025;
    if (drag.snapX) ox = 0;
    if (drag.snapY) oy = 0;
    patchClipLive(drag.clipId, (c) => ({ ...c, offsetX: ox, offsetY: oy }));
  }
}

function endCanvasDrag(): void {
  const drag = S.canvasDrag;
  if (!drag) return;
  S.canvasDrag = null;
  if (drag.moved) commitFromSnapshot(drag.beforeSnapshot);
  renderPreview();
}

/** Zooms the visible clip live; the whole wheel gesture is committed as a single undo step. */
function onWheel(ev: WheelEvent): void {
  const video = activeVideoClip();
  if (!video) return;
  ev.preventDefault();
  if (!S.wheelBefore) {
    flushPendingEdits();
    selectClip(video.id);
    S.wheelBefore = snapshotForUndo();
  }
  const delta = ev.deltaY < 0 ? 0.06 : -0.06;
  const zoom = E.roundTime(E.clamp((video.zoom || 1) + delta, 0.5, 2.5));
  patchClipLive(video.id, (c) => ({ ...c, zoom }));
  if (project().selectedClipId === video.id) {
    const pct = Math.round(zoom * 100);
    el.vZoom.value = String(pct);
    el.vZoomOut.textContent = `${pct}%`;
  }
  clearTimeout(S.wheelTimer);
  S.wheelTimer = window.setTimeout(flushPendingEdits, WHEEL_COMMIT_MS);
}

function onDoubleClick(ev: MouseEvent): void {
  if (topTextBoxAt(canvasEventToCoords(ev))) {
    el.tContent.focus();
    el.tContent.select();
  }
}

export function wireCanvasInteractions(): void {
  const c = el.previewCanvas;
  c.addEventListener('pointerdown', onPointerDown);
  c.addEventListener('pointermove', onPointerMove);
  c.addEventListener('pointerup', endCanvasDrag);
  c.addEventListener('pointercancel', endCanvasDrag);
  c.addEventListener('wheel', onWheel, { passive: false });
  c.addEventListener('dblclick', onDoubleClick);
}
