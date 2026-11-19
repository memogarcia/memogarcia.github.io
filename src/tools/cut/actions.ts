// Cut — Timeline editing commands and zoom.
import * as E from './engine/index.ts';
import type { Clip } from './engine/index.ts';
import { el } from './dom.ts';
import { commitState } from './history.ts';
import { getSelectedClip, project, S } from './state.ts';
import { renderRuler, renderTimelineClips, updatePlayheadUI } from './timeline.ts';
import { showToast } from './ui.ts';

export function splitAtPlayhead(): void {
  const target = E.findClipToSplit(project().clips, project().selectedClipId, S.playhead);
  if (!target) {
    showToast('Move the red playhead inside a clip to split');
    return;
  }
  const res = E.splitClipAt(project().clips, target.id, S.playhead);
  if (!res) return;
  commitState((p) => ({ ...p, clips: res.clips, selectedClipId: res.rightId }));
  showToast('Split clip');
}

export function duplicateSelected(): void {
  const sel = getSelectedClip();
  if (!sel) return;
  const copy: Clip = {
    ...sel,
    ...(sel.transitionIn ? { transitionIn: { type: 'none', duration: 0.45 } } : {}),
    id: E.makeId(sel.track[0]),
    start: E.roundTime(sel.start + sel.duration),
  };
  commitState((p) => {
    const next = p.clips.concat(copy);
    return {
      ...p,
      // preserveOrder: the copy goes right after the original and pushes later clips right.
      clips: copy.track === 'video' ? E.resolveVideoTrackOverlap(next, copy.id, { preserveOrder: true }) : next,
      selectedClipId: copy.id,
    };
  });
  showToast('Duplicated clip');
}

export function deleteSelected(ripple = false): void {
  const sel = getSelectedClip();
  if (!sel) return;
  commitState((p) => ({
    ...p,
    clips: ripple ? E.rippleDeleteClip(p.clips, sel.id) : p.clips.filter((c) => c.id !== sel.id),
    selectedClipId: null,
  }));
  showToast(ripple ? 'Ripple deleted clip' : 'Deleted clip');
}

export function closeVideoGaps(): void {
  if (!project().clips.some((c) => c.track === 'video')) return;
  commitState((p) => ({ ...p, clips: E.closeGaps(p.clips, 'video') }));
  showToast('Closed video gaps');
}

function redrawTimeline(): void {
  renderRuler();
  renderTimelineClips();
  updatePlayheadUI();
}

export function setZoom(next: number): void {
  S.pxPerSec = E.clamp(next, 24, 220);
  redrawTimeline();
}

export function fitTimelineZoom(): void {
  const total = E.computeProjectDuration(project().clips);
  const avail = Math.max(300, (el.timelineScroll.clientWidth || 720) - 48);
  if (total > 0) {
    S.pxPerSec = E.clamp(Math.round(avail / (total + 1.5)), 24, 220);
  }
  redrawTimeline();
}
