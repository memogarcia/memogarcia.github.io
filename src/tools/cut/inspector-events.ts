// Cut — Inspector control wiring. Sliders update live and commit one undo step when the gesture ends.
import * as E from './engine/index.ts';
import type { Clip, Fit, Project, TextAnimation, Track } from './engine/index.ts';
import { scheduleAllAudioFrom, updateLiveClipAudioGain } from './audio.ts';
import { closestFrom, el } from './dom.ts';
import {
  clipBlock, commitFromSnapshot, commitState, patchClipLive, snapshotForUndo,
} from './history.ts';
import { detachVideoAudio } from './ingest.ts';
import { TEXT_Y_POSITIONS } from './inspector.ts';
import { scheduleAutosave } from './persist.ts';
import { getSelectedClip, S } from './state.ts';
import { renderTimelineClips } from './timeline.ts';
import { showToast } from './ui.ts';

export function bindSliderWithUndo(
  input: HTMLInputElement,
  onLive: (val: number) => void,
  onCommit?: (val: number) => void,
): void {
  let before: Project | null = null;
  const finish = () => {
    if (!before) return;
    const snap = before;
    before = null;
    onCommit?.(Number(input.value));
    commitFromSnapshot(snap);
  };
  input.addEventListener('input', () => {
    if (!before) before = snapshotForUndo();
    onLive(Number(input.value));
  });
  input.addEventListener('change', finish);
  input.addEventListener('blur', finish);
}

function selectedOn(track: Track): Clip | null {
  const sel = getSelectedClip();
  return sel && sel.track === track ? sel : null;
}

/** Commits a change to the selected clip on `track` as one undo step. */
function commitSelected(track: Track, change: (c: Clip) => Partial<Clip>, opts?: { resolveOverlap?: boolean }): void {
  const sel = selectedOn(track);
  if (!sel) return;
  commitState((p) => {
    const clips = p.clips.map((c) => (c.id === sel.id ? { ...c, ...change(c) } : c));
    return { ...p, clips: opts?.resolveOverlap ? E.resolveVideoTrackOverlap(clips, sel.id, { preserveOrder: true }) : clips };
  });
}

function liveSlider(track: Track | null, input: HTMLInputElement, output: HTMLOutputElement,
  label: (v: number) => string, change: (v: number, c: Clip) => Partial<Clip>, onCommit?: () => void): void {
  bindSliderWithUndo(input, (val) => {
    const sel = track ? selectedOn(track) : getSelectedClip();
    if (!sel) return;
    output.textContent = label(val);
    patchClipLive(sel.id, (c) => ({ ...c, ...change(val, c) }));
  }, onCommit);
}

const rescheduleIfPlaying = () => {
  if (S.playing) scheduleAllAudioFrom(S.playhead);
};

function wireVolume(track: 'video' | 'audio', vol: HTMLInputElement, out: HTMLOutputElement, mute: HTMLButtonElement): void {
  bindSliderWithUndo(vol, (val) => {
    const sel = selectedOn(track);
    if (!sel) return;
    const isMuted = val === 0;
    out.textContent = `${Math.round(val)}%`;
    mute.setAttribute('aria-pressed', String(isMuted));
    mute.textContent = isMuted ? 'Muted' : 'Mute';
    patchClipLive(sel.id, (c) => ({ ...c, volume: val / 100, muted: isMuted }));
    updateLiveClipAudioGain(sel.id, val / 100, isMuted);
  }, () => renderTimelineClips());
  mute.addEventListener('click', () => commitSelected(track, (c) => ({ muted: !c.muted })));
}

