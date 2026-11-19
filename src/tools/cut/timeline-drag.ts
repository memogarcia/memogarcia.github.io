// Cut — Pointer gestures on the timeline: move and trim clips, scrub the ruler.
import * as E from './engine/index.ts';
import type { Clip } from './engine/index.ts';
import { closestFrom, el } from './dom.ts';
import { commitFromSnapshot, patchClipLive, selectClip, setPresent, snapshotForUndo } from './history.ts';
import { pausePlayback, seekTo, startPlayback } from './playback.ts';
import { closeTransitionPopover } from './popover.ts';
import { onStateChanged } from './refresh.ts';
import { findClip, project, S } from './state.ts';

type Handle = 'move' | 'left' | 'right';

function showDragTip(clientX: number, clientY: number, text: string): void {
  el.dragTip.textContent = text;
  el.dragTip.style.transform = `translate3d(${Math.round(clientX)}px, ${Math.round(clientY)}px, 0) translate(-50%, -125%)`;
  el.dragTip.hidden = false;
}

function snapEdge(proposed: number, targets: readonly number[], thresh: number): { time: number; snapped: number | null } {
  for (const t of targets) {
    if (Math.abs(proposed - t) < thresh) return { time: t, snapped: t };
  }
  return { time: proposed, snapped: null };
}

function computeDrag(handle: Handle, orig: Clip, dt: number, targets: readonly number[], thresh: number) {
  const snapOn = project().snap;
  if (handle === 'move') {
    const proposed = Math.max(0, orig.start + dt);
    if (!snapOn) return { clip: { ...orig, start: E.roundTime(proposed) }, snappedAt: null };
    const res = E.snapMoveStart(proposed, orig.duration, targets, thresh);
    return { clip: { ...orig, start: res.start }, snappedAt: res.snappedTo };
  }
  if (handle === 'left') {
    const edge = snapOn ? snapEdge(orig.start + dt, targets, thresh) : { time: orig.start + dt, snapped: null };
    return { clip: E.trimClipLeft(orig, edge.time), snappedAt: edge.snapped };
  }
  const end = orig.start + orig.duration + dt;
  const edge = snapOn ? snapEdge(end, targets, thresh) : { time: end, snapped: null };
  return { clip: E.trimClipRight(orig, edge.time), snappedAt: edge.snapped };
}

export function onClipPointerDown(ev: PointerEvent, clipId: string): void {
  if (ev.button !== 0) return;
  ev.stopPropagation();
  closeTransitionPopover();

  const handle = (closestFrom(ev.target, '.trim-handle')?.dataset.handle as Handle | undefined) || 'move';
  const blockEl = ev.currentTarget as HTMLElement;
  const clip = findClip(clipId);
  if (!clip) return;
  selectClip(clipId);

  const startX = ev.clientX;
  const origClip = { ...clip };
  const beforeSnapshot = snapshotForUndo();
  const snapTargets = E.getSnapTargets(project().clips, clipId, S.playhead);
  const snapThresh = 10 / S.pxPerSec;
  let moved = false;

  const onMove = (moveEv: PointerEvent) => {
    const dx = moveEv.clientX - startX;
    if (!moved && Math.abs(dx) < 3) return;
    moved = true;
    const { clip: updated, snappedAt } = computeDrag(handle, origClip, dx / S.pxPerSec, snapTargets, snapThresh);

    // Update the one block and repaint the preview; the timeline DOM is rebuilt on release.
    patchClipLive(clipId, () => updated);
    blockEl.style.left = `${updated.start * S.pxPerSec}px`;
    blockEl.style.width = `${Math.max(14, updated.duration * S.pxPerSec)}px`;
    el.inspectorMeta.textContent = E.formatTimecode(updated.duration);
    showDragTip(moveEv.clientX, moveEv.clientY, `${E.formatTimecode(updated.start)} · ${updated.duration.toFixed(1)}s`);

    if (snappedAt !== null) {
      el.snapLine.style.transform = `translate3d(${Math.round(snappedAt * S.pxPerSec)}px, 0, 0)`;
      el.snapLine.hidden = false;
    } else {
      el.snapLine.hidden = true;
    }
  };

  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    el.snapLine.hidden = true;
    el.dragTip.hidden = true;
    if (!moved) return;
    if (origClip.track === 'video') {
      const clips = E.resolveVideoTrackOverlap(project().clips, clipId, { preserveOrder: handle === 'right' });
      setPresent({ ...project(), clips });
    }
    commitFromSnapshot(beforeSnapshot);
    onStateChanged();
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

function scrubFromPointerEvent(ev: PointerEvent): void {
  const rect = el.timelineContent.getBoundingClientRect();
  seekTo(Math.max(0, ev.clientX - rect.left) / S.pxPerSec);
}

export function setupRulerScrub(targetEl: HTMLElement | null): void {
  targetEl?.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    closeTransitionPopover();
    const wasPlaying = S.playing;
    if (wasPlaying) pausePlayback();
    scrubFromPointerEvent(ev);

    const onUp = () => {
      window.removeEventListener('pointermove', scrubFromPointerEvent);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (wasPlaying) startPlayback();
    };
    window.addEventListener('pointermove', scrubFromPointerEvent);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  });
}
