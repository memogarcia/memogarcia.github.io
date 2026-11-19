// Loads the reel's media through the same path as imported files, so it can be edited and restored.
import { fitTimelineZoom } from './actions.ts';
import { ensureAudioContext } from './audio.ts';
import { cutLastTrain, REEL_ID, reelAudio, reelPhotos } from './demo-sequence.ts';
import type { ReelSource } from './demo-sequence.ts';
import { el } from './dom.ts';
import { commitState } from './history.ts';
import { loadAudioMedia, loadImageMedia } from './ingest.ts';
import { persistMedia } from './persist.ts';
import { pausePlayback } from './playback.ts';
import { mediaMap, S } from './state.ts';
import type { MediaItem } from './types.ts';
import { showToast } from './ui.ts';

async function loadSource(key: ReelSource): Promise<MediaItem> {
  const id = `${REEL_ID}-${key}`;
  const isAudio = key === 'station' || key === 'departure';
  const name = isAudio ? reelAudio[key] : reelPhotos[key];
  const url = isAudio ? `/demos/cut-last-train-${key}.mp3` : `/img/cut-last-train-${key}-photo.webp`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);
  let blob: Blob;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Missing reel source: ${name}`);
    blob = await response.blob();
  } finally {
    window.clearTimeout(timeout);
  }
  const file = new File([blob], name, { type: blob.type });
  const item = await (isAudio ? loadAudioMedia(file) : loadImageMedia(file));
  if (!item) throw new Error(`Could not decode reel source: ${name}`);
  return { ...item, id, name };
}

export async function loadDemoReel(): Promise<void> {
  if (el.emptyDemoBtn.disabled || S.exporting) return;
  const buttons = [el.emptyDemoBtn];
  const labels = buttons.map((button) => button.textContent);
  for (const button of buttons) {
    button.disabled = true;
    button.textContent = 'Loading…';
  }
  const prepared = new Map<ReelSource, MediaItem>();
  const newItems = new Set<MediaItem>();
  try {
    ensureAudioContext();
    await S.restored;
    const originalHistory = S.history;
    const photoKeys = Object.keys(reelPhotos) as (keyof typeof reelPhotos)[];
    const keys: ReelSource[] = [...photoKeys, 'station', 'departure'];
    const results = await Promise.allSettled(keys.map(async (key) => {
      const existing = mediaMap.get(`${REEL_ID}-${key}`);
      const item = existing ?? await loadSource(key);
      if (!existing) newItems.add(item);
      prepared.set(key, item);
      for (const button of buttons) button.textContent = `Loading ${prepared.size}/${keys.length}`;
    }));
    if (results.some((r) => r.status === 'rejected')) {
      showToast('Could not load the demo. Try again.');
      return;
    }
    const libraryChanged = [...prepared.values()].some((item) => !newItems.has(item) && mediaMap.get(item.id) !== item);
    if (originalHistory !== S.history || libraryChanged || S.exporting) return;
    const clips = cutLastTrain(Object.fromEntries(prepared) as Record<ReelSource, MediaItem>);
    pausePlayback();
    for (const key of keys) {
      const item = prepared.get(key)!;
      if (!newItems.has(item)) continue;
      mediaMap.set(item.id, item);
      void persistMedia(item);
    }
    S.playhead = 0;
    el.timelineScroll.scrollLeft = 0;
    commitState((p) => ({ ...p, aspect: '16:9', clips, selectedClipId: null }), { media: true, resize: true });
    fitTimelineZoom();
    el.playBtn.focus({ preventScroll: true });
    showToast('Demo ready. Select a clip to edit it.');
  } catch {
    showToast('Could not load the demo. Try again.');
  } finally {
    for (const item of newItems) {
      if (item.url && mediaMap.get(item.id) !== item) URL.revokeObjectURL(item.url);
    }
    buttons.forEach((button, i) => {
      button.disabled = false;
      button.textContent = labels[i];
    });
  }
}
