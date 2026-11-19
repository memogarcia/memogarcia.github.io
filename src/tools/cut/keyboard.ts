// Cut — Global keyboard shortcuts.
import * as E from './engine/index.ts';
import { deleteSelected, duplicateSelected, setZoom, splitAtPlayhead } from './actions.ts';
import { el } from './dom.ts';
import { closeExportModal } from './export.ts';
import { redo, undo } from './history.ts';
import { addTextAtPlayhead } from './ingest.ts';
import { seekTo, togglePlayback } from './playback.ts';
import { closeTransitionPopover } from './popover.ts';
import { project, S } from './state.ts';

function isTyping(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function onEscape(): void {
  closeTransitionPopover();
  if (!el.shortcutsModal.hidden) el.shortcutsModal.hidden = true;
  if (!el.exportModal.hidden) closeExportModal(true);
}

/** Single-key editor shortcuts. Returns false when the key is not one of ours. */
function runShortcut(ev: KeyboardEvent): boolean {
  const key = ev.key.toLowerCase();
  if (ev.code === 'Space') togglePlayback();
  else if (key === 's') splitAtPlayhead();
  else if (key === 't') addTextAtPlayhead('caption');
  else if (key === 'd') duplicateSelected();
  else if (ev.key === 'Backspace' || ev.key === 'Delete') deleteSelected(ev.shiftKey);
  else if (ev.key === 'ArrowLeft') seekTo(Math.max(0, S.playhead - (ev.shiftKey ? 1 : 0.1)));
  else if (ev.key === 'ArrowRight') seekTo(S.playhead + (ev.shiftKey ? 1 : 0.1));
  else if (ev.key === 'Home' || ev.key === '0') seekTo(0);
  else if (ev.key === 'End') seekTo(E.computeProjectDuration(project().clips));
  else if (ev.key === '+' || ev.key === '=') setZoom(S.pxPerSec + 20);
  else if (ev.key === '-') setZoom(S.pxPerSec - 20);
  else if (ev.key === '?') el.shortcutsModal.hidden = !el.shortcutsModal.hidden;
  else return false;
  return true;
}

export function wireKeyboard(): void {
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      onEscape();
      return;
    }

    // Nothing reaches the editor behind an open dialog or while an export is recording.
    if (S.exporting || !el.exportModal.hidden) return;
    if (!el.shortcutsModal.hidden) {
      if (ev.key === '?') el.shortcutsModal.hidden = true;
      return;
    }

    const typing = isTyping();
    const mod = ev.metaKey || ev.ctrlKey;
    const key = ev.key.toLowerCase();
    if (mod && !ev.altKey && (key === 'z' || key === 'y')) {
      if (typing) return;
      ev.preventDefault();
      if (key === 'y' || ev.shiftKey) redo();
      else undo();
      return;
    }

    // Leave every other modified key to the browser (Cmd/Ctrl +/-/0 zoom, Ctrl+S, Ctrl+D, …).
    if (typing || mod || ev.altKey) return;
    if (runShortcut(ev)) ev.preventDefault();
  });
}
