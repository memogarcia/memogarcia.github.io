// Cut — Transition popover opened from the diamonds between adjacent video clips.
import * as E from './engine/index.ts';
import type { TransitionType } from './engine/index.ts';
import { closestFrom, el } from './dom.ts';
import { commitState, patchClipLive } from './history.ts';
import { bindSliderWithUndo } from './inspector-events.ts';
import { renderInspector } from './inspector.ts';
import { seekTo } from './playback.ts';
import { findClip, S } from './state.ts';
import { renderTimelineClips } from './timeline.ts';

function setPressed(grid: HTMLElement, type: string): void {
  grid.querySelectorAll<HTMLElement>('.filter-chip').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.trans === type));
  });
}

function chooseTransition(clipId: string, type: TransitionType): void {
  const liveClip = findClip(clipId);
  const dur = Number(el.transPopDur.value) || liveClip?.transitionIn?.duration || 0.45;
  commitState((p) => ({
    ...p,
    clips: p.clips.map((c) => (c.id === clipId ? { ...c, transitionIn: { type, duration: dur } } : c)),
    selectedClipId: clipId,
  }));
  setPressed(el.transPopGrid, type);
  // Seek into the transition so its effect is visible right away.
  if (type !== 'none' && liveClip) seekTo(liveClip.start + Math.min(dur * 0.5, liveClip.duration * 0.4));
}

export function openTransitionPopover(clipId: string, anchorEl: HTMLElement): void {
  const clip = findClip(clipId);
  if (!clip) return;
  S.activeSeamClipId = clipId;

  const tr = clip.transitionIn || { type: 'none', duration: 0.45 };
  el.transPopGrid.replaceChildren();
  for (const [key, def] of Object.entries(E.TRANSITIONS) as [TransitionType, { label: string }][]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-chip';
    btn.dataset.trans = key;
    btn.textContent = def.label;
    btn.setAttribute('aria-pressed', String(key === tr.type));
    btn.addEventListener('click', () => chooseTransition(clipId, key));
    el.transPopGrid.appendChild(btn);
  }

  const dur = tr.duration || 0.45;
  el.transPopDur.value = String(dur);
  el.transPopDurOut.textContent = `${dur.toFixed(2)}s`;

  el.transPopover.hidden = false;
  const rect = anchorEl.getBoundingClientRect();
  const popW = 224;
  const popH = el.transPopover.offsetHeight || 168;
  const left = E.clamp(rect.left + rect.width / 2 - popW / 2, 10, window.innerWidth - popW - 10);
  const top = Math.max(10, rect.top - popH - 12);
  el.transPopover.style.left = `${Math.round(left)}px`;
  el.transPopover.style.top = `${Math.round(top)}px`;
}

export function closeTransitionPopover(): void {
  el.transPopover.hidden = true;
  S.activeSeamClipId = null;
}

export function wireTransitionPopover(): void {
  el.transPopClose.addEventListener('click', closeTransitionPopover);
  bindSliderWithUndo(el.transPopDur, (val) => {
    const clipId = S.activeSeamClipId;
    if (!clipId) return;
    el.transPopDurOut.textContent = `${val.toFixed(2)}s`;
    const updated = patchClipLive(clipId, (c) => {
      const type = c.transitionIn?.type && c.transitionIn.type !== 'none' ? c.transitionIn.type : 'dissolve';
      return { ...c, transitionIn: { type, duration: val } };
    });
    if (!updated?.transitionIn) return;
    setPressed(el.transPopGrid, updated.transitionIn.type);
  }, () => {
    renderTimelineClips();
    renderInspector();
  });

  window.addEventListener('pointerdown', (ev) => {
    if (el.transPopover.hidden) return;
    if (ev.target instanceof Node && el.transPopover.contains(ev.target)) return;
    if (closestFrom(ev.target, '.seam-btn')) return;
    closeTransitionPopover();
  });
}
