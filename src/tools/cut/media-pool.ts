// Cut — Pool of <video>/<audio> elements, shared per media file and lent to the clips that need
// them at the current time (on screen, in a transition, about to start, or playing element audio).
import * as E from './engine/index.ts';
import type { Clip, Project } from './engine/index.ts';
import { AG, ensureAudioContext, usesElementAudio } from './audio.ts';
import { context2d, makeCanvas } from './dom.ts';
import { renderPreview } from './playback.ts';
import { mediaMap, perf, project, S } from './state.ts';
import type { MediaSlot } from './types.ts';

const MAX_IDLE_SLOTS = 4;
const PRELOAD_AHEAD = 2.5;
const LAST_FRAME_MAX = 640;

const slots: MediaSlot[] = [];

interface SlotSpec {
  clip: Clip;
  localTime: number;
  /** Outgoing side of a transition: hold its last frame, no sound. */
  frozen: boolean;
  /** Upcoming clip: park it at its first frame so the cut is instant. */
  preload: boolean;
}

function needsElement(clip: Clip): boolean {
  return (clip.track === 'video' && clip.kind === 'video') || (clip.track === 'audio' && usesElementAudio(clip));
}

function wantsVideoTag(clip: Clip): boolean {
  return clip.track === 'video';
}

export function slotForClip(clipId: string): MediaSlot | null {
  return slots.find((s) => s.clipId === clipId) || null;
}

export function captureLastFrame(slot: MediaSlot): void {
  const video = slot.el;
  if (!(video instanceof HTMLVideoElement) || video.readyState < 2 || !video.videoWidth) return;
  const scale = Math.min(1, LAST_FRAME_MAX / Math.max(video.videoWidth, video.videoHeight));
  const w = Math.max(1, Math.round(video.videoWidth * scale));
  const h = Math.max(1, Math.round(video.videoHeight * scale));
  const frame = slot.lastFrame || makeCanvas();
  if (frame.width !== w || frame.height !== h) {
    frame.width = w;
    frame.height = h;
  }
  try {
    context2d(frame, { alpha: false }).drawImage(video, 0, 0, w, h);
    slot.lastFrame = frame;
  } catch {
    // Frame not decodable yet
  }
}

function createSlot(clip: Clip, url: string): MediaSlot {
  const media = wantsVideoTag(clip) ? document.createElement('video') : document.createElement('audio');
  media.src = url;
  media.preload = 'auto';
  media.crossOrigin = 'anonymous';
  media.muted = true;
  media.preservesPitch = true;
  if (media instanceof HTMLVideoElement) media.playsInline = true;
  const slot: MediaSlot = {
    el: media,
    mediaId: clip.mediaId as string,
    clipId: null,
    sourceNode: null,
    gainNode: null,
    lastFrame: null,
    lastUsed: performance.now(),
  };
  const onFrame = () => {
    captureLastFrame(slot);
    if (!S.playing && !S.exporting) renderPreview();
  };
  media.addEventListener('seeked', onFrame);
  media.addEventListener('loadeddata', onFrame);
  slots.push(slot);
  return slot;
}

function destroySlot(slot: MediaSlot): void {
  try { slot.el.pause(); } catch { /* ignore */ }
  try { slot.sourceNode?.disconnect(); } catch { /* ignore */ }
  try { slot.gainNode?.disconnect(); } catch { /* ignore */ }
  slot.el.removeAttribute('src');
  slot.el.load();
  slot.lastFrame = null;
  const idx = slots.indexOf(slot);
  if (idx !== -1) slots.splice(idx, 1);
}

function releaseSlot(slot: MediaSlot): void {
  slot.clipId = null;
  slot.el.muted = true;
  if (slot.gainNode) slot.gainNode.gain.value = 0;
  if (!slot.el.paused) {
    try { slot.el.pause(); } catch { /* ignore */ }
  }
}

function acquireSlot(clip: Clip): MediaSlot | null {
  const existing = slotForClip(clip.id);
  if (existing) return existing;
  const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
  if (!media || !media.url) return null;
  const isVideoTag = wantsVideoTag(clip);
  const free = slots.find((s) => !s.clipId && s.mediaId === media.id && (s.el instanceof HTMLVideoElement) === isVideoTag);
  const slot = free || createSlot(clip, media.url);
  slot.clipId = clip.id;
  slot.lastUsed = performance.now();
  return slot;
}

/** Drops slots for removed clips or media and trims the idle pool. */
export function syncMediaPool(): void {
  const clips = project().clips;
  const liveClipIds = new Set(clips.map((c) => c.id));
  const usedMedia = new Set(clips.filter(needsElement).map((c) => c.mediaId));
  for (const slot of [...slots]) {
    if (!mediaMap.has(slot.mediaId) || !usedMedia.has(slot.mediaId)) destroySlot(slot);
    else if (slot.clipId && !liveClipIds.has(slot.clipId)) releaseSlot(slot);
  }
}

function trimIdleSlots(): void {
  const idle = slots.filter((s) => !s.clipId).sort((a, b) => b.lastUsed - a.lastUsed);
  for (const slot of idle.slice(MAX_IDLE_SLOTS)) destroySlot(slot);
  perf.mediaSlots = slots.length;
}

