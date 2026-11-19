// Cut — Local-first browser video editor.
(() => {
  'use strict';

  const E = window.CutEngine;
  const Store = window.CutStorage || null;
  if (!E) return;

  // ── DOM References ────────────────────────────────────────
  const $ = (id) => document.getElementById(id);

  const el = {
    dropOverlay: $('drop-overlay'),
    saveStatus: $('save-status'),
    aspectGroup: $('aspect-group'),
    undoBtn: $('undo-btn'),
    redoBtn: $('redo-btn'),
    newProjectBtn: $('new-project-btn'),
    shortcutsBtn: $('shortcuts-btn'),
    exportOpenBtn: $('export-open-btn'),
    demoBtn: $('demo-btn'),
    importBtn: $('import-btn'),
    fileInput: $('file-input'),
    quickTextBtn: $('quick-text-btn'),
    mediaList: $('media-list'),

    // Left drawer tabs & captions
    tabMedia: $('tab-media'),
    tabCaptions: $('tab-captions'),
    captionCards: $('caption-cards'),
    srtFileBtn: $('srt-file-btn'),
    srtFileInput: $('srt-file-input'),
    bulkCaptions: $('bulk-captions'),
    bulkReplace: $('bulk-replace'),
    bulkCaptionsBtn: $('bulk-captions-btn'),

    // Stage & transport
    stageViewport: $('stage-viewport'),
    canvasFrame: $('canvas-frame'),
    previewCanvas: $('preview-canvas'),
    stageEmpty: $('stage-empty'),
    emptyImportBtn: $('empty-import-btn'),
    emptyDemoBtn: $('empty-demo-btn'),
    timeCurrent: $('time-current'),
    timeTotal: $('time-total'),
    jumpStartBtn: $('jump-start-btn'),
    stepBackBtn: $('step-back-btn'),
    playBtn: $('play-btn'),
    stepFwdBtn: $('step-fwd-btn'),
    jumpEndBtn: $('jump-end-btn'),
    masterMuteBtn: $('master-mute-btn'),

    // Inspector
    inspectorTitle: $('inspector-title'),
    inspectorMeta: $('inspector-meta'),
    inspProject: $('insp-project'),
    inspVideo: $('insp-video'),
    inspText: $('insp-text'),
    inspAudio: $('insp-audio'),
    bgSwatches: $('bg-swatches'),
    bgColorInput: $('bg-color-input'),

    vSpeedGroup: $('v-speed-group'),
    vSpeedPresets: $('v-speed-presets'),
    vSpeed: $('v-speed'),
    vSpeedOut: $('v-speed-out'),
    vAudioGroup: $('v-audio-group'),
    vVol: $('v-vol'),
    vVolOut: $('v-vol-out'),
    vMuteBtn: $('v-mute-btn'),
    vExtractAudioBtn: $('v-extract-audio-btn'),
    vFrameReset: $('v-frame-reset'),
    vFitCover: $('v-fit-cover'),
    vFitContain: $('v-fit-contain'),
    vRotateBtn: $('v-rotate-btn'),
    vFlipBtn: $('v-flip-btn'),
    vBlurRow: $('v-blur-row'),
    vBlurBg: $('v-blur-bg'),
    vZoom: $('v-zoom'),
    vZoomOut: $('v-zoom-out'),
    vMotionGroup: $('v-motion-group'),
    vKenBurnsGrid: $('v-kenburns-grid'),
    vColorReset: $('v-color-reset'),
    vFilterGrid: $('v-filter-grid'),
    vBright: $('v-bright'),
    vBrightOut: $('v-bright-out'),
    vContrast: $('v-contrast'),
    vContrastOut: $('v-contrast-out'),
    vSat: $('v-sat'),
    vSatOut: $('v-sat-out'),
    vTransGrid: $('v-trans-grid'),
    vTransDurWrap: $('v-trans-dur-wrap'),
    vTransDur: $('v-trans-dur'),
    vTransDurOut: $('v-trans-dur-out'),
    vFadeIn: $('v-fadein'),
    vFadeInOut: $('v-fadein-out'),
    vFadeOut: $('v-fadeout'),
    vFadeOutOut: $('v-fadeout-out'),

    tContent: $('t-content'),
    tPresetGrid: $('t-preset-grid'),
    tAnimRow: $('t-anim-row'),
    tSize: $('t-size'),
    tSizeOut: $('t-size-out'),
    tPosRow: $('t-pos-row'),
    tColorReset: $('t-color-reset'),
    tColor: $('t-color'),
    tBg: $('t-bg'),
    tApplyAllBtn: $('t-apply-all-btn'),

    aVol: $('a-vol'),
    aVolOut: $('a-vol-out'),
    aMuteBtn: $('a-mute-btn'),
    aFadeIn: $('a-fadein'),
    aFadeInOut: $('a-fadein-out'),
    aFadeOut: $('a-fadeout'),
    aFadeOutOut: $('a-fadeout-out'),

    // Timeline
    splitBtn: $('split-btn'),
    dupBtn: $('dup-btn'),
    delBtn: $('del-btn'),
    tlTextBtn: $('tl-text-btn'),
    closeGapsBtn: $('close-gaps-btn'),
    snapBtn: $('snap-btn'),
    zoomOutBtn: $('zoom-out-btn'),
    zoomSlider: $('zoom-slider'),
    zoomInBtn: $('zoom-in-btn'),
    zoomFitBtn: $('zoom-fit-btn'),
    timelineScroll: $('timeline-scroll'),
    timelineContent: $('timeline-content'),
    rulerRow: $('ruler-row'),
    rulerCanvas: $('ruler-canvas'),
    laneText: $('lane-text'),
    laneVideo: $('lane-video'),
    laneAudio: $('lane-audio'),
    snapLine: $('snap-line'),
    playhead: $('playhead'),

    // Transition popover & drag tip
    transPopover: $('trans-popover'),
    transPopClose: $('trans-pop-close'),
    transPopGrid: $('trans-pop-grid'),
    transPopDur: $('trans-pop-dur'),
    transPopDurOut: $('trans-pop-dur-out'),
    dragTip: $('drag-tip'),

    // Modals & Toast
    exportModal: $('export-modal'),
    exportOptions: $('export-options'),
    exportDims: $('export-dims'),
    exportDur: $('export-dur'),
    exportFmt: $('export-fmt'),
    exportProgressBox: $('export-progress-box'),
    exportPreviewCanvas: $('export-preview-canvas'),
    exportBar: $('export-bar'),
    exportStatus: $('export-status'),
    exportPct: $('export-pct'),
    exportDoneBox: $('export-done-box'),
    exportDownloadLink: $('export-download-link'),
    exportCancelBtn: $('export-cancel-btn'),
    exportStartBtn: $('export-start-btn'),
    shortcutsModal: $('shortcuts-modal'),
    toast: $('toast'),
  };

  // ── Editor State ──────────────────────────────────────────
  let history = E.createHistory(E.createProject());
  const project = () => history.present;

  const mediaMap = new Map();       // mediaId -> MediaItem
  const deletedMediaCache = new Map(); // mediaId -> MediaItem (kept for session undo)
  const videoPool = new Map();      // clipId -> { video, sourceNode, gainNode, mediaId }
  let playhead = 0;
  let playing = false;
  let pxPerSec = 72;
  let masterMuted = false;
  const trackMuted = { text: false, video: false, audio: false };

  let rafId = 0;
  let playStartWall = 0;
  let playStartTime = 0;
  let telemetryStarted = false;
  let saveTimer = 0;
  let activeSeamClipId = null;
  let textBefore = null;
  let textDirty = false;

  // Audio Graph
  let audioCtx = null;
  let mixBus = null;
  let speakerGain = null;
  let activeAudioNodes = []; // { source, fadeGain, volGain, clipId }

  // Canvas interaction state (text dragging OR video panning)
  let renderedTextBoxes = [];
  let canvasDrag = null; // { mode: 'text'|'video', clipId, ... }

  // Offscreen scratch canvases for smooth transitions & 1/8-scale fast blur backdrop
  const scratchCanvasA = document.createElement('canvas');
  const scratchCtxA = scratchCanvasA.getContext('2d', { alpha: false });
  const scratchCanvasB = document.createElement('canvas');
  const scratchCtxB = scratchCanvasB.getContext('2d', { alpha: false });
  const blurCanvas = document.createElement('canvas');
  const blurCtx = blurCanvas.getContext('2d', { alpha: false });

  // Performance caches & rAF coalescing
  const textLayoutCache = new Map();
  let previewRafId = 0;
  let rulerScrollRafId = 0;
  let cachedTimelineWidth = 720;
  let lastRulerKey = '';
  let lastTimeStr = '';
  let lastTotalStr = '';
  let lastSplitDisabled = null;
  let lastStageEmpty = null;
  let lastPlayheadPx = -1;

  const perf = {
    previewFrames: 0,
    lastFrameMs: 0,
    avgFrameMs: 0,
    timelineRebuilds: 0,
    mediaBinRebuilds: 0,
    rulerRebuilds: 0,
  };
  window.__cutPerf = perf;

  // Export state
  let exportSettings = { res: '720', fps: 30 };
  let exportAbort = null;
  let lastExportUrl = null;

  const previewCtx = el.previewCanvas.getContext('2d', { alpha: false });

  // ── Toast & Telemetry ─────────────────────────────────────
  let toastTimer = 0;
  function showToast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2200);
  }

  function markActiveTool() {
    if (telemetryStarted) return;
    telemetryStarted = true;
    window.memoToolTelemetry?.begin();
  }

  // ── IndexedDB Local Autosave ──────────────────────────────
  function scheduleAutosave() {
    if (!Store) return;
    el.saveStatus.textContent = 'Saving…';
    el.saveStatus.classList.remove('is-saved');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const p = project();
      const ok = await Store.saveProjectState({
        aspect: p.aspect,
        bgColor: p.bgColor,
        clips: p.clips,
        selectedClipId: p.selectedClipId,
        snap: p.snap,
        playhead,
        savedAt: Date.now(),
      });
      if (ok) {
        el.saveStatus.textContent = 'Saved locally';
        el.saveStatus.classList.add('is-saved');
      } else {
        el.saveStatus.textContent = 'Local';
      }
    }, 450);
  }

  async function persistMedia(media) {
    if (!Store) return;
    const record = {
      id: media.id,
      kind: media.kind,
      name: media.name,
      duration: media.duration,
      width: media.width || 0,
      height: media.height || 0,
      thumbs: media.thumbs || [],
      peaks: media.peaks || null,
      sceneId: media.sceneId || null,
      isDemoAudio: Boolean(media.isDemoAudio),
      blob: media.blob || null,
    };
    await Store.saveMediaRecord(record);
  }

  async function restoreSavedSession() {
    if (!Store) return;
    const { state, media } = await Store.loadAll();
    if (!state && (!media || !media.length)) return;

    for (const rec of media) {
      if (rec.kind === 'procedural') {
        mediaMap.set(rec.id, {
          ...rec,
          thumbs: rec.thumbs && rec.thumbs.length ? rec.thumbs : makeProceduralThumbs(rec.sceneId, rec.duration),
        });
      } else if (rec.isDemoAudio) {
        const synth = synthesizeDemoAudio(rec.duration || 11.6);
        mediaMap.set(rec.id, {
          ...rec,
          audioBuffer: synth.buffer,
          peaks: rec.peaks || synth.peaks,
        });
      } else if (rec.blob) {
        const url = URL.createObjectURL(rec.blob);
        if (rec.kind === 'image') {
          const img = new Image();
          img.src = url;
          img.onload = () => renderPreview();
          mediaMap.set(rec.id, { ...rec, url, img });
        } else if (rec.kind === 'video') {
          const item = { ...rec, url, audioBuffer: null };
          mediaMap.set(rec.id, item);
          // Re-decode audio buffer lazily if user interacts or right now in background
          decodeBlobAudioAsync(rec.blob, item);
        } else if (rec.kind === 'audio') {
          const item = { ...rec, url, audioBuffer: null };
          mediaMap.set(rec.id, item);
          decodeBlobAudioAsync(rec.blob, item);
        }
      }
    }

    if (state && Array.isArray(state.clips)) {
      const validClips = state.clips.filter((c) => c.track === 'text' || mediaMap.has(c.mediaId));
      history = E.createHistory(E.createProject({
        aspect: state.aspect || '9:16',
        bgColor: state.bgColor || '#0e0f12',
        clips: validClips,
        selectedClipId: validClips.some((c) => c.id === state.selectedClipId) ? state.selectedClipId : null,
        snap: state.snap !== false,
      }));
      playhead = E.clamp(state.playhead || 0, 0, E.computeProjectDuration(validClips));
      el.saveStatus.textContent = 'Restored';
      el.saveStatus.classList.add('is-saved');
      fitTimelineZoom();
      renderAll();
    }
  }

  async function decodeBlobAudioAsync(blob, mediaItem) {
    let tempCtx = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      tempCtx = audioCtx || new AC();
      const buf = await blob.arrayBuffer();
      const audioBuffer = await tempCtx.decodeAudioData(buf);
      mediaItem.audioBuffer = audioBuffer;
      if (!mediaItem.peaks) mediaItem.peaks = extractPeaks(audioBuffer, 120);
      if (playing) scheduleAllAudioFrom(playhead);
      renderTimelineClips();
      renderInspector();
    } catch {
      // Video may have no audio track or unsupported audio codec — native playback fallback handles it.
    } finally {
      if (tempCtx && tempCtx !== audioCtx) {
        try { tempCtx.close(); } catch {}
      }
    }
  }

  async function resetProject() {
    if (project().clips.length || mediaMap.size) {
      if (!window.confirm('Clear all clips and imported media to start a fresh project?')) return;
    }
    pausePlayback();
    closeTransitionPopover();
    clearTimeout(saveTimer);
    textBefore = null;
    textDirty = false;
    for (const m of mediaMap.values()) {
      if (m.url) URL.revokeObjectURL(m.url);
    }
    for (const m of deletedMediaCache.values()) {
      if (m.url) URL.revokeObjectURL(m.url);
    }
    mediaMap.clear();
    deletedMediaCache.clear();
    history = E.createHistory(E.createProject());
    playhead = 0;
    if (Store) await Store.clearAll();
    el.saveStatus.textContent = 'Local';
    el.saveStatus.classList.remove('is-saved');
    renderAll();
    showToast('Started fresh project');
  }

  // ── History & Granular State Helpers ──────────────────────
  function commitState(updater, opts = {}) {
    const current = project();
    const next = updater({ ...current, clips: current.clips.map((c) => ({ ...c, ...(c.transitionIn ? { transitionIn: { ...c.transitionIn } } : {}) })) });
    if (!next) return;
    history = E.commitHistory(history, next);
    markActiveTool();
    onStateChanged(opts);
    scheduleAutosave();
  }

  function updateStateSilent(updater, opts = {}) {
    const current = project();
    const next = updater({ ...current, clips: current.clips.map((c) => ({ ...c, ...(c.transitionIn ? { transitionIn: { ...c.transitionIn } } : {}) })) });
    if (!next) return;
    history = { ...history, present: next };
    onStateChanged(opts);
  }

  function flushPendingTextEdit() {
    if (textDirty && textBefore) {
      commitFromSnapshot(textBefore);
    }
    textBefore = null;
    textDirty = false;
  }

  function restoreDeletedMediaForClips(clips) {
    let restored = false;
    for (const clip of clips) {
      if (!clip.mediaId || mediaMap.has(clip.mediaId)) continue;
      const cached = deletedMediaCache.get(clip.mediaId);
      if (cached) {
        mediaMap.set(cached.id, cached);
        deletedMediaCache.delete(cached.id);
        persistMedia(cached);
        restored = true;
      }
    }
    return restored;
  }

  // Zero-rebuild clip selection: toggles .selected class in place without rebuilding timeline DOM.
  function selectClip(clipId) {
    const prevId = project().selectedClipId;
    if (prevId === clipId) return;
    flushPendingTextEdit();
    history = { ...history, present: { ...project(), selectedClipId: clipId } };
    if (prevId) {
      const prevEl = el.timelineContent.querySelector(`.clip-block[data-clip-id="${prevId}"]`);
      if (prevEl) prevEl.classList.remove('selected');
    }
    if (clipId) {
      const nextEl = el.timelineContent.querySelector(`.clip-block[data-clip-id="${clipId}"]`);
      if (nextEl) nextEl.classList.add('selected');
    }
    renderInspector();
    updateTimelineButtons();
    schedulePreviewRender();
  }

  // Zero-rebuild live clip property update during slider / canvas dragging (preview-only rAF).
  function patchClipLive(clipId, patchFn) {
    const p = project();
    let patched = null;
    const nextClips = p.clips.map((c) => {
      if (c.id !== clipId) return c;
      patched = patchFn(c);
      return patched;
    });
    if (!patched) return null;
    history = { ...history, present: { ...p, clips: nextClips } };
    schedulePreviewRender();
    return patched;
  }

  function snapshotForUndo() {
    const current = project();
    return { ...current, clips: current.clips.map((c) => ({ ...c, ...(c.transitionIn ? { transitionIn: { ...c.transitionIn } } : {}) })) };
  }

  function commitFromSnapshot(beforeSnapshot) {
    const current = project();
    const past = history.past.concat(beforeSnapshot);
    if (past.length > 60) past.shift();
    history = { past, present: current, future: [] };
    markActiveTool();
    updateHistoryButtons();
    scheduleAutosave();
  }

  function undo() {
    flushPendingTextEdit();
    if (!history.past.length) return;
    pausePlayback();
    history = E.undoHistory(history);
    const restoredMedia = restoreDeletedMediaForClips(project().clips);
    onStateChanged({ resize: true, media: restoredMedia });
    scheduleAutosave();
    showToast('Undone');
  }

  function redo() {
    flushPendingTextEdit();
    if (!history.future.length) return;
    pausePlayback();
    history = E.redoHistory(history);
    const restoredMedia = restoreDeletedMediaForClips(project().clips);
    onStateChanged({ resize: true, media: restoredMedia });
    scheduleAutosave();
    showToast('Redone');
  }

  function updateHistoryButtons() {
    el.undoBtn.disabled = history.past.length === 0;
    el.redoBtn.disabled = history.future.length === 0;
  }

  function getSelectedClip() {
    const id = project().selectedClipId;
    if (!id) return null;
    return project().clips.find((c) => c.id === id) || null;
  }

  // ── Web Audio Setup ───────────────────────────────────────
  function ensureAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
      mixBus = audioCtx.createGain();
      mixBus.gain.value = 1;
      speakerGain = audioCtx.createGain();
      speakerGain.gain.value = masterMuted ? 0 : 1;
      mixBus.connect(speakerGain);
      speakerGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function stopScheduledAudio() {
    for (const node of activeAudioNodes) {
      try { node.source.stop(); } catch {}
      try { node.source.disconnect(); } catch {}
      try { node.fadeGain.disconnect(); } catch {}
      try { node.volGain.disconnect(); } catch {}
    }
    activeAudioNodes = [];
  }

  function updateLiveClipAudioGain(clipId, volume, muted) {
    if (!audioCtx || !playing) return;
    const clip = project().clips.find((c) => c.id === clipId);
    const trackIsMuted = clip && ((clip.track === 'audio' && trackMuted.audio) || (clip.track === 'video' && trackMuted.video));
    const target = (muted || trackIsMuted) ? 0 : E.clamp(volume, 0, 2);
    let matched = false;
    for (const node of activeAudioNodes) {
      if (node.clipId === clipId) {
        matched = true;
        node.volGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.015);
      }
    }
    // If clip was muted at playback start and just got unmuted via slider, schedule it now.
    if (!matched && !muted && !trackIsMuted && target > 0) {
      scheduleAllAudioFrom(playhead);
    }
  }

  // Schedules BOTH Audio track clips AND Video clips that have decoded AudioBuffers
  // (guarantees glitch-free, sample-accurate playback & export audio!).
  function scheduleAllAudioFrom(startTime, destinationNode) {
    stopScheduledAudio();
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const dest = destinationNode || mixBus;
    const now = ctx.currentTime + 0.02;

    for (const clip of project().clips) {
      const isAudioTrack = clip.track === 'audio';
      const isVideoWithBuf = clip.track === 'video' && clip.kind === 'video';
      if (!isAudioTrack && !isVideoWithBuf) continue;
      if (clip.muted) continue;
      if (isAudioTrack && trackMuted.audio) continue;
      if (isVideoWithBuf && trackMuted.video) continue;

      const media = mediaMap.get(clip.mediaId);
      if (!media || !media.audioBuffer) continue;

      const clipEnd = clip.start + clip.duration;
      if (clipEnd <= startTime + 0.01) continue;

      const offsetInClip = Math.max(0, startTime - clip.start);
      const delay = Math.max(0, clip.start - startTime);
      const remaining = clip.duration - offsetInClip;
      if (remaining <= 0.02) continue;

      const source = ctx.createBufferSource();
      source.buffer = media.audioBuffer;
      source.playbackRate.value = clip.speed || 1;

      const fadeGain = ctx.createGain();
      const volGain = ctx.createGain();
      const targetGain = E.clamp(clip.volume ?? (isAudioTrack ? 0.85 : 1), 0, 2);
      volGain.gain.setValueAtTime(targetGain, now);

      const whenStart = now + delay;
      const whenEnd = whenStart + remaining;

      const fadeIn = Math.min(clip.fadeIn || 0, clip.duration * 0.45);
      const fadeOut = Math.min(clip.fadeOut || 0, clip.duration * 0.45);

      if (fadeIn > 0 && offsetInClip < fadeIn) {
        const startRatio = offsetInClip / fadeIn;
        fadeGain.gain.setValueAtTime(Math.max(0.0001, startRatio), whenStart);
        fadeGain.gain.linearRampToValueAtTime(1, whenStart + (fadeIn - offsetInClip));
      } else {
        fadeGain.gain.setValueAtTime(1, whenStart);
      }

      if (fadeOut > 0) {
        const fadeOutStartInClip = clip.duration - fadeOut;
        if (offsetInClip >= fadeOutStartInClip) {
          const remRatio = Math.max(0, remaining / fadeOut);
          fadeGain.gain.setValueAtTime(Math.max(0.0001, remRatio), whenStart);
          fadeGain.gain.linearRampToValueAtTime(0.0001, whenEnd);
        } else {
          const fadeOutWall = whenStart + (fadeOutStartInClip - offsetInClip);
          fadeGain.gain.setValueAtTime(1, fadeOutWall);
          fadeGain.gain.linearRampToValueAtTime(0.0001, whenEnd);
        }
      }

      source.connect(fadeGain);
      fadeGain.connect(volGain);
      volGain.connect(dest);

      const speed = clip.speed || 1;
      const bufferOffset = Math.max(0, (clip.sourceStart || 0) + offsetInClip * speed);
      const maxBufDur = Math.max(0, media.audioBuffer.duration - bufferOffset);
      if (maxBufDur <= 0.01) continue;

      try {
        source.start(whenStart, bufferOffset, Math.min(remaining * speed, maxBufDur));
        activeAudioNodes.push({ source, fadeGain, volGain, clipId: clip.id });
      } catch {
        // Ignore out-of-bounds buffer start
      }
    }
  }

  // ── Video Element Pool (one <video> per video clip) ───────
  function syncVideoPool() {
    const activeIds = new Set();
    for (const clip of project().clips) {
      if (clip.track === 'video' && clip.kind === 'video') {
        activeIds.add(clip.id);
        if (!videoPool.has(clip.id)) {
          const media = mediaMap.get(clip.mediaId);
          if (media && media.url) {
            const video = document.createElement('video');
            video.src = media.url;
            video.preload = 'auto';
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.muted = true; // Audio handled by decoded AudioBuffer when present
            video.addEventListener('seeked', () => {
              if (!playing) renderPreview();
            });
            video.addEventListener('loadeddata', () => {
              if (!playing) renderPreview();
            });
            videoPool.set(clip.id, { video, sourceNode: null, gainNode: null, mediaId: clip.mediaId });
          }
        }
      }
    }
    for (const [clipId, entry] of videoPool.entries()) {
      if (!activeIds.has(clipId)) {
        try { entry.video.pause(); } catch {}
        try { entry.sourceNode?.disconnect(); } catch {}
        try { entry.gainNode?.disconnect(); } catch {}
        entry.video.removeAttribute('src');
        entry.video.load();
        videoPool.delete(clipId);
      }
    }
  }

  function ensureVideoAudioRouting(entry) {
    if (!entry || entry.sourceNode) return;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const sourceNode = ctx.createMediaElementSource(entry.video);
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1;
      sourceNode.connect(gainNode);
      gainNode.connect(mixBus);
      entry.sourceNode = sourceNode;
      entry.gainNode = gainNode;
    } catch {
      // Fallback to native HTMLMediaElement volume
    }
  }

  function pauseAllPoolVideos() {
    for (const entry of videoPool.values()) {
      if (!entry.video.paused) {
        try { entry.video.pause(); } catch {}
      }
    }
  }

  function syncVideosToTime(time, isPlayingNow) {
    const active = E.getActiveClipsAt(project().clips, time).video;
    const tr = E.getTransitionStateAt(project().clips, time);
    const needed = new Map();
    if (tr) {
      needed.set(tr.outgoing.id, { clip: tr.outgoing, localTime: Math.max(0, tr.outgoing.duration - 0.04), frozen: true });
      needed.set(tr.incoming.id, { clip: tr.incoming, localTime: Math.max(0, time - tr.incoming.start), frozen: false });
    } else if (active) {
      needed.set(active.id, { clip: active, localTime: Math.max(0, time - active.start), frozen: false });
    }

    for (const [clipId, entry] of videoPool.entries()) {
      const video = entry.video;
      const spec = needed.get(clipId);
      if (spec) {
        const clip = spec.clip;
        const media = mediaMap.get(clip.mediaId);
        const speed = clip.speed || 1;
        const targetSourceTime = E.clamp(
          (clip.sourceStart || 0) + spec.localTime * speed,
          0,
          Math.max(0, (video.duration || clip.mediaDuration || 100) - 0.04)
        );
        const hasDecodedBuf = Boolean(media && media.audioBuffer);

        if (isPlayingNow && !spec.frozen) {
          if (hasDecodedBuf) {
            // Audio is already scheduled sample-accurately via Web Audio buffer!
            video.muted = true;
            if (entry.gainNode) entry.gainNode.gain.value = 0;
          } else {
            const opacity = E.computeClipOpacity(clip, spec.localTime);
            const muted = clip.muted || trackMuted.video;
            const vol = muted ? 0 : E.clamp((clip.volume ?? 1) * opacity, 0, 2);
            ensureVideoAudioRouting(entry);
            if (entry.gainNode) {
              entry.gainNode.gain.value = vol;
              video.muted = false;
              video.volume = 1;
            } else {
              video.muted = muted || masterMuted;
              video.volume = Math.min(1, vol);
            }
          }
          if (Math.abs(video.playbackRate - speed) > 0.01) {
            try { video.playbackRate = speed; } catch {}
          }
          if (Math.abs((video.currentTime || 0) - targetSourceTime) > 0.24) {
            try { video.currentTime = targetSourceTime; } catch {}
          }
          if (video.paused && video.readyState >= 2) {
            video.play().catch(() => {});
          }
        } else {
          if (spec.frozen) {
            video.muted = true;
            if (entry.gainNode) entry.gainNode.gain.value = 0;
          }
          if (!video.paused) {
            try { video.pause(); } catch {}
          }
          if (Math.abs((video.currentTime || 0) - targetSourceTime) > 0.03) {
            try { video.currentTime = targetSourceTime; } catch {}
          }
        }
      } else if (!video.paused) {
        try { video.pause(); } catch {}
      }
    }
  }

  // ── Procedural Demo Clips & Lo-Fi Audio Synth ─────────────
  function drawProceduralClip(ctx, sceneId, t, w, h) {
    if (sceneId === 'tokyo-rain') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0a1020');
      grad.addColorStop(0.55, '#191933');
      grad.addColorStop(1, '#2d1522');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const bokeh = [
        { x: 0.22, y: 0.34, r: 0.14, c: 'rgba(235, 87, 72, 0.26)', s: 0.3 },
        { x: 0.78, y: 0.28, r: 0.17, c: 'rgba(84, 198, 224, 0.22)', s: -0.22 },
        { x: 0.56, y: 0.58, r: 0.20, c: 'rgba(245, 185, 84, 0.2)', s: 0.18 },
        { x: 0.18, y: 0.72, r: 0.12, c: 'rgba(235, 110, 145, 0.22)', s: 0.26 },
        { x: 0.84, y: 0.76, r: 0.15, c: 'rgba(98, 212, 175, 0.2)', s: -0.15 },
      ];
      for (const b of bokeh) {
        const bx = (b.x + Math.sin(t * b.s + b.r * 20) * 0.04) * w;
        const by = (b.y + Math.cos(t * b.s * 1.2) * 0.03) * h;
        const br = b.r * Math.min(w, h);
        const rg = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        rg.addColorStop(0, b.c);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(215, 232, 255, 0.28)';
      ctx.lineWidth = Math.max(1, w * 0.0022);
      for (let i = 0; i < 48; i++) {
        const seed = i * 97.13;
        const rx = ((seed * 3.17) % 1) * w;
        const speed = 0.65 + (i % 5) * 0.14;
        const ry = (((seed * 0.19 + t * speed) % 1.2) - 0.1) * h;
        const len = (0.045 + (i % 4) * 0.015) * h;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - len * 0.12, ry + len);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 175, 120, 0.07)';
      for (let i = 0; i < 10; i++) {
        const y = h * (0.76 + i * 0.024);
        const bw = w * (0.18 + Math.sin(t * 2.1 + i) * 0.08);
        ctx.fillRect((w - bw) / 2 + Math.sin(t + i * 1.7) * w * 0.15, y, bw, 3);
      }
      return;
    }

    if (sceneId === 'golden-hour') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#222b45');
      grad.addColorStop(0.36, '#87434d');
      grad.addColorStop(0.62, '#de8250');
      grad.addColorStop(0.72, '#f7c57c');
      grad.addColorStop(1, '#1d2233');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const sunX = w * 0.5;
      const sunY = h * (0.44 + t * 0.018);
      const sunR = Math.min(w, h) * 0.17;
      const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.5);
      halo.addColorStop(0, 'rgba(255, 240, 196, 0.72)');
      halo.addColorStop(0.45, 'rgba(247, 165, 92, 0.25)');
      halo.addColorStop(1, 'rgba(247, 165, 92, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff3d1';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      const seaY = h * 0.64;
      const seaGrad = ctx.createLinearGradient(0, seaY, 0, h);
      seaGrad.addColorStop(0, '#362637');
      seaGrad.addColorStop(1, '#141724');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, seaY, w, h - seaY);

      ctx.fillStyle = 'rgba(255, 224, 166, 0.45)';
      for (let i = 0; i < 16; i++) {
        const p = i / 16;
        const y = seaY + 8 + p * p * (h - seaY - 16);
        const rw = sunR * (1.7 - p * 1.0) + Math.sin(t * 3 + i * 1.4) * 18;
        const ox = Math.sin(t * 2 + i) * 10;
        ctx.fillRect(sunX - rw / 2 + ox, y, rw, 2.5 + p * 3);
      }
      return;
    }

    // 'kinetic-grid'
    ctx.fillStyle = '#f2ede1';
    ctx.fillRect(0, 0, w, h);

    const step = Math.max(36, Math.round(Math.min(w, h) / 10));
    ctx.strokeStyle = 'rgba(27, 27, 30, 0.09)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const cx = w * 0.5;
    const cy = h * 0.46;
    const baseR = Math.min(w, h) * 0.25;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.55);
    ctx.strokeStyle = '#1b1b1e';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 1.25, 0, Math.PI * 1.45);
    ctx.stroke();

    const pulse = 1 + Math.sin(t * Math.PI * 1.6) * 0.06;
    ctx.fillStyle = '#c84231';
    ctx.beginPath();
    ctx.arc(Math.cos(t * 0.9) * baseR * 0.28, Math.sin(t * 0.9) * baseR * 0.28, baseR * 0.56 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1b1b1e';
    ctx.beginPath();
    ctx.arc(-Math.cos(t * 0.9) * baseR * 0.65, -Math.sin(t * 0.9) * baseR * 0.65, baseR * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(27, 27, 30, 0.45)';
    ctx.font = `600 ${Math.round(Math.min(w, h) * 0.024)}px ui-monospace, Menlo, monospace`;
    ctx.fillText(`FRAME ${String(Math.floor(t * 30)).padStart(3, '0')}`, w * 0.07, h * 0.08);
  }

  function makeProceduralThumbs(sceneId, duration) {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 64;
    const g = c.getContext('2d');
    const frames = [];
    for (let i = 0; i < 5; i++) {
      drawProceduralClip(g, sceneId, (i / 4) * duration, 96, 64);
      frames.push(c.toDataURL('image/jpeg', 0.72));
    }
    return frames;
  }

  function synthesizeDemoAudio(durationSec = 11.6) {
    const ctx = ensureAudioContext();
    const sampleRate = ctx ? ctx.sampleRate : 44100;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const buffer = ctx
      ? ctx.createBuffer(2, totalSamples, sampleRate)
      : { numberOfChannels: 2, sampleRate, length: totalSamples, duration: durationSec, getChannelData: () => new Float32Array(totalSamples) };

    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    const chords = [
      [174.61, 220.00, 261.63, 329.63],
      [164.81, 196.00, 246.94, 293.66],
      [146.83, 174.61, 220.00, 261.63],
      [130.81, 164.81, 196.00, 246.94],
    ];
    const barDur = 2.9;
    const beatDur = barDur / 4;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const chordIdx = Math.floor(t / barDur) % chords.length;
      const localBar = t % barDur;
      const env = Math.min(1, localBar / 0.04) * Math.exp(-localBar * 0.62);
      const notes = chords[chordIdx];

      let sL = 0;
      let sR = 0;
      for (let n = 0; n < notes.length; n++) {
        const freq = notes[n];
        const tone = Math.sin(2 * Math.PI * freq * t) + 0.22 * Math.sin(4 * Math.PI * freq * t);
        const pan = (n / (notes.length - 1)) * 0.5 - 0.25;
        sL += tone * (0.5 - pan);
        sR += tone * (0.5 + pan);
      }
      sL *= env * 0.14;
      sR *= env * 0.14;

      const rootFreq = notes[0] * 0.5;
      const bass = Math.sin(2 * Math.PI * rootFreq * t) * Math.exp(-localBar * 1.1) * 0.16;

      const beatInBar = localBar % (beatDur * 2);
      const kickEnv = Math.exp(-beatInBar * 18);
      const kickFreq = 52 + 78 * Math.exp(-beatInBar * 28);
      const kick = Math.sin(2 * Math.PI * kickFreq * beatInBar) * kickEnv * 0.2;

      const halfBeat = localBar % (beatDur * 0.5);
      const hatEnv = Math.exp(-halfBeat * 45);
      const noise = (Math.sin(i * 12.9898) * 43758.5453) % 1;
      const hat = noise * hatEnv * 0.03;

      const endFade = t > durationSec - 0.6 ? Math.max(0, (durationSec - t) / 0.6) : 1;

      left[i] = Math.tanh((sL + bass + kick + hat) * endFade);
      right[i] = Math.tanh((sR + bass + kick - hat * 0.7) * endFade);
    }

    return { buffer, peaks: extractPeaks(buffer, 120) };
  }

  function extractPeaks(audioBuffer, count = 120) {
    const data = audioBuffer.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / count));
    const peaks = [];
    for (let i = 0; i < count; i++) {
      let max = 0;
      const start = i * step;
      const end = Math.min(data.length, start + step);
      for (let j = start; j < end; j += Math.max(1, Math.floor(step / 24))) {
        const a = Math.abs(data[j]);
        if (a > max) max = a;
      }
      peaks.push(E.clamp(max, 0.05, 1));
    }
    return peaks;
  }

  function loadDemoReel() {
    pausePlayback();
    ensureAudioContext();

    const m1 = {
      id: E.makeId('m'),
      kind: 'procedural',
      sceneId: 'tokyo-rain',
      name: '01 · Tokyo Rain',
      duration: 4.0,
      width: 720,
      height: 1280,
      thumbs: makeProceduralThumbs('tokyo-rain', 4.0),
    };
    const m2 = {
      id: E.makeId('m'),
      kind: 'procedural',
      sceneId: 'golden-hour',
      name: '02 · Golden Hour',
      duration: 4.0,
      width: 720,
      height: 1280,
      thumbs: makeProceduralThumbs('golden-hour', 4.0),
    };
    const m3 = {
      id: E.makeId('m'),
      kind: 'procedural',
      sceneId: 'kinetic-grid',
      name: '03 · Kinetic Grid',
      duration: 3.6,
      width: 720,
      height: 1280,
      thumbs: makeProceduralThumbs('kinetic-grid', 3.6),
    };

    const synth = synthesizeDemoAudio(11.6);
    const ma = {
      id: E.makeId('m'),
      kind: 'audio',
      isDemoAudio: true,
      name: 'Lo-fi Tape · 96 BPM',
      duration: 11.6,
      audioBuffer: synth.buffer,
      peaks: synth.peaks,
    };

    mediaMap.set(m1.id, m1);
    mediaMap.set(m2.id, m2);
    mediaMap.set(m3.id, m3);
    mediaMap.set(ma.id, ma);

    persistMedia(m1);
    persistMedia(m2);
    persistMedia(m3);
    persistMedia(ma);

    const v1 = E.createVideoClip(m1, 0, { fadeIn: 0, fadeOut: 0 });
    const v2 = E.createVideoClip(m2, 4.0, {
      fadeIn: 0,
      fadeOut: 0,
      transitionIn: { type: 'dissolve', duration: 0.55 },
    });
    const v3 = E.createVideoClip(m3, 8.0, {
      fadeIn: 0,
      fadeOut: 0.5,
      transitionIn: { type: 'slide-left', duration: 0.45 },
    });

    const t1 = E.createTextClip(0.25, {
      text: 'Edit right in the browser.',
      duration: 3.35,
      preset: 'pill',
      y: 0.78,
      fontSize: 38,
      animation: 'pop',
    });
    const t2 = E.createTextClip(4.3, {
      text: 'Split, trim, color & mix.',
      duration: 3.3,
      preset: 'caption',
      y: 0.78,
      fontSize: 40,
      animation: 'slide',
    });
    const t3 = E.createTextClip(8.2, {
      text: 'No uploads. No watermarks.',
      duration: 3.2,
      preset: 'lower',
      y: 0.80,
      fontSize: 34,
      animation: 'fade',
    });

    const a1 = E.createAudioClip(ma, 0, { volume: 0.85, fadeIn: 0.4, fadeOut: 0.8 });

    commitState((p) => ({
      ...p,
      clips: [v1, v2, v3, t1, t2, t3, a1],
      selectedClipId: v1.id,
    }));

    playhead = 0.7;
    fitTimelineZoom();
    renderAll();
    showToast('Demo reel loaded — press Space to play');
  }

  // ── Real File Ingestion (Video, Image, Audio, SRT/VTT) ────
  async function ingestFiles(files) {
    if (!files || !files.length) return;
    ensureAudioContext();
    let addedCount = 0;

    for (const file of Array.from(files)) {
      const kind = E.detectMediaKind(file.name, file.type);
      if (kind === 'subtitle') {
        const text = await file.text();
        importCaptionsFromText(text);
        addedCount += 1;
      } else if (kind === 'video') {
        const media = await loadVideoMedia(file);
        if (media) {
          mediaMap.set(media.id, media);
          persistMedia(media);
          appendMediaToTimeline(media);
          addedCount += 1;
        }
      } else if (kind === 'image') {
        const media = await loadImageMedia(file);
        if (media) {
          mediaMap.set(media.id, media);
          persistMedia(media);
          appendMediaToTimeline(media);
          addedCount += 1;
        }
      } else if (kind === 'audio') {
        const media = await loadAudioMedia(file);
        if (media) {
          mediaMap.set(media.id, media);
          persistMedia(media);
          appendMediaToTimeline(media);
          addedCount += 1;
        }
      } else {
        showToast(`Unsupported file: ${file.name}`);
      }
    }

    if (addedCount > 0) {
      renderMediaBin();
      showToast(`Imported ${addedCount} ${addedCount === 1 ? 'file' : 'files'}`);
    }
  }

  async function resolveVideoDuration(video) {
    if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
    // WebM files recorded by MediaRecorder often report duration === Infinity until seeked past EOF.
    await new Promise((res) => {
      const timer = setTimeout(res, 600);
      const done = () => {
        clearTimeout(timer);
        video.removeEventListener('timeupdate', done);
        video.removeEventListener('seeked', done);
        res();
      };
      video.addEventListener('timeupdate', done, { once: true });
      video.addEventListener('seeked', done, { once: true });
      try { video.currentTime = 1e7; } catch { done(); }
    });
    const resolved = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 5;
    try { video.currentTime = 0; } catch {}
    return resolved;
  }

  function loadVideoMedia(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      const releaseTempVideo = () => {
        try { video.pause(); } catch {}
        video.removeAttribute('src');
        video.load();
      };

      const onFail = () => {
        releaseTempVideo();
        URL.revokeObjectURL(url);
        showToast(`Could not decode ${file.name}`);
        resolve(null);
      };

      video.addEventListener('error', onFail, { once: true });
      video.addEventListener('loadedmetadata', async () => {
        const duration = await resolveVideoDuration(video);
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        const thumbs = await extractVideoFilmstrip(video, duration, 6);
        releaseTempVideo();
        const media = {
          id: E.makeId('m'),
          kind: 'video',
          name: file.name.replace(/\.[^.]+$/, ''),
          url,
          blob: file,
          duration: E.roundTime(duration),
          width,
          height,
          thumbs,
          audioBuffer: null,
          peaks: null,
        };
        // Decode embedded audio asynchronously for waveform + glitch-free export + detach audio
        decodeBlobAudioAsync(file, media).then(() => persistMedia(media));
        resolve(media);
      }, { once: true });
    });
  }

  async function extractVideoFilmstrip(video, duration, count = 6) {
    const frames = [];
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 64;
    const g = c.getContext('2d');

    for (let i = 0; i < count; i++) {
      const target = Math.min(Math.max(0, duration - 0.05), (i / Math.max(1, count)) * duration + 0.05);
      if (Math.abs((video.currentTime || 0) - target) > 0.01 || video.readyState < 2) {
        await new Promise((res) => {
          const timer = setTimeout(res, 650);
          const done = () => { clearTimeout(timer); res(); };
          video.addEventListener('seeked', done, { once: true });
          try { video.currentTime = target; } catch { done(); }
        });
      }
      try {
        const r = E.computeDrawRect(video.videoWidth || 96, video.videoHeight || 64, 96, 64, 'cover', 1);
        g.fillStyle = '#0e0f12';
        g.fillRect(0, 0, 96, 64);
        g.drawImage(video, r.x, r.y, r.w, r.h);
        frames.push(c.toDataURL('image/jpeg', 0.65));
      } catch {}
    }
    return frames;
  }

  function loadImageMedia(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 96;
        c.height = 64;
        const g = c.getContext('2d');
        const r = E.computeDrawRect(img.naturalWidth, img.naturalHeight, 96, 64, 'cover', 1);
        g.drawImage(img, r.x, r.y, r.w, r.h);
        resolve({
          id: E.makeId('m'),
          kind: 'image',
          name: file.name.replace(/\.[^.]+$/, ''),
          url,
          blob: file,
          img,
          duration: 4,
          width: img.naturalWidth,
          height: img.naturalHeight,
          thumbs: [c.toDataURL('image/jpeg', 0.72)],
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        showToast(`Could not open ${file.name}`);
        resolve(null);
      };
      img.src = url;
    });
  }

  async function loadAudioMedia(file) {
    try {
      const ctx = ensureAudioContext();
      const buf = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(buf);
      return {
        id: E.makeId('m'),
        kind: 'audio',
        name: file.name.replace(/\.[^.]+$/, ''),
        blob: file,
        duration: E.roundTime(audioBuffer.duration),
        audioBuffer,
        peaks: extractPeaks(audioBuffer, 120),
      };
    } catch {
      showToast(`Could not decode audio: ${file.name}`);
      return null;
    }
  }

  function appendMediaToTimeline(media) {
    if (media.kind === 'audio') {
      const start = E.getTrackEnd(project().clips, 'audio');
      const clip = E.createAudioClip(media, start);
      commitState((p) => ({
        ...p,
        clips: p.clips.concat(clip),
        selectedClipId: clip.id,
      }));
    } else {
      const start = E.getTrackEnd(project().clips, 'video');
      const clip = E.createVideoClip(media, start);
      commitState((p) => ({
        ...p,
        clips: p.clips.concat(clip),
        selectedClipId: clip.id,
      }));
    }
  }

  function addTextAtPlayhead(presetKey = 'caption') {
    const start = E.roundTime(playhead);
    const clip = E.createTextClip(start, {
      text: 'New caption',
      preset: presetKey,
    });
    commitState((p) => ({
      ...p,
      clips: p.clips.concat(clip),
      selectedClipId: clip.id,
    }));
    showToast(`Added ${E.TEXT_PRESETS[presetKey]?.label || 'text'} caption`);
    setTimeout(() => {
      el.tContent.focus();
      el.tContent.select();
    }, 20);
  }

  function importCaptionsFromText(rawText) {
    const total = E.computeProjectDuration(project().clips);
    const created = E.scriptToCaptions(rawText, total, 'caption');
    if (!created.length) {
      showToast('Paste .srt subtitles or at least one caption line');
      return;
    }
    const replaceExisting = el.bulkReplace ? el.bulkReplace.checked : true;
    commitState((p) => ({
      ...p,
      clips: (replaceExisting ? p.clips.filter((c) => c.track !== 'text') : p.clips).concat(created),
      selectedClipId: created[0].id,
    }));
    showToast(`Added ${created.length} ${created.length === 1 ? 'caption' : 'captions'}`);
  }

  function detachVideoAudio(clipId) {
    const clip = project().clips.find((c) => c.id === clipId && c.track === 'video');
    if (!clip) return;
    const media = mediaMap.get(clip.mediaId);
    if (!media || !media.audioBuffer) {
      showToast('No audio stream found in this video');
      return;
    }
    const audioClip = E.createAudioClip(media, clip.start, {
      name: `${clip.name} (audio)`,
      duration: clip.duration,
      sourceStart: clip.sourceStart || 0,
      mediaDuration: media.audioBuffer.duration,
      speed: clip.speed || 1,
      volume: clip.volume ?? 1,
      muted: false,
      fadeIn: clip.fadeIn || 0,
      fadeOut: clip.fadeOut || 0,
    });
    commitState((p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === clip.id ? { ...c, muted: true } : c)).concat(audioClip),
      selectedClipId: audioClip.id,
    }));
    showToast('Detached audio to track A');
  }

  // ── Canvas Compositor (Shared Preview + Export) ───────────
  function drawVideoClipToCtx(ctx, clip, w, h, localTime) {
    const media = mediaMap.get(clip.mediaId);
    if (!media) return;
    const sourceTime = (clip.sourceStart || 0) + localTime * (clip.speed || 1);
    const opacity = E.computeClipOpacity(clip, localTime);
    if (opacity <= 0.001) return;

    const kb = clip.kind === 'image' ? E.evalKenBurns(clip, localTime) : { scale: 1, panX: 0, panY: 0 };
    const effectiveZoom = (clip.zoom || 1) * kb.scale;
    const effOffX = (clip.offsetX || 0) + kb.panX;
    const effOffY = (clip.offsetY || 0) + kb.panY;

    ctx.save();
    ctx.globalAlpha *= opacity;

    const filterStr = E.buildCanvasFilter(clip);

    if (media.kind === 'procedural') {
      if (filterStr !== 'none') ctx.filter = filterStr;
      ctx.translate(w / 2 + effOffX * w, h / 2 + effOffY * h);
      if (clip.flipH) ctx.scale(-1, 1);
      if (clip.rotate) ctx.rotate((clip.rotate * Math.PI) / 180);
      if (effectiveZoom !== 1) ctx.scale(effectiveZoom, effectiveZoom);
      ctx.translate(-w / 2, -h / 2);
      drawProceduralClip(ctx, media.sceneId, sourceTime, w, h);
    } else {
      let drawable = null;
      let srcW = media.width || w;
      let srcH = media.height || h;

      if (media.kind === 'image' && media.img && media.img.complete) {
        drawable = media.img;
      } else if (media.kind === 'video') {
        const entry = videoPool.get(clip.id);
        if (entry && entry.video.readyState >= 2) {
          drawable = entry.video;
          srcW = entry.video.videoWidth || srcW;
          srcH = entry.video.videoHeight || srcH;
        }
      }

      if (drawable) {
        const rotated = clip.rotate === 90 || clip.rotate === 270;
        const effSrcW = rotated ? srcH : srcW;
        const effSrcH = rotated ? srcW : srcH;

        if (clip.fit === 'contain' && clip.blurBg) {
          // 1/8-scale offscreen blur pass: visually identical, ~64x faster than full-res Gaussian blur.
          const bw = Math.max(48, Math.round(w / 8));
          const bh = Math.max(48, Math.round(h / 8));
          if (blurCanvas.width !== bw || blurCanvas.height !== bh) {
            blurCanvas.width = bw;
            blurCanvas.height = bh;
          }
          blurCtx.save();
          blurCtx.fillStyle = project().bgColor || '#0e0f12';
          blurCtx.fillRect(0, 0, bw, bh);
          blurCtx.filter = 'blur(4px) brightness(0.55) saturate(1.15)';
          const smallCover = E.computeDrawRect(effSrcW, effSrcH, bw, bh, 'cover', 1.12, 0, 0);
          drawTransformedDrawable(blurCtx, drawable, bw, bh, smallCover, clip.rotate, clip.flipH);
          blurCtx.restore();

          ctx.save();
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(blurCanvas, 0, 0, w, h);
          ctx.restore();
        }

        if (filterStr !== 'none') ctx.filter = filterStr;
        const rect = E.computeDrawRect(effSrcW, effSrcH, w, h, clip.fit || 'cover', effectiveZoom, effOffX, effOffY);
        drawTransformedDrawable(ctx, drawable, w, h, rect, clip.rotate, clip.flipH);
      }
    }
    ctx.restore();
  }

  function ensureScratchSize(w, h) {
    if (scratchCanvasA.width !== w || scratchCanvasA.height !== h) {
      scratchCanvasA.width = w;
      scratchCanvasA.height = h;
      scratchCanvasB.width = w;
      scratchCanvasB.height = h;
    }
  }

  function renderFrame(ctx, w, h, time, opts = {}) {
    const p = project();
    const isPreview = Boolean(opts.isPreview);
    if (isPreview) renderedTextBoxes = [];

    ctx.save();
    ctx.fillStyle = p.bgColor || '#0e0f12';
    ctx.fillRect(0, 0, w, h);

    const active = E.getActiveClipsAt(p.clips, time);
    const transition = E.getTransitionStateAt(p.clips, time);

    // 1. Video / Image / Procedural Layer (with true clip-to-clip transitions!)
    if (transition) {
      ensureScratchSize(w, h);
      scratchCtxA.fillStyle = p.bgColor || '#0e0f12';
      scratchCtxA.fillRect(0, 0, w, h);
      drawVideoClipToCtx(scratchCtxA, transition.outgoing, w, h, Math.max(0, transition.outgoing.duration - 0.02));

      scratchCtxB.fillStyle = p.bgColor || '#0e0f12';
      scratchCtxB.fillRect(0, 0, w, h);
      drawVideoClipToCtx(scratchCtxB, transition.incoming, w, h, Math.max(0, time - transition.incoming.start));

      const prog = transition.progress;
      ctx.save();
      if (transition.type === 'dissolve') {
        ctx.drawImage(scratchCanvasA, 0, 0);
        ctx.globalAlpha = prog;
        ctx.drawImage(scratchCanvasB, 0, 0);
      } else if (transition.type === 'slide-left') {
        ctx.drawImage(scratchCanvasA, -prog * w, 0);
        ctx.drawImage(scratchCanvasB, (1 - prog) * w, 0);
      } else if (transition.type === 'slide-up') {
        ctx.drawImage(scratchCanvasA, 0, -prog * h);
        ctx.drawImage(scratchCanvasB, 0, (1 - prog) * h);
      } else if (transition.type === 'zoom') {
        // Outgoing zooms subtly out while incoming punches in smoothly
        const outScale = 1 + 0.16 * prog;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.scale(outScale, outScale);
        ctx.drawImage(scratchCanvasA, -w / 2, -h / 2);
        ctx.restore();

        const inScale = 0.86 + 0.14 * prog;
        ctx.save();
        ctx.globalAlpha = prog;
        ctx.translate(w / 2, h / 2);
        ctx.scale(inScale, inScale);
        ctx.drawImage(scratchCanvasB, -w / 2, -h / 2);
        ctx.restore();
      }
      ctx.restore();
    } else if (active.video) {
      const localTime = Math.max(0, time - active.video.start);
      drawVideoClipToCtx(ctx, active.video, w, h, localTime);
    }

    // 2. Text Overlays Layer
    if (!trackMuted.text && active.texts.length) {
      const scaleUnit = Math.min(w, h) / 720;
      for (const clip of active.texts) {
        const localTime = Math.max(0, time - clip.start);
        const anim = E.evalTextAnim(clip, localTime);
        if (anim.alpha <= 0.001) continue;

        const preset = E.TEXT_PRESETS[clip.preset] || E.TEXT_PRESETS.caption;
        const rawText = (clip.text || '').trim() || ' ';
        const textStr = preset.uppercase ? rawText.toUpperCase() : rawText;
        const fontSize = Math.round((clip.fontSize || 44) * scaleUnit);
        const lineHeight = Math.round(fontSize * 1.22);

        ctx.save();
        ctx.font = `${preset.fontWeight} ${fontSize}px ${preset.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const maxLineWidth = w * 0.86;
        const layoutKey = `${clip.preset}|${fontSize}|${w}|${textStr}`;
        let layout = textLayoutCache.get(layoutKey);
        if (!layout) {
          const lines = E.wrapTextLines(textStr, maxLineWidth, (s) => ctx.measureText(s).width);
          let textWidth = 0;
          for (const line of lines) {
            textWidth = Math.max(textWidth, ctx.measureText(line).width);
          }
          layout = { lines, textWidth };
          if (textLayoutCache.size > 120) textLayoutCache.clear();
          textLayoutCache.set(layoutKey, layout);
        }
        const { lines, textWidth } = layout;

        const padX = preset.padX * scaleUnit;
        const padY = preset.padY * scaleUnit;
        const boxW = textWidth + padX * 2;
        const boxH = lines.length * lineHeight + padY * 2;

        const cx = (clip.x ?? 0.5) * w;
        const cy = (clip.y ?? 0.78) * h + anim.offsetY * scaleUnit;

        ctx.globalAlpha = anim.alpha;
        ctx.translate(cx, cy);
        ctx.scale(anim.scale, anim.scale);

        const bg = clip.bgColor || preset.bgColor;
        if (bg && bg !== 'transparent') {
          ctx.fillStyle = bg;
          const radius = Math.min(preset.radius * scaleUnit, boxH / 2);
          drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, radius);
          ctx.fill();
        }

        const fillCol = clip.color || preset.color;
        const startY = -((lines.length - 1) * lineHeight) / 2;

        for (let i = 0; i < lines.length; i++) {
          const ly = startY + i * lineHeight;
          if (preset.strokeColor && preset.strokeWidth > 0) {
            ctx.lineJoin = 'round';
            ctx.lineWidth = preset.strokeWidth * scaleUnit;
            ctx.strokeStyle = preset.strokeColor;
            ctx.strokeText(lines[i], 0, ly);
          }
          ctx.fillStyle = fillCol;
          ctx.fillText(lines[i], 0, ly);
        }

        if (isPreview && project().selectedClipId === clip.id) {
          ctx.strokeStyle = 'rgba(239, 83, 67, 0.9)';
          ctx.lineWidth = Math.max(2, 2 * scaleUnit);
          ctx.setLineDash([6 * scaleUnit, 4 * scaleUnit]);
          ctx.strokeRect(-boxW / 2 - 4, -boxH / 2 - 4, boxW + 8, boxH + 8);
        }

        ctx.restore();

        if (isPreview) {
          renderedTextBoxes.push({
            clipId: clip.id,
            x: cx - boxW / 2 - 8,
            y: cy - boxH / 2 - 8,
            w: boxW + 16,
            h: boxH + 16,
          });
        }
      }
    }

    // Center snap guides when dragging text OR panning video
    if (isPreview && canvasDrag) {
      ctx.save();
      ctx.strokeStyle = 'rgba(240, 177, 75, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      if (canvasDrag.snapX) {
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
      }
      if (canvasDrag.snapY) {
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  function drawTransformedDrawable(ctx, drawable, dstW, dstH, rect, rotate, flipH) {
    ctx.save();
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    ctx.translate(cx, cy);
    if (flipH) ctx.scale(-1, 1);
    if (rotate) ctx.rotate((rotate * Math.PI) / 180);
    const rotated = rotate === 90 || rotate === 270;
    const drawW = rotated ? rect.h : rect.w;
    const drawH = rotated ? rect.w : rect.h;
    ctx.drawImage(drawable, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function sizePreviewCanvas() {
    const dims = E.getCanvasDimensions(project().aspect, '720');
    const box = el.stageViewport.getBoundingClientRect();
    const availW = Math.max(120, box.width - 32);
    const availH = Math.max(120, box.height - 32);
    const ratio = dims.width / dims.height;

    let frameW = availW;
    let frameH = frameW / ratio;
    if (frameH > availH) {
      frameH = availH;
      frameW = frameH * ratio;
    }
    const cssW = Math.floor(frameW);
    const cssH = Math.floor(frameH);
    el.canvasFrame.style.width = `${cssW}px`;
    el.canvasFrame.style.height = `${cssH}px`;

    // Match backing canvas to displayed size * min(dpr, 1.5), capped at 720p (export always uses full 720p/1080p).
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetW = E.clamp(Math.round(cssW * scale), Math.min(360, dims.width), dims.width);
    const targetH = Math.max(120, Math.round(targetW / ratio));
    if (el.previewCanvas.width !== targetW || el.previewCanvas.height !== targetH) {
      el.previewCanvas.width = targetW;
      el.previewCanvas.height = targetH;
      textLayoutCache.clear();
    }
    cachedTimelineWidth = el.timelineScroll.clientWidth || 720;
  }

  function renderPreview() {
    const t0 = performance.now();
    const hasClips = project().clips.length > 0;
    if (lastStageEmpty !== hasClips) {
      el.stageEmpty.hidden = hasClips;
      lastStageEmpty = hasClips;
    }
    renderFrame(previewCtx, el.previewCanvas.width, el.previewCanvas.height, playhead, { isPreview: true });
    updateTimecodeUI();
    updatePlayheadUI();
    const dt = performance.now() - t0;
    perf.previewFrames += 1;
    perf.lastFrameMs = Math.round(dt * 100) / 100;
    perf.avgFrameMs = perf.previewFrames === 1
      ? perf.lastFrameMs
      : Math.round((perf.avgFrameMs * 0.9 + dt * 0.1) * 100) / 100;
  }

  function schedulePreviewRender() {
    if (playing || previewRafId) return;
    previewRafId = requestAnimationFrame(() => {
      previewRafId = 0;
      renderPreview();
    });
  }

  // ── Playback Loop ─────────────────────────────────────────
  function startPlayback() {
    const total = E.computeProjectDuration(project().clips);
    if (total <= 0) {
      showToast('Add a clip or load the demo reel first');
      return;
    }
    closeTransitionPopover();
    ensureAudioContext();
    if (playhead >= total - 0.05) {
      playhead = 0;
    }
    playing = true;
    playStartWall = performance.now();
    playStartTime = playhead;
    el.playBtn.setAttribute('aria-pressed', 'true');
    el.playBtn.setAttribute('aria-label', 'Pause');
    scheduleAllAudioFrom(playhead);
    syncVideosToTime(playhead, true);
    markActiveTool();
    rafId = requestAnimationFrame(playbackTick);
  }

  function pausePlayback() {
    if (!playing) return;
    playing = false;
    cancelAnimationFrame(rafId);
    stopScheduledAudio();
    pauseAllPoolVideos();
    el.playBtn.setAttribute('aria-pressed', 'false');
    el.playBtn.setAttribute('aria-label', 'Play');
    syncVideosToTime(playhead, false);
    renderPreview();
  }

  function togglePlayback() {
    if (playing) pausePlayback();
    else startPlayback();
  }

  function playbackTick(now) {
    if (!playing) return;
    const total = E.computeProjectDuration(project().clips);
    const elapsed = (now - playStartWall) / 1000;
    playhead = playStartTime + elapsed;

    if (playhead >= total) {
      playhead = total;
      pausePlayback();
      return;
    }

    syncVideosToTime(playhead, true);
    renderPreview();
    autoScrollPlayhead();
    rafId = requestAnimationFrame(playbackTick);
  }

  function seekTo(sec) {
    const total = Math.max(0, E.computeProjectDuration(project().clips));
    playhead = E.roundTime(E.clamp(sec, 0, Math.max(total, sec >= 0 ? sec : 0)));
    if (playing) {
      playStartWall = performance.now();
      playStartTime = playhead;
      scheduleAllAudioFrom(playhead);
      syncVideosToTime(playhead, true);
    } else {
      syncVideosToTime(playhead, false);
    }
    renderPreview();
  }

  function autoScrollPlayhead() {
    const x = playhead * pxPerSec;
    const viewL = el.timelineScroll.scrollLeft;
    const viewR = viewL + cachedTimelineWidth;
    if (x > viewR - 40) {
      el.timelineScroll.scrollLeft = x - 80;
    } else if (x < viewL) {
      el.timelineScroll.scrollLeft = Math.max(0, x - 40);
    }
  }

  // ── UI Rendering: Media Bin & Caption Cards ───────────────
  function buildCaptionPresetCards() {
    el.captionCards.innerHTML = '';
    for (const [key, def] of Object.entries(E.TEXT_PRESETS)) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'caption-card';

      const sample = document.createElement('span');
      sample.className = 'caption-sample';
      sample.textContent = def.uppercase ? def.label.toUpperCase() : def.label;
      sample.style.fontFamily = def.fontFamily;
      sample.style.fontWeight = String(def.fontWeight);
      sample.style.color = def.color;
      sample.style.background = def.bgColor && def.bgColor !== 'transparent' ? def.bgColor : 'rgba(20,22,28,0.85)';
      if (def.radius) sample.style.borderRadius = `${Math.min(def.radius, 999)}px`;
      if (def.strokeColor) sample.style.textShadow = `0 1px 2px ${def.strokeColor}`;

      const tag = document.createElement('span');
      tag.className = 'caption-card-name';
      tag.textContent = '+ Add';

      card.append(sample, tag);
      card.addEventListener('click', () => addTextAtPlayhead(key));
      el.captionCards.appendChild(card);
    }
  }

  function renderMediaBin() {
    perf.mediaBinRebuilds += 1;
    if (!mediaMap.size) {
      el.mediaList.innerHTML = '<p class="empty-note">Imported files stay in your browser. Click any item to append it to the timeline.</p>';
      return;
    }

    el.mediaList.innerHTML = '';
    for (const media of mediaMap.values()) {
      const item = document.createElement('div');
      item.className = 'media-item';
      item.setAttribute('role', 'listitem');
      item.title = `Click to add "${media.name}" to the timeline`;

      const thumb = document.createElement('div');
      thumb.className = 'media-thumb';
      if (media.thumbs && media.thumbs.length) {
        const img = document.createElement('img');
        img.src = media.thumbs[0];
        img.alt = '';
        thumb.appendChild(img);
      } else {
        thumb.textContent = media.kind === 'audio' ? '♪' : 'VID';
      }

      const info = document.createElement('div');
      info.className = 'media-info';
      const name = document.createElement('div');
      name.className = 'media-name';
      name.textContent = media.name;
      const meta = document.createElement('div');
      meta.className = 'media-meta';
      const kindLabel = media.kind === 'image' ? 'IMG' : media.kind === 'audio' ? 'AUD' : 'VID';
      meta.textContent = `${kindLabel} · ${E.formatTimecode(media.duration)}`;
      info.append(name, meta);

      const btns = document.createElement('div');
      btns.className = 'media-item-btns';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'media-del';
      delBtn.textContent = '×';
      delBtn.title = `Remove ${media.name} from library`;
      delBtn.setAttribute('aria-label', `Remove ${media.name}`);
      delBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const used = project().clips.some((c) => c.mediaId === media.id);
        if (used && !window.confirm(`"${media.name}" is used on the timeline. Remove it and its clips?`)) return;
        // Keep in session cache so Undo can cleanly restore the media alongside its clips.
        deletedMediaCache.set(media.id, media);
        mediaMap.delete(media.id);
        Store?.deleteMediaRecord(media.id);
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
      });

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'media-add';
      addBtn.textContent = '+';
      addBtn.setAttribute('aria-label', `Add ${media.name} to timeline`);

      btns.append(delBtn, addBtn);
      item.append(thumb, info, btns);
      item.addEventListener('click', () => {
        appendMediaToTimeline(media);
        showToast(`Added "${media.name}"`);
      });

      el.mediaList.appendChild(item);
    }
  }

  // ── UI Rendering: Timeline, Ruler & Seam Transitions ──────
  function getTimelineDurationSpan() {
    const projDur = E.computeProjectDuration(project().clips);
    const minFromWidth = cachedTimelineWidth / pxPerSec;
    return Math.max(projDur + 8, minFromWidth, 16);
  }

  function renderRuler(force = false) {
    const spanSec = Math.ceil(getTimelineDurationSpan());
    const widthPx = Math.ceil(spanSec * pxPerSec);
    const viewW = Math.max(1, Math.min(widthPx, Math.min(4096, Math.ceil(el.timelineScroll.clientWidth || cachedTimelineWidth || 720))));
    const scrollLeft = Math.max(0, Math.round(el.timelineScroll.scrollLeft || 0));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const themeAttr = document.documentElement.dataset.theme || '';
    const key = `${widthPx}|${viewW}|${scrollLeft}|${pxPerSec}|${dpr}|${themeAttr}`;
    if (!force && key === lastRulerKey) return;
    lastRulerKey = key;
    perf.rulerRebuilds += 1;

    el.timelineContent.style.width = `${widthPx}px`;

    const h = 28;
    const backingW = Math.max(1, Math.floor(viewW * dpr));
    const backingH = Math.floor(h * dpr);
    if (el.rulerCanvas.width !== backingW || el.rulerCanvas.height !== backingH) {
      el.rulerCanvas.width = backingW;
      el.rulerCanvas.height = backingH;
    }
    el.rulerCanvas.style.width = `${viewW}px`;
    el.rulerCanvas.style.height = `${h}px`;

    const ctx = el.rulerCanvas.getContext('2d');
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewW, h);

    const style = getComputedStyle(document.documentElement);
    const inkSoft = style.getPropertyValue('--ink-soft').trim() || '#888';
    const lineStrong = style.getPropertyValue('--line-strong').trim() || '#444';

    const majorStep = E.chooseRulerStep(pxPerSec);
    const subDiv = majorStep >= 10 ? 5 : 4;
    const minorStep = majorStep / subDiv;

    ctx.strokeStyle = lineStrong;
    ctx.fillStyle = inkSoft;
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textBaseline = 'top';

    const totalSteps = Math.ceil(spanSec / minorStep);
    const firstStep = Math.max(0, Math.floor((scrollLeft - 80) / (minorStep * pxPerSec)));
    const lastStep = Math.min(totalSteps, Math.ceil((scrollLeft + viewW + 80) / (minorStep * pxPerSec)));
    for (let i = firstStep; i <= lastStep; i++) {
      const t = i * minorStep;
      const x = Math.round(t * pxPerSec - scrollLeft) + 0.5;
      const isMajor = i % subDiv === 0;
      ctx.beginPath();
      ctx.moveTo(x, isMajor ? 14 : 20);
      ctx.lineTo(x, h);
      ctx.stroke();

      if (isMajor) {
        ctx.fillText(E.formatTimecode(t, majorStep < 1), x + 4, 4);
      }
    }
    ctx.restore();
  }

  function renderTimelineClips() {
    perf.timelineRebuilds += 1;
    el.laneText.innerHTML = '';
    el.laneVideo.innerHTML = '';
    el.laneAudio.innerHTML = '';

    el.laneText.classList.toggle('is-muted', trackMuted.text);
    el.laneVideo.classList.toggle('is-muted', trackMuted.video);
    el.laneAudio.classList.toggle('is-muted', trackMuted.audio);

    const lanes = { text: el.laneText, video: el.laneVideo, audio: el.laneAudio };
    const selectedId = project().selectedClipId;

    for (const clip of project().clips) {
      const lane = lanes[clip.track];
      if (!lane) continue;

      const block = document.createElement('div');
      block.className = 'clip-block';
      if (clip.id === selectedId) block.classList.add('selected');
      block.dataset.clipId = clip.id;
      block.dataset.track = clip.track;
      block.style.left = `${clip.start * pxPerSec}px`;
      block.style.width = `${Math.max(14, clip.duration * pxPerSec)}px`;

      const media = clip.mediaId ? mediaMap.get(clip.mediaId) : null;

      // Video/Image filmstrip preview
      if (clip.track === 'video' && media && media.thumbs && media.thumbs.length) {
        const strip = document.createElement('div');
        strip.className = 'clip-strip';
        const thumbCount = Math.max(1, Math.min(12, Math.ceil((clip.duration * pxPerSec) / 56)));
        for (let i = 0; i < thumbCount; i++) {
          const img = document.createElement('img');
          const idx = Math.floor((i / thumbCount) * media.thumbs.length);
          img.src = media.thumbs[idx];
          img.alt = '';
          img.draggable = false;
          strip.appendChild(img);
        }
        block.appendChild(strip);

        // Mini audio waveform along bottom edge of real video clips with audio
        if (media.peaks && !clip.muted) {
          const miniWave = document.createElement('canvas');
          miniWave.className = 'clip-mini-wave';
          miniWave.width = E.clamp(Math.round(clip.duration * pxPerSec), 24, 4096);
          miniWave.height = 16;
          drawClipWaveform(miniWave, media.peaks, clip, 'rgba(255, 255, 255, 0.48)');
          block.appendChild(miniWave);
        }
      }

      // Audio track waveform canvas
      if (clip.track === 'audio' && media && media.peaks) {
        const wave = document.createElement('canvas');
        wave.className = 'clip-wave';
        wave.width = E.clamp(Math.round(clip.duration * pxPerSec), 24, 4096);
        wave.height = 42;
        drawClipWaveform(wave, media.peaks, clip, 'rgba(229, 241, 252, 0.45)');
        block.appendChild(wave);
      }

      // Label + speed/mute/filter pill
      const label = document.createElement('div');
      label.className = 'clip-label';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'clip-name';
      nameSpan.textContent = clip.track === 'text' ? (clip.text || 'Text') : clip.name;
      label.appendChild(nameSpan);

      const badges = [];
      if (clip.speed && clip.speed !== 1) badges.push(`${clip.speed}×`);
      if (clip.muted) badges.push('M');
      if (clip.filter && clip.filter !== 'none') badges.push(E.FILTERS[clip.filter]?.label || '');
      if (clip.kenBurns && clip.kenBurns !== 'none') badges.push(E.KEN_BURNS[clip.kenBurns]?.label || '');
      if (badges.length) {
        const pill = document.createElement('span');
        pill.className = 'clip-pill';
        pill.textContent = badges.filter(Boolean).join(' · ');
        label.appendChild(pill);
      }
      block.appendChild(label);

      // Trim handles
      const leftH = document.createElement('div');
      leftH.className = 'trim-handle trim-left';
      leftH.dataset.handle = 'left';
      const rightH = document.createElement('div');
      rightH.className = 'trim-handle trim-right';
      rightH.dataset.handle = 'right';
      block.append(leftH, rightH);

      block.addEventListener('pointerdown', (ev) => onClipPointerDown(ev, clip.id));
      lane.appendChild(block);
    }

    // Render clickable Transition Diamonds on adjacent video clip seams
    const seams = E.getAdjacentVideoSeams(project().clips);
    for (const seam of seams) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'seam-btn';
      const hasTransition = seam.transition && seam.transition.type !== 'none';
      if (hasTransition) btn.classList.add('active');
      btn.style.left = `${seam.time * pxPerSec}px`;
      const trLabel = E.TRANSITIONS[seam.transition?.type || 'none']?.label || 'Cut';
      btn.title = `Transition: ${trLabel} (click to edit)`;
      btn.setAttribute('aria-label', `Edit transition (${trLabel})`);
      btn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        openTransitionPopover(seam.nextId, btn);
      });
      el.laneVideo.appendChild(btn);
    }

    updateTimelineButtons();
  }

  function drawClipWaveform(canvas, peaks, clip, fillStyle) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const mediaDur = Math.max(0.1, clip.mediaDuration || 1);
    const startFrac = E.clamp((clip.sourceStart || 0) / mediaDur, 0, 1);
    const endFrac = E.clamp(((clip.sourceStart || 0) + clip.duration * (clip.speed || 1)) / mediaDur, startFrac, 1);

    ctx.fillStyle = fillStyle;
    const barW = 2;
    const gap = 2;
    const count = Math.max(4, Math.floor(w / (barW + gap)));

    for (let i = 0; i < count; i++) {
      const frac = startFrac + (i / count) * (endFrac - startFrac);
      const peakIdx = Math.min(peaks.length - 1, Math.floor(frac * peaks.length));
      const amp = peaks[peakIdx] || 0.1;
      const barH = Math.max(2, amp * (h - 4));
      ctx.fillRect(i * (barW + gap), (h - barH) / 2, barW, barH);
    }
  }

  function updatePlayheadUI() {
    const x = Math.round(playhead * pxPerSec * 2) / 2;
    if (x !== lastPlayheadPx) {
      el.playhead.style.transform = `translate3d(${x}px, 0, 0)`;
      lastPlayheadPx = x;
    }
    const splitDisabled = !E.findClipToSplit(project().clips, project().selectedClipId, playhead);
    if (splitDisabled !== lastSplitDisabled) {
      el.splitBtn.disabled = splitDisabled;
      lastSplitDisabled = splitDisabled;
    }
  }

  function updateTimecodeUI() {
    const curStr = E.formatTimecode(playhead);
    if (curStr !== lastTimeStr) {
      el.timeCurrent.textContent = curStr;
      lastTimeStr = curStr;
    }
    const total = E.computeProjectDuration(project().clips);
    const totStr = E.formatTimecode(total);
    if (totStr !== lastTotalStr) {
      el.timeTotal.textContent = totStr;
      lastTotalStr = totStr;
    }
  }

  function updateTimelineButtons() {
    const sel = getSelectedClip();
    const splitDisabled = !E.findClipToSplit(project().clips, project().selectedClipId, playhead);
    el.splitBtn.disabled = splitDisabled;
    lastSplitDisabled = splitDisabled;
    el.dupBtn.disabled = !sel;
    el.delBtn.disabled = !sel;
    el.closeGapsBtn.disabled = !project().clips.some((c) => c.track === 'video');
    el.snapBtn.setAttribute('aria-pressed', String(project().snap));
  }

  // ── Transition Seam Popover ───────────────────────────────
  function openTransitionPopover(clipId, anchorEl) {
    const clip = project().clips.find((c) => c.id === clipId);
    if (!clip) return;
    activeSeamClipId = clipId;

    const tr = clip.transitionIn || { type: 'none', duration: 0.45 };
    el.transPopGrid.innerHTML = '';
    for (const [key, def] of Object.entries(E.TRANSITIONS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.dataset.trans = key;
      btn.textContent = def.label;
      btn.setAttribute('aria-pressed', String(key === (tr.type || 'none')));
      btn.addEventListener('click', () => {
        const liveClip = project().clips.find((c) => c.id === clipId);
        const dur = Number(el.transPopDur.value) || liveClip?.transitionIn?.duration || 0.45;
        commitState((p) => ({
          ...p,
          clips: p.clips.map((c) => (c.id === clipId ? { ...c, transitionIn: { type: key, duration: dur } } : c)),
          selectedClipId: clipId,
        }));
        el.transPopGrid.querySelectorAll('.filter-chip').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        // Seek into the middle of the transition so the user sees it immediately!
        if (key !== 'none' && liveClip) {
          seekTo(liveClip.start + Math.min(dur * 0.5, liveClip.duration * 0.4));
        }
      });
      el.transPopGrid.appendChild(btn);
    }

    el.transPopDur.value = String(tr.duration || 0.45);
    el.transPopDurOut.textContent = `${(tr.duration || 0.45).toFixed(2)}s`;

    el.transPopover.hidden = false;
    const rect = anchorEl.getBoundingClientRect();
    const popW = 224;
    const popH = el.transPopover.offsetHeight || 168;
    const left = E.clamp(rect.left + rect.width / 2 - popW / 2, 10, window.innerWidth - popW - 10);
    const top = Math.max(10, rect.top - popH - 12);
    el.transPopover.style.left = `${Math.round(left)}px`;
    el.transPopover.style.top = `${Math.round(top)}px`;
  }

  function closeTransitionPopover() {
    el.transPopover.hidden = true;
    activeSeamClipId = null;
  }

  // ── Clip Dragging & Trimming on Timeline ──────────────────
  function showDragTip(clientX, clientY, text) {
    el.dragTip.textContent = text;
    el.dragTip.style.transform = `translate3d(${Math.round(clientX)}px, ${Math.round(clientY)}px, 0) translate(-50%, -125%)`;
    el.dragTip.hidden = false;
  }

  function hideDragTip() {
    el.dragTip.hidden = true;
  }

  function onClipPointerDown(ev, clipId) {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    closeTransitionPopover();

    const handle = ev.target.closest('.trim-handle')?.dataset.handle || 'move';
    const blockEl = ev.currentTarget;
    const clip = project().clips.find((c) => c.id === clipId);
    if (!clip) return;

    selectClip(clipId);

    const startX = ev.clientX;
    const origClip = { ...clip };
    const beforeSnapshot = snapshotForUndo();
    const snapTargets = E.getSnapTargets(project().clips, clipId, playhead);
    const snapThresh = 10 / pxPerSec;
    let moved = false;

    const onMove = (moveEv) => {
      const dx = moveEv.clientX - startX;
      if (!moved && Math.abs(dx) < 3) return;
      moved = true;
      const dt = dx / pxPerSec;
      let snappedAt = null;
      let updatedClip = origClip;
      const snapOn = project().snap;

      if (handle === 'move') {
        const proposed = Math.max(0, origClip.start + dt);
        if (snapOn) {
          const res = E.snapMoveStart(proposed, origClip.duration, snapTargets, snapThresh);
          snappedAt = res.snappedTo;
          updatedClip = { ...origClip, start: res.start };
        } else {
          updatedClip = { ...origClip, start: E.roundTime(proposed) };
        }
      } else if (handle === 'left') {
        let proposedStart = origClip.start + dt;
        if (snapOn) {
          for (const t of snapTargets) {
            if (Math.abs(proposedStart - t) < snapThresh) {
              proposedStart = t;
              snappedAt = t;
              break;
            }
          }
        }
        updatedClip = E.trimClipLeft(origClip, proposedStart);
      } else {
        let proposedEnd = origClip.start + origClip.duration + dt;
        if (snapOn) {
          for (const t of snapTargets) {
            if (Math.abs(proposedEnd - t) < snapThresh) {
              proposedEnd = t;
              snappedAt = t;
              break;
            }
          }
        }
        updatedClip = E.trimClipRight(origClip, proposedEnd);
      }

      // Direct single-element DOM update + rAF preview (zero timeline DOM rebuilds while dragging!)
      patchClipLive(clipId, () => updatedClip);
      blockEl.style.left = `${updatedClip.start * pxPerSec}px`;
      blockEl.style.width = `${Math.max(14, updatedClip.duration * pxPerSec)}px`;
      el.inspectorMeta.textContent = E.formatTimecode(updatedClip.duration);

      showDragTip(
        moveEv.clientX,
        moveEv.clientY,
        `${E.formatTimecode(updatedClip.start)} · ${updatedClip.duration.toFixed(1)}s`
      );

      if (snappedAt !== null) {
        el.snapLine.style.transform = `translate3d(${Math.round(snappedAt * pxPerSec)}px, 0, 0)`;
        el.snapLine.hidden = false;
      } else {
        el.snapLine.hidden = true;
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.snapLine.hidden = true;
      hideDragTip();
      if (moved) {
        if (origClip.track === 'video') {
          history = {
            ...history,
            present: {
              ...project(),
              clips: E.resolveVideoTrackOverlap(project().clips, clipId, { preserveOrder: handle === 'right' }),
            },
          };
        }
        commitFromSnapshot(beforeSnapshot);
        onStateChanged();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  // ── Ruler Scrubbing ───────────────────────────────────────
  function scrubFromPointerEvent(ev) {
    const rect = el.timelineContent.getBoundingClientRect();
    const x = Math.max(0, ev.clientX - rect.left);
    seekTo(x / pxPerSec);
  }

  function setupRulerScrub(targetEl) {
    targetEl.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      closeTransitionPopover();
      const wasPlaying = playing;
      if (wasPlaying) pausePlayback();
      scrubFromPointerEvent(ev);

      const onMove = (m) => scrubFromPointerEvent(m);
      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        if (wasPlaying) startPlayback();
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    });
  }

  // ── Canvas Direct Text Dragging & Video Reframing ─────────
  function canvasEventToCoords(ev) {
    const rect = el.previewCanvas.getBoundingClientRect();
    const sx = el.previewCanvas.width / Math.max(1, rect.width);
    const sy = el.previewCanvas.height / Math.max(1, rect.height);
    return {
      x: (ev.clientX - rect.left) * sx,
      y: (ev.clientY - rect.top) * sy,
    };
  }

  el.previewCanvas.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 || !project().clips.length) return;
    closeTransitionPopover();
    const pt = canvasEventToCoords(ev);

    // 1. Try top-most visible text overlay first
    for (let i = renderedTextBoxes.length - 1; i >= 0; i--) {
      const box = renderedTextBoxes[i];
      if (pt.x >= box.x && pt.x <= box.x + box.w && pt.y >= box.y && pt.y <= box.y + box.h) {
        const clip = project().clips.find((c) => c.id === box.clipId);
        if (!clip) continue;
        selectClip(clip.id);
        const beforeSnapshot = snapshotForUndo();
        const cx = (clip.x ?? 0.5) * el.previewCanvas.width;
        const cy = (clip.y ?? 0.78) * el.previewCanvas.height;
        canvasDrag = {
          mode: 'text',
          clipId: clip.id,
          offsetX: pt.x - cx,
          offsetY: pt.y - cy,
          snapX: false,
          snapY: false,
          moved: false,
          beforeSnapshot,
        };
        el.previewCanvas.setPointerCapture?.(ev.pointerId);
        return;
      }
    }

    // 2. Otherwise pan/reframe the active video/image clip!
    const activeVideo = E.getActiveClipsAt(project().clips, playhead).video;
    if (activeVideo) {
      selectClip(activeVideo.id);
      canvasDrag = {
        mode: 'video',
        clipId: activeVideo.id,
        startPtX: pt.x,
        startPtY: pt.y,
        origOffX: activeVideo.offsetX || 0,
        origOffY: activeVideo.offsetY || 0,
        snapX: false,
        snapY: false,
        moved: false,
        beforeSnapshot: snapshotForUndo(),
      };
      el.previewCanvas.setPointerCapture?.(ev.pointerId);
    }
  });

  el.previewCanvas.addEventListener('pointermove', (ev) => {
    const pt = canvasEventToCoords(ev);
    if (!canvasDrag) {
      const hitText = renderedTextBoxes.some((b) => pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h);
      const hasActiveVideo = Boolean(E.getActiveClipsAt(project().clips, playhead).video);
      el.previewCanvas.style.cursor = hitText ? 'move' : hasActiveVideo ? 'grab' : 'default';
      return;
    }

    canvasDrag.moved = true;
    if (canvasDrag.mode === 'text') {
      let nx = E.clamp((pt.x - canvasDrag.offsetX) / el.previewCanvas.width, 0.06, 0.94);
      let ny = E.clamp((pt.y - canvasDrag.offsetY) / el.previewCanvas.height, 0.06, 0.94);
      canvasDrag.snapX = Math.abs(nx - 0.5) < 0.025;
      canvasDrag.snapY = Math.abs(ny - 0.5) < 0.025;
      if (canvasDrag.snapX) nx = 0.5;
      if (canvasDrag.snapY) ny = 0.5;
      patchClipLive(canvasDrag.clipId, (c) => ({ ...c, x: nx, y: ny }));
    } else if (canvasDrag.mode === 'video') {
      el.previewCanvas.style.cursor = 'grabbing';
      const dx = (pt.x - canvasDrag.startPtX) / el.previewCanvas.width;
      const dy = (pt.y - canvasDrag.startPtY) / el.previewCanvas.height;
      let ox = E.clamp(canvasDrag.origOffX + dx, -0.8, 0.8);
      let oy = E.clamp(canvasDrag.origOffY + dy, -0.8, 0.8);
      canvasDrag.snapX = Math.abs(ox) < 0.025;
      canvasDrag.snapY = Math.abs(oy) < 0.025;
      if (canvasDrag.snapX) ox = 0;
      if (canvasDrag.snapY) oy = 0;
      patchClipLive(canvasDrag.clipId, (c) => ({ ...c, offsetX: ox, offsetY: oy }));
    }
  });

  const endCanvasDrag = () => {
    if (!canvasDrag) return;
    const { moved, beforeSnapshot } = canvasDrag;
    canvasDrag = null;
    if (moved) commitFromSnapshot(beforeSnapshot);
    renderPreview();
  };
  el.previewCanvas.addEventListener('pointerup', endCanvasDrag);
  el.previewCanvas.addEventListener('pointercancel', endCanvasDrag);

  // Wheel over preview canvas smoothly zooms active video/image
  el.previewCanvas.addEventListener('wheel', (ev) => {
    const activeVideo = E.getActiveClipsAt(project().clips, playhead).video;
    if (!activeVideo) return;
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 0.06 : -0.06;
    const nextZoom = E.roundTime(E.clamp((activeVideo.zoom || 1) + delta, 0.5, 2.5));
    commitState((p) => ({
      ...p,
      clips: p.clips.map((c) => (c.id === activeVideo.id ? { ...c, zoom: nextZoom } : c)),
      selectedClipId: activeVideo.id,
    }));
  }, { passive: false });

  el.previewCanvas.addEventListener('dblclick', (ev) => {
    const pt = canvasEventToCoords(ev);
    for (let i = renderedTextBoxes.length - 1; i >= 0; i--) {
      const b = renderedTextBoxes[i];
      if (pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) {
        el.tContent.focus();
        el.tContent.select();
        return;
      }
    }
  });

  // ── UI Rendering: Context-Sensitive Inspector ─────────────
  function buildInspectorGrids() {
    el.vFilterGrid.innerHTML = '';
    for (const [key, def] of Object.entries(E.FILTERS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.dataset.filter = key;
      btn.textContent = def.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        const sel = getSelectedClip();
        if (!sel || sel.track !== 'video') return;
        commitState((p) => ({
          ...p,
          clips: p.clips.map((c) => (c.id === sel.id ? { ...c, filter: key } : c)),
        }));
      });
      el.vFilterGrid.appendChild(btn);
    }

    el.vTransGrid.innerHTML = '';
    for (const [key, def] of Object.entries(E.TRANSITIONS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.dataset.trans = key;
      btn.textContent = def.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        const sel = getSelectedClip();
        if (!sel || sel.track !== 'video') return;
        const dur = sel.transitionIn?.duration || 0.45;
        commitState((p) => ({
          ...p,
          clips: p.clips.map((c) => (c.id === sel.id ? { ...c, transitionIn: { type: key, duration: dur } } : c)),
        }));
      });
      el.vTransGrid.appendChild(btn);
    }

    el.vKenBurnsGrid.innerHTML = '';
    for (const [key, def] of Object.entries(E.KEN_BURNS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.dataset.kb = key;
      btn.textContent = def.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        const sel = getSelectedClip();
        if (!sel || sel.track !== 'video') return;
        commitState((p) => ({
          ...p,
          clips: p.clips.map((c) => (c.id === sel.id ? { ...c, kenBurns: key } : c)),
        }));
      });
      el.vKenBurnsGrid.appendChild(btn);
    }

    el.tPresetGrid.innerHTML = '';
    for (const [key, def] of Object.entries(E.TEXT_PRESETS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.dataset.preset = key;
      btn.textContent = def.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => {
        const sel = getSelectedClip();
        if (!sel || sel.track !== 'text') return;
        commitState((p) => ({
          ...p,
          clips: p.clips.map((c) => (c.id === sel.id ? { ...c, preset: key, color: '', bgColor: '' } : c)),
        }));
      });
      el.tPresetGrid.appendChild(btn);
    }
  }

  function renderInspector() {
    const p = project();
    const sel = getSelectedClip();

    for (const btn of el.aspectGroup.querySelectorAll('.seg-btn')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.aspect === p.aspect));
    }

    el.inspProject.hidden = Boolean(sel);
    el.inspVideo.hidden = !sel || sel.track !== 'video';
    el.inspText.hidden = !sel || sel.track !== 'text';
    el.inspAudio.hidden = !sel || sel.track !== 'audio';

    if (!sel) {
      el.inspectorTitle.textContent = 'Canvas';
      el.inspectorMeta.textContent = p.aspect;
      el.bgColorInput.value = p.bgColor || '#0e0f12';
      for (const sw of el.bgSwatches.querySelectorAll('.swatch')) {
        sw.setAttribute('aria-pressed', String(sw.dataset.color === p.bgColor));
      }
      return;
    }

    if (sel.track === 'video') {
      el.inspectorTitle.textContent = sel.kind === 'image' ? 'Photo' : 'Video Clip';
      el.inspectorMeta.textContent = `${E.formatTimecode(sel.duration)}`;

      const isImage = sel.kind === 'image';
      const media = mediaMap.get(sel.mediaId);
      el.vSpeedGroup.hidden = isImage;
      el.vAudioGroup.hidden = isImage || sel.kind === 'procedural';
      el.vExtractAudioBtn.hidden = !(media && media.audioBuffer);
      el.vMotionGroup.hidden = !isImage;

      const spd = sel.speed || 1;
      el.vSpeed.value = String(spd);
      el.vSpeedOut.textContent = `${spd.toFixed(2)}×`;
      for (const b of el.vSpeedPresets.querySelectorAll('.pill-btn')) {
        b.setAttribute('aria-pressed', String(Math.abs(Number(b.dataset.speed) - spd) < 0.01));
      }

      const volPct = Math.round((sel.volume ?? 1) * 100);
      el.vVol.value = String(volPct);
      el.vVolOut.textContent = `${volPct}%`;
      el.vMuteBtn.setAttribute('aria-pressed', String(Boolean(sel.muted)));
      el.vMuteBtn.textContent = sel.muted ? 'Muted' : 'Mute';

      el.vFitCover.setAttribute('aria-pressed', String((sel.fit || 'cover') === 'cover'));
      el.vFitContain.setAttribute('aria-pressed', String(sel.fit === 'contain'));
      el.vFlipBtn.setAttribute('aria-pressed', String(Boolean(sel.flipH)));
      el.vBlurRow.hidden = sel.fit !== 'contain';
      el.vBlurBg.checked = sel.blurBg !== false;

      const zoomPct = Math.round((sel.zoom || 1) * 100);
      el.vZoom.value = String(zoomPct);
      el.vZoomOut.textContent = `${zoomPct}%`;

      for (const btn of el.vKenBurnsGrid.querySelectorAll('.filter-chip')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.kb === (sel.kenBurns || 'none')));
      }

      for (const btn of el.vFilterGrid.querySelectorAll('.filter-chip')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.filter === (sel.filter || 'none')));
      }

      el.vBright.value = String(sel.brightness ?? 100);
      el.vBrightOut.textContent = `${sel.brightness ?? 100}%`;
      el.vContrast.value = String(sel.contrast ?? 100);
      el.vContrastOut.textContent = `${sel.contrast ?? 100}%`;
      el.vSat.value = String(sel.saturation ?? 100);
      el.vSatOut.textContent = `${sel.saturation ?? 100}%`;

      const tr = sel.transitionIn || { type: 'none', duration: 0.45 };
      for (const btn of el.vTransGrid.querySelectorAll('.filter-chip')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.trans === (tr.type || 'none')));
      }
      el.vTransDurWrap.hidden = !tr.type || tr.type === 'none';
      el.vTransDur.value = String(tr.duration || 0.45);
      el.vTransDurOut.textContent = `${(tr.duration || 0.45).toFixed(2)}s`;

      el.vFadeIn.value = String(sel.fadeIn || 0);
      el.vFadeInOut.textContent = `${(sel.fadeIn || 0).toFixed(1)}s`;
      el.vFadeOut.value = String(sel.fadeOut || 0);
      el.vFadeOutOut.textContent = `${(sel.fadeOut || 0).toFixed(1)}s`;
      return;
    }

    if (sel.track === 'text') {
      el.inspectorTitle.textContent = 'Caption';
      el.inspectorMeta.textContent = `${E.formatTimecode(sel.duration)}`;
      if (document.activeElement !== el.tContent) {
        el.tContent.value = sel.text || '';
      }
      for (const btn of el.tPresetGrid.querySelectorAll('.filter-chip')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.preset === (sel.preset || 'caption')));
      }
      for (const btn of el.tAnimRow.querySelectorAll('.pill-btn')) {
        btn.setAttribute('aria-pressed', String(btn.dataset.anim === (sel.animation || 'pop')));
      }
      el.tSize.value = String(sel.fontSize || 44);
      el.tSizeOut.textContent = `${sel.fontSize || 44}px`;

      const yMap = { top: 0.18, center: 0.5, bottom: 0.80 };
      const curY = sel.y ?? 0.78;
      for (const btn of el.tPosRow.querySelectorAll('.pill-btn')) {
        const targetY = yMap[btn.dataset.pos];
        btn.setAttribute('aria-pressed', String(targetY !== undefined && Math.abs(curY - targetY) < 0.08));
      }

      const preset = E.TEXT_PRESETS[sel.preset] || E.TEXT_PRESETS.caption;
      el.tColor.value = toHexColor(sel.color || preset.color, '#ffffff');
      el.tBg.value = toHexColor(sel.bgColor || preset.bgColor, '#121316');

      const textCount = p.clips.filter((c) => c.track === 'text').length;
      el.tApplyAllBtn.hidden = textCount < 2;
      return;
    }

    if (sel.track === 'audio') {
      el.inspectorTitle.textContent = 'Audio';
      el.inspectorMeta.textContent = `${E.formatTimecode(sel.duration)}`;
      const volPct = Math.round((sel.volume ?? 0.85) * 100);
      el.aVol.value = String(volPct);
      el.aVolOut.textContent = `${volPct}%`;
      el.aMuteBtn.setAttribute('aria-pressed', String(Boolean(sel.muted)));
      el.aMuteBtn.textContent = sel.muted ? 'Muted' : 'Mute';
      el.aFadeIn.value = String(sel.fadeIn || 0);
      el.aFadeInOut.textContent = `${(sel.fadeIn || 0).toFixed(1)}s`;
      el.aFadeOut.value = String(sel.fadeOut || 0);
      el.aFadeOutOut.textContent = `${(sel.fadeOut || 0).toFixed(1)}s`;
    }
  }

  function toHexColor(val, fallback) {
    if (typeof val === 'string' && /^#[0-9a-f]{6}$/i.test(val)) return val;
    return fallback;
  }

  // ── Core Timeline Actions ─────────────────────────────────
  function splitAtPlayhead() {
    const target = E.findClipToSplit(project().clips, project().selectedClipId, playhead);
    if (!target) {
      showToast('Move the red playhead inside a clip to split');
      return;
    }
    const res = E.splitClipAt(project().clips, target.id, playhead);
    if (!res) return;
    commitState((p) => ({
      ...p,
      clips: res.clips,
      selectedClipId: res.rightId,
    }));
    showToast('Split clip');
  }

  function duplicateSelected() {
    const sel = getSelectedClip();
    if (!sel) return;
    const copy = {
      ...sel,
      ...(sel.transitionIn ? { transitionIn: { type: 'none', duration: 0.45 } } : {}),
      id: E.makeId(sel.track[0]),
      start: E.roundTime(sel.start + sel.duration),
    };
    commitState((p) => {
      const next = p.clips.concat(copy);
      return {
        ...p,
        clips: copy.track === 'video' ? E.resolveVideoTrackOverlap(next, copy.id) : next,
        selectedClipId: copy.id,
      };
    });
    showToast('Duplicated clip');
  }

  function deleteSelected(ripple = false) {
    const sel = getSelectedClip();
    if (!sel) return;
    commitState((p) => ({
      ...p,
      clips: ripple ? E.rippleDeleteClip(p.clips, sel.id) : p.clips.filter((c) => c.id !== sel.id),
      selectedClipId: null,
    }));
    showToast(ripple ? 'Ripple deleted clip' : 'Deleted clip');
  }

  function closeVideoGaps() {
    const hasVideo = project().clips.some((c) => c.track === 'video');
    if (!hasVideo) return;
    commitState((p) => ({
      ...p,
      clips: E.closeGaps(p.clips, 'video'),
    }));
    showToast('Closed video gaps');
  }

  function fitTimelineZoom() {
    const total = E.computeProjectDuration(project().clips);
    const avail = Math.max(300, (el.timelineScroll.clientWidth || 720) - 48);
    if (total > 0) {
      pxPerSec = E.clamp(Math.round(avail / (total + 1.5)), 24, 220);
      el.zoomSlider.value = String(pxPerSec);
    }
    renderRuler();
    renderTimelineClips();
    updatePlayheadUI();
  }

  // ── Export Pipeline (100% Browser-Side with Live Preview) ─
  function pickExportMimeType() {
    if (typeof MediaRecorder === 'undefined') return null;
    const candidates = [
      { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4', label: 'MP4 (H.264)' },
      { mime: 'video/mp4', ext: 'mp4', label: 'MP4' },
      { mime: 'video/webm;codecs=vp9,opus', ext: 'webm', label: 'WebM (VP9)' },
      { mime: 'video/webm;codecs=vp8,opus', ext: 'webm', label: 'WebM (VP8)' },
      { mime: 'video/webm', ext: 'webm', label: 'WebM' },
    ];
    for (const c of candidates) {
      if (MediaRecorder.isTypeSupported(c.mime)) return c;
    }
    return { mime: '', ext: 'webm', label: 'WebM' };
  }

  function openExportModal() {
    flushPendingTextEdit();
    const total = E.computeProjectDuration(project().clips);
    if (total <= 0) {
      showToast('Add clips to the timeline before exporting');
      return;
    }
    pausePlayback();
    closeTransitionPopover();
    updateExportSummary();
    el.exportOptions.hidden = false;
    el.exportProgressBox.hidden = true;
    el.exportDoneBox.hidden = true;
    el.exportStartBtn.hidden = false;
    el.exportStartBtn.disabled = false;
    el.exportCancelBtn.textContent = 'Close';
    el.exportModal.hidden = false;
  }

  function updateExportSummary() {
    const dims = E.getCanvasDimensions(project().aspect, exportSettings.res);
    const total = E.computeProjectDuration(project().clips);
    const fmt = pickExportMimeType();
    el.exportDims.textContent = `${dims.width} × ${dims.height}`;
    el.exportDur.textContent = E.formatTimecode(total);
    el.exportFmt.textContent = fmt ? fmt.label : 'Unsupported';
    el.exportStartBtn.disabled = !fmt;
  }

  async function preseekAllVideosForExport() {
    const tasks = [];
    for (const clip of project().clips) {
      if (clip.track !== 'video' || clip.kind !== 'video') continue;
      const entry = videoPool.get(clip.id);
      if (!entry) continue;
      const video = entry.video;
      try { if (!video.paused) video.pause(); } catch {}
      const target = E.clamp(
        clip.sourceStart || 0,
        0,
        Math.max(0, (video.duration || clip.mediaDuration || 100) - 0.04)
      );
      if (video.readyState >= 2 && Math.abs((video.currentTime || 0) - target) <= 0.03) continue;
      tasks.push(new Promise((resolve) => {
        const timer = setTimeout(() => {
          video.removeEventListener('seeked', done);
          video.removeEventListener('canplay', done);
          resolve();
        }, 800);
        const done = () => {
          clearTimeout(timer);
          video.removeEventListener('seeked', done);
          video.removeEventListener('canplay', done);
          resolve();
        };
        video.addEventListener('seeked', done, { once: true });
        if (video.readyState < 2) video.addEventListener('canplay', done, { once: true });
        try { video.currentTime = target; } catch { done(); }
      }));
    }
    if (tasks.length) await Promise.all(tasks);
  }

  async function startExport() {
    const total = E.computeProjectDuration(project().clips);
    if (total <= 0) return;

    const fmt = pickExportMimeType();
    if (!fmt) {
      showToast('MediaRecorder is not supported in this browser');
      return;
    }

    const ctx = ensureAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }
    const dims = E.getCanvasDimensions(project().aspect, exportSettings.res);
    const fps = exportSettings.fps;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = dims.width;
    exportCanvas.height = dims.height;
    const exportCtx = exportCanvas.getContext('2d', { alpha: false });

    // Size miniature live export preview canvas proportionally
    const maxPrev = 180;
    const ratio = dims.width / dims.height;
    const prevH = ratio >= 1 ? Math.round(maxPrev / ratio) : maxPrev;
    const prevW = ratio >= 1 ? maxPrev : Math.round(maxPrev * ratio);
    el.exportPreviewCanvas.width = Math.max(80, prevW * 2);
    el.exportPreviewCanvas.height = Math.max(80, prevH * 2);
    const miniCtx = el.exportPreviewCanvas.getContext('2d', { alpha: false });

    el.exportOptions.hidden = true;
    el.exportProgressBox.hidden = false;
    el.exportDoneBox.hidden = true;
    el.exportStartBtn.hidden = true;
    el.exportStartBtn.disabled = true;
    el.exportCancelBtn.textContent = 'Cancel';
    el.exportBar.style.width = '0%';
    el.exportPct.textContent = '0%';
    el.exportStatus.textContent = 'Preparing media…';

    let exportDest = null;
    const prevSpeakerGain = speakerGain ? speakerGain.gain.value : 1;
    if (ctx && mixBus) {
      exportDest = ctx.createMediaStreamDestination();
      mixBus.connect(exportDest);
      speakerGain.gain.value = 0;
    }

    await preseekAllVideosForExport();
    syncVideosToTime(0, false);

    const videoStream = exportCanvas.captureStream(fps);
    const tracks = [...videoStream.getVideoTracks()];
    if (exportDest) {
      for (const at of exportDest.stream.getAudioTracks()) tracks.push(at);
    }
    const combinedStream = new MediaStream(tracks);

    const recorderOpts = {
      videoBitsPerSecond: exportSettings.res === '1080' ? 9_500_000 : 5_500_000,
    };
    if (fmt.mime) recorderOpts.mimeType = fmt.mime;

    let recorder;
    try {
      recorder = new MediaRecorder(combinedStream, recorderOpts);
    } catch {
      recorder = new MediaRecorder(combinedStream);
    }

    const chunks = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    let cancelled = false;
    let exportRaf = 0;

    const cleanup = () => {
      cancelAnimationFrame(exportRaf);
      stopScheduledAudio();
      pauseAllPoolVideos();
      if (exportDest && mixBus) {
        try { mixBus.disconnect(exportDest); } catch {}
      }
      if (speakerGain) speakerGain.gain.value = prevSpeakerGain;
      for (const t of combinedStream.getTracks()) t.stop();
      exportAbort = null;
    };

    exportAbort = () => {
      cancelled = true;
      try { if (recorder.state !== 'inactive') recorder.stop(); } catch {}
      cleanup();
      el.exportModal.hidden = true;
      showToast('Export cancelled');
    };

    recorder.onstop = () => {
      cleanup();
      if (cancelled) return;

      const actualMime = recorder.mimeType || fmt.mime || 'video/webm';
      const actualExt = actualMime.toLowerCase().includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: actualMime });
      if (lastExportUrl) URL.revokeObjectURL(lastExportUrl);
      lastExportUrl = URL.createObjectURL(blob);

      const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
      const filename = `cut-${stamp}.${actualExt}`;
      el.exportDownloadLink.href = lastExportUrl;
      el.exportDownloadLink.download = filename;

      const sizeLabel = blob.size >= 1024 * 1024
        ? `${(blob.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(blob.size / 1024))} KB`;

      el.exportBar.style.width = '100%';
      el.exportPct.textContent = '100%';
      el.exportStatus.textContent = `Saved ${filename} (${sizeLabel})`;
      el.exportDoneBox.hidden = false;
      el.exportCancelBtn.textContent = 'Done';

      el.exportDownloadLink.click();
      if (blob.size > 0) window.memoToolTelemetry?.converted();
      showToast('Export complete');
    };

    el.exportStatus.textContent = `Rendering ${dims.width}×${dims.height} at ${fps} fps…`;
    renderFrame(exportCtx, dims.width, dims.height, 0, { isPreview: false });
    miniCtx.drawImage(exportCanvas, 0, 0, el.exportPreviewCanvas.width, el.exportPreviewCanvas.height);

    recorder.start(200);
    markActiveTool();
    scheduleAllAudioFrom(0, mixBus);
    syncVideosToTime(0, true);

    const startWall = performance.now();
    let lastMiniDraw = 0;
    let lastExportPct = -1;
    const tick = (now) => {
      if (cancelled) return;
      const t = (now - startWall) / 1000;
      if (t >= total) {
        renderFrame(exportCtx, dims.width, dims.height, total - 0.001, { isPreview: false });
        try { if (recorder.state !== 'inactive') recorder.stop(); } catch {}
        return;
      }
      syncVideosToTime(t, true);
      renderFrame(exportCtx, dims.width, dims.height, t, { isPreview: false });
      if (now - lastMiniDraw >= 85) {
        miniCtx.drawImage(exportCanvas, 0, 0, el.exportPreviewCanvas.width, el.exportPreviewCanvas.height);
        lastMiniDraw = now;
      }

      const pct = Math.min(99, Math.round((t / total) * 100));
      if (pct !== lastExportPct) {
        el.exportBar.style.width = `${pct}%`;
        el.exportPct.textContent = `${pct}%`;
        lastExportPct = pct;
      }
      exportRaf = requestAnimationFrame(tick);
    };

    exportRaf = requestAnimationFrame(tick);
  }

  // ── Master State Refresh ──────────────────────────────────
  function onStateChanged(opts = {}) {
    syncVideoPool();
    if (opts.resize) sizePreviewCanvas();
    updateHistoryButtons();
    if (opts.media) renderMediaBin();
    renderRuler(Boolean(opts.forceRuler));
    renderTimelineClips();
    renderInspector();
    if (playing) {
      if (E.computeProjectDuration(project().clips) <= 0) {
        pausePlayback();
        return;
      }
      scheduleAllAudioFrom(playhead);
    }
    syncVideosToTime(playhead, playing);
    renderPreview();
  }

  function renderAll() {
    onStateChanged({ media: true, resize: true, forceRuler: true });
  }

  // ── Wire Up Events ────────────────────────────────────────
  function bindSliderWithUndo(inputEl, onLiveUpdate, onCommit) {
    let before = null;
    const finish = () => {
      if (!before) return;
      const snap = before;
      before = null;
      if (onCommit) onCommit(Number(inputEl.value));
      commitFromSnapshot(snap);
    };
    inputEl.addEventListener('input', () => {
      if (!before) before = snapshotForUndo();
      onLiveUpdate(Number(inputEl.value));
    });
    inputEl.addEventListener('change', finish);
    inputEl.addEventListener('blur', finish);
  }

  function wireEvents() {
    // Left drawer tabs
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
        el.tabMedia.hidden = tab !== 'media';
        el.tabCaptions.hidden = tab !== 'captions';
      });
    });

    // Bulk captions & SRT file picker
    el.srtFileBtn.addEventListener('click', () => el.srtFileInput.click());
    el.srtFileInput.addEventListener('change', async () => {
      const f = el.srtFileInput.files?.[0];
      if (f) {
        el.bulkCaptions.value = await f.text();
        importCaptionsFromText(el.bulkCaptions.value);
      }
      el.srtFileInput.value = '';
    });
    el.bulkCaptionsBtn.addEventListener('click', () => {
      importCaptionsFromText(el.bulkCaptions.value);
    });

    // Aspect ratio selector
    el.aspectGroup.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.seg-btn');
      if (!btn) return;
      const aspect = btn.dataset.aspect;
      if (aspect === project().aspect) return;
      commitState((p) => ({ ...p, aspect }), { resize: true });
      showToast(`Canvas ${aspect}`);
    });

    // Topbar actions
    el.undoBtn.addEventListener('click', undo);
    el.redoBtn.addEventListener('click', redo);
    el.newProjectBtn.addEventListener('click', resetProject);
    el.shortcutsBtn.addEventListener('click', () => { el.shortcutsModal.hidden = false; });
    el.exportOpenBtn.addEventListener('click', openExportModal);

    // Import & Demo
    el.importBtn.addEventListener('click', () => el.fileInput.click());
    el.emptyImportBtn.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', () => {
      ingestFiles(el.fileInput.files);
      el.fileInput.value = '';
    });
    el.demoBtn.addEventListener('click', loadDemoReel);
    el.emptyDemoBtn.addEventListener('click', loadDemoReel);
    el.quickTextBtn.addEventListener('click', () => addTextAtPlayhead('caption'));
    el.tlTextBtn.addEventListener('click', () => addTextAtPlayhead('caption'));

    // Full-window drag & drop
    let dragDepth = 0;
    window.addEventListener('dragenter', (ev) => {
      if (!ev.dataTransfer?.types?.includes('Files')) return;
      ev.preventDefault();
      dragDepth += 1;
      el.dropOverlay.hidden = false;
    });
    window.addEventListener('dragover', (ev) => {
      if (!ev.dataTransfer?.types?.includes('Files')) return;
      ev.preventDefault();
    });
    window.addEventListener('dragleave', () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) el.dropOverlay.hidden = true;
    });
    window.addEventListener('drop', (ev) => {
      ev.preventDefault();
      dragDepth = 0;
      el.dropOverlay.hidden = true;
      if (ev.dataTransfer?.files?.length) {
        ingestFiles(ev.dataTransfer.files);
      }
    });

    // Transport
    el.playBtn.addEventListener('click', togglePlayback);
    el.jumpStartBtn.addEventListener('click', () => seekTo(0));
    el.jumpEndBtn.addEventListener('click', () => seekTo(E.computeProjectDuration(project().clips)));
    el.stepBackBtn.addEventListener('click', () => seekTo(Math.max(0, playhead - 0.1)));
    el.stepFwdBtn.addEventListener('click', () => seekTo(playhead + 0.1));
    el.masterMuteBtn.addEventListener('click', () => {
      masterMuted = !masterMuted;
      el.masterMuteBtn.setAttribute('aria-pressed', String(masterMuted));
      if (speakerGain) speakerGain.gain.value = masterMuted ? 0 : 1;
      syncVideosToTime(playhead, playing);
    });

    // Timeline Toolbar
    el.splitBtn.addEventListener('click', splitAtPlayhead);
    el.dupBtn.addEventListener('click', duplicateSelected);
    el.delBtn.addEventListener('click', (ev) => deleteSelected(ev.shiftKey));
    el.closeGapsBtn.addEventListener('click', closeVideoGaps);
    el.snapBtn.addEventListener('click', () => {
      updateStateSilent((p) => ({ ...p, snap: !p.snap }));
      showToast(project().snap ? 'Snapping on' : 'Snapping off');
    });

    const setZoom = (next) => {
      pxPerSec = E.clamp(next, 24, 220);
      el.zoomSlider.value = String(pxPerSec);
      renderRuler();
      renderTimelineClips();
      updatePlayheadUI();
    };
    el.zoomSlider.addEventListener('input', () => setZoom(Number(el.zoomSlider.value)));
    el.zoomInBtn.addEventListener('click', () => setZoom(pxPerSec + 20));
    el.zoomOutBtn.addEventListener('click', () => setZoom(pxPerSec - 20));
    el.zoomFitBtn.addEventListener('click', fitTimelineZoom);

    // Trackpad / wheel zoom & horizontal scroll on timeline
    el.timelineScroll.addEventListener('wheel', (ev) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) {
        ev.preventDefault();
        const factor = ev.deltaY < 0 ? 1.14 : 0.88;
        setZoom(Math.round(pxPerSec * factor));
      } else if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        el.timelineScroll.scrollLeft += ev.deltaY;
      }
    }, { passive: false });

    // Viewport-sized sticky ruler updates smoothly on horizontal scroll
    el.timelineScroll.addEventListener('scroll', () => {
      if (rulerScrollRafId) return;
      rulerScrollRafId = requestAnimationFrame(() => {
        rulerScrollRafId = 0;
        renderRuler();
      });
    }, { passive: true });

    // Track header toggles
    document.querySelectorAll('[data-toggle-track]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const track = btn.dataset.toggleTrack;
        trackMuted[track] = !trackMuted[track];
        btn.setAttribute('aria-pressed', String(trackMuted[track]));
        if (playing && (track === 'audio' || track === 'video')) scheduleAllAudioFrom(playhead);
        renderTimelineClips();
        syncVideosToTime(playhead, playing);
        renderPreview();
      });
    });

    // Click empty lane area to deselect clip
    for (const lane of [el.laneText, el.laneVideo, el.laneAudio]) {
      lane.addEventListener('pointerdown', (ev) => {
        closeTransitionPopover();
        if (ev.target === lane && project().selectedClipId) {
          selectClip(null);
        }
      });
    }

    // Transition popover controls
    el.transPopClose.addEventListener('click', closeTransitionPopover);
    bindSliderWithUndo(el.transPopDur, (val) => {
      if (!activeSeamClipId) return;
      el.transPopDurOut.textContent = `${val.toFixed(2)}s`;
      const updated = patchClipLive(activeSeamClipId, (c) => {
        const nextType = c.transitionIn?.type && c.transitionIn.type !== 'none' ? c.transitionIn.type : 'dissolve';
        return { ...c, transitionIn: { type: nextType, duration: val } };
      });
      if (updated) {
        el.transPopGrid.querySelectorAll('.filter-chip').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.trans === updated.transitionIn.type));
        });
        if (project().selectedClipId === activeSeamClipId) {
          el.vTransDurWrap.hidden = false;
          el.vTransDur.value = String(val);
          el.vTransDurOut.textContent = `${val.toFixed(2)}s`;
        }
      }
    }, () => {
      renderTimelineClips();
      renderInspector();
    });
    window.addEventListener('pointerdown', (ev) => {
      if (!el.transPopover.hidden && !el.transPopover.contains(ev.target) && !ev.target.closest('.seam-btn')) {
        closeTransitionPopover();
      }
    });

    // Ruler & playhead cap scrubbing
    setupRulerScrub(el.rulerRow);
    setupRulerScrub(el.playhead.querySelector('.playhead-cap'));

    // Project background swatches
    el.bgSwatches.addEventListener('click', (ev) => {
      const sw = ev.target.closest('.swatch');
      if (!sw) return;
      commitState((p) => ({ ...p, bgColor: sw.dataset.color }));
    });
    let bgBefore = null;
    const flushBgColor = () => {
      if (!bgBefore) return;
      const snap = bgBefore;
      bgBefore = null;
      commitFromSnapshot(snap);
      renderInspector();
    };
    el.bgColorInput.addEventListener('input', () => {
      if (!bgBefore) bgBefore = snapshotForUndo();
      history = { ...history, present: { ...project(), bgColor: el.bgColorInput.value } };
      schedulePreviewRender();
    });
    el.bgColorInput.addEventListener('change', flushBgColor);
    el.bgColorInput.addEventListener('blur', flushBgColor);

    // Video inspector controls
    el.vSpeedPresets.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.pill-btn');
      const sel = getSelectedClip();
      if (!btn || !sel || sel.track !== 'video') return;
      const spd = Number(btn.dataset.speed);
      commitState((p) => {
        const nextClips = p.clips.map((c) => (c.id === sel.id ? E.setClipSpeed(c, spd) : c));
        return {
          ...p,
          clips: E.resolveVideoTrackOverlap(nextClips, sel.id, { preserveOrder: true }),
        };
      });
    });
    bindSliderWithUndo(el.vSpeed, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      const updated = patchClipLive(sel.id, (c) => E.setClipSpeed(c, val));
      if (updated) {
        el.vSpeedOut.textContent = `${updated.speed.toFixed(2)}×`;
        el.inspectorMeta.textContent = E.formatTimecode(updated.duration);
        const blk = el.timelineContent.querySelector(`.clip-block[data-clip-id="${sel.id}"]`);
        if (blk) blk.style.width = `${Math.max(14, updated.duration * pxPerSec)}px`;
      }
    }, () => {
      const sel = getSelectedClip();
      if (sel && sel.track === 'video') {
        history = {
          ...history,
          present: {
            ...project(),
            clips: E.resolveVideoTrackOverlap(project().clips, sel.id, { preserveOrder: true }),
          },
        };
      }
      onStateChanged();
    });
    bindSliderWithUndo(el.vVol, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      const isMuted = val === 0;
      el.vVolOut.textContent = `${Math.round(val)}%`;
      el.vMuteBtn.setAttribute('aria-pressed', String(isMuted));
      el.vMuteBtn.textContent = isMuted ? 'Muted' : 'Mute';
      patchClipLive(sel.id, (c) => ({ ...c, volume: val / 100, muted: isMuted }));
      updateLiveClipAudioGain(sel.id, val / 100, isMuted);
    }, () => {
      renderTimelineClips();
    });
    el.vMuteBtn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, muted: !c.muted } : c)),
      }));
    });
    el.vExtractAudioBtn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (sel) detachVideoAudio(sel.id);
    });
    el.vFrameReset.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id
          ? { ...c, fit: 'cover', zoom: 1, offsetX: 0, offsetY: 0, rotate: 0, flipH: false }
          : c)),
      }));
      showToast('Reset framing');
    });
    for (const btn of [el.vFitCover, el.vFitContain]) {
      btn.addEventListener('click', () => {
        const sel = getSelectedClip();
        if (!sel || sel.track !== 'video') return;
        commitState((p) => ({
          ...p,
          clips: p.clips.map((c) => (c.id === sel.id ? { ...c, fit: btn.dataset.fit } : c)),
        }));
      });
    }
    el.vBlurBg.addEventListener('change', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, blurBg: el.vBlurBg.checked } : c)),
      }));
    });
    el.vRotateBtn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, rotate: ((c.rotate || 0) + 90) % 360 } : c)),
      }));
    });
    el.vFlipBtn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, flipH: !c.flipH } : c)),
      }));
    });
    bindSliderWithUndo(el.vZoom, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      el.vZoomOut.textContent = `${Math.round(val)}%`;
      patchClipLive(sel.id, (c) => ({ ...c, zoom: val / 100 }));
    });
    bindSliderWithUndo(el.vBright, (val) => {
      const sel = getSelectedClip();
      if (!sel) return;
      el.vBrightOut.textContent = `${val}%`;
      patchClipLive(sel.id, (c) => ({ ...c, brightness: val }));
    });
    bindSliderWithUndo(el.vContrast, (val) => {
      const sel = getSelectedClip();
      if (!sel) return;
      el.vContrastOut.textContent = `${val}%`;
      patchClipLive(sel.id, (c) => ({ ...c, contrast: val }));
    });
    bindSliderWithUndo(el.vSat, (val) => {
      const sel = getSelectedClip();
      if (!sel) return;
      el.vSatOut.textContent = `${val}%`;
      patchClipLive(sel.id, (c) => ({ ...c, saturation: val }));
    });
    el.vColorReset.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, filter: 'none', brightness: 100, contrast: 100, saturation: 100 } : c)),
      }));
    });
    bindSliderWithUndo(el.vTransDur, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'video') return;
      el.vTransDurOut.textContent = `${val.toFixed(2)}s`;
      patchClipLive(sel.id, (c) => {
        const nextType = c.transitionIn?.type && c.transitionIn.type !== 'none' ? c.transitionIn.type : 'dissolve';
        return { ...c, transitionIn: { type: nextType, duration: val } };
      });
    });
    bindSliderWithUndo(el.vFadeIn, (val) => {
      const sel = getSelectedClip();
      if (!sel) return;
      el.vFadeInOut.textContent = `${val.toFixed(1)}s`;
      patchClipLive(sel.id, (c) => ({ ...c, fadeIn: val }));
    }, () => {
      if (playing) scheduleAllAudioFrom(playhead);
    });
    bindSliderWithUndo(el.vFadeOut, (val) => {
      const sel = getSelectedClip();
      if (!sel) return;
      el.vFadeOutOut.textContent = `${val.toFixed(1)}s`;
      patchClipLive(sel.id, (c) => ({ ...c, fadeOut: val }));
    }, () => {
      if (playing) scheduleAllAudioFrom(playhead);
    });

    // Text inspector controls
    el.tContent.addEventListener('focus', () => {
      textBefore = snapshotForUndo();
      textDirty = false;
    });
    el.tContent.addEventListener('input', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'text') return;
      if (!textBefore) textBefore = snapshotForUndo();
      textDirty = true;
      const val = el.tContent.value;
      patchClipLive(sel.id, (c) => ({ ...c, text: val }));
      const labelEl = el.timelineContent.querySelector(`.clip-block[data-clip-id="${sel.id}"] .clip-name`);
      if (labelEl) labelEl.textContent = val || 'Text';
      scheduleAutosave();
    });
    el.tContent.addEventListener('blur', flushPendingTextEdit);

    el.tAnimRow.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.pill-btn');
      const sel = getSelectedClip();
      if (!btn || !sel || sel.track !== 'text') return;
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, animation: btn.dataset.anim } : c)),
      }));
    });
    bindSliderWithUndo(el.tSize, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'text') return;
      el.tSizeOut.textContent = `${val}px`;
      patchClipLive(sel.id, (c) => ({ ...c, fontSize: val }));
    });
    el.tPosRow.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.pill-btn');
      const sel = getSelectedClip();
      if (!btn || !sel || sel.track !== 'text') return;
      const yMap = { top: 0.18, center: 0.5, bottom: 0.80 };
      commitState((p) => ({
        ...p,
        clips: p.clips.map((c) => (c.id === sel.id ? { ...c, x: 0.5, y: yMap[btn.dataset.pos] ?? 0.78 } : c)),
      }));
    });
    let tColorBefore = null;
    const flushTColor = () => {
      if (!tColorBefore) return;
      const snap = tColorBefore;
      tColorBefore = null;
      commitFromSnapshot(snap);
    };
    el.tColor.addEventListener('input', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'text') return;
      if (!tColorBefore) tColorBefore = snapshotForUndo();
      patchClipLive(sel.id, (c) => ({ ...c, color: el.tColor.value }));
    });
    el.tColor.addEventListener('change', flushTColor);
    el.tColor.addEventListener('blur', flushTColor);

    let tBgBefore = null;
    const flushTBg = () => {
      if (!tBgBefore) return;
      const snap = tBgBefore;
      tBgBefore = null;
      commitFromSnapshot(snap);
    };
    el.tBg.addEventListener('input', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'text') return;
      if (!tBgBefore) tBgBefore = snapshotForUndo();
      patchClipLive(sel.id, (c) => ({ ...c, bgColor: el.tBg.value }));
    });
    el.tBg.addEventListener('change', flushTBg);
    el.tBg.addEventListener('blur', flushTBg);
    el.tColorReset.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'text') return;
      commitState((p) => ({ ...p, clips: p.clips.map((c) => (c.id === sel.id ? { ...c, color: '', bgColor: '' } : c)) }));
    });
    el.tApplyAllBtn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'text') return;
      commitState((p) => ({
        ...p,
        clips: E.applyTextStyleToAll(p.clips, sel.id),
      }));
      showToast('Applied style to all captions');
    });

    // Audio inspector controls
    bindSliderWithUndo(el.aVol, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'audio') return;
      const isMuted = val === 0;
      el.aVolOut.textContent = `${Math.round(val)}%`;
      el.aMuteBtn.setAttribute('aria-pressed', String(isMuted));
      el.aMuteBtn.textContent = isMuted ? 'Muted' : 'Mute';
      patchClipLive(sel.id, (c) => ({ ...c, volume: val / 100, muted: isMuted }));
      updateLiveClipAudioGain(sel.id, val / 100, isMuted);
    }, () => {
      renderTimelineClips();
    });
    el.aMuteBtn.addEventListener('click', () => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'audio') return;
      commitState((p) => ({ ...p, clips: p.clips.map((c) => (c.id === sel.id ? { ...c, muted: !c.muted } : c)) }));
    });
    bindSliderWithUndo(el.aFadeIn, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'audio') return;
      el.aFadeInOut.textContent = `${val.toFixed(1)}s`;
      patchClipLive(sel.id, (c) => ({ ...c, fadeIn: val }));
    }, () => {
      if (playing) scheduleAllAudioFrom(playhead);
    });
    bindSliderWithUndo(el.aFadeOut, (val) => {
      const sel = getSelectedClip();
      if (!sel || sel.track !== 'audio') return;
      el.aFadeOutOut.textContent = `${val.toFixed(1)}s`;
      patchClipLive(sel.id, (c) => ({ ...c, fadeOut: val }));
    }, () => {
      if (playing) scheduleAllAudioFrom(playhead);
    });

    // Export modal controls
    el.exportOptions.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.pill-btn');
      if (!btn) return;
      if (btn.dataset.res) {
        exportSettings.res = btn.dataset.res;
        el.exportOptions.querySelectorAll('[data-res]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.res === exportSettings.res)));
        updateExportSummary();
      } else if (btn.dataset.fps) {
        exportSettings.fps = Number(btn.dataset.fps);
        el.exportOptions.querySelectorAll('[data-fps]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.fps) === exportSettings.fps)));
        updateExportSummary();
      }
    });
    el.exportStartBtn.addEventListener('click', startExport);

    // Modal close triggers
    document.querySelectorAll('[data-close-modal]').forEach((node) => {
      node.addEventListener('click', () => {
        const modalId = node.dataset.closeModal;
        if (modalId === 'export-modal' && exportAbort) {
          exportAbort();
          return;
        }
        const m = $(modalId);
        if (m) m.hidden = true;
      });
    });

    // Global keyboard shortcuts
    window.addEventListener('keydown', (ev) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (ev.key === 'Escape') {
        closeTransitionPopover();
        if (!el.shortcutsModal.hidden) el.shortcutsModal.hidden = true;
        if (!el.exportModal.hidden) {
          if (exportAbort) exportAbort();
          else el.exportModal.hidden = true;
        }
        return;
      }

      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'z') {
        if (inInput) return;
        ev.preventDefault();
        if (ev.shiftKey) redo();
        else undo();
        return;
      }
      if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'y') {
        if (inInput) return;
        ev.preventDefault();
        redo();
        return;
      }

      if (inInput) return;

      if (ev.code === 'Space') {
        ev.preventDefault();
        togglePlayback();
      } else if (ev.key.toLowerCase() === 's') {
        ev.preventDefault();
        splitAtPlayhead();
      } else if (ev.key.toLowerCase() === 't') {
        ev.preventDefault();
        addTextAtPlayhead('caption');
      } else if (ev.key.toLowerCase() === 'd') {
        ev.preventDefault();
        duplicateSelected();
      } else if (ev.key === 'Backspace' || ev.key === 'Delete') {
        ev.preventDefault();
        deleteSelected(ev.shiftKey);
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        seekTo(Math.max(0, playhead - (ev.shiftKey ? 1 : 0.1)));
      } else if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        seekTo(playhead + (ev.shiftKey ? 1 : 0.1));
      } else if (ev.key === 'Home' || ev.key === '0') {
        ev.preventDefault();
        seekTo(0);
      } else if (ev.key === 'End') {
        ev.preventDefault();
        seekTo(E.computeProjectDuration(project().clips));
      } else if (ev.key === '+' || ev.key === '=') {
        ev.preventDefault();
        setZoom(pxPerSec + 20);
      } else if (ev.key === '-') {
        ev.preventDefault();
        setZoom(pxPerSec - 20);
      } else if (ev.key === '?') {
        ev.preventDefault();
        el.shortcutsModal.hidden = !el.shortcutsModal.hidden;
      }
    });

    // Resize handling
    const onResize = () => {
      sizePreviewCanvas();
      renderRuler(true);
      renderPreview();
    };
    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(onResize).observe(el.stageViewport);
      new ResizeObserver(() => {
        cachedTimelineWidth = el.timelineScroll.clientWidth || 720;
        renderRuler();
      }).observe(el.timelineScroll);
    }

    new MutationObserver(() => renderRuler(true)).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  // ── Boot ──────────────────────────────────────────────────
  buildInspectorGrids();
  buildCaptionPresetCards();
  wireEvents();
  renderAll();
  restoreSavedSession();
})();
