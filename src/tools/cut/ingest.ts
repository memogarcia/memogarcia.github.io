// Cut — File import (video, image, audio, SRT/VTT) and adding media or captions to the timeline.
import * as E from './engine/index.ts';
import type { TextPresetKey } from './engine/index.ts';
import { ensureAudioContext, extractPeaks } from './audio.ts';
import { context2d, el, makeCanvas } from './dom.ts';
import { commitState } from './history.ts';
import { renderMediaBin } from './media-bin.ts';
import { canDecodeInMemory, decodeBlobAudioAsync, persistMedia } from './persist.ts';
import { mediaMap, project, S } from './state.ts';
import { showToast, stripExtension } from './ui.ts';
import type { MediaItem } from './types.ts';

/** If a browser never answers with metadata or an error, give up instead of stalling the queue. */
const METADATA_TIMEOUT_MS = 20_000;

export async function ingestFiles(files: FileList | File[] | null | undefined): Promise<void> {
  if (!files || !files.length) return;
  const list = Array.from(files);
  await S.restored;
  ensureAudioContext();
  let addedCount = 0;

  for (const file of list) {
    const kind = E.detectMediaKind(file.name, file.type);
    if (kind === 'subtitle') {
      importCaptionsFromText(await file.text());
      addedCount += 1;
      continue;
    }
    const media = kind === 'video' ? await loadVideoMedia(file)
      : kind === 'image' ? await loadImageMedia(file)
        : kind === 'audio' ? await loadAudioMedia(file)
          : null;
    if (!kind) showToast(`Unsupported file: ${file.name}`);
    if (!media) continue;
    mediaMap.set(media.id, media);
    void persistMedia(media);
    appendMediaToTimeline(media);
    addedCount += 1;
  }

  if (addedCount > 0) {
    renderMediaBin();
    showToast(`Imported ${addedCount} ${addedCount === 1 ? 'file' : 'files'}`);
  }
}

function waitForEvent(target: EventTarget, events: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      for (const name of events) target.removeEventListener(name, done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    for (const name of events) target.addEventListener(name, done, { once: true });
  });
}

async function resolveVideoDuration(video: HTMLVideoElement): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  // WebM files recorded by MediaRecorder often report duration === Infinity until seeked past EOF.
  const settled = waitForEvent(video, ['timeupdate', 'seeked'], 600);
  try { video.currentTime = 1e7; } catch { /* not seekable */ }
  await settled;
  const resolved = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 5;
  try { video.currentTime = 0; } catch { /* not seekable */ }
  return resolved;
}

async function extractVideoFilmstrip(video: HTMLVideoElement, duration: number, count = 6): Promise<string[]> {
  const frames: string[] = [];
  const c = makeCanvas(96, 64);
  const g = context2d(c);
  for (let i = 0; i < count; i++) {
    const target = Math.min(Math.max(0, duration - 0.05), (i / Math.max(1, count)) * duration + 0.05);
    if (Math.abs((video.currentTime || 0) - target) > 0.01 || video.readyState < 2) {
      const seeked = waitForEvent(video, ['seeked'], 650);
      try { video.currentTime = target; } catch { /* not seekable */ }
      await seeked;
    }
    try {
      const r = E.computeDrawRect(video.videoWidth || 96, video.videoHeight || 64, 96, 64, 'cover', 1);
      g.fillStyle = '#0e0f12';
      g.fillRect(0, 0, 96, 64);
      g.drawImage(video, r.x, r.y, r.w, r.h);
      frames.push(c.toDataURL('image/jpeg', 0.65));
    } catch {
      // Frame not decodable
    }
  }
  return frames;
}

function loadVideoMedia(file: File): Promise<MediaItem | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let settled = false;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const release = () => {
      clearTimeout(timer);
      try { video.pause(); } catch { /* ignore */ }
      video.removeAttribute('src');
      video.load();
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      release();
      URL.revokeObjectURL(url);
      showToast(`Could not decode ${file.name}`);
      resolve(null);
    };
    const timer = setTimeout(fail, METADATA_TIMEOUT_MS);

    video.addEventListener('error', fail, { once: true });
    video.addEventListener('loadedmetadata', async () => {
      if (settled) return;
      clearTimeout(timer);
      const duration = await resolveVideoDuration(video);
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const thumbs = await extractVideoFilmstrip(video, duration, 6);
      if (settled) return;
      settled = true;
      release();
      const media: MediaItem = {
        id: E.makeId('m'),
        kind: 'video',
        name: stripExtension(file.name),
        url,
        blob: file,
        duration: E.roundTime(duration),
        width,
        height,
        thumbs,
        audioBuffer: null,
        peaks: null,
      };
      // Decode embedded audio in the background for the waveform, export, and detach-audio.
      // Re-save afterwards to store the peaks, unless the media was removed in the meantime.
      void decodeBlobAudioAsync(file, media).then(() => persistMedia(media));
      resolve(media);
    }, { once: true });
    video.src = url;
  });
}

