// Cut — Wiring for the topbar, library drawer, transport, timeline toolbar, tracks, and dialogs.
import * as E from './engine/index.ts';
import type { AspectKey, Quality, Track } from './engine/index.ts';
import { closeVideoGaps, deleteSelected, duplicateSelected, fitTimelineZoom, setZoom, splitAtPlayhead } from './actions.ts';
import { scheduleAllAudioFrom, setMasterMuted } from './audio.ts';
import { loadDemoReel } from './demo.ts';
import { byId, closestFrom, el } from './dom.ts';
import { closeExportModal, openExportModal, startExport, updateExportSummary } from './export.ts';
import { commitState, redo, selectClip, undo, updateStateSilent } from './history.ts';
import { addTextAtPlayhead, importCaptionsFromText, ingestFiles } from './ingest.ts';
import { syncMediaToTime } from './media-pool.ts';
import { resetProject, scheduleAutosave } from './persist.ts';
import { renderPreview, seekTo, sizePreviewCanvas, togglePlayback } from './playback.ts';
import { closeTransitionPopover } from './popover.ts';
import { project, S } from './state.ts';
import { setupRulerScrub } from './timeline-drag.ts';
import { renderRuler, renderTimelineClips, renderTrackToggles } from './timeline.ts';
import { showToast } from './ui.ts';

function wireLibrary(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tab-btn');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      el.tabMedia.hidden = btn.dataset.tab !== 'media';
      el.tabCaptions.hidden = btn.dataset.tab !== 'captions';
    });
  });

  el.srtFileBtn.addEventListener('click', () => el.srtFileInput.click());
  el.srtFileInput.addEventListener('change', async () => {
    const f = el.srtFileInput.files?.[0];
    if (f) {
      el.bulkCaptions.value = await f.text();
      importCaptionsFromText(el.bulkCaptions.value);
    }
    el.srtFileInput.value = '';
  });
  el.bulkCaptionsBtn.addEventListener('click', () => importCaptionsFromText(el.bulkCaptions.value));

  const pickFiles = () => el.fileInput.click();
  el.importBtn.addEventListener('click', pickFiles);
  el.emptyImportBtn.addEventListener('click', pickFiles);
  el.fileInput.addEventListener('change', () => {
    const files = Array.from(el.fileInput.files || []);
    el.fileInput.value = '';
    void ingestFiles(files);
  });
  el.demoBtn.addEventListener('click', () => void loadDemoReel());
  el.emptyDemoBtn.addEventListener('click', () => void loadDemoReel());
  el.quickTextBtn.addEventListener('click', () => addTextAtPlayhead('caption'));
  el.tlTextBtn.addEventListener('click', () => addTextAtPlayhead('caption'));
}

function wireDragAndDrop(): void {
  let dragDepth = 0;
  const hasFiles = (ev: DragEvent) => Boolean(ev.dataTransfer?.types?.includes('Files'));
  window.addEventListener('dragenter', (ev) => {
    if (!hasFiles(ev) || S.exporting) return;
    ev.preventDefault();
    dragDepth += 1;
    el.dropOverlay.hidden = false;
  });
  window.addEventListener('dragover', (ev) => {
    if (hasFiles(ev)) ev.preventDefault();
  });
  window.addEventListener('dragleave', () => {
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) el.dropOverlay.hidden = true;
  });
  window.addEventListener('drop', (ev) => {
    ev.preventDefault();
    dragDepth = 0;
    el.dropOverlay.hidden = true;
    if (!S.exporting && ev.dataTransfer?.files?.length) void ingestFiles(Array.from(ev.dataTransfer.files));
  });
}

function wireTopbarAndTransport(): void {
  el.aspectGroup.addEventListener('click', (ev) => {
    const aspect = closestFrom(ev.target, '.seg-btn')?.dataset.aspect;
    if (!E.isKeyOf(E.ASPECTS, aspect) || aspect === project().aspect) return;
    commitState((p) => ({ ...p, aspect: aspect as AspectKey }), { resize: true });
    showToast(`Canvas ${aspect}`);
  });
  el.undoBtn.addEventListener('click', undo);
  el.redoBtn.addEventListener('click', redo);
  el.newProjectBtn.addEventListener('click', () => void resetProject());
  el.shortcutsBtn.addEventListener('click', () => { el.shortcutsModal.hidden = false; });
  el.exportOpenBtn.addEventListener('click', openExportModal);

  el.playBtn.addEventListener('click', togglePlayback);
  el.jumpStartBtn.addEventListener('click', () => seekTo(0));
  el.jumpEndBtn.addEventListener('click', () => seekTo(E.computeProjectDuration(project().clips)));
  el.stepBackBtn.addEventListener('click', () => seekTo(Math.max(0, S.playhead - 0.1)));
  el.stepFwdBtn.addEventListener('click', () => seekTo(S.playhead + 0.1));
  el.masterMuteBtn.addEventListener('click', () => {
    setMasterMuted(!S.masterMuted);
    el.masterMuteBtn.setAttribute('aria-pressed', String(S.masterMuted));
    syncMediaToTime(S.playhead, S.playing);
  });
}

