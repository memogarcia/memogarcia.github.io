// Cut — Timeline queries and edits: active clips, seams, split, trim, speed, snap, overlap, gaps, ripple.
import { clamp, cloneClip, cloneClips, makeId, MIN_CLIP_DURATION, roundTime } from './core.ts';
import type { Clip, Track, Transition, TransitionType } from './types.ts';

const SEAM_GAP = 0.08;
const DEFAULT_TRANSITION: Transition = { type: 'none', duration: 0.45 };

export interface ActiveClips {
  video: Clip | null;
  texts: Clip[];
  audios: Clip[];
}

export interface Seam {
  prevId: string;
  nextId: string;
  time: number;
  transition: Transition;
}

export interface TransitionState {
  type: TransitionType;
  duration: number;
  progress: number;
  outgoing: Clip;
  incoming: Clip;
}

export interface SplitResult {
  clips: Clip[];
  leftId: string;
  rightId: string;
}

/** Clips whose `sourceStart` maps to a position in a time-based source (not stills or text). */
function isMediaTimed(clip: Clip): boolean {
  return clip.track === 'audio' || clip.kind === 'video' || clip.kind === 'procedural';
}

function sortedVideos(clips: readonly Clip[]): Clip[] {
  return clips.filter((c) => c.track === 'video').sort((a, b) => a.start - b.start);
}

export function getTrackEnd(clips: readonly Clip[], track: Track): number {
  let end = 0;
  for (const clip of clips) {
    if (clip.track === track) end = Math.max(end, clip.start + clip.duration);
  }
  return roundTime(end);
}

export function computeProjectDuration(clips: readonly Clip[]): number {
  let maxEnd = 0;
  for (const clip of clips) maxEnd = Math.max(maxEnd, clip.start + clip.duration);
  return roundTime(maxEnd);
}

export function getActiveClipsAt(clips: readonly Clip[], time: number): ActiveClips {
  const t = Math.max(0, time);
  let video: Clip | null = null;
  const texts: Clip[] = [];
  const audios: Clip[] = [];

  for (const clip of clips) {
    if (t < clip.start - 1e-4 || t >= clip.start + clip.duration - 1e-4) continue;
    if (clip.track === 'video') {
      if (!video || clip.start >= video.start) video = clip;
    } else if (clip.track === 'text') {
      texts.push(clip);
    } else if (clip.track === 'audio') {
      audios.push(clip);
    }
  }
  return { video, texts, audios };
}

export function getAdjacentVideoSeams(clips: readonly Clip[]): Seam[] {
  const videos = sortedVideos(clips);
  const seams: Seam[] = [];
  for (let i = 1; i < videos.length; i++) {
    const prev = videos[i - 1];
    const next = videos[i];
    const gap = next.start - (prev.start + prev.duration);
    if (Math.abs(gap) <= SEAM_GAP) {
      seams.push({
        prevId: prev.id,
        nextId: next.id,
        time: next.start,
        transition: next.transitionIn || DEFAULT_TRANSITION,
      });
    }
  }
  return seams;
}

export function getTransitionStateAt(clips: readonly Clip[], time: number): TransitionState | null {
  const videos = sortedVideos(clips);
  for (let i = 1; i < videos.length; i++) {
    const prev = videos[i - 1];
    const next = videos[i];
    const tr = next.transitionIn;
    if (!tr || tr.type === 'none') continue;
    const gap = next.start - (prev.start + prev.duration);
    if (Math.abs(gap) > SEAM_GAP) continue;

    const dur = Math.min(tr.duration || 0.45, prev.duration * 0.5, next.duration * 0.5);
    if (dur <= 0.02) continue;
    if (time >= next.start && time < next.start + dur) {
      const rawP = clamp((time - next.start) / dur, 0, 1);
      // Smoothstep easing for a natural visual transition
      const progress = rawP * rawP * (3 - 2 * rawP);
      return { type: tr.type, duration: dur, progress, outgoing: prev, incoming: next };
    }
  }
  return null;
}

export function canSplitAt(clip: Clip | null | undefined, time: number): boolean {
  if (!clip) return false;
  return time > clip.start + MIN_CLIP_DURATION && time < clip.start + clip.duration - MIN_CLIP_DURATION;
}

