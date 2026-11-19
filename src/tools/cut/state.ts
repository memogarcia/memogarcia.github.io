// Cut — Shared mutable editor state. Modules read and write `S.*` instead of module-level lets
// so that every module sees the same value.
import * as E from './engine/index.ts';
import type { Clip, History, Project, Quality } from './engine/index.ts';
import type { CanvasDrag, MediaItem, TextBox, TrackMuted } from './types.ts';

export const S = {
  history: E.createHistory(E.createProject()) as History,
  playhead: 0,
  playing: false,
  pxPerSec: 72,
  masterMuted: false,
  trackMuted: { text: false, video: false, audio: false } as TrackMuted,
  cachedTimelineWidth: 720,

  // Playback clock
  rafId: 0,
  playStartWall: 0,
  playStartTime: 0,

  telemetryStarted: false,
  saveTimer: 0,
  activeSeamClipId: null as string | null,

  // Pending gestures that become one undo step when they finish
  textBefore: null as Project | null,
  textDirty: false,
  wheelBefore: null as Project | null,
  wheelTimer: 0,

  // Preview canvas interaction
  renderedTextBoxes: [] as TextBox[],
  canvasDrag: null as CanvasDrag | null,

  // Export
  exportSettings: { res: '1080' as Quality, fps: 30 },
  exporting: false,
  exportAbort: null as (() => void) | null,
  lastExportUrl: null as string | null,

  /** Media ids whose blob could not be written to IndexedDB (quota, private mode). */
  unsavedMedia: new Set<string>(),
  /** Resolves once the saved session has been restored, so imports never race the restore. */
  restored: Promise.resolve() as Promise<void>,
};

export const mediaMap = new Map<string, MediaItem>();
/** Media removed from the bin this session, kept so Undo can bring it back with its clips. */
export const deletedMediaCache = new Map<string, MediaItem>();

export const project = (): Project => S.history.present;

export function findClip(clipId: string | null | undefined): Clip | null {
  if (!clipId) return null;
  return project().clips.find((c) => c.id === clipId) || null;
}

export function getSelectedClip(): Clip | null {
  return findClip(project().selectedClipId);
}

export const perf = {
  previewFrames: 0,
  lastFrameMs: 0,
  avgFrameMs: 0,
  timelineRebuilds: 0,
  mediaBinRebuilds: 0,
  rulerRebuilds: 0,
  mediaSlots: 0,
};
window.__cutPerf = perf;
