// Cut — Caption helpers: SRT/VTT parsing, script-to-captions, style copy, text wrapping, file sniffing.
import { cloneClip, cloneClips, createTextClip, MIN_CLIP_DURATION, roundTime } from './core.ts';
import type { Clip, DetectedKind, TextPresetKey } from './types.ts';

export interface Cue {
  start: number;
  duration: number;
  text: string;
}

export function applyTextStyleToAll(clips: readonly Clip[], sourceClipId: string): Clip[] {
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

export function parseSrtTimestamp(str: string): number {
  const m = str.trim().match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})[,.](\d{1,3})$/);
  if (!m) return NaN;
  const h = m[1] ? Number(m[1]) : 0;
  const min = Number(m[2]);
  const sec = Number(m[3]);
  const ms = Number(m[4].padEnd(3, '0'));
  return roundTime(h * 3600 + min * 60 + sec + ms / 1000);
}

export function parseSrt(raw: unknown): Cue[] {
  if (!raw || typeof raw !== 'string') return [];
  const normalized = raw.replace(/\r\n/g, '\n').replace(/^WEBVTT[^\n]*\n+/i, '').trim();
  const cues: Cue[] = [];
  for (const block of normalized.split(/\n{2,}/)) {
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

/** SRT/VTT text keeps its timing; plain lines are spread evenly across `totalDuration`. */
export function scriptToCaptions(rawText: unknown, totalDuration: number, preset: TextPresetKey = 'caption'): Clip[] {
  if (!rawText || typeof rawText !== 'string') return [];
  const cues = parseSrt(rawText);
  if (cues.length > 0) {
    return cues.map((cue) => createTextClip(cue.start, { text: cue.text, duration: cue.duration, preset }));
  }
  const lines = rawText.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const span = totalDuration > 0 ? totalDuration : lines.length * 2.5;
  const perLine = Math.max(MIN_CLIP_DURATION, span / lines.length);
  return lines.map((line, i) => createTextClip(roundTime(i * perLine), {
    text: line,
    duration: roundTime(Math.max(MIN_CLIP_DURATION, perLine - 0.06)),
    preset,
  }));
}

/** Word-wraps text; tokens wider than a line (CJK runs, URLs) are broken per character. */
export function wrapTextLines(text: string, maxWidth: number, measureFn: (s: string) => number): string[] {
  const lines: string[] = [];
  const pushBrokenToken = (token: string): string => {
    let chunk = '';
    for (const ch of Array.from(token)) {
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

  for (const para of String(text || '').split('\n')) {
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

export function detectMediaKind(name: string, mime: string): DetectedKind | null {
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
