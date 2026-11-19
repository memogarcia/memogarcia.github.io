// Loads the reel's media through the same path as imported files, so it can be edited and restored.
import { fitTimelineZoom } from './actions.ts';
import { ensureAudioContext } from './audio.ts';
import { cutLastTrain, reelPhotos } from './demo-sequence.ts';
import type { ReelSource } from './demo-sequence.ts';
import { el } from './dom.ts';
import { commitState } from './history.ts';
import { loadAudioMedia, loadImageMedia } from './ingest.ts';
import { persistMedia } from './persist.ts';
import { pausePlayback, startPlayback } from './playback.ts';
import { makeProceduralThumbs } from './procedural.ts';
import { mediaMap, S } from './state.ts';
import type { MediaItem } from './types.ts';
import { showToast } from './ui.ts';

async function loadSource(key: ReelSource): Promise<MediaItem> {
  const id = `cut-last-train-${key}`;
  if (key === 'route') {
    return {
      id, name: 'Night service route map', kind: 'procedural', sceneId: 'night-route',
      duration: 9, width: 720, height: 1280, thumbs: makeProceduralThumbs('night-route', 9),
    };
  }
  const isScore = key === 'score';
  const name = isScore ? 'Last Train · 120 BPM' : reelPhotos[key];
  const url = isScore ? '/demos/cut-last-train.mp3' : `/img/${id}.webp`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Missing reel source: ${name}`);
  const blob = await response.blob();
  const file = new File([blob], name, { type: blob.type });
  const item = await (isScore ? loadAudioMedia(file) : loadImageMedia(file));
  if (!item) throw new Error(`Could not decode reel source: ${name}`);
  return { ...item, id, name };
}

export async function loadDemoReel(): Promise<void> {
  if (el.demoBtn.disabled || S.exporting) return;
  const buttons = [el.demoBtn, el.emptyDemoBtn];
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
    const keys: ReelSource[] = [...photoKeys, 'route', 'score'];
    const results = await Promise.allSettled(keys.map(async (key) => {
      const existing = mediaMap.get(`cut-last-train-${key}`);
      const item = existing ?? await loadSource(key);
      if (!existing) newItems.add(item);
      prepared.set(key, item);
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
    commitState((p) => ({ ...p, aspect: '9:16', clips, selectedClipId: clips[0].id }), { media: true, resize: true });
    fitTimelineZoom();
    startPlayback();
    el.playBtn.focus({ preventScroll: true });
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
