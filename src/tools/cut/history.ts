// Cut — Undo history, granular state updates, and selection.
import * as E from './engine/index.ts';
import type { Clip, Project } from './engine/index.ts';
import { el } from './dom.ts';
import { scheduleAutosave, persistMedia } from './persist.ts';
import { schedulePreviewRender } from './playback.ts';
import { renderInspector } from './inspector.ts';
import { onStateChanged } from './refresh.ts';
import { deletedMediaCache, mediaMap, project, S } from './state.ts';
import { updateTimelineButtons } from './timeline.ts';
import { markActiveTool, showToast } from './ui.ts';
import type { StateChangeOpts } from './types.ts';

type Updater = (draft: Project) => Project | null | undefined | void;

export function snapshotForUndo(): Project {
  return E.cloneProject(project());
}

/** Applies `updater` to a copy of the project and records it as one undo step. */
export function commitState(updater: Updater, opts: StateChangeOpts = {}): void {
  flushPendingEdits();
  const next = updater(snapshotForUndo());
  if (!next) return;
  S.history = E.commitHistory(S.history, next);
  markActiveTool();
  onStateChanged(opts);
  scheduleAutosave();
}

/** Applies `updater` without an undo step (settings such as snapping). */
export function updateStateSilent(updater: Updater, opts: StateChangeOpts = {}): void {
  const next = updater(snapshotForUndo());
  if (!next) return;
  S.history = { ...S.history, present: next };
  onStateChanged(opts);
  scheduleAutosave();
}

/** Replaces the present project without an undo step or a full refresh (gesture in progress). */
export function setPresent(next: Project): void {
  S.history = { ...S.history, present: next };
}

/** Records `beforeSnapshot` as the undo step for changes already applied live. */
export function commitFromSnapshot(beforeSnapshot: Project): void {
  S.history = E.pushHistory(S.history, beforeSnapshot);
  markActiveTool();
  updateHistoryButtons();
  scheduleAutosave();
}

/** Closes any gesture still collecting live edits (typing, wheel zoom) into its undo step. */
export function flushPendingEdits(): void {
  if (S.textDirty && S.textBefore) commitFromSnapshot(S.textBefore);
  S.textBefore = null;
  S.textDirty = false;

  if (S.wheelBefore) {
    const before = S.wheelBefore;
    S.wheelBefore = null;
    clearTimeout(S.wheelTimer);
    commitFromSnapshot(before);
    renderInspector();
  }
}

function restoreDeletedMediaForClips(clips: readonly Clip[]): boolean {
  let restored = false;
  for (const clip of clips) {
    if (!clip.mediaId || mediaMap.has(clip.mediaId)) continue;
    const cached = deletedMediaCache.get(clip.mediaId);
    if (cached) {
      mediaMap.set(cached.id, cached);
      deletedMediaCache.delete(cached.id);
      void persistMedia(cached);
      restored = true;
    }
  }
  return restored;
}

function stepHistory(direction: 'undo' | 'redo'): void {
  flushPendingEdits();
  const stack = direction === 'undo' ? S.history.past : S.history.future;
  if (!stack.length) return;
  S.history = direction === 'undo' ? E.undoHistory(S.history) : E.redoHistory(S.history);
  const restoredMedia = restoreDeletedMediaForClips(project().clips);
  onStateChanged({ resize: true, media: restoredMedia });
  scheduleAutosave();
  showToast(direction === 'undo' ? 'Undone' : 'Redone');
}

export const undo = () => stepHistory('undo');
export const redo = () => stepHistory('redo');

export function updateHistoryButtons(): void {
  el.undoBtn.disabled = S.history.past.length === 0;
  el.redoBtn.disabled = S.history.future.length === 0;
}

function clipBlock(clipId: string): HTMLElement | null {
  return el.timelineContent.querySelector<HTMLElement>(`.clip-block[data-clip-id="${CSS.escape(clipId)}"]`);
}

/** Changes the selection by toggling classes in place, without rebuilding the timeline DOM. */
export function selectClip(clipId: string | null): void {
  const prevId = project().selectedClipId;
  if (prevId === clipId) return;
  flushPendingEdits();
  setPresent({ ...project(), selectedClipId: clipId });
  if (prevId) clipBlock(prevId)?.classList.remove('selected');
  if (clipId) clipBlock(clipId)?.classList.add('selected');
  renderInspector();
  updateTimelineButtons();
  schedulePreviewRender();
}

/** Live clip update during slider or canvas drags: patches state and repaints the preview only. */
export function patchClipLive(clipId: string, patchFn: (clip: Clip) => Clip): Clip | null {
  const p = project();
  let patched: Clip | null = null;
  const clips = p.clips.map((c) => {
    if (c.id !== clipId) return c;
    patched = patchFn(c);
    return patched;
  });
  if (!patched) return null;
  setPresent({ ...p, clips });
  schedulePreviewRender();
  return patched;
}

export { clipBlock };