export function loadImageMedia(file: File): Promise<MediaItem | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = makeCanvas(96, 64);
      const r = E.computeDrawRect(img.naturalWidth, img.naturalHeight, 96, 64, 'cover', 1);
      context2d(c).drawImage(img, r.x, r.y, r.w, r.h);
      resolve({
        id: E.makeId('m'),
        kind: 'image',
        name: stripExtension(file.name),
        url,
        blob: file,
        img,
        duration: 4,
        width: img.naturalWidth,
        height: img.naturalHeight,
        thumbs: [c.toDataURL('image/jpeg', 0.72)],
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast(`Could not open ${file.name}`);
      resolve(null);
    };
    img.src = url;
  });
}

function probeAudioDuration(url: string): Promise<number> {
  const audio = document.createElement('audio');
  audio.preload = 'metadata';
  const ready = waitForEvent(audio, ['loadedmetadata', 'error'], METADATA_TIMEOUT_MS);
  audio.src = url;
  return ready.then(() => {
    const d = audio.duration;
    audio.removeAttribute('src');
    audio.load();
    return Number.isFinite(d) && d > 0 ? d : 0;
  });
}

export async function loadAudioMedia(file: File): Promise<MediaItem | null> {
  const url = URL.createObjectURL(file);
  const base = { id: E.makeId('m'), kind: 'audio' as const, name: stripExtension(file.name), blob: file, url };
  if (!canDecodeInMemory(file, 0)) {
    // Too large to hold as PCM: play it through an <audio> element, without a waveform.
    const duration = await probeAudioDuration(url);
    if (duration > 0) {
      showToast(`${file.name} is large: playing it without a waveform`);
      return { ...base, duration: E.roundTime(duration), streamedAudio: true, peaks: null };
    }
  } else {
    try {
      const ctx = ensureAudioContext();
      if (ctx) {
        const audioBuffer = await ctx.decodeAudioData(await file.arrayBuffer());
        return {
          ...base,
          duration: E.roundTime(audioBuffer.duration),
          audioBuffer,
          peaks: extractPeaks(audioBuffer.getChannelData(0), 120),
        };
      }
    } catch {
      // Fall through to the error toast
    }
  }
  URL.revokeObjectURL(url);
  showToast(`Could not decode audio: ${file.name}`);
  return null;
}

export function appendMediaToTimeline(media: MediaItem): void {
  const track = media.kind === 'audio' ? 'audio' : 'video';
  const start = E.getTrackEnd(project().clips, track);
  const clip = track === 'audio' ? E.createAudioClip(media, start) : E.createVideoClip(media, start);
  commitState((p) => ({ ...p, clips: p.clips.concat(clip), selectedClipId: clip.id }));
}

export function addTextAtPlayhead(presetKey: TextPresetKey = 'caption'): void {
  const clip = E.createTextClip(E.roundTime(S.playhead), { text: 'New text', preset: presetKey });
  commitState((p) => ({ ...p, clips: p.clips.concat(clip), selectedClipId: clip.id }));
  showToast(`Added ${E.TEXT_PRESETS[presetKey]?.label || 'text'}`);
  setTimeout(() => {
    el.tContent.focus();
    el.tContent.select();
  }, 20);
}

export function importCaptionsFromText(rawText: string): void {
  const total = E.computeProjectDuration(project().clips);
  const created = E.scriptToCaptions(rawText, total, 'caption');
  if (!created.length) {
    showToast('Paste .srt subtitles or at least one caption line');
    return;
  }
  commitState((p) => ({
    ...p,
    clips: p.clips.filter((c) => c.track !== 'text').concat(created),
    selectedClipId: created[0].id,
  }));
  showToast(`Added ${created.length} ${created.length === 1 ? 'caption' : 'captions'}`);
}

export function detachVideoAudio(clipId: string): void {
  const clip = project().clips.find((c) => c.id === clipId && c.track === 'video');
  if (!clip) return;
  const media = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
  if (!media || !(media.audioBuffer || media.streamedAudio)) {
    showToast('No audio stream found in this video');
    return;
  }
  const audioClip = E.createAudioClip(media, clip.start, {
    name: `${clip.name} (audio)`,
    duration: clip.duration,
    sourceStart: clip.sourceStart || 0,
    mediaDuration: media.audioBuffer?.duration ?? media.duration,
    speed: clip.speed || 1,
    volume: clip.volume ?? 1,
    muted: false,
    fadeIn: clip.fadeIn || 0,
    fadeOut: clip.fadeOut || 0,
  });
  commitState((p) => ({
    ...p,
    clips: p.clips.map((c) => (c.id === clip.id ? { ...c, muted: true } : c)).concat(audioClip),
    selectedClipId: audioClip.id,
  }));
  showToast('Detached audio to track A');
}
