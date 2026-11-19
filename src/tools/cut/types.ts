// Cut — App-side types (DOM, media, audio graph) that the pure engine does not know about.
import type { MediaKind, Project } from './engine/index.ts';

export type SceneId = 'tokyo-rain' | 'golden-hour' | 'kinetic-grid';

/** An imported or generated source. `blob` is what gets persisted; `url`/`img`/`audioBuffer` are runtime-only. */
export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  duration: number;
  width?: number;
  height?: number;
  thumbs?: string[];
  peaks?: number[] | null;
  sceneId?: SceneId | null;
  isDemoAudio?: boolean;
  blob?: Blob | null;
  url?: string;
  img?: HTMLImageElement;
  audioBuffer?: AudioBuffer | null;
  /** True when the file is too large to decode into memory; audio plays through the media element. */
  streamedAudio?: boolean;
}

/** The serializable subset of MediaItem written to IndexedDB. */
export interface MediaRecord {
  id: string;
  kind: MediaKind;
  name: string;
  duration: number;
  width: number;
  height: number;
  thumbs: string[];
  peaks: number[] | null;
  sceneId: SceneId | null;
  isDemoAudio: boolean;
  streamedAudio: boolean;
  blob: Blob | null;
}

export interface TrackMuted {
  text: boolean;
  video: boolean;
  audio: boolean;
}

export interface SavedState extends Project {
  playhead: number;
  savedAt: number;
  trackMuted?: TrackMuted;
}

/**
 * A pooled media element. Slots belong to a media file, not a clip, so splitting a clip twenty
 * times does not create twenty decoders. A slot is lent to whichever clip needs it right now.
 */
export interface MediaSlot {
  el: HTMLVideoElement | HTMLAudioElement;
  mediaId: string;
  clipId: string | null;
  sourceNode: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  /** Last decoded frame, drawn while the element is seeking so playback never flashes the background. */
  lastFrame: HTMLCanvasElement | null;
  lastUsed: number;
}

export interface ScheduledAudio {
  source: AudioBufferSourceNode;
  fadeGain: GainNode;
  volGain: GainNode;
  clipId: string;
}

export interface TextBox {
  clipId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CanvasDragBase {
  clipId: string;
  snapX: boolean;
  snapY: boolean;
  moved: boolean;
  beforeSnapshot: Project;
}

export interface TextDrag extends CanvasDragBase {
  mode: 'text';
  offsetX: number;
  offsetY: number;
}

export interface VideoDrag extends CanvasDragBase {
  mode: 'video';
  startPtX: number;
  startPtY: number;
  origOffX: number;
  origOffY: number;
}

export type CanvasDrag = TextDrag | VideoDrag;

export interface ExportFormat {
  mime: string;
  ext: 'mp4' | 'webm';
  label: string;
}

export interface StateChangeOpts {
  resize?: boolean;
  media?: boolean;
  forceRuler?: boolean;
}
