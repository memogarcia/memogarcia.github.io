// Cut — Static catalogs: canvas aspects, color filters, transitions, photo motion, and caption styles.

export interface AspectPreset {
  label: string;
  hint: string;
  w720: number;
  h720: number;
  w1080: number;
  h1080: number;
}

export interface TextPreset {
  label: string;
  fontFamily: string;
  fontWeight: number;
  color: string;
  bgColor: string;
  strokeColor: string;
  strokeWidth: number;
  uppercase: boolean;
  radius: number;
  padX: number;
  padY: number;
}

export const ASPECTS = {
  '9:16': { label: '9:16', hint: 'Reels / Shorts', w720: 720, h720: 1280, w1080: 1080, h1080: 1920 },
  '16:9': { label: '16:9', hint: 'YouTube / Wide', w720: 1280, h720: 720, w1080: 1920, h1080: 1080 },
  '1:1': { label: '1:1', hint: 'Square', w720: 720, h720: 720, w1080: 1080, h1080: 1080 },
  '4:5': { label: '4:5', hint: 'Portrait Feed', w720: 720, h720: 900, w1080: 1080, h1080: 1350 },
} satisfies Record<string, AspectPreset>;

export const FILTERS = {
  none: { label: 'Original', css: '' },
  cinematic: { label: 'Cinematic', css: 'contrast(1.14) saturate(0.88) sepia(0.12)' },
  warm: { label: 'Warm', css: 'sepia(0.24) saturate(1.18) brightness(1.03)' },
  cool: { label: 'Cool', css: 'hue-rotate(-10deg) saturate(0.95) contrast(1.06) brightness(1.02)' },
  bw: { label: 'B&W', css: 'grayscale(1) contrast(1.18)' },
  vintage: { label: 'Vintage', css: 'sepia(0.36) contrast(0.94) brightness(1.04) saturate(0.84)' },
  vivid: { label: 'Vivid', css: 'saturate(1.38) contrast(1.08)' },
} satisfies Record<string, { label: string; css: string }>;

export const TRANSITIONS = {
  none: { label: 'Cut' },
  dissolve: { label: 'Dissolve' },
  'slide-left': { label: 'Slide Left' },
  'slide-up': { label: 'Slide Up' },
  zoom: { label: 'Zoom' },
} satisfies Record<string, { label: string }>;

export const KEN_BURNS = {
  none: { label: 'Still' },
  'zoom-in': { label: 'Zoom In' },
  'zoom-out': { label: 'Zoom Out' },
  'pan-left': { label: 'Pan Left' },
  'pan-right': { label: 'Pan Right' },
} satisfies Record<string, { label: string }>;

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const TEXT_PRESETS = {
  caption: {
    label: 'Caption',
    fontFamily: SANS,
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
    fontFamily: SANS,
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
    fontFamily: SANS,
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
} satisfies Record<string, TextPreset>;

/** Looks up a catalog entry by an untrusted string key (dataset values, restored JSON). */
export function isKeyOf<T extends object>(catalog: T, key: unknown): key is keyof T {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(catalog, key);
}