function ensureElementAudioRouting(slot: MediaSlot): void {
  if (slot.sourceNode) return;
  const ctx = ensureAudioContext();
  if (!ctx || !AG.mixBus) return;
  try {
    const sourceNode = ctx.createMediaElementSource(slot.el);
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    sourceNode.connect(gainNode);
    gainNode.connect(AG.mixBus);
    slot.sourceNode = sourceNode;
    slot.gainNode = gainNode;
  } catch {
    // Fall back to the element's own volume
  }
}

function seekSlot(slot: MediaSlot, target: number): void {
  captureLastFrame(slot);
  try { slot.el.currentTime = target; } catch { /* not seekable yet */ }
}

function neededSpecs(time: number, clips: readonly Clip[]): Map<string, SlotSpec> {
  const needed = new Map<string, SlotSpec>();
  const add = (clip: Clip, localTime: number, frozen = false, preload = false) => {
    if (needsElement(clip) && !needed.has(clip.id)) needed.set(clip.id, { clip, localTime, frozen, preload });
  };

  const tr = E.getTransitionStateAt(clips, time);
  if (tr) {
    add(tr.outgoing, Math.max(0, tr.outgoing.duration - 0.04), true);
    add(tr.incoming, Math.max(0, time - tr.incoming.start));
  } else {
    const active = E.getActiveClipsAt(clips, time).video;
    if (active) add(active, Math.max(0, time - active.start));
  }
  for (const clip of clips) {
    if (clip.track !== 'audio' || !needsElement(clip)) continue;
    if (time >= clip.start && time < clip.start + clip.duration) add(clip, time - clip.start);
  }
  // Park the next clip on each track at its first frame so the cut has a decoded picture ready.
  for (const track of ['video', 'audio'] as const) {
    let next: Clip | null = null;
    for (const clip of clips) {
      if (clip.track !== track || !needsElement(clip) || needed.has(clip.id)) continue;
      if (clip.start > time && clip.start - time <= PRELOAD_AHEAD && (!next || clip.start < next.start)) next = clip;
    }
    if (next) add(next, 0, false, true);
  }
  return needed;
}

function driveSlot(slot: MediaSlot, spec: SlotSpec, isPlaying: boolean): void {
  const { clip, localTime, frozen, preload } = spec;
  const media = slot.el;
  const speed = clip.speed || 1;
  const maxTime = Math.max(0, (media.duration || clip.mediaDuration || 100) - 0.04);
  const target = E.clamp((clip.sourceStart || 0) + localTime * speed, 0, Number.isFinite(maxTime) ? maxTime : 100);
  const live = isPlaying && !frozen && !preload;

  if (live && usesElementAudio(clip)) {
    const opacity = E.computeClipOpacity(clip, localTime);
    const trackMuted = clip.track === 'audio' ? S.trackMuted.audio : S.trackMuted.video;
    const muted = Boolean(clip.muted) || trackMuted;
    const baseVolume = clip.volume ?? (clip.track === 'audio' ? 0.85 : 1);
    const vol = muted ? 0 : E.clamp(baseVolume * opacity, 0, 2);
    ensureElementAudioRouting(slot);
    if (slot.gainNode) {
      slot.gainNode.gain.value = vol;
      media.muted = false;
      media.volume = 1;
    } else {
      media.muted = muted || S.masterMuted;
      media.volume = Math.min(1, vol);
    }
  } else {
    media.muted = true;
    if (slot.gainNode) slot.gainNode.gain.value = 0;
  }

  if (live) {
    if (Math.abs(media.playbackRate - speed) > 0.01) {
      try { media.playbackRate = speed; } catch { /* unsupported rate */ }
    }
    if (Math.abs((media.currentTime || 0) - target) > 0.24) seekSlot(slot, target);
    if (media.paused && media.readyState >= 2) media.play().catch(() => {});
  } else {
    if (!media.paused) {
      try { media.pause(); } catch { /* ignore */ }
    }
    if (Math.abs((media.currentTime || 0) - target) > 0.03) seekSlot(slot, target);
  }
}

/** Lends elements to the clips needed at `time` and plays, pauses, or seeks them. */
export function syncMediaToTime(time: number, isPlaying: boolean, p: Project = project()): void {
  const needed = neededSpecs(time, p.clips);
  for (const slot of slots) {
    if (slot.clipId && !needed.has(slot.clipId)) releaseSlot(slot);
  }
  for (const spec of needed.values()) {
    const slot = acquireSlot(spec.clip);
    if (slot) driveSlot(slot, spec, isPlaying);
  }
  trimIdleSlots();
}

export function pauseAllSlots(): void {
  for (const slot of slots) {
    if (!slot.el.paused) {
      try { slot.el.pause(); } catch { /* ignore */ }
    }
  }
}

export function destroyAllSlots(): void {
  for (const slot of [...slots]) destroySlot(slot);
}

/** Waits (bounded) until every lent element has a decoded frame at its target time. */
export async function waitForSlotsReady(timeoutMs = 800): Promise<void> {
  const pending = slots.filter((s) => s.clipId && (s.el.readyState < 2 || s.el.seeking));
  await Promise.all(pending.map((slot) => new Promise<void>((resolve) => {
    const media = slot.el;
    const done = () => {
      clearTimeout(timer);
      media.removeEventListener('seeked', done);
      media.removeEventListener('canplay', done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    media.addEventListener('seeked', done, { once: true });
    media.addEventListener('canplay', done, { once: true });
  })));
}
