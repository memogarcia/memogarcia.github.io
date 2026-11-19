// Cut — Typed references to every element the editor drives. Fails loudly if the markup drifts.

export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Cut: missing element #${id}`);
  return node as T;
}

const div = (id: string) => byId<HTMLDivElement>(id);
const span = (id: string) => byId<HTMLSpanElement>(id);
const btn = (id: string) => byId<HTMLButtonElement>(id);
const input = (id: string) => byId<HTMLInputElement>(id);
const out = (id: string) => byId<HTMLOutputElement>(id);
const canvas = (id: string) => byId<HTMLCanvasElement>(id);
const textarea = (id: string) => byId<HTMLTextAreaElement>(id);

export const el = {
  dropOverlay: div('drop-overlay'),
  saveStatus: span('save-status'),
  aspectGroup: div('aspect-group'),
  undoBtn: btn('undo-btn'),
  redoBtn: btn('redo-btn'),
  newProjectBtn: btn('new-project-btn'),
  shortcutsBtn: btn('shortcuts-btn'),
  exportOpenBtn: btn('export-open-btn'),
  demoBtn: btn('demo-btn'),
  importBtn: btn('import-btn'),
  fileInput: input('file-input'),
  quickTextBtn: btn('quick-text-btn'),
  mediaList: div('media-list'),

  // Left drawer tabs & captions
  tabMedia: div('tab-media'),
  tabCaptions: div('tab-captions'),
  captionCards: div('caption-cards'),
  srtFileBtn: btn('srt-file-btn'),
  srtFileInput: input('srt-file-input'),
  bulkCaptions: textarea('bulk-captions'),
  bulkReplace: input('bulk-replace'),
  bulkCaptionsBtn: btn('bulk-captions-btn'),

  // Stage & transport
  stageViewport: div('stage-viewport'),
  canvasFrame: div('canvas-frame'),
  previewCanvas: canvas('preview-canvas'),
  stageEmpty: div('stage-empty'),
  emptyImportBtn: btn('empty-import-btn'),
  emptyDemoBtn: btn('empty-demo-btn'),
  timeCurrent: span('time-current'),
  timeTotal: span('time-total'),
  jumpStartBtn: btn('jump-start-btn'),
  stepBackBtn: btn('step-back-btn'),
  playBtn: btn('play-btn'),
  stepFwdBtn: btn('step-fwd-btn'),
  jumpEndBtn: btn('jump-end-btn'),
  masterMuteBtn: btn('master-mute-btn'),

  // Inspector
  inspectorTitle: span('inspector-title'),
  inspectorMeta: span('inspector-meta'),
  inspProject: div('insp-project'),
  inspVideo: div('insp-video'),
  inspText: div('insp-text'),
  inspAudio: div('insp-audio'),
  bgSwatches: div('bg-swatches'),
  bgColorInput: input('bg-color-input'),

  vSpeedGroup: div('v-speed-group'),
  vSpeedPresets: div('v-speed-presets'),
  vSpeed: input('v-speed'),
  vSpeedOut: out('v-speed-out'),
  vAudioGroup: div('v-audio-group'),
  vVol: input('v-vol'),
  vVolOut: out('v-vol-out'),
  vMuteBtn: btn('v-mute-btn'),
  vExtractAudioBtn: btn('v-extract-audio-btn'),
  vFrameReset: btn('v-frame-reset'),
  vFitCover: btn('v-fit-cover'),
  vFitContain: btn('v-fit-contain'),
  vRotateBtn: btn('v-rotate-btn'),
  vFlipBtn: btn('v-flip-btn'),
  vBlurRow: byId<HTMLLabelElement>('v-blur-row'),
  vBlurBg: input('v-blur-bg'),
  vZoom: input('v-zoom'),
  vZoomOut: out('v-zoom-out'),
  vMotionGroup: div('v-motion-group'),
  vKenBurnsGrid: div('v-kenburns-grid'),
  vColorReset: btn('v-color-reset'),
  vFilterGrid: div('v-filter-grid'),
  vBright: input('v-bright'),
  vBrightOut: out('v-bright-out'),
  vContrast: input('v-contrast'),
  vContrastOut: out('v-contrast-out'),
  vSat: input('v-sat'),
  vSatOut: out('v-sat-out'),
  vTransGrid: div('v-trans-grid'),
  vTransDurWrap: div('v-trans-dur-wrap'),
  vTransDur: input('v-trans-dur'),
  vTransDurOut: out('v-trans-dur-out'),
  vFadeIn: input('v-fadein'),
  vFadeInOut: out('v-fadein-out'),
  vFadeOut: input('v-fadeout'),
  vFadeOutOut: out('v-fadeout-out'),

  tContent: textarea('t-content'),
  tPresetGrid: div('t-preset-grid'),
  tAnimRow: div('t-anim-row'),
  tSize: input('t-size'),
  tSizeOut: out('t-size-out'),
  tPosRow: div('t-pos-row'),
  tColorReset: btn('t-color-reset'),
  tColor: input('t-color'),
  tBg: input('t-bg'),
  tApplyAllBtn: btn('t-apply-all-btn'),

  aVol: input('a-vol'),
  aVolOut: out('a-vol-out'),
  aMuteBtn: btn('a-mute-btn'),
  aFadeIn: input('a-fadein'),
  aFadeInOut: out('a-fadein-out'),
  aFadeOut: input('a-fadeout'),
  aFadeOutOut: out('a-fadeout-out'),

  // Timeline
  splitBtn: btn('split-btn'),
  dupBtn: btn('dup-btn'),
  delBtn: btn('del-btn'),
  tlTextBtn: btn('tl-text-btn'),
  closeGapsBtn: btn('close-gaps-btn'),
  snapBtn: btn('snap-btn'),
  zoomOutBtn: btn('zoom-out-btn'),
  zoomSlider: input('zoom-slider'),
  zoomInBtn: btn('zoom-in-btn'),
  zoomFitBtn: btn('zoom-fit-btn'),
  timelineScroll: div('timeline-scroll'),
  timelineContent: div('timeline-content'),
  rulerRow: div('ruler-row'),
  rulerCanvas: canvas('ruler-canvas'),
  laneText: div('lane-text'),
  laneVideo: div('lane-video'),
  laneAudio: div('lane-audio'),
  snapLine: div('snap-line'),
  playhead: div('playhead'),

  // Transition popover & drag tip
  transPopover: div('trans-popover'),
  transPopClose: btn('trans-pop-close'),
  transPopGrid: div('trans-pop-grid'),
  transPopDur: input('trans-pop-dur'),
  transPopDurOut: out('trans-pop-dur-out'),
  dragTip: div('drag-tip'),

  // Modals & toast
  exportModal: div('export-modal'),
  exportOptions: div('export-options'),
  exportDims: byId('export-dims'),
  exportDur: byId('export-dur'),
  exportFmt: byId('export-fmt'),
  exportProgressBox: div('export-progress-box'),
  exportPreviewCanvas: canvas('export-preview-canvas'),
  exportBar: div('export-bar'),
  exportStatus: span('export-status'),
  exportPct: span('export-pct'),
  exportDoneBox: div('export-done-box'),
  exportDownloadLink: byId<HTMLAnchorElement>('export-download-link'),
  exportCancelBtn: btn('export-cancel-btn'),
  exportStartBtn: btn('export-start-btn'),
  shortcutsModal: div('shortcuts-modal'),
  toast: div('toast'),
};

/** `closest()` from an event target, typed. Returns null for non-element targets. */
export function closestFrom<T extends HTMLElement = HTMLElement>(target: EventTarget | null, selector: string): T | null {
  return target instanceof Element ? (target.closest(selector) as T | null) : null;
}

export function context2d(canvasEl: HTMLCanvasElement, opts?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D {
  const ctx = canvasEl.getContext('2d', opts);
  if (!ctx) throw new Error('Cut: 2D canvas is not available');
  return ctx;
}

export function makeCanvas(w = 0, h = 0): HTMLCanvasElement {
  const c = document.createElement('canvas');
  if (w) c.width = w;
  if (h) c.height = h;
  return c;
}

export function isDialogOpen(): boolean {
  return !el.exportModal.hidden || !el.shortcutsModal.hidden;
}
