// Cut — Context-sensitive inspector: canvas settings, or the selected video, caption, or audio clip.
import * as E from './engine/index.ts';
import type { Clip, FilterKey, KenBurnsKey, Project, TextPresetKey, TransitionType } from './engine/index.ts';
import { el } from './dom.ts';
import { commitState } from './history.ts';
import { getSelectedClip, mediaMap, project } from './state.ts';

export const TEXT_Y_POSITIONS: Record<string, number> = { top: 0.18, center: 0.5, bottom: 0.8 };

function chipGrid<K extends string>(
  grid: HTMLElement,
  catalog: Record<K, { label: string }>,
  dataKey: string,
  track: Clip['track'],
  patch: (key: K) => Partial<Clip> | ((c: Clip) => Partial<Clip>),
): void {
  grid.replaceChildren();
  for (const key of Object.keys(catalog) as K[]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-chip';
    btn.dataset[dataKey] = key;
    btn.textContent = catalog[key].label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== track) return;
      const change = patch(key);
      commitState((p: Project) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, ...(typeof change === 'function' ? change(c) : change) } : c)),
      }));
    });
    grid.appendChild(btn);
  }
}

export function buildInspectorGrids(): void {
  chipGrid<FilterKey>(el.vFilterGrid, E.FILTERS, 'filter', 'video', (filter) => ({ filter }));
  chipGrid<TransitionType>(el.vTransGrid, E.TRANSITIONS, 'trans', 'video', (type) => (c) => ({
    transitionIn: { type, duration: c.transitionIn?.duration || 0.45 },
  }));
  chipGrid<KenBurnsKey>(el.vKenBurnsGrid, E.KEN_BURNS, 'kb', 'video', (kenBurns) => ({ kenBurns }));
  chipGrid<TextPresetKey>(el.tPresetGrid, E.TEXT_PRESETS, 'preset', 'text', (preset) => ({ preset, color: '', bgColor: '' }));
}

export function toHexColor(val: unknown, fallback: string): string {
  return typeof val === 'string' && /^#[0-9a-f]{6}$/i.test(val) ? val : fallback;
}

function pressAll(container: HTMLElement, selector: string, isOn: (btn: HTMLElement) => boolean): void {
  for (const btn of container.querySelectorAll<HTMLElement>(selector)) {
    btn.setAttribute('aria-pressed', String(isOn(btn)));
  }
}

function setSlider(input: HTMLInputElement, output: HTMLOutputElement, value: number, label: string): void {
  input.value = String(value);
  output.textContent = label;
}

function setMuteButton(btn: HTMLButtonElement, muted: boolean): void {
  btn.setAttribute('aria-pressed', String(muted));
  btn.textContent = muted ? 'Muted' : 'Mute';
}

function renderVideoInspector(sel: Clip): void {
  el.inspectorTitle.textContent = sel.kind === 'image' ? 'Photo' : 'Video Clip';
  el.inspectorMeta.textContent = E.formatTimecode(sel.duration);

  const isImage = sel.kind === 'image';
  const media = sel.mediaId ? mediaMap.get(sel.mediaId) : undefined;
  el.vSpeedGroup.hidden = isImage;
  el.vAudioGroup.hidden = isImage || sel.kind === 'procedural';
  el.vExtractAudioBtn.hidden = !(media && (media.audioBuffer || media.streamedAudio));
  el.vMotionGroup.hidden = !isImage;

  const spd = sel.speed || 1;
  setSlider(el.vSpeed, el.vSpeedOut, spd, `${spd.toFixed(2)}×`);
  pressAll(el.vSpeedPresets, '.pill-btn', (b) => Math.abs(Number(b.dataset.speed) - spd) < 0.01);

  const volPct = Math.round((sel.volume ?? 1) * 100);
  setSlider(el.vVol, el.vVolOut, volPct, `${volPct}%`);
  setMuteButton(el.vMuteBtn, Boolean(sel.muted));

  el.vFitCover.setAttribute('aria-pressed', String((sel.fit || 'cover') === 'cover'));
  el.vFitContain.setAttribute('aria-pressed', String(sel.fit === 'contain'));
  el.vFlipBtn.setAttribute('aria-pressed', String(Boolean(sel.flipH)));
  el.vBlurRow.hidden = sel.fit !== 'contain';
  el.vBlurBg.checked = sel.blurBg !== false;

  const zoomPct = Math.round((sel.zoom || 1) * 100);
  setSlider(el.vZoom, el.vZoomOut, zoomPct, `${zoomPct}%`);

  pressAll(el.vKenBurnsGrid, '.filter-chip', (b) => b.dataset.kb === (sel.kenBurns || 'none'));
  pressAll(el.vFilterGrid, '.filter-chip', (b) => b.dataset.filter === (sel.filter || 'none'));
  setSlider(el.vBright, el.vBrightOut, sel.brightness ?? 100, `${sel.brightness ?? 100}%`);
  setSlider(el.vContrast, el.vContrastOut, sel.contrast ?? 100, `${sel.contrast ?? 100}%`);
  setSlider(el.vSat, el.vSatOut, sel.saturation ?? 100, `${sel.saturation ?? 100}%`);

  const tr = sel.transitionIn || { type: 'none', duration: 0.45 };
  pressAll(el.vTransGrid, '.filter-chip', (b) => b.dataset.trans === tr.type);
  el.vTransDurWrap.hidden = tr.type === 'none';
  setSlider(el.vTransDur, el.vTransDurOut, tr.duration || 0.45, `${(tr.duration || 0.45).toFixed(2)}s`);

  setSlider(el.vFadeIn, el.vFadeInOut, sel.fadeIn || 0, `${(sel.fadeIn || 0).toFixed(1)}s`);
  setSlider(el.vFadeOut, el.vFadeOutOut, sel.fadeOut || 0, `${(sel.fadeOut || 0).toFixed(1)}s`);
}

