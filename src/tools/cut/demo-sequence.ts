// An editable photo film. Camera photographs and field recordings, with source credits in the UI.
import { createAudioClip, createTextClip, createVideoClip } from './engine/index.ts';
import type { Clip, MediaRef } from './engine/index.ts';

export const REEL_SECONDS = 30;
// Version the IDs so a saved copy of the old reel cannot replace these sources.
export const REEL_ID = 'cut-last-train-photo-v2';
export const reelPhotos = {
  ueno: 'Ueno after dark · Nichika Sakurai',
  platform: 'Waiting on the platform · BREAKIFY',
  passengers: 'The ride home · Hugh Han',
  interior: 'Empty carriage · Finan Akbar',
  blur: 'Passing lights · Noham Genevieve',
  street: 'Out in the rain · Andreas Rasmussen',
};
export const reelAudio = {
  station: 'Platform ambience · RutgerMuller',
  departure: 'Train departing · RutgerMuller',
};
export type ReelSource = keyof typeof reelPhotos | keyof typeof reelAudio;

export function cutLastTrain(media: Record<ReelSource, MediaRef>): Clip[] {
  function shot(source: keyof typeof reelPhotos, start: number, duration: number, edit: Partial<Clip> = {}): Clip {
    return createVideoClip(media[source], start, { duration, saturation: 92, ...edit });
  }
  function title(start: number, duration: number, text: string, edit: Partial<Clip> = {}): Clip {
    return createTextClip(start, {
      duration, text, preset: 'cinema', color: '#f5f3ed', fontSize: 108,
      y: 0.51, animation: 'fade', fadeIn: 0.7, fadeOut: 0.6, ...edit,
    });
  }
  return [
    shot('ueno', 0, 5.5, { kenBurns: 'zoom-in', brightness: 116, fadeIn: 0.6 }),
    shot('platform', 5.5, 4, { kenBurns: 'zoom-out', brightness: 93 }),
    shot('passengers', 9.5, 4.5, { kenBurns: 'zoom-in', saturation: 82 }),
    shot('interior', 14, 4, { kenBurns: 'zoom-in', brightness: 91, saturation: 78 }),
    shot('blur', 18, 3.5, { kenBurns: 'zoom-in', brightness: 110 }),
    shot('street', 21.5, 4.5, { kenBurns: 'zoom-out', saturation: 86 }),
    shot('ueno', 26, 4, { kenBurns: 'zoom-out', brightness: 105, fadeOut: 1.2,
      transitionIn: { type: 'dissolve', duration: 0.9 } }),
    title(0.8, 4.2, 'LAST TRAIN'),
    title(1.5, 3.5, 'J A P A N   /   A F T E R   D A R K', { fontSize: 20, y: 0.65 }),
    title(26.8, 3.2, 'LAST TRAIN', { fontSize: 64, y: 0.46, fadeOut: 0 }),
    title(27.2, 2.8, 'A photo film. Edited in Cut.', { fontSize: 23, y: 0.59, fadeOut: 0 }),
    createAudioClip(media.station, 0, { duration: REEL_SECONDS, volume: 0.78, fadeIn: 0.2, fadeOut: 2.5 }),
    // Sound enters before the picture cut, from the carriage to the passing lights.
    createAudioClip(media.departure, 17.1, { duration: 6.6, volume: 0.64, fadeIn: 0.45, fadeOut: 1.1 }),
  ];
}
