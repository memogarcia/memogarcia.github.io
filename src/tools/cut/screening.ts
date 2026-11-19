// Use the actual editor canvas in a native modal: one renderer, with focus contained by the browser.
import { computeProjectDuration, formatTimecode } from './engine/index.ts';
import { REEL_ID } from './demo-sequence.ts';
import { el } from './dom.ts';
import { pausePlayback, renderPreview, seekTo, sizePreviewCanvas } from './playback.ts';
import { project, S } from './state.ts';

const dialog = document.querySelector<HTMLDialogElement>('#screening-dialog')!;
const stage = document.querySelector<HTMLElement>('.stage-panel')!;
const openButton = document.querySelector<HTMLButtonElement>('#cinema-btn')!;
const closeButton = document.querySelector<HTMLButtonElement>('#screening-close')!;
const scrub = document.querySelector<HTMLInputElement>('#screening-scrub')!;
let placeholder: Comment | null = null;
let returnFocus: HTMLElement | null = null;

export const isScreening = (): boolean => dialog.open;

export function updateScreening(): void {
  const duration = computeProjectDuration(project().clips);
  openButton.disabled = duration <= 0 || S.exporting;
  if (!dialog.open) return;
  scrub.max = String(duration);
  scrub.value = String(Math.min(duration, S.playhead));
  scrub.setAttribute('aria-valuetext', `${formatTimecode(S.playhead)} of ${formatTimecode(duration)}`);
  scrub.style.setProperty('--progress', `${duration ? Math.min(100, S.playhead / duration * 100) : 0}%`);
}

export function openScreening(): void {
  if (dialog.open || S.exporting || !project().clips.length) return;
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
  placeholder = document.createComment('editor preview');
  stage.before(placeholder);
  dialog.append(stage);
  const demo = project().clips.some((clip) => clip.mediaId?.startsWith(REEL_ID));
  document.querySelector('#screening-title')!.textContent = demo ? 'Last Train / A photo film' : 'Preview';
  dialog.showModal();
  document.body.classList.add('is-screening');
  // A screening cannot drag a selected title or reframe an image accidentally.
  el.previewCanvas.style.pointerEvents = 'none';
  sizePreviewCanvas();
  renderPreview();
  el.playBtn.focus({ preventScroll: true });
}

export function closeScreening(): void {
  if (!dialog.open) return;
  pausePlayback();
  dialog.close();
  restoreStage();
}

function restoreStage(): void {
  if (!placeholder) return;
  placeholder.replaceWith(stage);
  placeholder = null;
  document.body.classList.remove('is-screening');
  el.previewCanvas.style.removeProperty('pointer-events');
  sizePreviewCanvas();
  renderPreview();
  // Demo controls can be hidden after loading; always provide a visible return point.
  const target = returnFocus && returnFocus.tabIndex >= 0 && returnFocus.getClientRects().length ? returnFocus : openButton;
  target?.focus({ preventScroll: true });
}

export function wireScreening(): void {
  openButton.addEventListener('click', openScreening);
  closeButton.addEventListener('click', closeScreening);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeScreening(); });
  dialog.addEventListener('close', () => { if (!dialog.open) restoreStage(); });
  scrub.addEventListener('input', () => seekTo(Number(scrub.value)));
}