function renderTextInspector(p: Project, sel: Clip): void {
  el.inspectorTitle.textContent = 'Caption';
  el.inspectorMeta.textContent = E.formatTimecode(sel.duration);
  if (document.activeElement !== el.tContent) el.tContent.value = sel.text || '';
  pressAll(el.tPresetGrid, '.filter-chip', (b) => b.dataset.preset === (sel.preset || 'caption'));
  pressAll(el.tAnimRow, '.pill-btn', (b) => b.dataset.anim === (sel.animation || 'pop'));
  setSlider(el.tSize, el.tSizeOut, sel.fontSize || 44, `${sel.fontSize || 44}px`);

  const curY = sel.y ?? 0.78;
  pressAll(el.tPosRow, '.pill-btn', (b) => {
    const targetY = TEXT_Y_POSITIONS[b.dataset.pos || ''];
    return targetY !== undefined && Math.abs(curY - targetY) < 0.08;
  });

  const preset = E.TEXT_PRESETS[sel.preset || 'caption'] || E.TEXT_PRESETS.caption;
  el.tColor.value = toHexColor(sel.color || preset.color, '#ffffff');
  el.tBg.value = toHexColor(sel.bgColor || preset.bgColor, '#121316');
  el.tApplyAllBtn.hidden = p.clips.filter((c) => c.track === 'text').length < 2;
}

function renderAudioInspector(sel: Clip): void {
  el.inspectorTitle.textContent = 'Audio';
  el.inspectorMeta.textContent = E.formatTimecode(sel.duration);
  const volPct = Math.round((sel.volume ?? 0.85) * 100);
  setSlider(el.aVol, el.aVolOut, volPct, `${volPct}%`);
  setMuteButton(el.aMuteBtn, Boolean(sel.muted));
  setSlider(el.aFadeIn, el.aFadeInOut, sel.fadeIn || 0, `${(sel.fadeIn || 0).toFixed(1)}s`);
  setSlider(el.aFadeOut, el.aFadeOutOut, sel.fadeOut || 0, `${(sel.fadeOut || 0).toFixed(1)}s`);
}

export function renderInspector(): void {
  const p = project();
  const sel = getSelectedClip();
  pressAll(el.aspectGroup, '.seg-btn', (b) => b.dataset.aspect === p.aspect);

  el.inspProject.hidden = Boolean(sel);
  el.inspVideo.hidden = sel?.track !== 'video';
  el.inspText.hidden = sel?.track !== 'text';
  el.inspAudio.hidden = sel?.track !== 'audio';

  if (!sel) {
    el.inspectorTitle.textContent = 'Canvas';
    el.inspectorMeta.textContent = p.aspect;
    el.bgColorInput.value = p.bgColor || '#0e0f12';
    pressAll(el.bgSwatches, '.swatch', (b) => b.dataset.color === p.bgColor);
  } else if (sel.track === 'video') {
    renderVideoInspector(sel);
  } else if (sel.track === 'text') {
    renderTextInspector(p, sel);
  } else {
    renderAudioInspector(sel);
  }
}
