// Cut — Ids, clip factories, cloning, and undo history.
import type { Clip, History, MediaRef, Project } from './types.ts';

export const MIN_CLIP_DURATION = 0.2;
export const MAX_HISTORY = 60;

let idCounter = 1;
export function makeId(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function roundTime(sec: number): number {
  return Math.round(sec * 1000) / 1000;
}

export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    aspect: '9:16',
    bgColor: '#0e0f12',
    clips: [],
    selectedClipId: null,
    snap: true,
    ...overrides,
  };
}

export function createVideoClip(media: MediaRef, start = 0, overrides: Partial<Clip> = {}): Clip {
  const isImage = media.kind === 'image';
  const mediaDuration = isImage ? 4 : Math.max(MIN_CLIP_DURATION, media.duration || 4);
  return {
    id: makeId('v'),
    track: 'video',
    mediaId: media.id,
    name: media.name || 'Clip',
    kind: media.kind || 'video',
    start: roundTime(Math.max(0, start)),
    duration: roundTime(mediaDuration),
    sourceStart: 0,
    mediaDuration: isImage ? Infinity : mediaDuration,
    speed: 1,
    volume: 1,
    muted: false,
    fit: 'cover',
    blurBg: true,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotate: 0,
    flipH: false,
    kenBurns: 'none',
    filter: 'none',
    brightness: 100,
    contrast: 100,
    saturation: 100,
    fadeIn: 0,
    fadeOut: 0,
    transitionIn: { type: 'none', duration: 0.45 },
    ...overrides,
  };
}

export function createAudioClip(media: MediaRef, start = 0, overrides: Partial<Clip> = {}): Clip {
  const mediaDuration = Math.max(MIN_CLIP_DURATION, media.duration || 5);
  return {
    id: makeId('a'),
    track: 'audio',
    mediaId: media.id,
    name: media.name || 'Audio',
    kind: 'audio',
    start: roundTime(Math.max(0, start)),
    duration: roundTime(mediaDuration),
    sourceStart: 0,
    mediaDuration,
    speed: 1,
    volume: 0.85,
    muted: false,
    fadeIn: 0.2,
    fadeOut: 0.4,
    ...overrides,
  };
}

export function createTextClip(start = 0, overrides: Partial<Clip> = {}): Clip {
  return {
    id: makeId('t'),
    track: 'text',
    kind: 'text',
    name: 'Text',
    text: 'Your caption here',
    preset: 'caption',
    start: roundTime(Math.max(0, start)),
    duration: 3,
    mediaDuration: Infinity,
    sourceStart: 0,
    speed: 1,
    x: 0.5,
    y: 0.78,
    fontSize: 44,
    color: '',
    bgColor: '',
    animation: 'pop',
    fadeIn: 0.25,
    fadeOut: 0.25,
    ...overrides,
  };
}

export function cloneClip(clip: Clip): Clip {
  return {
    ...clip,
    ...(clip.transitionIn ? { transitionIn: { ...clip.transitionIn } } : {}),
  };
}

export function cloneClips(clips: readonly Clip[]): Clip[] {
  return clips.map(cloneClip);
}

export function cloneProject(project: Project): Project {
  return { ...project, clips: cloneClips(project.clips) };
}

export function createHistory(initialProject: Project): History {
  return { past: [], present: cloneProject(initialProject), future: [] };
}

export function commitHistory(history: History, nextProject: Project): History {
  return pushHistory(history, cloneProject(history.present), cloneProject(nextProject));
}

/** Records `before` as the undo step that leads to `present`. */
export function pushHistory(history: History, before: Project, present: Project = history.present): History {
  const past = history.past.concat(before);
  if (past.length > MAX_HISTORY) past.shift();
  return { past, present, future: [] };
}

export function undoHistory(history: History): History {
  if (!history.past.length) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: cloneProject(previous),
    future: [cloneProject(history.present), ...history.future].slice(0, MAX_HISTORY),
  };
}

export function redoHistory(history: History): History {
  if (!history.future.length) return history;
  const next = history.future[0];
  return {
    past: history.past.concat(cloneProject(history.present)).slice(-MAX_HISTORY),
    present: cloneProject(next),
    future: history.future.slice(1),
  };
}