export function findClipToSplit(clips: readonly Clip[], selectedClipId: string | null, time: number): Clip | null {
  if (selectedClipId) {
    const selected = clips.find((c) => c.id === selectedClipId);
    if (selected && canSplitAt(selected, time)) return selected;
  }
  for (const track of ['video', 'text', 'audio'] as const) {
    const hit = clips.find((c) => c.track === track && canSplitAt(c, time));
    if (hit) return hit;
  }
  return null;
}

export function splitClipAt(clips: readonly Clip[], clipId: string, time: number): SplitResult | null {
  const idx = clips.findIndex((c) => c.id === clipId);
  if (idx === -1) return null;
  const clip = clips[idx];
  if (!canSplitAt(clip, time)) return null;

  const splitTime = roundTime(time);
  const leftDur = roundTime(splitTime - clip.start);
  const rightDur = roundTime(clip.start + clip.duration - splitTime);
  const speed = clip.speed || 1;

  // The cut itself has no fade: the left half keeps its fade in, the right half its fade out.
  const leftClip = cloneClip({ ...clip, duration: leftDur, fadeOut: 0 });
  const rightClip = cloneClip({
    ...clip,
    id: makeId(clip.track[0]),
    start: splitTime,
    duration: rightDur,
    sourceStart: isMediaTimed(clip) ? roundTime((clip.sourceStart || 0) + leftDur * speed) : 0,
    fadeIn: 0,
    transitionIn: { ...DEFAULT_TRANSITION },
  });

  const next = cloneClips(clips);
  next.splice(idx, 1, leftClip, rightClip);
  return { clips: next, leftId: leftClip.id, rightId: rightClip.id };
}

export function trimClipLeft(clip: Clip, proposedStart: number): Clip {
  const speed = clip.speed || 1;
  const end = clip.start + clip.duration;
  const maxStart = end - MIN_CLIP_DURATION;
  const timed = isMediaTimed(clip);
  const minStartFromSource = timed ? clip.start - (clip.sourceStart || 0) / speed : 0;
  const minStart = Math.max(0, minStartFromSource);
  const nextStart = roundTime(clamp(proposedStart, minStart, maxStart));
  const delta = nextStart - clip.start;
  return cloneClip({
    ...clip,
    start: nextStart,
    duration: roundTime(Math.max(MIN_CLIP_DURATION, end - nextStart)),
    sourceStart: timed ? roundTime(Math.max(0, (clip.sourceStart || 0) + delta * speed)) : 0,
  });
}

export function trimClipRight(clip: Clip, proposedEnd: number): Clip {
  const speed = clip.speed || 1;
  const minEnd = clip.start + MIN_CLIP_DURATION;
  const bounded = isMediaTimed(clip) && Number.isFinite(clip.mediaDuration);
  const maxDuration = bounded
    ? Math.max(MIN_CLIP_DURATION, (clip.mediaDuration - (clip.sourceStart || 0)) / speed)
    : Infinity;
  const maxEnd = Number.isFinite(maxDuration) ? clip.start + maxDuration : Infinity;
  const nextEnd = roundTime(clamp(proposedEnd, minEnd, maxEnd));
  return cloneClip({ ...clip, duration: roundTime(Math.max(MIN_CLIP_DURATION, nextEnd - clip.start)) });
}

export function setClipSpeed(clip: Clip, nextSpeed: number): Clip {
  const speed = clamp(nextSpeed, 0.25, 4);
  const sourceSpan = clip.duration * (clip.speed || 1);
  const bounded = isMediaTimed(clip) && Number.isFinite(clip.mediaDuration);
  const maxSpan = bounded ? Math.max(0.1, clip.mediaDuration - (clip.sourceStart || 0)) : sourceSpan;
  const duration = roundTime(Math.max(MIN_CLIP_DURATION, Math.min(sourceSpan, maxSpan) / speed));
  return cloneClip({ ...clip, speed, duration });
}

