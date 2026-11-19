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
  bw: { label: 'B&W', css: 'grayscale(1) contrast(1.18)' },
  vintage: { label: 'Vintage', css: 'sepia(0.36) contrast(0.94) brightness(1.04) saturate(0.84)' },
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
} satisfies Record<string, { label: string }>;

const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const TEXT_PRESETS = {
  cinema: {
    label: 'Cinema',
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    fontWeight: 500,
    color: '#f5f3ed',
    bgColor: 'transparent',
    strokeColor: '',
    strokeWidth: 0,
    uppercase: false,
    radius: 0,
    padX: 8,
    padY: 6,
  },
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
} satisfies Record<string, TextPreset>;

/** Looks up a catalog entry by an untrusted string key (dataset values, restored JSON). */
export function isKeyOf<T extends object>(catalog: T, key: unknown): key is keyof T {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(catalog, key);
}