function wireVideoInspector(): void {
  el.vSpeedPresets.addEventListener('click', (ev) => {
    const speed = Number(closestFrom(ev.target, '.pill-btn')?.dataset.speed);
    if (speed) commitSelected('video', (c) => E.setClipSpeed(c, speed), { resolveOverlap: true });
  });
  wireVolume('video', el.vVol, el.vVolOut, el.vMuteBtn);
  el.vExtractAudioBtn.addEventListener('click', () => {
    const sel = getSelectedClip();
    if (sel) detachVideoAudio(sel.id);
  });

  el.vFrameReset.addEventListener('click', () => {
    commitSelected('video', () => ({ fit: 'cover', zoom: 1, offsetX: 0, offsetY: 0, rotate: 0, flipH: false }));
    showToast('Reset framing');
  });
  for (const btn of [el.vFitCover, el.vFitContain]) {
    btn.addEventListener('click', () => commitSelected('video', () => ({ fit: btn.dataset.fit as Fit })));
  }
  el.vRotateBtn.addEventListener('click', () => commitSelected('video', (c) => ({ rotate: ((c.rotate || 0) + 90) % 360 })));
  liveSlider('video', el.vZoom, el.vZoomOut, (v) => `${Math.round(v)}%`, (v) => ({ zoom: v / 100 }));

  liveSlider(null, el.vBright, el.vBrightOut, (v) => `${v}%`, (v) => ({ brightness: v }));
  liveSlider(null, el.vContrast, el.vContrastOut, (v) => `${v}%`, (v) => ({ contrast: v }));
  liveSlider(null, el.vSat, el.vSatOut, (v) => `${v}%`, (v) => ({ saturation: v }));
  el.vColorReset.addEventListener('click', () => {
    commitSelected('video', () => ({ filter: 'none', brightness: 100, contrast: 100, saturation: 100 }));
  });

  liveSlider(null, el.vFadeIn, el.vFadeInOut, (v) => `${v.toFixed(1)}s`, (v) => ({ fadeIn: v }), rescheduleIfPlaying);
  liveSlider(null, el.vFadeOut, el.vFadeOutOut, (v) => `${v.toFixed(1)}s`, (v) => ({ fadeOut: v }), rescheduleIfPlaying);
}

function wireTextInspector(): void {
  el.tContent.addEventListener('focus', () => {
    S.textBefore = snapshotForUndo();
    S.textDirty = false;
  });
  el.tContent.addEventListener('input', () => {
    const sel = selectedOn('text');
    if (!sel) return;
    if (!S.textBefore) S.textBefore = snapshotForUndo();
    S.textDirty = true;
    const val = el.tContent.value;
    patchClipLive(sel.id, (c) => ({ ...c, text: val }));
    const labelEl = clipBlock(sel.id)?.querySelector('.clip-name');
    if (labelEl) labelEl.textContent = val || 'Text';
    scheduleAutosave();
  });
  el.tContent.addEventListener('blur', () => {
    if (S.textDirty && S.textBefore) commitFromSnapshot(S.textBefore);
    S.textBefore = null;
    S.textDirty = false;
  });

  el.tAnimRow.addEventListener('click', (ev) => {
    const anim = closestFrom(ev.target, '.pill-btn')?.dataset.anim as TextAnimation | undefined;
    if (anim) commitSelected('text', () => ({ animation: anim }));
  });
  liveSlider('text', el.tSize, el.tSizeOut, (v) => `${v}px`, (v) => ({ fontSize: v }));
  el.tPosRow.addEventListener('click', (ev) => {
    const pos = closestFrom(ev.target, '.pill-btn')?.dataset.pos;
    if (pos) commitSelected('text', () => ({ x: 0.5, y: TEXT_Y_POSITIONS[pos] ?? 0.78 }));
  });

  el.tApplyAllBtn.addEventListener('click', () => {
    const sel = selectedOn('text');
    if (!sel) return;
    commitState((p) => ({ ...p, clips: E.applyTextStyleToAll(p.clips, sel.id) }));
    showToast('Applied style to all text');
  });
}

function wireAudioInspector(): void {
  wireVolume('audio', el.aVol, el.aVolOut, el.aMuteBtn);
  liveSlider('audio', el.aFadeIn, el.aFadeInOut, (v) => `${v.toFixed(1)}s`, (v) => ({ fadeIn: v }), rescheduleIfPlaying);
  liveSlider('audio', el.aFadeOut, el.aFadeOutOut, (v) => `${v.toFixed(1)}s`, (v) => ({ fadeOut: v }), rescheduleIfPlaying);
}

export function wireInspectorControls(): void {
  wireVideoInspector();
  wireTextInspector();
  wireAudioInspector();
}
