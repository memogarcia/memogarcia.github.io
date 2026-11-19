// Cut — Web Audio graph and sample-accurate scheduling of decoded clip audio.
import * as E from './engine/index.ts';
import type { Clip, Project } from './engine/index.ts';
import { mediaMap, project, S } from './state.ts';
import type { ScheduledAudio } from './types.ts';

export const AG = {
  ctx: null as AudioContext | null,
  /** Every clip sound goes through here; export taps it, the speaker gain mutes the preview. */
  mixBus: null as GainNode | null,
  speakerGain: null as GainNode | null,
  active: [] as ScheduledAudio[],
};

export function audioContextClass(): typeof AudioContext | null {
  return window.AudioContext || window.webkitAudioContext || null;
}

export function ensureAudioContext(): AudioContext | null {
  if (!AG.ctx) {
    const AC = audioContextClass();
    if (!AC) return null;
    const ctx = new AC();
    const mixBus = ctx.createGain();
    const speakerGain = ctx.createGain();
    mixBus.gain.value = 1;
    speakerGain.gain.value = S.masterMuted ? 0 : 1;
    mixBus.connect(speakerGain);
    speakerGain.connect(ctx.destination);
    Object.assign(AG, { ctx, mixBus, speakerGain });
  }
  const ctx = AG.ctx as AudioContext;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function stopScheduledAudio(): void {
  for (const node of AG.active) {
    try { node.source.stop(); } catch { /* already stopped */ }
    try { node.source.disconnect(); } catch { /* detached */ }
    try { node.fadeGain.disconnect(); } catch { /* detached */ }
    try { node.volGain.disconnect(); } catch { /* detached */ }
  }
  AG.active = [];
}

function isTrackMuted(clip: Clip): boolean {
  return (clip.track === 'audio' && S.trackMuted.audio) || (clip.track === 'video' && S.trackMuted.video);
}

/**
 * Clips that play through a media element instead of a decoded buffer. A buffer source changes
 * pitch with `playbackRate`; a media element keeps pitch (`preservesPitch`). Files too large to
 * decode also stream through their element.
 */
export function usesElementAudio(clip: Clip): boolean {
  if (clip.track === 'text' || (clip.track === 'video' && clip.kind !== 'video')) return false;
  const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
  if (!media || !media.url) return false;
  if (!media.audioBuffer) return true;
  return Math.abs((clip.speed || 1) - 1) > 0.001;
}

export function updateLiveClipAudioGain(clipId: string, volume: number, muted: boolean): void {
  const ctx = AG.ctx;
  if (!ctx || !S.playing) return;
  const clip = project().clips.find((c) => c.id === clipId);
  const trackIsMuted = Boolean(clip && isTrackMuted(clip));
  const target = muted || trackIsMuted ? 0 : E.clamp(volume, 0, 2);
  let matched = false;
  for (const node of AG.active) {
    if (node.clipId === clipId) {
      matched = true;
      node.volGain.gain.setTargetAtTime(target, ctx.currentTime, 0.015);
    }
  }
  // A clip muted when playback started has no node yet; schedule it now that it is audible.
  if (!matched && target > 0) scheduleAllAudioFrom(S.playhead);
}

function applyFades(gain: AudioParam, clip: Clip, offsetInClip: number, whenStart: number, remaining: number): void {
  const whenEnd = whenStart + remaining;
  const fadeIn = Math.min(clip.fadeIn || 0, clip.duration * 0.45);
  const fadeOut = Math.min(clip.fadeOut || 0, clip.duration * 0.45);

  if (fadeIn > 0 && offsetInClip < fadeIn) {
    gain.setValueAtTime(Math.max(0.0001, offsetInClip / fadeIn), whenStart);
    gain.linearRampToValueAtTime(1, whenStart + (fadeIn - offsetInClip));
  } else {
    gain.setValueAtTime(1, whenStart);
  }

  if (fadeOut > 0) {
    const fadeOutStartInClip = clip.duration - fadeOut;
    if (offsetInClip >= fadeOutStartInClip) {
      gain.setValueAtTime(Math.max(0.0001, remaining / fadeOut), whenStart);
    } else {
      gain.setValueAtTime(1, whenStart + (fadeOutStartInClip - offsetInClip));
    }
    gain.linearRampToValueAtTime(0.0001, whenEnd);
  }
}

/**
 * Schedules every audio-track clip and every video clip with a decoded buffer from `startTime`.
 * Clips that need pitch-preserving speed or have streamed audio are left to their media element.
 */
export function scheduleAllAudioFrom(startTime: number, destinationNode?: AudioNode, p: Project = project()): void {
  stopScheduledAudio();
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const dest = destinationNode || AG.mixBus;
  if (!dest) return;
  const now = ctx.currentTime + 0.02;

  for (const clip of p.clips) {
    const isAudioTrack = clip.track === 'audio';
    if (!isAudioTrack && !(clip.track === 'video' && clip.kind === 'video')) continue;
    if (clip.muted || isTrackMuted(clip) || usesElementAudio(clip)) continue;

    const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
    const buffer = media?.audioBuffer;
    if (!buffer) continue;
    if (clip.start + clip.duration <= startTime + 0.01) continue;

    const offsetInClip = Math.max(0, startTime - clip.start);
    const delay = Math.max(0, clip.start - startTime);
    const remaining = clip.duration - offsetInClip;
    if (remaining <= 0.02) continue;

    const speed = clip.speed || 1;
    const bufferOffset = Math.max(0, (clip.sourceStart || 0) + offsetInClip * speed);
    const maxBufDur = Math.max(0, buffer.duration - bufferOffset);
    if (maxBufDur <= 0.01) continue;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = speed;
    const fadeGain = ctx.createGain();
    const volGain = ctx.createGain();
    volGain.gain.setValueAtTime(E.clamp(clip.volume ?? (isAudioTrack ? 0.85 : 1), 0, 2), now);

    const whenStart = now + delay;
    applyFades(fadeGain.gain, clip, offsetInClip, whenStart, remaining);
    source.connect(fadeGain);
    fadeGain.connect(volGain);
    volGain.connect(dest);

    try {
      source.start(whenStart, bufferOffset, Math.min(remaining * speed, maxBufDur));
      AG.active.push({ source, fadeGain, volGain, clipId: clip.id });
    } catch {
      // Out-of-bounds buffer start
    }
  }
}

export function setMasterMuted(muted: boolean): void {
  S.masterMuted = muted;
  if (AG.speakerGain) AG.speakerGain.gain.value = muted ? 0 : 1;
}

export function extractPeaks(data: Float32Array, count = 120): number[] {
  const step = Math.max(1, Math.floor(data.length / count));
  const stride = Math.max(1, Math.floor(step / 24));
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    let max = 0;
    const start = i * step;
    const end = Math.min(data.length, start + step);
    for (let j = start; j < end; j += stride) {
      const a = Math.abs(data[j]);
      if (a > max) max = a;
    }
    peaks.push(E.clamp(max, 0.05, 1));
  }
  return peaks;
}
