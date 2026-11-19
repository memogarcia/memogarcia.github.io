// Cut — Pure timeline, transform, transition, caption, filter, and history engine.
// Shared between the browser app (window.CutEngine) and Node tests (module.exports).
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.CutEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const MIN_CLIP_DURATION = 0.2;
  const MAX_HISTORY = 60;

  const ASPECTS = {
    '9:16': { label: '9:16', hint: 'Reels / Shorts', w720: 720, h720: 1280, w1080: 1080, h1080: 1920 },
    '16:9': { label: '16:9', hint: 'YouTube / Wide', w720: 1280, h720: 720, w1080: 1920, h1080: 1080 },
    '1:1':  { label: '1:1',  hint: 'Square',         w720: 720, h720: 720,  w1080: 1080, h1080: 1080 },
    '4:5':  { label: '4:5',  hint: 'Portrait Feed',  w720: 720, h720: 900,  w1080: 1080, h1080: 1350 },
  };

  const FILTERS = {
    none:      { label: 'Original',  css: '' },
    cinematic: { label: 'Cinematic', css: 'contrast(1.14) saturate(0.88) sepia(0.12)' },
    warm:      { label: 'Warm',      css: 'sepia(0.24) saturate(1.18) brightness(1.03)' },
    cool:      { label: 'Cool',      css: 'hue-rotate(-10deg) saturate(0.95) contrast(1.06) brightness(1.02)' },
    bw:        { label: 'B&W',       css: 'grayscale(1) contrast(1.18)' },
    vintage:   { label: 'Vintage',   css: 'sepia(0.36) contrast(0.94) brightness(1.04) saturate(0.84)' },
    vivid:     { label: 'Vivid',     css: 'saturate(1.38) contrast(1.08)' },
  };

  const TRANSITIONS = {
    none:         { label: 'Cut' },
    dissolve:     { label: 'Dissolve' },
    'slide-left': { label: 'Slide Left' },
    'slide-up':   { label: 'Slide Up' },
    zoom:         { label: 'Zoom' },
  };

  const KEN_BURNS = {
    none:       { label: 'Still' },
    'zoom-in':  { label: 'Zoom In' },
    'zoom-out': { label: 'Zoom Out' },
    'pan-left': { label: 'Pan Left' },
    'pan-right':{ label: 'Pan Right' },
  };

  const TEXT_PRESETS = {
    caption: {
      label: 'Caption',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: 700,
      color: '#ffffff',
      bgColor: 'rgba(15, 16, 20, 0.72)',
      strokeColor: '',
      strokeWidth: 0,
      uppercase: false,
      radius: 10,
      padX: 18,
      padY: 10,
    },
    pill: {
      label: 'Bold Pill',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: 800,
      color: '#121316',
      bgColor: '#f6d55c',
      strokeColor: '',
      strokeWidth: 0,
      uppercase: true,
      radius: 999,
      padX: 24,
      padY: 11,
    },
    outline: {
      label: 'Impact',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: 900,
      color: '#ffffff',
      bgColor: 'transparent',
      strokeColor: '#0c0d10',
      strokeWidth: 7,
      uppercase: true,
      radius: 0,
      padX: 8,
      padY: 6,
    },
    lower: {
      label: 'Lower 3rd',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontWeight: 600,
      color: '#f4f0e4',
      bgColor: 'rgba(180, 57, 43, 0.92)',
      strokeColor: '',
      strokeWidth: 0,
      uppercase: false,
      radius: 4,
      padX: 16,
      padY: 8,
    },
    editorial: {
      label: 'Editorial',
      fontFamily: '"Source Serif 4", Georgia, "Times New Roman", serif',
      fontWeight: 600,
      color: '#faf7f2',
      bgColor: 'transparent',
      strokeColor: 'rgba(0, 0, 0, 0.55)',
      strokeWidth: 3,
      uppercase: false,
      radius: 0,
      padX: 8,
      padY: 6,
    },
  };

  let idCounter = 1;
  function makeId(prefix = 'id') {
    idCounter += 1;
    return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function roundTime(sec) {
    return Math.round(sec * 1000) / 1000;
  }

  function createProject(overrides = {}) {
    return {
      aspect: '9:16',
      bgColor: '#0e0f12',
      clips: [],
      selectedClipId: null,
      snap: true,
      ...overrides,
    };
  }

  function createVideoClip(media, start = 0, overrides = {}) {
    const mediaDuration = media.kind === 'image' ? 4 : Math.max(MIN_CLIP_DURATION, media.duration || 4);
    return {
      id: makeId('v'),
      track: 'video',
      mediaId: media.id,
      name: media.name || 'Clip',
      kind: media.kind || 'video', // 'video' | 'image' | 'procedural'
      start: roundTime(Math.max(0, start)),
      duration: roundTime(mediaDuration),
      sourceStart: 0,
      mediaDuration: media.kind === 'image' ? Infinity : mediaDuration,
      speed: 1,
      volume: 1,
      muted: false,
      fit: 'cover', // 'cover' | 'contain'
      blurBg: true,
      zoom: 1,
      offsetX: 0, // normalized pan offset (-1..1)
      offsetY: 0,
      rotate: 0, // 0 | 90 | 180 | 270
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

  function createAudioClip(media, start = 0, overrides = {}) {
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

  function createTextClip(start = 0, overrides = {}) {
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
      animation: 'pop', // 'none' | 'fade' | 'pop' | 'slide'
      fadeIn: 0.25,
      fadeOut: 0.25,
      ...overrides,
    };
  }

  function cloneClip(clip) {
    return {
      ...clip,
      ...(clip.transitionIn ? { transitionIn: { ...clip.transitionIn } } : {}),
    };
  }

  function cloneClips(clips) {
    return clips.map(cloneClip);
  }

  function createHistory(initialProject) {
    return {
      past: [],
      present: { ...initialProject, clips: cloneClips(initialProject.clips) },
      future: [],
    };
  }

  function commitHistory(history, nextProject) {
    const snapshot = { ...history.present, clips: cloneClips(history.present.clips) };
    const past = history.past.concat(snapshot);
    if (past.length > MAX_HISTORY) past.shift();
    return {
      past,
      present: { ...nextProject, clips: cloneClips(nextProject.clips) },
      future: [],
    };
  }

  function undoHistory(history) {
    if (!history.past.length) return history;
    const previous = history.past[history.past.length - 1];
    return {
      past: history.past.slice(0, -1),
      present: { ...previous, clips: cloneClips(previous.clips) },
      future: [{ ...history.present, clips: cloneClips(history.present.clips) }, ...history.future].slice(0, MAX_HISTORY),
    };
  }

  function redoHistory(history) {
    if (!history.future.length) return history;
    const next = history.future[0];
    return {
      past: history.past.concat({ ...history.present, clips: cloneClips(history.present.clips) }).slice(-MAX_HISTORY),
      present: { ...next, clips: cloneClips(next.clips) },
      future: history.future.slice(1),
    };
  }

  function getTrackEnd(clips, track) {
    let end = 0;
    for (const clip of clips) {
      if (clip.track === track) {
        end = Math.max(end, clip.start + clip.duration);
      }
    }
    return roundTime(end);
  }

  function computeProjectDuration(clips) {
    let maxEnd = 0;
    for (const clip of clips) {
      maxEnd = Math.max(maxEnd, clip.start + clip.duration);
    }
    return roundTime(maxEnd);
  }

  function getActiveClipsAt(clips, time) {
    const t = Math.max(0, time);
    let video = null;
    const texts = [];
    const audios = [];

    for (const clip of clips) {
      if (t >= clip.start - 1e-4 && t < clip.start + clip.duration - 1e-4) {
        if (clip.track === 'video') {
          if (!video || clip.start >= video.start) video = clip;
        } else if (clip.track === 'text') {
          texts.push(clip);
        } else if (clip.track === 'audio') {
          audios.push(clip);
        }
      }
    }
    return { video, texts, audios };
  }

  function getAdjacentVideoSeams(clips) {
    const videos = clips
      .filter((c) => c.track === 'video')
      .sort((a, b) => a.start - b.start);
    const seams = [];
    for (let i = 1; i < videos.length; i++) {
      const prev = videos[i - 1];
      const next = videos[i];
      const gap = next.start - (prev.start + prev.duration);
      if (Math.abs(gap) <= 0.08) {
        seams.push({
          prevId: prev.id,
          nextId: next.id,
          time: next.start,
          transition: next.transitionIn || { type: 'none', duration: 0.45 },
        });
      }
    }
    return seams;
  }

  function getTransitionStateAt(clips, time) {
    const videos = clips
      .filter((c) => c.track === 'video')
      .sort((a, b) => a.start - b.start);
    for (let i = 1; i < videos.length; i++) {
      const prev = videos[i - 1];
      const next = videos[i];
      const tr = next.transitionIn;
      if (!tr || tr.type === 'none') continue;
      const gap = next.start - (prev.start + prev.duration);
      if (Math.abs(gap) > 0.08) continue;

      const dur = Math.min(tr.duration || 0.45, prev.duration * 0.5, next.duration * 0.5);
      if (dur <= 0.02) continue;
      if (time >= next.start && time < next.start + dur) {
        const rawP = clamp((time - next.start) / dur, 0, 1);
        // Smoothstep easing for natural visual transition
        const progress = rawP * rawP * (3 - 2 * rawP);
        return {
          type: tr.type,
          duration: dur,
          progress,
          outgoing: prev,
          incoming: next,
        };
      }
    }
    return null;
  }

  function canSplitAt(clip, time) {
    if (!clip) return false;
    return time > clip.start + MIN_CLIP_DURATION && time < clip.start + clip.duration - MIN_CLIP_DURATION;
  }

  function findClipToSplit(clips, selectedClipId, time) {
    if (selectedClipId) {
      const selected = clips.find((c) => c.id === selectedClipId);
      if (selected && canSplitAt(selected, time)) return selected;
    }
    for (const track of ['video', 'text', 'audio']) {
      const hit = clips.find((c) => c.track === track && canSplitAt(c, time));
      if (hit) return hit;
    }
    return null;
  }

  function splitClipAt(clips, clipId, time) {
    const idx = clips.findIndex((c) => c.id === clipId);
    if (idx === -1) return null;
    const clip = clips[idx];
    if (!canSplitAt(clip, time)) return null;

    const splitTime = roundTime(time);
    const leftDur = roundTime(splitTime - clip.start);
    const rightDur = roundTime(clip.start + clip.duration - splitTime);
    const speed = clip.speed || 1;
    const isMediaTimed = clip.track === 'audio' || clip.kind === 'video' || clip.kind === 'procedural';

    const leftClip = cloneClip({
      ...clip,
      duration: leftDur,
      fadeOut: 0,
    });

    const rightClip = cloneClip({
      ...clip,
      id: makeId(clip.track[0]),
      start: splitTime,
      duration: rightDur,
      sourceStart: isMediaTimed ? roundTime((clip.sourceStart || 0) + leftDur * speed) : 0,
      fadeIn: 0,
      transitionIn: { type: 'none', duration: 0.45 },
    });

    const next = cloneClips(clips);
    next.splice(idx, 1, leftClip, rightClip);
    return { clips: next, leftId: leftClip.id, rightId: rightClip.id };
  }

  function trimClipLeft(clip, proposedStart) {
    const speed = clip.speed || 1;
    const end = clip.start + clip.duration;
    const maxStart = end - MIN_CLIP_DURATION;
    const isMediaTimed = clip.track === 'audio' || clip.kind === 'video' || clip.kind === 'procedural';
    const minStartFromSource = isMediaTimed
      ? clip.start - (clip.sourceStart || 0) / speed
      : 0;
    const minStart = Math.max(0, minStartFromSource);
    const nextStart = roundTime(clamp(proposedStart, minStart, maxStart));
    const delta = nextStart - clip.start;
    return cloneClip({
      ...clip,
      start: nextStart,
      duration: roundTime(Math.max(MIN_CLIP_DURATION, end - nextStart)),
      sourceStart: isMediaTimed ? roundTime(Math.max(0, (clip.sourceStart || 0) + delta * speed)) : 0,
    });
  }

  function trimClipRight(clip, proposedEnd) {
    const speed = clip.speed || 1;
    const minEnd = clip.start + MIN_CLIP_DURATION;
    const isMediaTimed = (clip.track === 'audio' || clip.kind === 'video' || clip.kind === 'procedural')
      && Number.isFinite(clip.mediaDuration);
    const maxDuration = isMediaTimed
      ? Math.max(MIN_CLIP_DURATION, (clip.mediaDuration - (clip.sourceStart || 0)) / speed)
      : Infinity;
    const maxEnd = Number.isFinite(maxDuration) ? clip.start + maxDuration : Infinity;
    const nextEnd = roundTime(clamp(proposedEnd, minEnd, maxEnd));
    return cloneClip({
      ...clip,
      duration: roundTime(Math.max(MIN_CLIP_DURATION, nextEnd - clip.start)),
    });
  }

  function setClipSpeed(clip, nextSpeed) {
    const speed = clamp(nextSpeed, 0.25, 4);
    const oldSpeed = clip.speed || 1;
    const sourceSpan = clip.duration * oldSpeed;
    const isMediaTimed = (clip.track === 'audio' || clip.kind === 'video' || clip.kind === 'procedural')
      && Number.isFinite(clip.mediaDuration);
    const maxSpan = isMediaTimed ? Math.max(0.1, clip.mediaDuration - (clip.sourceStart || 0)) : sourceSpan;
    const newDuration = roundTime(Math.max(MIN_CLIP_DURATION, Math.min(sourceSpan, maxSpan) / speed));
    return cloneClip({
      ...clip,
      speed,
      duration: newDuration,
    });
  }

  function getSnapTargets(clips, excludeClipId, playhead) {
    const targets = [0];
    if (Number.isFinite(playhead)) targets.push(roundTime(playhead));
    for (const clip of clips) {
      if (clip.id === excludeClipId) continue;
      targets.push(clip.start, roundTime(clip.start + clip.duration));
    }
    return targets;
  }

  function snapMoveStart(proposedStart, duration, targets, thresholdSec) {
    const rawStart = Math.max(0, proposedStart);
    let bestStart = rawStart;
    let bestDelta = thresholdSec;
    let snappedTo = null;

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

  // Ensures no two clips on the Video track silently cover each other after a move, trim, or speed change.
  function resolveVideoTrackOverlap(clips, movedClipId, opts = {}) {
    const moved = clips.find((c) => c.id === movedClipId);
    if (!moved || moved.track !== 'video') return cloneClips(clips);

    const others = clips
      .filter((c) => c.track === 'video' && c.id !== movedClipId)
      .sort((a, b) => a.start - b.start);

    // Check if moved overlaps any other clip
    const hasOverlap = others.some((o) => moved.start < o.start + o.duration - 0.005 && moved.start + moved.duration > o.start + 0.005);
    if (!hasOverlap) return cloneClips(clips);

    const preserveOrder = Boolean(opts.preserveOrder);
    // Preserve start-time order when expanding in place (speed / right-trim); use midpoint order when dragging.
    const ordered = [...others, moved].sort((a, b) => {
      if (preserveOrder) {
        if (Math.abs(a.start - b.start) < 0.001) return a.id === movedClipId ? -1 : 1;
        return a.start - b.start;
      }
      const ma = a.start + a.duration * 0.5;
      const mb = b.start + b.duration * 0.5;
      if (Math.abs(ma - mb) < 0.001) return a.id === movedClipId ? -1 : 1;
      return ma - mb;
    });

    const placed = new Map();
    let cursor = 0;
    for (const clip of ordered) {
      const nextStart = roundTime(Math.max(cursor, clip.start));
      // If moved was dragged earlier than the next clip, let it sit where dropped and push subsequent clips right
      placed.set(clip.id, nextStart);
      cursor = nextStart + clip.duration;
    }

    // Check if the moved clip ended up overlapping an earlier clip because we kept max(cursor, start) — cursor guarantees strictly non-overlapping!
    // One extra pass: if moved was dragged before the very first clip, allow packing from 0 if overlap existed at front
    if (ordered[0].id === movedClipId && placed.get(movedClipId) > moved.start) {
      let c = Math.max(0, moved.start);
      for (const clip of ordered) {
        placed.set(clip.id, roundTime(c));
        c += clip.duration;
      }
    }

    return clips.map((c) => (placed.has(c.id) ? cloneClip({ ...c, start: placed.get(c.id) }) : cloneClip(c)));
  }

  function closeGaps(clips, track = 'video') {
    const trackClips = clips
      .filter((c) => c.track === track)
      .sort((a, b) => a.start - b.start);
    let cursor = 0;
    const moved = new Map();
    for (const clip of trackClips) {
      moved.set(clip.id, roundTime(cursor));
      cursor += clip.duration;
    }
    return clips.map((clip) => (moved.has(clip.id) ? cloneClip({ ...clip, start: moved.get(clip.id) }) : cloneClip(clip)));
  }

  function rippleDeleteClip(clips, clipId) {
    const target = clips.find((c) => c.id === clipId);
    if (!target) return cloneClips(clips);
    const remaining = clips.filter((c) => c.id !== clipId);
    if (target.track !== 'video') return cloneClips(remaining);
    return remaining.map((c) => {
      if (c.track === 'video' && c.start >= target.start + target.duration - 0.05) {
        return cloneClip({ ...c, start: roundTime(Math.max(0, c.start - target.duration)) });
      }
      return cloneClip(c);
    });
  }

  function applyTextStyleToAll(clips, sourceClipId) {
    const src = clips.find((c) => c.id === sourceClipId && c.track === 'text');
    if (!src) return cloneClips(clips);
    return clips.map((c) => {
      if (c.track !== 'text') return cloneClip(c);
      return cloneClip({
        ...c,
        preset: src.preset,
        fontSize: src.fontSize,
        color: src.color,
        bgColor: src.bgColor,
        animation: src.animation,
        x: src.x,
        y: src.y,
      });
    });
  }

  function parseSrtTimestamp(str) {
    const m = str.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})$/);
    if (!m) return NaN;
    const h = m[1] ? Number(m[1]) : 0;
    const min = Number(m[2]);
    const sec = Number(m[3]);
    const ms = Number(m[4].padEnd(3, '0'));
    return roundTime(h * 3600 + min * 60 + sec + ms / 1000);
  }

  function parseSrt(raw) {
    if (!raw || typeof raw !== 'string') return [];
    const normalized = raw.replace(/\r\n/g, '\n').replace(/^WEBVTT[^\n]*\n+/i, '').trim();
    const blocks = normalized.split(/\n{2,}/);
    const cues = [];
    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const timeIdx = lines.findIndex((l) => l.includes('-->'));
      if (timeIdx === -1) continue;
      const [startStr, endStrRaw] = lines[timeIdx].split('-->');
      const endStr = (endStrRaw || '').trim().split(/\s+/)[0];
      const start = parseSrtTimestamp(startStr);
      const end = parseSrtTimestamp(endStr);
      const text = lines.slice(timeIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();
      if (Number.isFinite(start) && Number.isFinite(end) && end > start && text) {
        cues.push({ start, duration: roundTime(Math.max(MIN_CLIP_DURATION, end - start)), text });
      }
    }
    return cues;
  }

  function scriptToCaptions(rawText, totalDuration, preset = 'caption') {
    if (!rawText || typeof rawText !== 'string') return [];
    const cues = parseSrt(rawText);
    if (cues.length > 0) {
      return cues.map((cue) => createTextClip(cue.start, {
        text: cue.text,
        duration: cue.duration,
        preset,
      }));
    }
    const lines = rawText
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return [];
    const span = totalDuration > 0 ? totalDuration : lines.length * 2.5;
    const perLine = Math.max(MIN_CLIP_DURATION, span / lines.length);
    return lines.map((line, i) => createTextClip(roundTime(i * perLine), {
      text: line,
      duration: roundTime(Math.max(MIN_CLIP_DURATION, perLine - 0.06)),
      preset,
    }));
  }

  function computeClipOpacity(clip, localTime) {
    const dur = Math.max(0.001, clip.duration);
    let alpha = 1;
    if (clip.fadeIn > 0 && localTime < clip.fadeIn) {
      alpha = Math.min(alpha, clamp(localTime / clip.fadeIn, 0, 1));
    }
    const remaining = dur - localTime;
    if (clip.fadeOut > 0 && remaining < clip.fadeOut) {
      alpha = Math.min(alpha, clamp(remaining / clip.fadeOut, 0, 1));
    }
    return alpha;
  }

  function evalKenBurns(clip, localTime) {
    const mode = clip.kenBurns || 'none';
    if (mode === 'none') return { scale: 1, panX: 0, panY: 0 };
    const p = clamp(localTime / Math.max(0.001, clip.duration), 0, 1);
    if (mode === 'zoom-in') return { scale: 1 + 0.14 * p, panX: 0, panY: 0 };
    if (mode === 'zoom-out') return { scale: 1.14 - 0.14 * p, panX: 0, panY: 0 };
    if (mode === 'pan-left') return { scale: 1.12, panX: 0.05 - 0.10 * p, panY: 0 };
    if (mode === 'pan-right') return { scale: 1.12, panX: -0.05 + 0.10 * p, panY: 0 };
    return { scale: 1, panX: 0, panY: 0 };
  }

  function evalTextAnim(clip, localTime) {
    const dur = Math.max(0.001, clip.duration);
    const inDur = Math.min(clip.fadeIn || 0.25, dur * 0.45);
    const outDur = Math.min(clip.fadeOut || 0.25, dur * 0.45);
    const anim = clip.animation || 'none';

    let alpha = 1;
    let scale = 1;
    let offsetY = 0;

    if (anim === 'none') return { alpha, scale, offsetY };

    const pIn = inDur > 0 ? clamp(localTime / inDur, 0, 1) : 1;
    const pOut = outDur > 0 ? clamp((dur - localTime) / outDur, 0, 1) : 1;
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const easeOutBack = (t) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    alpha = Math.min(pIn, pOut);
    if (anim === 'pop') {
      scale = pIn < 1 ? 0.72 + 0.28 * easeOutBack(pIn) : 1;
      if (pOut < 1) scale *= 0.9 + 0.1 * pOut;
    } else if (anim === 'slide') {
      if (pIn < 1) offsetY = (1 - easeOut(pIn)) * 34;
      else if (pOut < 1) offsetY = -(1 - pOut) * 18;
    }

    return { alpha: clamp(alpha, 0, 1), scale, offsetY };
  }

  function buildCanvasFilter(clip) {
    const parts = [];
    const preset = FILTERS[clip.filter];
    if (preset && preset.css) parts.push(preset.css);
    if (clip.brightness !== undefined && clip.brightness !== 100) {
      parts.push(`brightness(${(clip.brightness / 100).toFixed(2)})`);
    }
    if (clip.contrast !== undefined && clip.contrast !== 100) {
      parts.push(`contrast(${(clip.contrast / 100).toFixed(2)})`);
    }
    if (clip.saturation !== undefined && clip.saturation !== 100) {
      parts.push(`saturate(${(clip.saturation / 100).toFixed(2)})`);
    }
    return parts.length ? parts.join(' ') : 'none';
  }

  function computeDrawRect(srcW, srcH, dstW, dstH, fit = 'cover', zoom = 1, offsetX = 0, offsetY = 0) {
    if (!srcW || !srcH || !dstW || !dstH) {
      return { x: 0, y: 0, w: dstW || 0, h: dstH || 0 };
    }
    const scaleX = dstW / srcW;
    const scaleY = dstH / srcH;
    const baseScale = fit === 'contain' ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
    const finalScale = baseScale * clamp(zoom, 0.25, 4);
    const w = srcW * finalScale;
    const h = srcH * finalScale;
    return {
      x: (dstW - w) / 2 + clamp(offsetX, -1, 1) * dstW,
      y: (dstH - h) / 2 + clamp(offsetY, -1, 1) * dstH,
      w,
      h,
    };
  }

  function formatTimecode(sec, includeTenths = true) {
    const safe = Math.max(0, Number.isFinite(sec) ? sec : 0);
    const mins = Math.floor(safe / 60);
    const rem = safe - mins * 60;
    const wholeSec = Math.floor(rem);
    const mm = String(mins).padStart(2, '0');
    const ss = String(wholeSec).padStart(2, '0');
    if (!includeTenths) return `${mm}:${ss}`;
    const tenths = Math.floor((rem - wholeSec) * 10);
    return `${mm}:${ss}.${tenths}`;
  }

  function chooseRulerStep(pxPerSec) {
    const steps = [0.5, 1, 2, 5, 10, 15, 30, 60];
    for (const step of steps) {
      if (step * pxPerSec >= 68) return step;
    }
    return 60;
  }

  function getCanvasDimensions(aspectKey, quality = '720') {
    const preset = ASPECTS[aspectKey] || ASPECTS['9:16'];
    return quality === '1080'
      ? { width: preset.w1080, height: preset.h1080 }
      : { width: preset.w720, height: preset.h720 };
  }

  function wrapTextLines(text, maxWidth, measureFn) {
    const paragraphs = String(text || '').split('\n');
    const lines = [];
    const pushBrokenToken = (token) => {
      const chars = Array.from(token);
      let chunk = '';
      for (const ch of chars) {
        const next = chunk + ch;
        if (chunk && measureFn(next) > maxWidth) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk = next;
        }
      }
      return chunk;
    };

    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push('');
        continue;
      }
      let current = '';
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (measureFn(test) <= maxWidth) {
          current = test;
        } else {
          if (current) lines.push(current);
          current = measureFn(word) <= maxWidth ? word : pushBrokenToken(word);
        }
      }
      if (current) lines.push(current);
    }
    return lines.length ? lines : [''];
  }

  function detectMediaKind(name, mime) {
    const m = String(mime || '').toLowerCase();
    const lower = String(name || '').toLowerCase();
    if (lower.endsWith('.srt') || lower.endsWith('.vtt')) return 'subtitle';
    if (m.startsWith('video/')) return 'video';
    if (m.startsWith('image/')) return 'image';
    if (m.startsWith('audio/')) return 'audio';
    if (/\.(mp4|m4v|webm|mov|mkv|ogv|avi)$/.test(lower)) return 'video';
    if (/\.(png|jpe?g|webp|gif|avif|bmp|svg)$/.test(lower)) return 'image';
    if (/\.(mp3|wav|m4a|aac|ogg|oga|flac|opus)$/.test(lower)) return 'audio';
    return null;
  }

  return {
    MIN_CLIP_DURATION,
    ASPECTS,
    FILTERS,
    TRANSITIONS,
    KEN_BURNS,
    TEXT_PRESETS,
    makeId,
    clamp,
    roundTime,
    createProject,
    createVideoClip,
    createAudioClip,
    createTextClip,
    createHistory,
    commitHistory,
    undoHistory,
    redoHistory,
    getTrackEnd,
    computeProjectDuration,
    getActiveClipsAt,
    getAdjacentVideoSeams,
    getTransitionStateAt,
    canSplitAt,
    findClipToSplit,
    splitClipAt,
    trimClipLeft,
    trimClipRight,
    setClipSpeed,
    getSnapTargets,
    snapMoveStart,
    resolveVideoTrackOverlap,
    closeGaps,
    rippleDeleteClip,
    applyTextStyleToAll,
    parseSrtTimestamp,
    parseSrt,
    scriptToCaptions,
    computeClipOpacity,
    evalKenBurns,
    evalTextAnim,
    buildCanvasFilter,
    computeDrawRect,
    formatTimecode,
    chooseRulerStep,
    getCanvasDimensions,
    wrapTextLines,
    detectMediaKind,
  };
}));
