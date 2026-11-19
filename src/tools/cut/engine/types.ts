// Cut — Timeline data model shared by the engine, the app, and the tests.
import type { ASPECTS, FILTERS, KEN_BURNS, TEXT_PRESETS, TRANSITIONS } from './presets.ts';

export type Track = 'video' | 'audio' | 'text';
export type ClipKind = 'video' | 'image' | 'audio' | 'text';
export type MediaKind = 'video' | 'image' | 'audio';
export type DetectedKind = MediaKind | 'subtitle';

export type AspectKey = keyof typeof ASPECTS;
export type FilterKey = keyof typeof FILTERS;
export type TransitionType = keyof typeof TRANSITIONS;
export type KenBurnsKey = keyof typeof KEN_BURNS;
export type TextPresetKey = keyof typeof TEXT_PRESETS;
export type TextAnimation = 'none' | 'fade' | 'pop';
export type Fit = 'cover' | 'contain';
export type Quality = '720' | '1080';

export interface Transition {
  type: TransitionType;
  duration: number;
}

/**
 * One block on the timeline. Every clip carries the timing fields; the optional groups below
 * only apply to the track named in the comment.
 */
export interface Clip {
  id: string;
  track: Track;
  kind: ClipKind;
  name: string;
  start: number;
  duration: number;
  /** Offset into the source media, in source seconds. */
  sourceStart: number;
  /** Length of the source media; Infinity for stills and text. */
  mediaDuration: number;
  speed: number;
  fadeIn: number;
  fadeOut: number;
  mediaId?: string;

  // Video & audio
  volume?: number;
  muted?: boolean;

  // Video
  fit?: Fit;
  zoom?: number;
  /** Normalized pan offset (-1..1). */
  offsetX?: number;
  offsetY?: number;
  /** 0 | 90 | 180 | 270 */
  rotate?: number;
  flipH?: boolean;
  kenBurns?: KenBurnsKey;
  filter?: FilterKey;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  transitionIn?: Transition;

  // Text
  text?: string;
  preset?: TextPresetKey;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  bgColor?: string;
  animation?: TextAnimation;
}

export interface Project {
  aspect: AspectKey;
  clips: Clip[];
  selectedClipId: string | null;
  snap: boolean;
}

export interface History {
  past: Project[];
  present: Project;
  future: Project[];
}

/** The minimum a media item must provide to become a clip. */
export interface MediaRef {
  id: string;
  kind: MediaKind;
  name?: string;
  duration?: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