export function getSnapTargets(clips: readonly Clip[], excludeClipId: string | null, playhead?: number): number[] {
  const targets = [0];
  if (playhead !== undefined && Number.isFinite(playhead)) targets.push(roundTime(playhead));
  for (const clip of clips) {
    if (clip.id === excludeClipId) continue;
    targets.push(clip.start, roundTime(clip.start + clip.duration));
  }
  return targets;
}

export function snapMoveStart(
  proposedStart: number,
  duration: number,
  targets: readonly number[],
  thresholdSec: number,
): { start: number; snappedTo: number | null } {
  const rawStart = Math.max(0, proposedStart);
  let bestStart = rawStart;
  let bestDelta = thresholdSec;
  let snappedTo: number | null = null;

  for (const target of targets) {
    const startDelta = Math.abs(rawStart - target);
    if (startDelta < bestDelta) {
      bestDelta = startDelta;
      bestStart = target;
      snappedTo = target;
    }
    const endDelta = Math.abs(rawStart + duration - target);
    if (endDelta < bestDelta && target - duration >= 0) {
      bestDelta = endDelta;
      bestStart = target - duration;
      snappedTo = target;
    }
  }
  return { start: roundTime(Math.max(0, bestStart)), snappedTo };
}

/**
 * Keeps clips on the Video track from silently covering each other after a move, trim,
 * duplicate, or speed change. `preserveOrder` keeps start-time order (the moved clip wins ties),
 * which is right when a clip grows in place; without it clips are ordered by midpoint, which is
 * right while dragging.
 */
export function resolveVideoTrackOverlap(
  clips: readonly Clip[],
  movedClipId: string,
  opts: { preserveOrder?: boolean } = {},
): Clip[] {
  const moved = clips.find((c) => c.id === movedClipId);
  if (!moved || moved.track !== 'video') return cloneClips(clips);

  const others = clips.filter((c) => c.track === 'video' && c.id !== movedClipId);
  const overlaps = others.some(
    (o) => moved.start < o.start + o.duration - 0.005 && moved.start + moved.duration > o.start + 0.005,
  );
  if (!overlaps) return cloneClips(clips);

  const key = opts.preserveOrder
    ? (c: Clip) => c.start
    : (c: Clip) => c.start + c.duration * 0.5;
  const ordered = [...others, moved].sort((a, b) => {
    const diff = key(a) - key(b);
    if (Math.abs(diff) < 0.001) return a.id === movedClipId ? -1 : b.id === movedClipId ? 1 : 0;
    return diff;
  });

  // Each clip stays where it is unless that would overlap the clip before it.
  const placed = new Map<string, number>();
  let cursor = 0;
  for (const clip of ordered) {
    const nextStart = roundTime(Math.max(cursor, clip.start));
    placed.set(clip.id, nextStart);
    cursor = nextStart + clip.duration;
  }

  return clips.map((c) => {
    const start = placed.get(c.id);
    return cloneClip(start === undefined ? c : { ...c, start });
  });
}

export function closeGaps(clips: readonly Clip[], track: Track = 'video'): Clip[] {
  const trackClips = clips.filter((c) => c.track === track).sort((a, b) => a.start - b.start);
  let cursor = 0;
  const moved = new Map<string, number>();
  for (const clip of trackClips) {
    moved.set(clip.id, roundTime(cursor));
    cursor += clip.duration;
  }
  return clips.map((clip) => {
    const start = moved.get(clip.id);
    return cloneClip(start === undefined ? clip : { ...clip, start });
  });
}

/**
 * Removes a clip. For a video clip, everything that starts after it on every track moves left by
 * its duration, so captions and music stay in sync with the picture. Clips that overlap the
 * removed range (a music bed under the whole edit, say) stay where they are.
 */
export function rippleDeleteClip(clips: readonly Clip[], clipId: string): Clip[] {
  const target = clips.find((c) => c.id === clipId);
  if (!target) return cloneClips(clips);
  const remaining = clips.filter((c) => c.id !== clipId);
  if (target.track !== 'video') return cloneClips(remaining);
  const end = target.start + target.duration;
  return remaining.map((c) => {
    if (c.start >= end - 0.05) {
      return cloneClip({ ...c, start: roundTime(Math.max(0, c.start - target.duration)) });
    }
    return cloneClip(c);
  });
}
