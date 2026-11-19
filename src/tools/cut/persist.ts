// Cut — IndexedDB autosave, session restore, background audio decoding, and project reset.
import * as E from './engine/index.ts';
import type { Clip, Project } from './engine/index.ts';
import { fitTimelineZoom } from './actions.ts';
import { audioContextClass, AG, extractPeaks, scheduleAllAudioFrom } from './audio.ts';
import { el } from './dom.ts';
import { renderInspector } from './inspector.ts';
import { destroyAllSlots, syncMediaToTime } from './media-pool.ts';
import { pausePlayback, renderPreview } from './playback.ts';
import { closeTransitionPopover } from './popover.ts';
import { renderAll } from './refresh.ts';
import { deletedMediaCache, mediaMap, project, S } from './state.ts';
import * as Store from './storage.ts';
import { renderTimelineClips, renderTrackToggles } from './timeline.ts';
import { setSaveStatus, showToast } from './ui.ts';
import type { MediaItem, MediaRecord } from './types.ts';

/** Above these limits the audio is not decoded into memory; it streams through the media element. */
const MAX_DECODE_BYTES = 200 * 1024 * 1024;
const MAX_DECODE_SECONDS = 15 * 60;

let lastProjectSaveOk = true;

function refreshSaveStatus(): void {
  if (!lastProjectSaveOk) {
    setSaveStatus('Not saved', false, 'This browser refused local storage. Edits will be lost on reload.');
  } else if (S.unsavedMedia.size) {
    const n = S.unsavedMedia.size;
    setSaveStatus('Media not saved', false,
      `${n} imported ${n === 1 ? 'file' : 'files'} could not be stored locally (storage full or private window). `
      + 'Clips using them will be missing after a reload.');
  } else {
    setSaveStatus('Saved', true);
  }
}

export function scheduleAutosave(): void {
  if (!Store.available) return;
  setSaveStatus('Saving…', false);
  clearTimeout(S.saveTimer);
  S.saveTimer = window.setTimeout(async () => {
    const p = project();
    lastProjectSaveOk = await Store.saveProjectState({
      aspect: p.aspect,
      clips: p.clips,
      selectedClipId: p.selectedClipId,
      snap: p.snap,
      playhead: S.playhead,
      trackMuted: { ...S.trackMuted },
      savedAt: Date.now(),
    });
    refreshSaveStatus();
  }, 450);
}

function toRecord(media: MediaItem): MediaRecord {
  return {
    id: media.id,
    kind: media.kind,
    name: media.name,
    duration: media.duration,
    width: media.width || 0,
    height: media.height || 0,
    thumbs: media.thumbs || [],
    peaks: media.peaks || null,
    streamedAudio: Boolean(media.streamedAudio),
    blob: media.blob || null,
  };
}

/** Saves a media record, but only while that exact item is still in the library. */
export async function persistMedia(media: MediaItem): Promise<void> {
  if (!Store.available || mediaMap.get(media.id) !== media) return;
  const ok = await Store.saveMediaRecord(toRecord(media));
  if (mediaMap.get(media.id) !== media) {
    // Removed (or the project was reset) while the write was in flight.
    if (ok) await Store.deleteMediaRecord(media.id);
    S.unsavedMedia.delete(media.id);
  } else if (ok) {
    S.unsavedMedia.delete(media.id);
  } else {
    S.unsavedMedia.add(media.id);
  }
  refreshSaveStatus();
}

export function forgetMedia(mediaId: string): void {
  void Store.deleteMediaRecord(mediaId);
  if (S.unsavedMedia.delete(mediaId)) refreshSaveStatus();
}

export function canDecodeInMemory(blob: Blob, durationSec: number): boolean {
  return blob.size <= MAX_DECODE_BYTES && (!Number.isFinite(durationSec) || durationSec <= MAX_DECODE_SECONDS);
}

/** Decodes a file's audio in the background for waveforms and sample-accurate playback. */
export async function decodeBlobAudioAsync(blob: Blob, item: MediaItem): Promise<void> {
  if (!canDecodeInMemory(blob, item.duration)) {
    item.streamedAudio = true;
    return;
  }
  const AC = audioContextClass();
  if (!AC) return;
  const ctx = AG.ctx || new AC();
  try {
    const audioBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    item.audioBuffer = audioBuffer;
    if (!item.peaks) item.peaks = extractPeaks(audioBuffer.getChannelData(0), 120);
    if (S.playing) {
      scheduleAllAudioFrom(S.playhead);
      syncMediaToTime(S.playhead, true);
    }
    renderTimelineClips();
    renderInspector();
  } catch {
    // No audio track or unsupported codec: the media element plays whatever it can.
  } finally {
    if (ctx !== AG.ctx) ctx.close().catch(() => {});
  }
}

