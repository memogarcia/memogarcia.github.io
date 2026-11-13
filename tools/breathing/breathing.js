((globalScope) => {
  const STORAGE_KEY = 'memo-tools-breathing-v1';
  const RING_RADIUS = 158;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ORB_MIN_RADIUS = 56;
  const ORB_MAX_RADIUS = 118;

  const PATTERNS = {
    box: {
      id: 'box',
      name: 'Box Breathing',
      shortName: 'Box',
      ratio: '4-4-4-4',
      summary: 'Equal-ratio breathing to steady focus and even out stress.',
      tip: 'Breathe through your nose. Keep both holds soft without locking your throat.',
      phases: [
        { kind: 'inhale', label: 'Inhale', seconds: 4, scaleFrom: 0, scaleTo: 1 },
        { kind: 'hold', label: 'Hold', seconds: 4, scaleFrom: 1, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', seconds: 4, scaleFrom: 1, scaleTo: 0 },
        { kind: 'hold-empty', label: 'Hold', seconds: 4, scaleFrom: 0, scaleTo: 0 },
      ],
    },
    478: {
      id: '478',
      name: '4-7-8 Breathing',
      shortName: '4-7-8',
      ratio: '4-7-8',
      summary: 'Extended exhale shifts your nervous system toward calm and rest.',
      tip: 'Inhale quietly through your nose, hold gently, then exhale through relaxed lips.',
      phases: [
        { kind: 'inhale', label: 'Inhale', seconds: 4, scaleFrom: 0, scaleTo: 1 },
        { kind: 'hold', label: 'Hold', seconds: 7, scaleFrom: 1, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', seconds: 8, scaleFrom: 1, scaleTo: 0 },
      ],
    },
    coherent: {
      id: 'coherent',
      name: 'Coherent Breathing',
      shortName: 'Coherent',
      ratio: '5-5',
      summary: 'Six breaths per minute (0.1 Hz) to steady heart rate and breath rhythm.',
      tip: 'Inhale and exhale through your nose with no pauses, like a slow pendulum.',
      phases: [
        { kind: 'inhale', label: 'Inhale', seconds: 5, scaleFrom: 0, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', seconds: 5, scaleFrom: 1, scaleTo: 0 },
      ],
    },
    sigh: {
      id: 'sigh',
      name: 'Physiological Sigh',
      shortName: 'Physiological Sigh',
      ratio: '2+1-6',
      summary: 'Double nasal inhale re-inflates lung air sacs before a long sigh out.',
      tip: 'Take one full inhale, add a short second sip at the top, then let a slow exhale out your mouth.',
      phases: [
        { kind: 'inhale', label: 'Inhale', seconds: 2, scaleFrom: 0, scaleTo: 0.72 },
        { kind: 'inhale-top', label: 'Top-up inhale', seconds: 1, scaleFrom: 0.72, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', seconds: 6, scaleFrom: 1, scaleTo: 0 },
      ],
    },
  };

  const DEFAULT_SETTINGS = {
    cue: 'tones',
    volume: 65,
    ambient: 'off',
    prepSec: 0,
    endBell: true,
  };

  function getCycleDurationMs(patternId) {
    const pattern = PATTERNS[patternId] || PATTERNS.box;
    return pattern.phases.reduce((sum, p) => sum + p.seconds * 1000, 0);
  }

  function easeInOutSine(t) {
    const clamped = Math.max(0, Math.min(1, t));
    return -(Math.cos(Math.PI * clamped) - 1) / 2;
  }

  function getPhaseAtElapsed(patternId, elapsedMs) {
    const pattern = PATTERNS[patternId] || PATTERNS.box;
    const cycleMs = getCycleDurationMs(pattern.id);
    const safeElapsed = Math.max(0, elapsedMs);
    const cycleIndex = Math.floor(safeElapsed / cycleMs);
    let withinCycle = safeElapsed % cycleMs;

    for (let i = 0; i < pattern.phases.length; i++) {
      const phase = pattern.phases[i];
      const durMs = phase.seconds * 1000;
      if (withinCycle < durMs || i === pattern.phases.length - 1) {
        const phaseElapsedMs = Math.min(durMs, withinCycle);
        const phaseRemainingMs = Math.max(0, durMs - phaseElapsedMs);
        const rawProgress = durMs > 0 ? phaseElapsedMs / durMs : 1;
        return {
          cycleIndex,
          phaseIndex: i,
          phase,
          phaseDurationMs: durMs,
          phaseElapsedMs,
          phaseRemainingMs,
          rawProgress,
          cycleProgress: withinCycle / cycleMs,
        };
      }
      withinCycle -= durMs;
    }
    return null;
  }

  function getOrbScale(phaseInfo, reducedMotion = false) {
    if (!phaseInfo) return 0.35;
    if (reducedMotion) return 0.45;
    const { phase, rawProgress } = phaseInfo;
    const eased = phase.scaleFrom === phase.scaleTo ? 0 : easeInOutSine(rawProgress);
    return phase.scaleFrom + (phase.scaleTo - phase.scaleFrom) * eased;
  }

  function getOrbRadius(scaleNorm) {
    const clamped = Math.max(0, Math.min(1, scaleNorm));
    return ORB_MIN_RADIUS + (ORB_MAX_RADIUS - ORB_MIN_RADIUS) * clamped;
  }

  function formatMMSS(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatPatternCadence(pattern) {
    return pattern.phases.map((p) => `${p.seconds}s ${p.label.toLowerCase()}`).join(' · ');
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PATTERNS,
      getCycleDurationMs,
      easeInOutSine,
      getPhaseAtElapsed,
      getOrbScale,
      getOrbRadius,
      formatMMSS,
    };
  }

  if (typeof document === 'undefined') return;

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatClockTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* Continue in memory when storage is blocked. */
    }
  }

  class BreathAudio {
    constructor() {
      this.ctx = null;
      this.ambientNodes = null;
      this.ambientBuffer = null;
    }

    ensureContext() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        return this.ctx;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      return this.ctx;
    }

    playPhaseCue(kind, cueStyle, volumePct) {
      if (cueStyle === 'off' || volumePct <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const level = Math.max(0.01, Math.min(1, volumePct / 100));
      const now = ctx.currentTime + 0.01;

      if (cueStyle === 'wood') {
        const freqMap = {
          inhale: 660,
          'inhale-top': 840,
          hold: 520,
          'hold-empty': 480,
          exhale: 410,
          prep: 580,
        };
        this.#woodTap(ctx, now, freqMap[kind] || 540, level * 0.24);
        return;
      }

      if (cueStyle === 'bowl') {
        const freqMap = {
          inhale: 396,
          'inhale-top': 495,
          hold: 330,
          'hold-empty': 297,
          exhale: 264,
          prep: 440,
        };
        const dur = kind === 'hold' || kind === 'hold-empty' ? 1.4 : 2.1;
        this.#singingBowl(ctx, now, freqMap[kind] || 396, level * 0.2, dur);
        return;
      }

      // Default: 'tones' (gentle sinusoidal cues)
      if (kind === 'inhale') {
        this.#glideTone(ctx, now, 261.63, 329.63, level * 0.16, 0.55);
      } else if (kind === 'inhale-top') {
        this.#glideTone(ctx, now, 349.23, 440.0, level * 0.16, 0.36);
      } else if (kind === 'exhale') {
        this.#glideTone(ctx, now, 329.63, 220.0, level * 0.14, 0.72);
      } else {
        this.#glideTone(ctx, now, 293.66, 293.66, level * 0.08, 0.28);
      }
    }

    playCompletion(cueStyle, volumePct) {
      if (cueStyle === 'off' || volumePct <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const level = Math.max(0.01, Math.min(1, volumePct / 100));
      const now = ctx.currentTime + 0.02;
      this.#singingBowl(ctx, now, 432, level * 0.3, 3.2);
      this.#singingBowl(ctx, now + 0.9, 540, level * 0.2, 2.8);
    }

    startAmbient(mode, volumePct) {
      this.stopAmbient();
      if (mode === 'off' || volumePct <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      if (!this.ambientBuffer) {
        const seconds = 4;
        const length = ctx.sampleRate * seconds;
        const buf = ctx.createBuffer(1, length, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < length; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.028 * white) / 1.028;
          ch[i] = lastOut * 3.1;
        }
        const fade = Math.min(2000, Math.floor(length * 0.05));
        for (let i = 0; i < fade; i++) {
          const w = i / fade;
          ch[i] = ch[i] * w + ch[length - fade + i] * (1 - w);
        }
        this.ambientBuffer = buf;
      }

      const src = ctx.createBufferSource();
      src.buffer = this.ambientBuffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = mode === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = mode === 'rain' ? 920 : 410;
      filter.Q.value = mode === 'rain' ? 0.55 : 0.7;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.14;
      lfoGain.gain.value = mode === 'rain' ? 220 : 70;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const master = ctx.createGain();
      const targetGain = (volumePct / 100) * (mode === 'rain' ? 0.14 : 0.2);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(Math.max(0.002, targetGain), ctx.currentTime + 0.8);

      src.connect(filter);
      filter.connect(master);
      master.connect(ctx.destination);
      src.start();
      lfo.start();
      this.ambientNodes = { src, lfo, master, ctx };
    }

    stopAmbient() {
      if (!this.ambientNodes) return;
      const { src, lfo, master, ctx } = this.ambientNodes;
      this.ambientNodes = null;
      try {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        setTimeout(() => {
          try { src.stop(); } catch {}
          try { lfo.stop(); } catch {}
        }, 280);
      } catch {}
    }

    #glideTone(ctx, start, freqFrom, freqTo, level, dur) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqFrom, start);
      if (freqFrom !== freqTo) {
        osc.frequency.exponentialRampToValueAtTime(freqTo, start + dur * 0.85);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(level, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    }

    #singingBowl(ctx, start, freq, level, dur) {
      const partials = [
        { ratio: 1, amp: 1 },
        { ratio: 1.003, amp: 0.6 },
        { ratio: 2.756, amp: 0.24 },
      ];
      partials.forEach(({ ratio, amp }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * ratio, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(level * amp, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    }

    #woodTap(ctx, start, freq, level) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.68, start + 0.055);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(level, start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.11);
    }
  }

  const els = {
    body: document.body,
    favicon: document.getElementById('favicon'),
    tabs: [...document.querySelectorAll('.pattern-tabs [role="tab"]')],
    patternSummary: document.getElementById('pattern-summary'),
    patternTip: document.getElementById('pattern-tip'),
    progressRing: document.getElementById('dial-progress'),
    breathHalo: document.getElementById('breath-halo'),
    breathOrb: document.getElementById('breath-orb'),
    breathCore: document.getElementById('breath-core'),
    eyebrow: document.getElementById('phase-eyebrow'),
    action: document.getElementById('phase-action'),
    timer: document.getElementById('phase-timer'),
    sessionLine: document.getElementById('session-line'),
    phaseStrip: document.getElementById('phase-strip'),
    durChips: [...document.querySelectorAll('.dur-chip[data-dur]')],
    customDurBtn: document.getElementById('custom-dur-btn'),
    customDurWrap: document.getElementById('custom-dur-wrap'),
    customDurInput: document.getElementById('custom-dur-input'),
    customDurApply: document.getElementById('custom-dur-apply'),
    toggleBtn: document.getElementById('toggle-btn'),
    finishBtn: document.getElementById('finish-btn'),
    resetBtn: document.getElementById('reset-btn'),
    soundQuickBtn: document.getElementById('sound-quick-btn'),
    zenBtn: document.getElementById('zen-btn'),
    zenExit: document.getElementById('zen-exit'),
    settingsBtn: document.getElementById('settings-btn'),
    liveStatus: document.getElementById('live-status'),
    todaySummary: document.getElementById('today-summary'),
    historyCount: document.getElementById('history-count'),
    historyEmpty: document.getElementById('history-empty'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    dialog: document.getElementById('settings-dialog'),
    settingsForm: document.getElementById('settings-form'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    settingsResetBtn: document.getElementById('settings-reset-btn'),
    optCue: document.getElementById('opt-cue'),
    optVolume: document.getElementById('opt-volume'),
    optVolumeLabel: document.getElementById('opt-volume-label'),
    optAmbient: document.getElementById('opt-ambient'),
    optPrep: document.getElementById('opt-prep'),
    optEndBell: document.getElementById('opt-end-bell'),
    testCueBtn: document.getElementById('test-cue-btn'),
  };

  els.progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  els.progressRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;

  const audio = new BreathAudio();
  const saved = loadStore();
  const settings = { ...DEFAULT_SETTINGS, ...(saved?.settings || {}) };
  const today = todayKey();
  let sessions = saved?.date === today && Array.isArray(saved?.sessions) ? saved.sessions : [];

  const initialPattern = saved?.patternId && PATTERNS[saved.patternId] ? saved.patternId : 'box';
  const initialDurMin = Number.isInteger(saved?.durationMin) && saved.durationMin >= 0 ? saved.durationMin : 2;
  const initialCustomMin = Number.isInteger(saved?.customMin) && saved.customMin >= 1 ? saved.customMin : 3;

  const state = {
    patternId: initialPattern,
    durationMin: initialDurMin, // 0 means Open
    customMin: initialCustomMin,
    isCustomDur: ![2, 5, 10, 0].includes(initialDurMin),
    status: 'idle', // 'idle' | 'prep' | 'running' | 'paused' | 'complete'
    prepRemainingMs: 0,
    prepEndAt: null,
    elapsedMs: 0,
    runAnchorTs: null,
    startedClockTs: null,
    lastPhaseKey: '',
    zen: false,
    cueBeforeMute: settings.cue !== 'off' ? settings.cue : 'tones',
  };

  let rafId = null;
  let bgInterval = null;
  let lastFaviconBucket = '';

  function currentPrepRemainingMs() {
    if (state.status === 'prep' && state.prepEndAt !== null) {
      return Math.max(0, state.prepEndAt - Date.now());
    }
    return Math.max(0, state.prepRemainingMs);
  }

  function currentElapsedMs() {
    if (state.status === 'running' && state.runAnchorTs !== null) {
      return Math.max(0, Date.now() - state.runAnchorTs);
    }
    return Math.max(0, state.elapsedMs);
  }

  function persist() {
    saveStore({
      date: todayKey(),
      patternId: state.patternId,
      durationMin: state.durationMin,
      customMin: state.customMin,
      settings,
      sessions,
    });
  }

  function announce(text) {
    els.liveStatus.textContent = text;
  }

  function targetMs() {
    return state.durationMin > 0 ? state.durationMin * 60_000 : 0;
  }

  function prefersReducedMotion() {
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function buildPhaseStrip() {
    const pattern = PATTERNS[state.patternId];
    els.phaseStrip.replaceChildren();
    pattern.phases.forEach((p, idx) => {
      const pill = document.createElement('span');
      pill.className = 'phase-pill';
      pill.dataset.index = String(idx);

      const label = document.createElement('span');
      label.textContent = `${p.label} ${p.seconds}s`;

      const fill = document.createElement('span');
      fill.className = 'phase-pill-fill';

      pill.append(label, fill);
      els.phaseStrip.appendChild(pill);
    });
  }

  function updatePhaseStrip(activeIndex, rawProgress) {
    const pills = [...els.phaseStrip.children];
    pills.forEach((pill, idx) => {
      const isActive = (state.status === 'running' || state.status === 'paused') && idx === activeIndex;
      pill.classList.toggle('active', isActive);
      const fill = pill.querySelector('.phase-pill-fill');
      if (fill) {
        fill.style.width = isActive ? `${(rawProgress * 100).toFixed(1)}%` : '0%';
      }
    });
  }

  function updateFavicon(progress, patternId, status) {
    const bucket = `${patternId}:${status}:${Math.round(progress * 20)}`;
    if (bucket === lastFaviconBucket) return;
    lastFaviconBucket = bucket;

    const palette = {
      box: '#364a32',
      478: '#2e4c66',
      coherent: '#3d5d53',
      sigh: '#9c4a2d',
    };
    const stroke = palette[patternId] || '#364a32';
    const r = 12;
    const c = 2 * Math.PI * r;
    const offset = status === 'idle' ? c : c * (1 - Math.max(0, Math.min(1, progress)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#faf7f2"/><circle cx="16" cy="16" r="12" fill="none" stroke="#e2ddd2" stroke-width="3"/><circle cx="16" cy="16" r="12" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 16 16)"/><circle cx="16" cy="16" r="4" fill="${stroke}"/></svg>`;
    els.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function renderOrb(radius) {
    els.breathOrb.setAttribute('r', radius.toFixed(2));
    els.breathHalo.setAttribute('r', (radius + 14).toFixed(2));
    els.breathCore.setAttribute('r', Math.max(36, radius * 0.72).toFixed(2));
  }

  function renderDial() {
    const pattern = PATTERNS[state.patternId];
    const totalTarget = targetMs();
    const cycleMs = getCycleDurationMs(pattern.id);

    if (state.status === 'idle') {
      els.body.dataset.phaseKind = 'ready';
      renderOrb(64);
      els.progressRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;
      els.eyebrow.textContent = pattern.name;
      els.action.textContent = 'Ready';
      els.timer.textContent = state.durationMin > 0 ? formatMMSS(totalTarget) : 'Open';
      els.sessionLine.textContent = `${cycleMs / 1000}s cycle · ${formatPatternCadence(pattern)}`;
      updatePhaseStrip(-1, 0);
      document.title = 'Breathing · Memo Garcia';
      updateFavicon(0, pattern.id, 'idle');
      return;
    }

    if (state.status === 'prep') {
      els.body.dataset.phaseKind = 'prep';
      const prepRem = currentPrepRemainingMs();
      const prepSec = Math.max(1, Math.ceil(prepRem / 1000));
      renderOrb(64);
      const prepFrac = settings.prepSec > 0 ? 1 - prepRem / (settings.prepSec * 1000) : 1;
      els.progressRing.style.strokeDashoffset = `${(RING_CIRCUMFERENCE * (1 - prepFrac)).toFixed(2)}`;
      els.eyebrow.textContent = pattern.name;
      els.action.textContent = 'Settle in';
      els.timer.textContent = String(prepSec);
      els.sessionLine.textContent = 'Relax your shoulders and jaw';
      updatePhaseStrip(-1, 0);
      document.title = `Settle (${prepSec}) · Breathing`;
      updateFavicon(prepFrac, pattern.id, 'prep');
      return;
    }

    if (state.status === 'complete') {
      els.body.dataset.phaseKind = 'complete';
      renderOrb(78);
      els.progressRing.style.strokeDashoffset = '0';
      els.eyebrow.textContent = pattern.name;
      els.action.textContent = 'Complete';
      els.timer.textContent = formatMMSS(state.elapsedMs);
      const cycles = Math.max(1, Math.round(state.elapsedMs / cycleMs));
      els.sessionLine.textContent = `${cycles} ${cycles === 1 ? 'cycle' : 'cycles'} completed`;
      updatePhaseStrip(-1, 0);
      document.title = `Done · ${pattern.shortName} · Memo Garcia`;
      updateFavicon(1, pattern.id, 'complete');
      return;
    }

    const elapsed = currentElapsedMs();
    const phaseInfo = getPhaseAtElapsed(pattern.id, elapsed);
    const scaleNorm = getOrbScale(phaseInfo, prefersReducedMotion());
    const radius = getOrbRadius(scaleNorm);
    renderOrb(radius);

    els.body.dataset.phaseKind = phaseInfo.phase.kind;
    const secLeft = Math.max(1, Math.ceil(phaseInfo.phaseRemainingMs / 1000));

    const ringProgress = totalTarget > 0
      ? Math.min(1, elapsed / totalTarget)
      : phaseInfo.cycleProgress;
    els.progressRing.style.strokeDashoffset = `${(RING_CIRCUMFERENCE * (1 - ringProgress)).toFixed(2)}`;

    const prefix = state.status === 'paused' ? 'Paused · ' : '';
    els.eyebrow.textContent = `${prefix}${pattern.shortName} · Cycle ${phaseInfo.cycleIndex + 1}`;
    els.action.textContent = phaseInfo.phase.label;
    els.timer.textContent = String(secLeft);
    els.sessionLine.textContent = totalTarget > 0
      ? `${formatMMSS(Math.max(0, totalTarget - elapsed))} left`
      : `${formatMMSS(elapsed)} elapsed`;

    updatePhaseStrip(phaseInfo.phaseIndex, phaseInfo.rawProgress);
    document.title = state.status === 'paused'
      ? `Paused · ${pattern.shortName} · Memo Garcia`
      : `${phaseInfo.phase.label} (${secLeft}) · ${pattern.shortName}`;
    updateFavicon(ringProgress, pattern.id, state.status);
  }

  function renderHistory() {
    const nowKey = todayKey();
    if (sessions.length && sessions[0].day && sessions[0].day !== nowKey) {
      sessions = [];
    }

    const count = sessions.length;
    const totalSec = sessions.reduce((acc, s) => acc + s.seconds, 0);
    const totalMin = Math.max(count > 0 ? 1 : 0, Math.round(totalSec / 60));
    const noun = count === 1 ? 'session' : 'sessions';
    els.todaySummary.textContent = count > 0
      ? `${count} ${noun} today (${totalMin}m)`
      : '0 sessions today';

    els.historyCount.textContent = String(count);
    els.historyEmpty.hidden = count > 0;
    els.historyList.hidden = count === 0;
    els.clearHistoryBtn.hidden = count === 0;

    if (count > 0) {
      els.historyList.replaceChildren();
      [...sessions].reverse().forEach((item) => {
        const li = document.createElement('li');
        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-time';
        timeSpan.textContent = item.time;

        const noteSpan = document.createElement('span');
        noteSpan.className = 'history-note';
        noteSpan.textContent = item.patternName;

        const durSpan = document.createElement('span');
        durSpan.className = 'history-dur';
        const mins = Math.floor(item.seconds / 60);
        const secs = item.seconds % 60;
        durSpan.textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

        li.append(timeSpan, noteSpan, durSpan);
        els.historyList.appendChild(li);
      });
    }
  }

  function renderChrome() {
    const pattern = PATTERNS[state.patternId];
    els.body.dataset.pattern = state.patternId;
    els.body.dataset.state = state.status;
    els.body.dataset.zen = state.zen ? 'true' : 'false';
    els.zenExit.hidden = !state.zen;

    els.tabs.forEach((tab) => {
      const active = tab.dataset.pattern === state.patternId;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    els.patternSummary.textContent = pattern.summary;
    els.patternTip.textContent = pattern.tip;

    els.durChips.forEach((chip) => {
      const durVal = chip.dataset.dur;
      let pressed = false;
      if (durVal === 'custom') {
        pressed = state.isCustomDur;
        chip.textContent = state.isCustomDur ? `Custom (${state.customMin}m)` : 'Custom';
      } else {
        pressed = !state.isCustomDur && Number(durVal) === state.durationMin;
      }
      chip.setAttribute('aria-pressed', String(pressed));
    });

    els.customDurWrap.hidden = !state.isCustomDur || state.status === 'running' || state.status === 'prep';
    els.customDurInput.value = String(state.customMin);

    if (state.status === 'running' || state.status === 'prep') {
      els.toggleBtn.textContent = 'Pause';
    } else if (state.status === 'paused') {
      els.toggleBtn.textContent = 'Resume';
    } else if (state.status === 'complete') {
      els.toggleBtn.textContent = 'Practice Again';
    } else {
      els.toggleBtn.textContent = 'Start Breathing';
    }

    const canFinish = (state.status === 'running' || state.status === 'paused') && currentElapsedMs() >= 5000;
    els.finishBtn.hidden = !canFinish;

    const soundOn = settings.cue !== 'off';
    els.soundQuickBtn.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
    els.soundQuickBtn.setAttribute('aria-pressed', String(soundOn));

    renderHistory();
    renderDial();
  }

  function recordSession(elapsedMs) {
    const seconds = Math.max(1, Math.round(elapsedMs / 1000));
    const pattern = PATTERNS[state.patternId];
    sessions.push({
      day: todayKey(),
      time: formatClockTime(Date.now()),
      patternId: pattern.id,
      patternName: `${pattern.name} (${pattern.ratio})`,
      seconds,
    });
  }

  function completeSession(playBell = true) {
    stopLoop();
    audio.stopAmbient();
    if (playBell && settings.endBell) {
      audio.playCompletion(settings.cue, settings.volume);
    }
    recordSession(state.elapsedMs);
    state.status = 'complete';
    state.runAnchorTs = null;
    state.prepEndAt = null;
    renderChrome();
    persist();
    announce(`${PATTERNS[state.patternId].name} session complete.`);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (bgInterval !== null) {
      clearInterval(bgInterval);
      bgInterval = null;
    }
  }

  function advanceTick(renderVisuals = true) {
    if (state.status === 'prep') {
      const rem = currentPrepRemainingMs();
      state.prepRemainingMs = rem;
      if (rem <= 0) {
        state.status = 'running';
        state.prepEndAt = null;
        state.prepRemainingMs = 0;
        state.elapsedMs = 0;
        state.runAnchorTs = Date.now();
        state.lastPhaseKey = '';
        const first = getPhaseAtElapsed(state.patternId, 0);
        if (first) {
          state.lastPhaseKey = `${first.cycleIndex}:${first.phaseIndex}`;
          audio.playPhaseCue(first.phase.kind, settings.cue, settings.volume);
          announce(`${first.phase.label}`);
        }
        if (settings.ambient !== 'off') {
          audio.startAmbient(settings.ambient, settings.volume);
        }
        renderChrome();
      } else if (renderVisuals) {
        renderDial();
      }
      return true;
    }

    if (state.status !== 'running') return false;

    const elapsed = currentElapsedMs();
    state.elapsedMs = elapsed;
    const goalMs = targetMs();
    if (goalMs > 0 && elapsed >= goalMs) {
      state.elapsedMs = goalMs;
      completeSession(true);
      return false;
    }

    const info = getPhaseAtElapsed(state.patternId, elapsed);
    if (info) {
      const key = `${info.cycleIndex}:${info.phaseIndex}`;
      if (key !== state.lastPhaseKey) {
        state.lastPhaseKey = key;
        audio.playPhaseCue(info.phase.kind, settings.cue, settings.volume);
        announce(`${info.phase.label} for ${info.phase.seconds} seconds`);
      }
    }

    const showFinish = elapsed >= 5000;
    if (els.finishBtn.hidden === showFinish) {
      els.finishBtn.hidden = !showFinish;
    }

    if (renderVisuals) renderDial();
    return true;
  }

  function startLoop() {
    stopLoop();
    const step = () => {
      if (!advanceTick(true)) return;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    bgInterval = setInterval(() => {
      if (document.hidden) advanceTick(false);
    }, 350);
  }

  function startBreathing() {
    audio.ensureContext();
    if (state.status === 'complete') {
      state.elapsedMs = 0;
      state.lastPhaseKey = '';
    }
    if (state.status === 'idle' || state.status === 'complete') {
      state.startedClockTs = Date.now();
      if (settings.prepSec > 0) {
        state.status = 'prep';
        state.prepRemainingMs = settings.prepSec * 1000;
        state.prepEndAt = Date.now() + state.prepRemainingMs;
        audio.playPhaseCue('prep', settings.cue, settings.volume);
        renderChrome();
        startLoop();
        announce(`Settle in for ${settings.prepSec} seconds.`);
        return;
      }
      state.status = 'running';
      state.elapsedMs = 0;
      state.runAnchorTs = Date.now();
      const first = getPhaseAtElapsed(state.patternId, 0);
      if (first) {
        state.lastPhaseKey = `${first.cycleIndex}:${first.phaseIndex}`;
        audio.playPhaseCue(first.phase.kind, settings.cue, settings.volume);
        announce(`${first.phase.label}`);
      }
    } else if (state.status === 'paused') {
      if (state.prepRemainingMs > 0) {
        state.status = 'prep';
        state.prepEndAt = Date.now() + state.prepRemainingMs;
      } else {
        state.status = 'running';
        state.runAnchorTs = Date.now() - state.elapsedMs;
      }
    }

    if (state.status === 'running' && settings.ambient !== 'off') {
      audio.startAmbient(settings.ambient, settings.volume);
    }
    renderChrome();
    startLoop();
  }

  function pauseBreathing() {
    if (state.status !== 'running' && state.status !== 'prep') return;
    if (state.status === 'prep') {
      state.prepRemainingMs = currentPrepRemainingMs();
      state.prepEndAt = null;
    } else {
      state.elapsedMs = currentElapsedMs();
      state.runAnchorTs = null;
    }
    stopLoop();
    audio.stopAmbient();
    state.status = 'paused';
    renderChrome();
    announce('Breathing paused.');
  }

  function resetBreathing() {
    stopLoop();
    audio.stopAmbient();
    state.status = 'idle';
    state.prepRemainingMs = 0;
    state.prepEndAt = null;
    state.elapsedMs = 0;
    state.runAnchorTs = null;
    state.lastPhaseKey = '';
    renderChrome();
    announce('Breathing pacer reset.');
  }

  function selectPattern(patternId) {
    if (!PATTERNS[patternId] || patternId === state.patternId) return;
    stopLoop();
    audio.stopAmbient();
    state.patternId = patternId;
    state.status = 'idle';
    state.prepRemainingMs = 0;
    state.prepEndAt = null;
    state.elapsedMs = 0;
    state.runAnchorTs = null;
    state.lastPhaseKey = '';
    buildPhaseStrip();
    renderChrome();
    persist();
    announce(`Selected ${PATTERNS[patternId].name}.`);
  }

  function setDuration(minutes, isCustom = false) {
    state.durationMin = minutes;
    state.isCustomDur = isCustom;
    if (isCustom) {
      state.customMin = minutes;
    }
    if (state.status !== 'idle') {
      resetBreathing();
    } else {
      renderChrome();
    }
    persist();
  }

  function toggleSound() {
    if (settings.cue === 'off') {
      settings.cue = state.cueBeforeMute || 'tones';
    } else {
      state.cueBeforeMute = settings.cue;
      settings.cue = 'off';
    }
    renderChrome();
    persist();
    announce(settings.cue === 'off' ? 'Sound muted.' : 'Sound enabled.');
  }

  function toggleZen(force) {
    state.zen = typeof force === 'boolean' ? force : !state.zen;
    renderChrome();
    announce(state.zen ? 'Zen mode enabled.' : 'Zen mode exited.');
  }

  function syncSettingsUI() {
    els.optCue.value = settings.cue;
    els.optVolume.value = settings.volume;
    els.optVolumeLabel.textContent = `${settings.volume}%`;
    els.optAmbient.value = settings.ambient;
    els.optPrep.value = String(settings.prepSec);
    els.optEndBell.checked = settings.endBell;
  }

  function applySettings() {
    settings.cue = els.optCue.value;
    if (settings.cue !== 'off') state.cueBeforeMute = settings.cue;
    settings.volume = Math.max(0, Math.min(100, Number(els.optVolume.value)));
    settings.ambient = els.optAmbient.value;
    settings.prepSec = Math.max(0, Math.min(15, Number(els.optPrep.value) || 0));
    settings.endBell = els.optEndBell.checked;

    if (state.status === 'running') {
      if (settings.ambient === 'off') {
        audio.stopAmbient();
      } else {
        audio.startAmbient(settings.ambient, settings.volume);
      }
    }
    renderChrome();
    persist();
  }

  // --- Event Listeners ---
  els.tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => selectPattern(tab.dataset.pattern));
    tab.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const nextIdx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + els.tabs.length) % els.tabs.length;
      els.tabs[nextIdx].focus();
      selectPattern(els.tabs[nextIdx].dataset.pattern);
    });
  });

  els.durChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const dur = chip.dataset.dur;
      if (dur === 'custom') {
        state.isCustomDur = true;
        state.durationMin = Math.max(1, Math.min(60, Number(els.customDurInput.value) || state.customMin));
        state.customMin = state.durationMin;
        if (state.status !== 'idle') resetBreathing();
        else renderChrome();
        persist();
        els.customDurInput.focus();
      } else {
        setDuration(Number(dur), false);
      }
    });
  });

  els.customDurApply.addEventListener('click', () => {
    const mins = Math.max(1, Math.min(60, Math.round(Number(els.customDurInput.value) || 3)));
    els.customDurInput.value = String(mins);
    setDuration(mins, true);
  });

  els.customDurInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      els.customDurApply.click();
    }
  });

  els.toggleBtn.addEventListener('click', () => {
    if (state.status === 'running' || state.status === 'prep') pauseBreathing();
    else startBreathing();
  });

  els.finishBtn.addEventListener('click', () => {
    const elapsed = currentElapsedMs();
    if (elapsed >= 5000) {
      state.elapsedMs = elapsed;
      completeSession(false);
    }
  });

  els.resetBtn.addEventListener('click', resetBreathing);
  els.soundQuickBtn.addEventListener('click', toggleSound);
  els.zenBtn.addEventListener('click', () => toggleZen(true));
  els.zenExit.addEventListener('click', () => toggleZen(false));

  els.settingsBtn.addEventListener('click', () => {
    syncSettingsUI();
    els.dialog.showModal();
  });

  els.settingsCloseBtn.addEventListener('click', () => els.dialog.close());
  els.dialog.addEventListener('click', (e) => {
    if (e.target === els.dialog) els.dialog.close();
  });

  els.optVolume.addEventListener('input', () => {
    els.optVolumeLabel.textContent = `${els.optVolume.value}%`;
  });

  els.testCueBtn.addEventListener('click', () => {
    const style = els.optCue.value === 'off' ? 'tones' : els.optCue.value;
    audio.playPhaseCue('inhale', style, Number(els.optVolume.value));
  });

  els.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applySettings();
    els.dialog.close();
  });

  els.settingsResetBtn.addEventListener('click', () => {
    Object.assign(settings, DEFAULT_SETTINGS);
    syncSettingsUI();
    renderChrome();
    persist();
  });

  els.clearHistoryBtn.addEventListener('click', () => {
    sessions = [];
    renderChrome();
    persist();
    announce('Cleared today\'s breathing log.');
  });

  document.addEventListener('keydown', (e) => {
    if (els.dialog.open) return;
    const target = e.target;
    const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
    if (isTyping) {
      if (e.key === 'Escape') target.blur();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const k = e.key.toLowerCase();
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.status === 'running' || state.status === 'prep') pauseBreathing();
      else startBreathing();
    } else if (k === 'r') {
      e.preventDefault();
      resetBreathing();
    } else if (k === 'z') {
      e.preventDefault();
      toggleZen();
    } else if (k === 'm') {
      e.preventDefault();
      toggleSound();
    } else if (k === 's') {
      e.preventDefault();
      syncSettingsUI();
      els.dialog.showModal();
    } else if (k === '1') {
      selectPattern('box');
    } else if (k === '2') {
      selectPattern('478');
    } else if (k === '3') {
      selectPattern('coherent');
    } else if (k === '4') {
      selectPattern('sigh');
    } else if (e.key === 'Escape' && state.zen) {
      toggleZen(false);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (state.status === 'running' || state.status === 'prep')) {
      advanceTick(true);
    }
  });

  buildPhaseStrip();
  renderChrome();
})(typeof window !== 'undefined' ? window : globalThis);
