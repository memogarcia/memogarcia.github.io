// Cut — Built-in demo reel: three procedural clips, captions, transitions, and a synth track.
import * as E from './engine/index.ts';
import { fitTimelineZoom } from './actions.ts';
import { ensureAudioContext } from './audio.ts';
import { commitState } from './history.ts';
import { persistMedia } from './persist.ts';
import { pausePlayback } from './playback.ts';
import { makeProceduralThumbs, synthesizeDemoAudio } from './procedural.ts';
import { renderAll } from './refresh.ts';
import { mediaMap, S } from './state.ts';
import { showToast } from './ui.ts';
import type { MediaItem, SceneId } from './types.ts';

function proceduralMedia(sceneId: SceneId, name: string, duration: number): MediaItem {
  return {
    id: E.makeId('m'),
    kind: 'procedural',
    sceneId,
    name,
    duration,
    width: 720,
    height: 1280,
    thumbs: makeProceduralThumbs(sceneId, duration),
  };
}

export async function loadDemoReel(): Promise<void> {
  await S.restored;
  pausePlayback();
  ensureAudioContext();

  const m1 = proceduralMedia('tokyo-rain', '01 · Tokyo Rain', 4.0);
  const m2 = proceduralMedia('golden-hour', '02 · Golden Hour', 4.0);
  const m3 = proceduralMedia('kinetic-grid', '03 · Kinetic Grid', 3.6);
  const synth = synthesizeDemoAudio(11.6);
  const ma: MediaItem = {
    id: E.makeId('m'),
    kind: 'audio',
    isDemoAudio: true,
    name: 'Lo-fi Tape · 96 BPM',
    duration: 11.6,
    audioBuffer: synth.buffer,
    peaks: synth.peaks,
  };

  for (const m of [m1, m2, m3, ma]) {
    mediaMap.set(m.id, m);
    void persistMedia(m);
  }

  const v1 = E.createVideoClip(m1, 0, { fadeIn: 0, fadeOut: 0 });
  const v2 = E.createVideoClip(m2, 4.0, {
    fadeIn: 0,
    fadeOut: 0,
    transitionIn: { type: 'dissolve', duration: 0.55 },
  });
  const v3 = E.createVideoClip(m3, 8.0, {
    fadeIn: 0,
    fadeOut: 0.5,
    transitionIn: { type: 'slide-left', duration: 0.45 },
  });
  const t1 = E.createTextClip(0.25, {
    text: 'Edit right in the browser.',
    duration: 3.35,
    preset: 'pill',
    y: 0.78,
    fontSize: 38,
    animation: 'pop',
  });
  const t2 = E.createTextClip(4.3, {
    text: 'Split, trim, color & mix.',
    duration: 3.3,
    preset: 'caption',
    y: 0.78,
    fontSize: 40,
    animation: 'slide',
  });
  const t3 = E.createTextClip(8.2, {
    text: 'No uploads. No watermarks.',
    duration: 3.2,
    preset: 'lower',
    y: 0.8,
    fontSize: 34,
    animation: 'fade',
  });
  const a1 = E.createAudioClip(ma, 0, { volume: 0.85, fadeIn: 0.4, fadeOut: 0.8 });

  commitState((p) => ({ ...p, clips: [v1, v2, v3, t1, t2, t3, a1], selectedClipId: v1.id }));
  S.playhead = 0.7;
  fitTimelineZoom();
  renderAll();
  showToast('Demo reel loaded — press Space to play');
}