function restoreMediaRecord(rec: MediaRecord): void {
  if (!rec.blob) return;
  const blob = rec.blob;
  const url = URL.createObjectURL(blob);
  if (rec.kind === 'image') {
    const img = new Image();
    img.src = url;
    img.onload = () => renderPreview();
    mediaMap.set(rec.id, { ...rec, url, img });
  } else {
    const item: MediaItem = { ...rec, url, audioBuffer: null };
    mediaMap.set(rec.id, item);
    void decodeBlobAudioAsync(blob, item);
  }
}

/** Places clips added while the restore was loading after the restored ones on their track. */
function appendAfterRestored(restored: Clip[], extra: Clip[]): Clip[] {
  const out = [...restored];
  for (const clip of extra) {
    const start = clip.track === 'text' ? clip.start : E.getTrackEnd(out, clip.track);
    out.push({ ...clip, start });
  }
  return out;
}

export async function restoreSavedSession(): Promise<void> {
  if (!Store.available) return;
  const historyAtStart = S.history;
  const { state, media } = await Store.loadAll();
  if (!state && !media.length) return;

  for (const rec of media) {
    if (!mediaMap.has(rec.id)) restoreMediaRecord(rec);
  }

  let dropped = 0;
  if (state && Array.isArray(state.clips)) {
    const validClips = state.clips.filter((c) => c.track === 'text' || (c.mediaId && mediaMap.has(c.mediaId)));
    dropped = state.clips.length - validClips.length;
    const restored: Project = E.createProject({
      aspect: E.isKeyOf(E.ASPECTS, state.aspect) ? state.aspect : '9:16',
      clips: validClips,
      selectedClipId: validClips.some((c) => c.id === state.selectedClipId) ? state.selectedClipId ?? null : null,
      snap: state.snap !== false,
    });

    if (S.history === historyAtStart) {
      S.history = E.createHistory(restored);
      S.playhead = E.clamp(state.playhead || 0, 0, E.computeProjectDuration(validClips));
    } else {
      // The user edited while the restore was loading: keep both, as one undoable step.
      const current = project();
      const restoredIds = new Set(validClips.map((c) => c.id));
      const extra = current.clips.filter((c) => !restoredIds.has(c.id));
      S.history = E.createHistory(restored);
      if (extra.length) {
        S.history = E.commitHistory(S.history, {
          ...restored,
          clips: appendAfterRestored(restored.clips, extra),
          selectedClipId: current.selectedClipId,
        });
      }
    }
    if (state.trackMuted) Object.assign(S.trackMuted, state.trackMuted);
    renderTrackToggles();
  }

  setSaveStatus('Saved', true);
  fitTimelineZoom();
  renderAll();
  if (dropped) {
    showToast(`${dropped} ${dropped === 1 ? 'clip was' : 'clips were'} not restored: their media was never saved`);
  }
}

export async function resetProject(): Promise<void> {
  await S.restored;
  if (S.exporting) return;
  if (project().clips.length || mediaMap.size) {
    if (!window.confirm('Clear all clips and imported media to start a fresh project?')) return;
  }
  pausePlayback();
  closeTransitionPopover();
  clearTimeout(S.saveTimer);
  clearTimeout(S.wheelTimer);
  S.textBefore = null;
  S.textDirty = false;
  S.wheelBefore = null;
  destroyAllSlots();
  for (const m of [...mediaMap.values(), ...deletedMediaCache.values()]) {
    if (m.url) URL.revokeObjectURL(m.url);
  }
  mediaMap.clear();
  deletedMediaCache.clear();
  S.unsavedMedia.clear();
  S.history = E.createHistory(E.createProject());
  S.playhead = 0;
  Object.assign(S.trackMuted, { text: false, video: false, audio: false });
  renderTrackToggles();
  if (Store.available) await Store.clearAll();
  lastProjectSaveOk = true;
  setSaveStatus('Saved', false);
  renderAll();
  el.emptyImportBtn.focus({ preventScroll: true });
  showToast('New project ready');
}
