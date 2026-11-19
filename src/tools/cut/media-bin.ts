// Cut — Media library list and caption style cards in the left drawer.
import * as E from './engine/index.ts';
import type { TextPresetKey } from './engine/index.ts';
import { el } from './dom.ts';
import { commitState } from './history.ts';
import { addTextAtPlayhead, appendMediaToTimeline } from './ingest.ts';
import { forgetMedia } from './persist.ts';
import { deletedMediaCache, mediaMap, perf, project } from './state.ts';
import { showToast } from './ui.ts';
import type { MediaItem } from './types.ts';

function create<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function buildCaptionPresetCards(): void {
  el.captionCards.replaceChildren();
  for (const [key, def] of Object.entries(E.TEXT_PRESETS) as [TextPresetKey, E.TextPreset][]) {
    const card = create('button', 'caption-card');
    card.type = 'button';

    const sample = create('span', 'caption-sample', def.uppercase ? def.label.toUpperCase() : def.label);
    sample.style.fontFamily = def.fontFamily;
    sample.style.fontWeight = String(def.fontWeight);
    sample.style.color = def.color;
    sample.style.background = def.bgColor && def.bgColor !== 'transparent' ? def.bgColor : 'rgba(20,22,28,0.85)';
    if (def.radius) sample.style.borderRadius = `${Math.min(def.radius, 999)}px`;
    if (def.strokeColor) sample.style.textShadow = `0 1px 2px ${def.strokeColor}`;

    card.append(sample, create('span', 'caption-card-name', '+ Add'));
    card.addEventListener('click', () => addTextAtPlayhead(key));
    el.captionCards.appendChild(card);
  }
}

function removeMedia(media: MediaItem): void {
  const used = project().clips.some((c) => c.mediaId === media.id);
  if (used && !window.confirm(`"${media.name}" is used on the timeline. Remove it and its clips?`)) return;
  // Kept for this session so Undo can restore the media together with its clips.
  deletedMediaCache.set(media.id, media);
  mediaMap.delete(media.id);
  forgetMedia(media.id);
  if (used) {
    commitState((p) => ({
      ...p,
      clips: p.clips.filter((c) => c.mediaId !== media.id),
      selectedClipId: p.clips.find((c) => c.id === p.selectedClipId)?.mediaId === media.id ? null : p.selectedClipId,
    }), { media: true });
  } else {
    renderMediaBin();
  }
  showToast(`Removed "${media.name}"`);
}

function mediaRow(media: MediaItem): HTMLElement {
  const item = create('div', 'media-item');
  item.setAttribute('role', 'listitem');
  item.title = `Click to add "${media.name}" to the timeline`;

  const thumb = create('div', 'media-thumb');
  if (media.thumbs && media.thumbs.length) {
    const img = document.createElement('img');
    img.src = media.thumbs[0];
    img.alt = '';
    thumb.appendChild(img);
  } else {
    thumb.textContent = media.kind === 'audio' ? '♪' : 'VID';
  }

  const kindLabel = media.kind === 'image' ? 'IMG' : media.kind === 'audio' ? 'AUD' : 'VID';
  const info = create('div', 'media-info');
  info.append(
    create('div', 'media-name', media.name),
    create('div', 'media-meta', `${kindLabel} · ${E.formatTimecode(media.duration)}`),
  );

  const delBtn = create('button', 'media-del', '×');
  delBtn.type = 'button';
  delBtn.title = `Remove ${media.name} from library`;
  delBtn.setAttribute('aria-label', `Remove ${media.name}`);
  delBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    removeMedia(media);
  });

  const addBtn = create('button', 'media-add', '+');
  addBtn.type = 'button';
  addBtn.setAttribute('aria-label', `Add ${media.name} to timeline`);

  const btns = create('div', 'media-item-btns');
  btns.append(delBtn, addBtn);
  item.append(thumb, info, btns);
  item.addEventListener('click', () => {
    appendMediaToTimeline(media);
    showToast(`Added "${media.name}"`);
  });
  return item;
}

export function renderMediaBin(): void {
  perf.mediaBinRebuilds += 1;
  if (!mediaMap.size) {
    el.mediaList.replaceChildren(create('p', 'empty-note',
      'Imported files stay in your browser. Click any item to append it to the timeline.'));
    return;
  }
  el.mediaList.replaceChildren(...Array.from(mediaMap.values(), mediaRow));
}