function wireTimeline(): void {
  el.splitBtn.addEventListener('click', splitAtPlayhead);
  el.dupBtn.addEventListener('click', duplicateSelected);
  el.delBtn.addEventListener('click', (ev) => deleteSelected(ev.shiftKey));
  el.closeGapsBtn.addEventListener('click', closeVideoGaps);
  el.snapBtn.addEventListener('click', () => {
    updateStateSilent((p) => ({ ...p, snap: !p.snap }));
    showToast(project().snap ? 'Snapping on' : 'Snapping off');
  });

  el.zoomSlider.addEventListener('input', () => setZoom(Number(el.zoomSlider.value)));
  el.zoomInBtn.addEventListener('click', () => setZoom(S.pxPerSec + 20));
  el.zoomOutBtn.addEventListener('click', () => setZoom(S.pxPerSec - 20));
  el.zoomFitBtn.addEventListener('click', fitTimelineZoom);

  // Pinch / Cmd-wheel zooms; a vertical wheel scrolls the timeline sideways.
  el.timelineScroll.addEventListener('wheel', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) {
      ev.preventDefault();
      setZoom(Math.round(S.pxPerSec * (ev.deltaY < 0 ? 1.14 : 0.88)));
    } else if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
      el.timelineScroll.scrollLeft += ev.deltaY;
    }
  }, { passive: false });

  let rulerScrollRafId = 0;
  el.timelineScroll.addEventListener('scroll', () => {
    if (rulerScrollRafId) return;
    rulerScrollRafId = requestAnimationFrame(() => {
      rulerScrollRafId = 0;
      renderRuler();
    });
  }, { passive: true });

  document.querySelectorAll<HTMLButtonElement>('[data-toggle-track]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const track = btn.dataset.toggleTrack as Track;
      S.trackMuted[track] = !S.trackMuted[track];
      renderTrackToggles();
      if (S.playing && track !== 'text') scheduleAllAudioFrom(S.playhead);
      renderTimelineClips();
      syncMediaToTime(S.playhead, S.playing);
      renderPreview();
      scheduleAutosave();
    });
  });

  for (const lane of [el.laneText, el.laneVideo, el.laneAudio]) {
    lane.addEventListener('pointerdown', (ev) => {
      closeTransitionPopover();
      if (ev.target === lane && project().selectedClipId) selectClip(null);
    });
  }

  setupRulerScrub(el.rulerRow);
  setupRulerScrub(el.playhead.querySelector<HTMLElement>('.playhead-cap'));
}

function wireDialogs(): void {
  el.exportOptions.addEventListener('click', (ev) => {
    const btn = closestFrom(ev.target, '.pill-btn');
    if (!btn) return;
    const { res, fps } = btn.dataset;
    if (res === '720' || res === '1080') {
      S.exportSettings.res = res as Quality;
      el.exportOptions.querySelectorAll<HTMLElement>('[data-res]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.res === res));
      });
    } else if (fps) {
      S.exportSettings.fps = Number(fps);
      el.exportOptions.querySelectorAll<HTMLElement>('[data-fps]').forEach((b) => {
        b.setAttribute('aria-pressed', String(Number(b.dataset.fps) === S.exportSettings.fps));
      });
    }
    updateExportSummary();
  });
  el.exportStartBtn.addEventListener('click', () => void startExport());

  document.querySelectorAll<HTMLElement>('[data-close-modal]').forEach((node) => {
    node.addEventListener('click', () => {
      const modalId = node.dataset.closeModal || '';
      if (modalId === 'export-modal') {
        // The backdrop is easy to hit by accident; the buttons are deliberate.
        closeExportModal(node.classList.contains('modal-backdrop'));
        return;
      }
      byId(modalId).hidden = true;
    });
  });
}

function wireResize(): void {
  const onResize = () => {
    sizePreviewCanvas();
    renderRuler(true);
    renderPreview();
  };
  window.addEventListener('resize', onResize);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(onResize).observe(el.stageViewport);
    new ResizeObserver(() => {
      S.cachedTimelineWidth = el.timelineScroll.clientWidth || 720;
      renderRuler();
    }).observe(el.timelineScroll);
  }
  new MutationObserver(() => renderRuler(true)).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}

export function wireEvents(): void {
  wireLibrary();
  wireDragAndDrop();
  wireTopbarAndTransport();
  wireTimeline();
  wireDialogs();
  wireResize();
}
