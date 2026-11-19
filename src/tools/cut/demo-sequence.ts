// Last Train, fifteen bars at 120 BPM. Times below are in timeline seconds.
import { createAudioClip, createTextClip, createVideoClip } from './engine/index.ts';
import type { Clip, MediaRef } from './engine/index.ts';

export const REEL_SECONDS = 30;
export const reelPhotos = {
  platform: 'Platform in the rain',
  signal: 'Red signal',
  carriage: 'Empty carriage',
  rails: 'Through the windscreen',
  viaduct: 'Tail lights',
};
export type ReelSource = keyof typeof reelPhotos | 'route' | 'score';

export function cutLastTrain(media: Record<ReelSource, MediaRef>): Clip[] {
  function shot(source: Exclude<ReelSource, 'score'>, start: number, duration: number, edit: Partial<Clip> = {}): Clip {
    return createVideoClip(media[source], start, { duration, ...edit });
  }
  function title(start: number, duration: number, text: string, edit: Partial<Clip> = {}): Clip {
    return createTextClip(start, {
      duration, text, preset: 'editorial', color: '#fff5df', fontSize: 92,
      y: 0.23, animation: 'fade', ...edit,
    });
  }
  function label(start: number, duration: number, text: string): Clip {
    return title(start, duration, text, {
      preset: 'lower', fontSize: 40, y: 0.83, color: '#fff5df',
      bgColor: '#222a2a', animation: 'slide', fadeIn: 0.18, fadeOut: 0.12,
    });
  }

  return [
    shot('platform', 0, 4, { kenBurns: 'zoom-in' }),
    shot('signal', 4, 2, { filter: 'bw' }),
    shot('signal', 6, 2, { filter: 'vivid', transitionIn: { type: 'dissolve', duration: 0.85 } }),
    shot('carriage', 8, 4, { kenBurns: 'pan-left', transitionIn: { type: 'slide-left', duration: 0.55 } }),
    shot('rails', 12, 4, { kenBurns: 'zoom-in', transitionIn: { type: 'zoom', duration: 0.5 } }),
    shot('route', 16, 3),
    shot('route', 19, 3, { sourceStart: 3, speed: 2 }),
    shot('signal', 22, 1, { zoom: 1.22 }),
    shot('platform', 23, 0.5, { zoom: 1.3 }),
    shot('carriage', 23.5, 0.5, { zoom: 1.14 }),
    shot('rails', 24, 2, { kenBurns: 'zoom-in' }),
    shot('viaduct', 26, 4, { kenBurns: 'zoom-out', transitionIn: { type: 'dissolve', duration: 0.9 } }),

    title(0, 2.6, 'Last Train', { fadeIn: 0 }),
    label(2.6, 1.4, 'TOKYO   /   23:58'),
    label(4, 2, 'Color grade   /   B&W'),
    label(6, 2, 'Color grade   /   Vivid'),
    title(8.55, 3.25, 'Doors closing.', { preset: 'caption', fontSize: 50, y: 0.77, animation: 'slide' }),
    label(12.5, 3.5, 'Photo motion / Zoom in'),
    label(16, 3, 'Playback   /   1×'),
    label(19, 3, 'Playback   /   2×'),
    label(22, 3.8, 'Cut to the beat'),
    title(26.75, 3.25, 'Made in Cut', { fontSize: 81, fadeIn: 0.55, fadeOut: 0 }),
    createAudioClip(media.score, 0, { duration: REEL_SECONDS, volume: 0.92, fadeIn: 0.06, fadeOut: 1.25 }),
  ];
}
