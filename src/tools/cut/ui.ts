// Cut — Toast messages and first-use telemetry.
import { el } from './dom.ts';
import { S } from './state.ts';

let toastTimer = 0;

export function showToast(msg: string): void {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.toast.hidden = true;
  }, 2200);
}

export function markActiveTool(): void {
  if (S.telemetryStarted) return;
  S.telemetryStarted = true;
  window.memoToolTelemetry?.begin();
}

export function setSaveStatus(text: string, saved: boolean, title = ''): void {
  el.saveStatus.textContent = text;
  el.saveStatus.classList.toggle('is-saved', saved);
  el.saveStatus.title = title || 'Edits and imported files auto-save locally in IndexedDB';
}

export function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, '');
}
