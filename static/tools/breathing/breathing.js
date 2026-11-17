((globalScope) => {
  const STORAGE_KEY = 'memo-tools-breathing-v1';
  const BASE_TITLE = (typeof document !== 'undefined' && document.title) ? document.title : 'Breathing · Memo Garcia';
  const MAX_RESTORE_OPEN_MS = 4 * 60 * 60 * 1000;
  const MAX_RESTORE_OVERDUE_MS = 12 * 60 * 60 * 1000;

  // scaleFrom / scaleTo are lung volume, 0 (empty) to 1 (full). `mark` is what
  // gets printed under the chart at the start of the phase.
  const PATTERNS = {
    box: {
      id: 'box',
      name: 'Box Breathing',
      shortName: 'Box',
      ratio: '4-4-4-4',
      phases: [
        { kind: 'inhale', label: 'Inhale', mark: 'in', seconds: 4, scaleFrom: 0, scaleTo: 1 },
        { kind: 'hold', label: 'Hold', mark: 'hold', seconds: 4, scaleFrom: 1, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', mark: 'out', seconds: 4, scaleFrom: 1, scaleTo: 0 },
        { kind: 'hold-empty', label: 'Hold', mark: 'hold', seconds: 4, scaleFrom: 0, scaleTo: 0 },
      ],
    },
    478: {
      id: '478',
      name: '4-7-8 Breathing',
      shortName: '4-7-8',
      ratio: '4-7-8',
      phases: [
        { kind: 'inhale', label: 'Inhale', mark: 'in', seconds: 4, scaleFrom: 0, scaleTo: 1 },
        { kind: 'hold', label: 'Hold', mark: 'hold', seconds: 7, scaleFrom: 1, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', mark: 'out', seconds: 8, scaleFrom: 1, scaleTo: 0 },
      ],
    },
    coherent: {
      id: 'coherent',
      name: 'Coherent Breathing',
      shortName: 'Coherent',
      ratio: '5-5',
      phases: [
        { kind: 'inhale', label: 'Inhale', mark: 'in', seconds: 5, scaleFrom: 0, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', mark: 'out', seconds: 5, scaleFrom: 1, scaleTo: 0 },
      ],
    },
    sigh: {
      id: 'sigh',
      name: 'Physiological Sigh',
      shortName: 'Sigh',
      ratio: '2+1-6',
      phases: [
        { kind: 'inhale', label: 'Inhale', mark: 'in', seconds: 2, scaleFrom: 0, scaleTo: 0.72 },
        { kind: 'inhale-top', label: 'Top up', mark: '+', seconds: 1, scaleFrom: 0.72, scaleTo: 1 },
        { kind: 'exhale', label: 'Exhale', mark: 'out', seconds: 6, scaleFrom: 1, scaleTo: 0 },
      ],
    },
  };

  Object.values(PATTERNS).forEach((p) => {
    p.cycleSec = p.phases.reduce((sum, ph) => sum + ph.seconds, 0);
  });

  const DEFAULT_SETTINGS = {
    cue: 'tones',
    volume: 65,
    ambient: 'off',
    prepSec: 3,
    endBell: true,
  };

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function getCycleDurationMs(patternId) {
    return (PATTERNS[patternId] || PATTERNS.box).cycleSec * 1000;
  }

  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * clamp(t, 0, 1)) - 1) / 2;
  }

  function getPhaseAtElapsed(patternId, elapsedMs) {
    const pattern = PATTERNS[patternId] || PATTERNS.box;
    const cycleMs = pattern.cycleSec * 1000;
    const safeElapsed = Math.max(0, elapsedMs);
    const cycleIndex = Math.floor(safeElapsed / cycleMs);
    let withinCycle = safeElapsed % cycleMs;

    for (let i = 0; i < pattern.phases.length; i++) {
      const phase = pattern.phases[i];
      const durMs = phase.seconds * 1000;
      if (withinCycle < durMs || i === pattern.phases.length - 1) {
        const phaseElapsedMs = Math.min(durMs, withinCycle);
        return {
          cycleIndex,
          phaseIndex: i,
          phase,
          phaseDurationMs: durMs,
          phaseElapsedMs,
          phaseRemainingMs: Math.max(0, durMs - phaseElapsedMs),
          rawProgress: durMs > 0 ? phaseElapsedMs / durMs : 1,
        };
      }
      withinCycle -= durMs;
    }
    return null;
  }

  // Lung volume, 0 to 1, at a point on the chart. Before zero the paper is
  // still running in and the pen rests on the baseline.
  function getVolumeAt(patternId, sec) {
    if (!(sec > 0)) return 0;
    const pattern = PATTERNS[patternId] || PATTERNS.box;
    let u = sec % pattern.cycleSec;
    for (const ph of pattern.phases) {
      if (u < ph.seconds) {
        if (ph.scaleFrom === ph.scaleTo) return ph.scaleFrom;
        return ph.scaleFrom + (ph.scaleTo - ph.scaleFrom) * easeInOutSine(u / ph.seconds);
      }
      u -= ph.seconds;
    }
    return pattern.phases[pattern.phases.length - 1].scaleTo;
  }

  // Calls fn(phase, start, end, cycleIndex, phaseIndex) for every phase that
  // overlaps [t0, t1], in seconds.
  function eachPhase(pattern, t0, t1, fn) {
    if (!(t1 > 0) || !(t1 > t0)) return;
    for (let c = Math.max(0, Math.floor(t0 / pattern.cycleSec)); ; c++) {
      let s = c * pattern.cycleSec;
      if (s >= t1) return;
      for (let i = 0; i < pattern.phases.length; i++) {
        const e = s + pattern.phases[i].seconds;
        if (e > t0 && s < t1) fn(pattern.phases[i], s, e, c, i);
        s = e;
      }
    }
  }

  function formatMMSS(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PATTERNS,
      getCycleDurationMs,
      easeInOutSine,
      getPhaseAtElapsed,
      getVolumeAt,
      eachPhase,
      formatMMSS,
    };
  }

  if (typeof document === 'undefined') return;

  function clock(ms, roundUp) {
    const total = Math.max(0, roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

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

  /* ── Sound ─────────────────────────────────────────────── */

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

      const level = clamp(volumePct / 100, 0.01, 1);
      const now = ctx.currentTime + 0.01;

      if (cueStyle === 'wood') {
        const freqMap = { inhale: 660, 'inhale-top': 840, hold: 520, 'hold-empty': 480, exhale: 410, prep: 580 };
        this.#woodTap(ctx, now, freqMap[kind] || 540, level * 0.24);
        return;
      }

      if (cueStyle === 'bowl') {
        const freqMap = { inhale: 396, 'inhale-top': 495, hold: 330, 'hold-empty': 297, exhale: 264, prep: 440 };
        const dur = kind === 'hold' || kind === 'hold-empty' ? 1.4 : 2.1;
        this.#singingBowl(ctx, now, freqMap[kind] || 396, level * 0.2, dur);
        return;
      }

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
      const level = clamp(volumePct / 100, 0.01, 1);
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
      const master = ctx.createGain();
      src.connect(filter);
      filter.connect(master);
      master.connect(ctx.destination);

      // Air is silent until a breath moves through it. See airPhase.
      if (mode === 'air') {
        filter.type = 'bandpass';
        filter.frequency.value = 700;
        filter.Q.value = 0.8;
        master.gain.value = 0.0001;
        src.start();
        this.ambientNodes = { src, lfo: null, master, filter, ctx, mode, peak: (volumePct / 100) * 0.55 };
        return;
      }

      filter.type = mode === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = mode === 'rain' ? 920 : 410;
      filter.Q.value = mode === 'rain' ? 0.55 : 0.7;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.14;
      lfoGain.gain.value = mode === 'rain' ? 220 : 70;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const targetGain = (volumePct / 100) * (mode === 'rain' ? 0.14 : 0.2);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(Math.max(0.002, targetGain), ctx.currentTime + 0.8);

      src.start();
      lfo.start();
      this.ambientNodes = { src, lfo, master, filter, ctx, mode };
    }

    // The sound of air follows the flow, not the volume: it swells in the
    // middle of an inhale or exhale and is silent through a hold.
    airPhase(kind, seconds) {
      const n = this.ambientNodes;
      if (!n || n.mode !== 'air') return;
      const { ctx, master, filter } = n;
      const t = ctx.currentTime + 0.02;
      const hold = (param) => {
        if (param.cancelAndHoldAtTime) {
          param.cancelAndHoldAtTime(t);
        } else {
          param.cancelScheduledValues(t);
          param.setValueAtTime(param.value, t);
        }
      };
      try {
        hold(master.gain);
        hold(filter.frequency);
        const inhale = kind === 'inhale' || kind === 'inhale-top';
        if ((!inhale && kind !== 'exhale') || seconds < 0.3) {
          master.gain.setTargetAtTime(0.0001, t, 0.08);
          return;
        }
        const dur = seconds - 0.05;
        const peak = n.peak * (inhale ? 1 : 0.8);
        master.gain.setValueAtTime(0.0001, t);
        master.gain.linearRampToValueAtTime(peak * 0.7, t + dur * 0.25);
        master.gain.linearRampToValueAtTime(peak, t + dur * 0.5);
        master.gain.linearRampToValueAtTime(peak * 0.7, t + dur * 0.75);
        master.gain.linearRampToValueAtTime(0.0001, t + dur);
        filter.frequency.setValueAtTime(inhale ? 520 : 1250, t);
        filter.frequency.exponentialRampToValueAtTime(inhale ? 1500 : 420, t + dur);
      } catch { /* a missed breath of air is not worth breaking the session */ }
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
          try { if (lfo) lfo.stop(); } catch {}
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

  /* ── Elements and state ────────────────────────────────── */

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const body = document.body;
  const stage = $('stage');
  const canvas = $('chart');
  const ctx2d = canvas.getContext('2d');
  const rig = $('rig');
  const pen = $('pen');
  const wordEl = $('word');
  const countEl = $('count');
  const subEl = $('sub');
  const hintEl = $('hint');
  const live = $('live');
  const favicon = $('favicon');
  const toggleBtn = $('toggle-btn');
  const finishBtn = $('finish-btn');
  const resetBtn = $('reset-btn');
  const patternBtns = [...document.querySelectorAll('#patterns [data-pattern]')];
  const lengthBtn = $('length-btn');
  const soundBtn = $('sound-btn');
  const prefsBtn = $('prefs-btn');
  const logBtn = $('log-btn');
  const prefs = $('prefs');
  const logPanel = $('log');
  const optLength = $('opt-length');
  const optCustom = $('opt-custom');
  const optCustomSet = $('opt-custom-set');
  const optPrep = $('opt-prep');
  const optCue = $('opt-cue');
  const optVolume = $('opt-volume');
  const optVolumeOut = $('opt-volume-out');
  const optAmbient = $('opt-ambient');
  const optEndBell = $('opt-end-bell');
  const logSummary = $('log-summary');
  const logList = $('log-list');
  const logClear = $('log-clear');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = matchMedia('(pointer: coarse)');
  const PRESETS = [2, 5, 10, 0];

  const audio = new BreathAudio();
  const saved = loadStore();
  const settings = { ...DEFAULT_SETTINGS, ...(saved?.settings || {}) };
  if (!['off', 'air', 'rain', 'warm'].includes(settings.ambient)) settings.ambient = 'off';
  const today = todayKey();
  let sessions = saved?.date === today && Array.isArray(saved?.sessions) ? saved.sessions : [];

  const initialDurMin = Number.isInteger(saved?.durationMin) && saved.durationMin >= 0 ? saved.durationMin : 2;

  const state = {
    patternId: saved?.patternId && PATTERNS[saved.patternId] ? saved.patternId : 'box',
    durationMin: initialDurMin, // 0 means open
    customMin: Number.isInteger(saved?.customMin) && saved.customMin >= 1 ? saved.customMin : 3,
    isCustomDur: typeof saved?.isCustomDur === 'boolean' ? saved.isCustomDur : !PRESETS.includes(initialDurMin),
    status: 'idle', // 'idle' | 'prep' | 'running' | 'paused' | 'complete'
    prepTotalMs: 0,
    prepRemainingMs: 0,
    prepEndAt: null,
    elapsedMs: 0,
    runAnchorTs: null,
    startedClockTs: null,
    lastPhaseKey: '',
    cueBeforeMute: typeof saved?.cueBeforeMute === 'string' && saved.cueBeforeMute !== 'off'
      ? saved.cueBeforeMute
      : (settings.cue !== 'off' ? settings.cue : 'tones'),
  };

  const pattern = () => PATTERNS[state.patternId];
  const isLive = () => state.status === 'running' || state.status === 'prep';
  const targetMs = () => (state.durationMin > 0 ? state.durationMin * 60_000 : 0);
  const lengthLabel = () => (state.durationMin > 0 ? `${state.durationMin} min` : 'Open');

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
    const timer = state.status !== 'idle'
      ? {
          status: state.status,
          patternId: state.patternId,
          durationMin: state.durationMin,
          elapsedMs: state.status === 'running' ? currentElapsedMs() : state.elapsedMs,
          runAnchorTs: state.runAnchorTs,
          prepTotalMs: state.prepTotalMs,
          prepRemainingMs: state.status === 'prep' ? currentPrepRemainingMs() : state.prepRemainingMs,
          prepEndAt: state.prepEndAt,
          startedClockTs: state.startedClockTs,
          lastPhaseKey: state.lastPhaseKey,
        }
      : null;

    saveStore({
      date: todayKey(),
      patternId: state.patternId,
      durationMin: state.durationMin,
      customMin: state.customMin,
      isCustomDur: state.isCustomDur,
      cueBeforeMute: state.cueBeforeMute,
      settings,
      sessions,
      timer,
    });
  }

  function announce(text) {
    live.textContent = text;
  }

  /* ── The chart ─────────────────────────────────────────────
     Time runs left to right on the paper. The pen sits at one x and the
     paper moves under it, so everything is placed by its time on the chart:
     x = penX + (t - now) * pps. */

  const view = {
    w: 0,
    h: 0,
    dpr: 1,
    sub: 2,        // grid squares per second
    g: 16,         // one grid square, px
    pps0: 32,      // px per second while breathing
    pps: 32,
    penX0: 0,      // where the pen sits while breathing
    penX: 0,
    margin: 48,
    baseY: 0,      // empty lungs
    amp: 0,        // baseline to full lungs, px
    feed: 0,       // seconds of blank paper between the pen and the pattern
    tween: null,
    feedAnim: null,
  };

  let theme = { ink: '46, 74, 143', wet: '22, 42, 102', text: '38, 34, 28', grid: '122, 98, 66', gridK: 1, glow: 0 };

  function readTheme() {
    const cs = getComputedStyle(body);
    const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
    theme = {
      ink: v('--ink-rgb', theme.ink),
      wet: v('--wet-rgb', theme.wet),
      text: v('--text-rgb', theme.text),
      grid: v('--grid-rgb', theme.grid),
      gridK: parseFloat(v('--grid-k', '1')) || 1,
      glow: parseFloat(v('--glow', '0')) || 0,
    };
  }

  function measure() {
    const r = stage.getBoundingClientRect();
    const w = Math.max(240, r.width);
    const h = Math.max(240, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    view.w = w;
    view.h = h;
    view.dpr = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    view.sub = w >= 1100 ? 4 : w >= 560 ? 2 : 1;
    const lo = view.sub === 1 ? 13 : view.sub === 2 ? 9 : 10;
    const hi = view.sub === 4 ? 12 : 18;
    view.g = clamp(Math.round(w / 32 / view.sub), lo, hi);
    view.pps0 = view.g * view.sub;
    view.margin = w < 700 ? 20 : 48;
    // With reduced motion the paper holds still and the pen crosses it instead.
    view.penX0 = reducedMotion.matches ? view.margin + 24 : Math.round(w * (w < 700 ? 0.33 : 0.36));
    view.amp = Math.max(4, Math.round(clamp(h * 0.27, 92, 236) / view.g)) * view.g;
    view.baseY = Math.round(h * 0.56 + view.amp / 2);

    root.style.setProperty('--home-x', view.penX0 + 'px');
    root.style.setProperty('--band-top', (view.baseY - view.amp) + 'px');
  }

  function chartNow() {
    if (state.status === 'idle') return -view.feed;
    if (state.status === 'prep') return -currentPrepRemainingMs() / 1000;
    if (state.status === 'paused' && state.prepRemainingMs > 0) return -state.prepRemainingMs / 1000;
    return currentElapsedMs() / 1000;
  }

  // Where on the chart the ink begins. The lead-in is drawn too.
  function inkStart() {
    return state.status === 'idle' ? null : -state.prepTotalMs / 1000;
  }

  // After a session the whole strip is laid out across the screen.
  function fitView() {
    const dur = Math.max(1, state.elapsedMs / 1000 - (inkStart() || 0));
    const pps = Math.min(view.pps0, (view.w - 2 * view.margin) / dur);
    const strip = dur * pps;
    return { pps, penX: (view.w - strip) / 2 + strip };
  }

  function homeView() {
    return { pps: view.pps0, penX: view.penX0 };
  }

  function settleView() {
    view.tween = null;
    Object.assign(view, state.status === 'complete' ? fitView() : homeView());
  }

  function tweenView(to, ms) {
    if (reducedMotion.matches) {
      view.tween = null;
      Object.assign(view, to);
    } else {
      view.tween = { a: { pps: view.pps, penX: view.penX }, b: to, t0: performance.now(), ms };
    }
    kick();
  }

  // New paper: the printed pattern runs in from the right to meet the pen.
  function feedPaper() {
    if (reducedMotion.matches) {
      view.feed = 0;
      view.feedAnim = null;
    } else {
      const from = (view.w - view.penX0) / view.pps0;
      view.feed = from;
      view.feedAnim = { from, t0: performance.now(), ms: 700 };
    }
    kick();
  }

  function stepAnims(ts) {
    const tw = view.tween;
    if (tw) {
      const k = clamp((ts - tw.t0) / tw.ms, 0, 1);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      view.pps = tw.a.pps * Math.pow(tw.b.pps / tw.a.pps, e);
      view.penX = tw.a.penX + (tw.b.penX - tw.a.penX) * e;
      if (k >= 1) view.tween = null;
    }
    const fa = view.feedAnim;
    if (fa) {
      const k = clamp((ts - fa.t0) / fa.ms, 0, 1);
      view.feed = fa.from * Math.pow(1 - k, 3);
      if (k >= 1) {
        view.feed = 0;
        view.feedAnim = null;
      }
    }
  }

  // Reduced motion: one page of whole cycles at a time. The pen sweeps across
  // it and the page turns when the pen reaches the edge.
  function poseAt(now) {
    const sweeping = reducedMotion.matches && (isLive() || state.status === 'paused');
    if (!sweeping) return { penX: view.penX, inkFrom: -Infinity };
    const P = pattern();
    const span = (view.w - view.margin - view.penX0) / view.pps;
    const page = span >= P.cycleSec ? Math.floor(span / P.cycleSec) * P.cycleSec : span;
    const into = (now - (inkStart() || 0)) % page;
    return { penX: view.penX0 + into * view.pps, inkFrom: now - into };
  }

  function niceStep(n) {
    for (const s of [1, 2, 5, 10, 20, 50, 100, 200, 500]) if (s >= n) return s;
    return 1000;
  }

  function paint() {
    const { w, h, dpr, g, sub, baseY, amp, pps } = view;
    const P = pattern();
    const st = state.status;
    const now = chartNow();
    const { penX, inkFrom } = poseAt(now);
    const xOf = (t) => penX + (t - now) * pps;
    const yOf = (v) => baseY - v * amp;
    const tL = now - penX / pps;
    const tR = now + (w - penX) / pps;
    const topY = baseY - amp;
    // Where the printed pattern stops.
    const end = st === 'complete' ? state.elapsedMs / 1000 : (targetMs() > 0 ? targetMs() / 1000 : Infinity);
    const c = ctx2d;

    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, h);
    c.setLineDash([]);
    c.lineWidth = 1;

    /* grid: a square is 1/sub of a second, heavier lines at 1 s and 5 s */
    const gridInk = (a) => `rgba(${theme.grid}, ${(a * theme.gridK).toFixed(3)})`;
    const tiers = sub > 1 ? [[1, 0.075], [sub, 0.1], [sub * 5, 0.17]] : [[1, 0.1], [5, 0.17]];
    const kMin = -Math.ceil(baseY / g);
    const kMax = Math.ceil((h - baseY) / g);
    for (const [every, a] of tiers) {
      c.beginPath();
      for (let k = kMin; k <= kMax; k++) {
        if (k % every !== 0) continue;
        const y = baseY + k * g + 0.5;
        c.moveTo(0, y);
        c.lineTo(w, y);
      }
      c.strokeStyle = gridInk(a);
      c.stroke();
    }
    for (const [every, a] of tiers.concat([[sub * 60, 0.2]])) {
      const step = every / sub;
      const px = step * pps;
      if (px < 4) continue;
      c.beginPath();
      for (let i = Math.ceil(tL / step); i * step <= tR; i++) {
        const x = xOf(i * step);
        c.moveTo(x, 0);
        c.lineTo(x, h);
      }
      c.strokeStyle = gridInk(a * clamp((px - 4) / 6, 0, 1));
      c.stroke();
    }
    c.beginPath();
    c.moveTo(0, baseY + 0.5);
    c.lineTo(w, baseY + 0.5);
    c.moveTo(0, topY + 0.5);
    c.lineTo(w, topY + 0.5);
    c.strokeStyle = gridInk(0.3);
    c.stroke();

    /* what is printed on the paper: phase marks below, cycle numbers above */
    const textInk = (a) => `rgba(${theme.text}, ${a})`;
    const cur = (st === 'running' || st === 'paused') && now >= 0 ? getPhaseAtElapsed(P.id, now * 1000) : null;
    c.font = '500 10.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    c.textBaseline = 'alphabetic';
    const cyclePx = P.cycleSec * pps;
    const numberEvery = cyclePx >= 22 ? 1 : niceStep(22 / cyclePx);
    c.beginPath();
    eachPhase(P, Math.max(0, tL), Math.min(tR, end), (ph, s, e, ci, pi) => {
      const x = xOf(s);
      const px = (Math.min(e, end) - s) * pps;
      if (px >= 5 || pi === 0) {
        c.moveTo(x, baseY + 5);
        c.lineTo(x, baseY + (pi === 0 ? 14 : 10));
      }
      if (px >= ph.mark.length * 6.4 + 8) {
        const active = cur && cur.cycleIndex === ci && cur.phaseIndex === pi;
        c.fillStyle = textInk(active ? 0.92 : 0.44);
        c.fillText(ph.mark, x + 4, baseY + 27);
      }
      if (pi === 0 && ci % numberEvery === 0) {
        c.fillStyle = textInk(0.44);
        c.fillText(String(ci + 1), x + 4, topY - 8);
      }
    });
    c.strokeStyle = textInk(0.4);
    c.stroke();

    if (Number.isFinite(end) && end >= tL && end <= tR) {
      const x = xOf(end);
      c.beginPath();
      c.moveTo(x, topY - 16);
      c.lineTo(x, baseY + 16);
      c.lineWidth = 1.6;
      c.strokeStyle = textInk(0.55);
      c.stroke();
      c.beginPath();
      c.moveTo(x + 4, topY - 16);
      c.lineTo(x + 4, baseY + 16);
      c.lineWidth = 1;
      c.stroke();
    }

    /* how much of this phase is left */
    if (cur && st !== 'complete') {
      const xe = xOf(Math.min(now + cur.phaseRemainingMs / 1000, end));
      c.fillStyle = `rgba(${theme.ink}, 0.07)`;
      c.fillRect(penX, topY, Math.max(0, xe - penX), amp);
    }

    /* the pattern still to come, printed in dots */
    if (st !== 'complete') {
      c.save();
      c.beginPath();
      c.rect(penX, 0, Math.max(0, Math.min(w, xOf(end)) - penX), h);
      c.clip();
      c.setLineDash([0.1, 6]);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.lineWidth = 1.9;
      c.strokeStyle = `rgba(${theme.ink}, 0.64)`;
      if (now < 0) {
        c.beginPath();
        c.moveTo(xOf(0), baseY);
        c.lineTo(penX - 1, baseY);
        c.stroke();
      }
      // One path per phase, started at the phase boundary, so the dots stay
      // fixed to the paper instead of crawling along the line.
      eachPhase(P, Math.max(0, now), Math.min(tR, end), (ph, s, e) => {
        const n = Math.max(2, Math.ceil(((e - s) * pps) / 2));
        c.beginPath();
        for (let j = 0; j <= n; j++) {
          const u = j / n;
          const v = ph.scaleFrom + (ph.scaleTo - ph.scaleFrom) * easeInOutSine(u);
          if (j) c.lineTo(xOf(s + (e - s) * u), yOf(v));
          else c.moveTo(xOf(s), yOf(v));
        }
        c.stroke();
      });
      c.restore();
    }

    /* ink */
    const i0 = inkStart();
    if (i0 !== null && now > i0) {
      const tA = Math.max(tL - 2 / pps, i0, inkFrom);
      const dt = 1.5 / pps;
      const path = new Path2D();
      path.moveTo(xOf(tA), yOf(getVolumeAt(P.id, tA)));
      for (let t = Math.ceil(tA / dt) * dt; t < now; t += dt) path.lineTo(xOf(t), yOf(getVolumeAt(P.id, t)));
      path.lineTo(penX, yOf(getVolumeAt(P.id, now)));

      const iw = w < 700 ? 2 : 2.4;
      c.setLineDash([]);
      c.lineCap = 'round';
      c.lineJoin = 'round';
      // a little bleed into the paper
      c.strokeStyle = `rgba(${theme.ink}, 0.13)`;
      c.lineWidth = iw + 3;
      c.stroke(path);
      if (theme.glow) {
        c.shadowColor = `rgba(${theme.ink}, 0.6)`;
        c.shadowBlur = theme.glow;
      }
      c.strokeStyle = `rgb(${theme.ink})`;
      c.lineWidth = iw;
      c.stroke(path);
      c.shadowBlur = 0;
      c.shadowColor = 'transparent';

      // The last couple of seconds are still wet.
      if (isLive()) {
        const x0 = xOf(now - 1.8);
        const wet = c.createLinearGradient(x0, 0, penX, 0);
        wet.addColorStop(0, `rgba(${theme.wet}, 0)`);
        wet.addColorStop(1, `rgba(${theme.wet}, 1)`);
        c.save();
        c.beginPath();
        c.rect(x0, 0, penX - x0, h);
        c.clip();
        c.strokeStyle = wet;
        c.lineWidth = iw + 0.9;
        c.stroke(path);
        c.restore();
      }
    }

    rig.style.transform = `translate3d(${penX.toFixed(2)}px, 0, 0)`;
    pen.style.transform = `translate3d(0, ${yOf(getVolumeAt(P.id, now)).toFixed(2)}px, 0)`;

    updateReadout();
  }

  /* ── Readout ───────────────────────────────────────────── */

  const shown = { word: null, count: null, sub: null, title: null, favicon: '' };

  function setText(el, key, value) {
    if (shown[key] === value) return false;
    shown[key] = value;
    el.textContent = value;
    return true;
  }

  function updateFavicon(progress, patternId, status) {
    const bucket = `${patternId}:${status}:${Math.round(progress * 20)}`;
    if (bucket === shown.favicon) return;
    shown.favicon = bucket;
    const palette = { box: '#2e4a8f', 478: '#7a3b78', coherent: '#1f6f5c', sigh: '#b4472a' };
    const stroke = palette[patternId] || palette.box;
    const c = 2 * Math.PI * 12;
    const offset = status === 'idle' ? c : c * (1 - clamp(progress, 0, 1));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#efeadd"/><circle cx="16" cy="16" r="12" fill="none" stroke="#d6cfbd" stroke-width="3"/><circle cx="16" cy="16" r="12" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 16 16)"/><circle cx="16" cy="16" r="4" fill="${stroke}"/></svg>`;
    favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function updateReadout() {
    const P = pattern();
    const goalMs = targetMs();
    let word = P.shortName;
    let count = '';
    let sub = `${P.ratio} · ${lengthLabel()}`;
    let title = BASE_TITLE;
    let progress = 0;

    if (state.status === 'prep' || (state.status === 'paused' && state.prepRemainingMs > 0)) {
      const s = Math.max(1, Math.ceil(currentPrepRemainingMs() / 1000));
      word = state.status === 'paused' ? 'Paused' : 'Settle in';
      count = state.status === 'paused' ? '' : String(s);
      sub = state.status === 'paused' ? 'space to resume' : 'relax your shoulders and jaw';
      title = state.status === 'paused' ? `Paused · ${P.shortName} · Memo Garcia` : `Settle (${s}) · Breathing`;
    } else if (state.status === 'complete') {
      const cycles = Math.max(1, Math.round(state.elapsedMs / (P.cycleSec * 1000)));
      word = 'Done';
      sub = `${cycles} ${cycles === 1 ? 'cycle' : 'cycles'} · ${clock(state.elapsedMs)} · ${P.name}`;
      title = `Done · ${P.shortName} · Memo Garcia`;
      progress = 1;
    } else if (state.status === 'running' || state.status === 'paused') {
      const elapsed = currentElapsedMs();
      const info = getPhaseAtElapsed(P.id, elapsed);
      const secLeft = Math.max(1, Math.ceil(info.phaseRemainingMs / 1000));
      const rest = goalMs > 0 ? `${clock(goalMs - elapsed, true)} left` : clock(elapsed);
      progress = goalMs > 0 ? Math.min(1, elapsed / goalMs) : (elapsed / 1000 % P.cycleSec) / P.cycleSec;
      if (state.status === 'paused') {
        word = 'Paused';
        sub = `space to resume · cycle ${info.cycleIndex + 1} · ${rest}`;
        title = `Paused · ${P.shortName} · Memo Garcia`;
      } else {
        word = info.phase.label;
        count = String(secLeft);
        sub = `cycle ${info.cycleIndex + 1} · ${rest}`;
        title = `${info.phase.label} (${secLeft}) · ${P.shortName}`;
      }
    }

    if (setText(wordEl, 'word', word) && state.status === 'running' && !reducedMotion.matches) {
      wordEl.parentElement.animate(
        [{ opacity: 0.25, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }],
        { duration: 320, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
      );
    }
    setText(countEl, 'count', count);
    setText(subEl, 'sub', sub);
    if (shown.title !== title) {
      shown.title = title;
      document.title = title;
    }
    updateFavicon(progress, P.id, state.status);
  }

  /* ── Chrome ────────────────────────────────────────────── */

  function setPressed(group, attr, value) {
    group.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset[attr] === String(value)));
    });
  }

  function renderLog() {
    if (sessions.length && sessions[0].day && sessions[0].day !== todayKey()) sessions = [];
    const count = sessions.length;
    const totalSec = sessions.reduce((acc, s) => acc + s.seconds, 0);
    const totalMin = Math.max(count > 0 ? 1 : 0, Math.round(totalSec / 60));
    logBtn.textContent = `Log ${count}`;
    logSummary.textContent = count > 0
      ? `${count} ${count === 1 ? 'session' : 'sessions'} today, ${totalMin} min`
      : 'No sessions today.';
    logList.hidden = count === 0;
    logClear.hidden = count === 0;
    logList.replaceChildren();
    [...sessions].reverse().forEach((item) => {
      const li = document.createElement('li');
      const time = document.createElement('span');
      time.textContent = item.time;
      const name = document.createElement('span');
      name.textContent = item.patternName;
      const dur = document.createElement('span');
      const mins = Math.floor(item.seconds / 60);
      const secs = item.seconds % 60;
      dur.textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      li.append(time, name, dur);
      logList.appendChild(li);
    });
  }

  function renderChrome() {
    const st = state.status;
    body.dataset.pattern = state.patternId;
    body.dataset.state = st;

    patternBtns.forEach((b) => {
      const on = b.dataset.pattern === state.patternId;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });

    toggleBtn.textContent = isLive() ? 'Pause' : st === 'paused' ? 'Resume' : st === 'complete' ? 'Again' : 'Start';
    finishBtn.hidden = !((st === 'running' || st === 'paused') && currentElapsedMs() >= 5000);
    resetBtn.hidden = st === 'idle';
    lengthBtn.textContent = lengthLabel();

    const soundOn = settings.cue !== 'off';
    soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(soundOn));

    setPressed(optLength, 'dur', state.isCustomDur ? 'custom' : state.durationMin);
    if (document.activeElement !== optCustom) optCustom.value = String(state.customMin);
    setPressed(optPrep, 'prep', settings.prepSec);
    setPressed(optCue, 'cue', soundOn ? settings.cue : state.cueBeforeMute);
    optVolume.value = settings.volume;
    optVolumeOut.textContent = `${settings.volume}%`;
    setPressed(optAmbient, 'ambient', settings.ambient);
    optEndBell.checked = settings.endBell;

    renderLog();
    readTheme();
    wake();
    kick();
  }

  // The controls step back once the breathing starts.
  let quietTimer = 0;
  function wake() {
    body.classList.remove('quiet');
    clearTimeout(quietTimer);
    if (isLive() && prefs.hidden && logPanel.hidden) {
      quietTimer = setTimeout(() => body.classList.add('quiet'), 3200);
    }
  }

  function openPanel(which) {
    [[prefs, prefsBtn, 'prefs'], [logPanel, logBtn, 'log']].forEach(([el, btn, name]) => {
      const open = name === which;
      if (open) {
        // Sit just above the controls, however many rows they wrap to.
        const top = btn.parentElement.getBoundingClientRect().top - stage.getBoundingClientRect().top;
        el.style.bottom = Math.round(view.h - top + 8) + 'px';
      }
      el.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    wake();
  }

  /* ── Session ───────────────────────────────────────────── */

  function startAmbient() {
    if (settings.ambient === 'off' || settings.cue === 'off') return;
    audio.startAmbient(settings.ambient, settings.volume);
    if (settings.ambient === 'air' && state.status === 'running') {
      const info = getPhaseAtElapsed(state.patternId, currentElapsedMs());
      if (info) audio.airPhase(info.phase.kind, info.phaseRemainingMs / 1000);
    }
  }

  function enterPhase(info, text) {
    state.lastPhaseKey = `${info.cycleIndex}:${info.phaseIndex}`;
    audio.playPhaseCue(info.phase.kind, settings.cue, settings.volume);
    audio.airPhase(info.phase.kind, info.phaseRemainingMs / 1000);
    announce(text || `${info.phase.label} for ${info.phase.seconds} seconds`);
  }

  function recordSession(elapsedMs, endedAt = Date.now()) {
    const P = pattern();
    sessions.push({
      day: todayKey(),
      time: formatClockTime(endedAt),
      patternId: P.id,
      patternName: `${P.name} (${P.ratio})`,
      seconds: Math.max(1, Math.round(elapsedMs / 1000)),
    });
  }

  function completeSession(playBell = true) {
    stopBackground();
    audio.stopAmbient();
    if (playBell && settings.endBell) {
      audio.playCompletion(settings.cue, settings.volume);
    }
    recordSession(state.elapsedMs);
    state.status = 'complete';
    state.runAnchorTs = null;
    state.prepEndAt = null;
    tweenView(fitView(), 1500);
    renderChrome();
    persist();
    announce(`${pattern().name} session complete.`);
  }

  function advanceTick() {
    if (state.status === 'prep') {
      const rem = currentPrepRemainingMs();
      state.prepRemainingMs = rem;
      if (rem <= 0) {
        state.status = 'running';
        state.prepEndAt = null;
        state.prepRemainingMs = 0;
        state.elapsedMs = 0;
        state.runAnchorTs = Date.now();
        startAmbient();
        const first = getPhaseAtElapsed(state.patternId, 0);
        if (first) enterPhase(first, first.phase.label);
        renderChrome();
        persist();
      }
      return;
    }

    if (state.status !== 'running') return;

    const elapsed = currentElapsedMs();
    state.elapsedMs = elapsed;
    const goalMs = targetMs();
    if (goalMs > 0 && elapsed >= goalMs) {
      state.elapsedMs = goalMs;
      completeSession(true);
      return;
    }

    const info = getPhaseAtElapsed(state.patternId, elapsed);
    if (info && `${info.cycleIndex}:${info.phaseIndex}` !== state.lastPhaseKey) enterPhase(info);

    if (finishBtn.hidden && elapsed >= 5000) finishBtn.hidden = false;
  }

  let rafId = null;
  let bgInterval = null;

  function frame(ts) {
    rafId = null;
    if (isLive()) advanceTick();
    stepAnims(ts);
    paint();
    if ((isLive() || view.tween || view.feedAnim) && rafId === null) {
      rafId = requestAnimationFrame(frame);
    }
  }

  function kick() {
    if (rafId === null) rafId = requestAnimationFrame(frame);
  }

  // Frames stop in a hidden tab. This keeps the cues and the end of the
  // session on time while nobody is looking.
  function startBackground() {
    stopBackground();
    bgInterval = setInterval(() => {
      if (document.hidden && isLive()) advanceTick();
    }, 350);
  }

  function stopBackground() {
    if (bgInterval !== null) {
      clearInterval(bgInterval);
      bgInterval = null;
    }
  }

  function startBreathing() {
    audio.ensureContext();
    openPanel(null);
    if (state.status === 'idle' || state.status === 'complete') {
      state.elapsedMs = 0;
      state.lastPhaseKey = '';
      state.startedClockTs = Date.now();
      state.prepTotalMs = settings.prepSec * 1000;
      view.feed = 0;
      view.feedAnim = null;
      if (state.status === 'complete') tweenView(homeView(), 700);
      if (settings.prepSec > 0) {
        state.status = 'prep';
        state.prepRemainingMs = state.prepTotalMs;
        state.prepEndAt = Date.now() + state.prepRemainingMs;
        audio.playPhaseCue('prep', settings.cue, settings.volume);
        announce(`Settle in for ${settings.prepSec} seconds.`);
      } else {
        state.status = 'running';
        state.runAnchorTs = Date.now();
        startAmbient();
        const first = getPhaseAtElapsed(state.patternId, 0);
        if (first) enterPhase(first, first.phase.label);
      }
    } else if (state.status === 'paused') {
      if (state.prepRemainingMs > 0) {
        state.status = 'prep';
        state.prepEndAt = Date.now() + state.prepRemainingMs;
      } else {
        state.status = 'running';
        state.runAnchorTs = Date.now() - state.elapsedMs;
        startAmbient();
      }
      announce('Resumed.');
    } else {
      return;
    }
    startBackground();
    renderChrome();
    persist();
  }

  function pauseBreathing() {
    if (!isLive()) return;
    if (state.status === 'prep') {
      state.prepRemainingMs = currentPrepRemainingMs();
      state.prepEndAt = null;
    } else {
      state.elapsedMs = currentElapsedMs();
      state.runAnchorTs = null;
    }
    stopBackground();
    audio.stopAmbient();
    state.status = 'paused';
    renderChrome();
    persist();
    announce('Breathing paused.');
  }

  function toggle() {
    if (isLive()) pauseBreathing();
    else startBreathing();
  }

  function toIdle() {
    stopBackground();
    audio.stopAmbient();
    const wasIdle = state.status === 'idle';
    state.status = 'idle';
    state.prepTotalMs = 0;
    state.prepRemainingMs = 0;
    state.prepEndAt = null;
    state.elapsedMs = 0;
    state.runAnchorTs = null;
    state.startedClockTs = null;
    state.lastPhaseKey = '';
    if (wasIdle) settleView();
    else tweenView(homeView(), 500);
    feedPaper();
    renderChrome();
    persist();
  }

  function resetBreathing() {
    toIdle();
    announce('Breathing pacer reset.');
  }

  function selectPattern(patternId) {
    if (!PATTERNS[patternId] || patternId === state.patternId) return;
    state.patternId = patternId;
    toIdle();
    announce(`Selected ${PATTERNS[patternId].name}.`);
  }

  function setDuration(minutes, isCustom = false) {
    state.durationMin = minutes;
    state.isCustomDur = isCustom;
    if (isCustom) state.customMin = minutes;
    if (state.status !== 'idle') {
      toIdle();
    } else {
      renderChrome();
      persist();
    }
    announce(minutes > 0 ? `Session length ${minutes} minutes.` : 'Open session.');
  }

  function toggleSound() {
    if (settings.cue === 'off') {
      settings.cue = state.cueBeforeMute || 'tones';
      if (state.status === 'running') startAmbient();
    } else {
      state.cueBeforeMute = settings.cue;
      settings.cue = 'off';
      audio.stopAmbient();
    }
    renderChrome();
    persist();
    announce(settings.cue === 'off' ? 'Sound muted.' : 'Sound enabled.');
  }

  /* ── Events ────────────────────────────────────────────── */

  // The paper itself is the start and pause button.
  stage.addEventListener('click', (e) => {
    if (e.target.closest('.chrome, .panel')) return;
    if (!prefs.hidden || !logPanel.hidden) {
      openPanel(null);
      return;
    }
    if (state.status === 'complete') return;
    toggle();
  });

  document.querySelector('.chrome-bottom').addEventListener('click', (e) => {
    // A mouse click should not leave focus behind, or the controls never fade.
    const btn = e.target.closest('button');
    if (btn && e.detail > 0) btn.blur();
  });

  toggleBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', resetBreathing);
  soundBtn.addEventListener('click', toggleSound);
  finishBtn.addEventListener('click', () => {
    const elapsed = currentElapsedMs();
    if (elapsed >= 5000) {
      state.elapsedMs = elapsed;
      completeSession(false);
    }
  });

  patternBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => selectPattern(btn.dataset.pattern));
    btn.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = patternBtns[(idx + step + patternBtns.length) % patternBtns.length];
      next.focus();
      selectPattern(next.dataset.pattern);
    });
  });

  lengthBtn.addEventListener('click', () => {
    const steps = state.isCustomDur ? [2, 5, 10, state.customMin, 0] : PRESETS;
    const next = steps[(steps.lastIndexOf(state.durationMin) + 1) % steps.length];
    setDuration(next, state.isCustomDur && next === state.customMin);
  });

  prefsBtn.addEventListener('click', () => openPanel(prefs.hidden ? 'prefs' : null));
  logBtn.addEventListener('click', () => openPanel(logPanel.hidden ? 'log' : null));

  optLength.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-dur]');
    if (b) setDuration(Number(b.dataset.dur), false);
  });

  function applyCustom() {
    const mins = clamp(Math.round(Number(optCustom.value) || 3), 1, 60);
    optCustom.value = String(mins);
    setDuration(mins, true);
  }
  optCustomSet.addEventListener('click', applyCustom);
  optCustom.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustom();
    }
  });

  optPrep.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-prep]');
    if (!b) return;
    settings.prepSec = Number(b.dataset.prep);
    renderChrome();
    persist();
  });

  optCue.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cue]');
    if (!b) return;
    settings.cue = b.dataset.cue;
    state.cueBeforeMute = settings.cue;
    audio.playPhaseCue('inhale', settings.cue, settings.volume);
    renderChrome();
    persist();
  });

  optVolume.addEventListener('input', () => {
    settings.volume = clamp(Number(optVolume.value), 0, 100);
    optVolumeOut.textContent = `${settings.volume}%`;
  });
  optVolume.addEventListener('change', () => {
    if (state.status === 'running') {
      audio.stopAmbient();
      startAmbient();
    }
    audio.playPhaseCue('inhale', settings.cue, settings.volume);
    persist();
  });

  optAmbient.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-ambient]');
    if (!b) return;
    settings.ambient = b.dataset.ambient;
    audio.stopAmbient();
    if (state.status === 'running') startAmbient();
    renderChrome();
    persist();
  });

  optEndBell.addEventListener('change', () => {
    settings.endBell = optEndBell.checked;
    persist();
  });

  logClear.addEventListener('click', () => {
    sessions = [];
    renderChrome();
    persist();
    announce('Cleared today\'s breathing log.');
  });

  document.addEventListener('keydown', (e) => {
    wake();
    const target = e.target;
    const tag = target && target.tagName;
    if (e.key === 'Escape') {
      if (!prefs.hidden || !logPanel.hidden) openPanel(null);
      if (tag === 'INPUT') target.blur();
      return;
    }
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.code === 'Space') {
      // On a control, space belongs to that control.
      if (tag === 'BUTTON' || tag === 'A') return;
      e.preventDefault();
      toggle();
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'r') resetBreathing();
    else if (k === 'm') toggleSound();
    else if (k === '1') selectPattern('box');
    else if (k === '2') selectPattern('478');
    else if (k === '3') selectPattern('coherent');
    else if (k === '4') selectPattern('sigh');
  });

  let moved = 0;
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    if (moved > 24) {
      moved = 0;
      wake();
    }
  });
  stage.addEventListener('pointerdown', wake);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      persist();
    } else {
      if (isLive()) advanceTick();
      kick();
    }
  });
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);

  function relayout() {
    measure();
    settleView();
    kick();
  }

  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(relayout).observe(stage);
  } else {
    window.addEventListener('resize', relayout);
  }
  reducedMotion.addEventListener('change', relayout);

  const repaintTheme = () => {
    readTheme();
    kick();
  };
  new MutationObserver(repaintTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', repaintTheme);

  /* ── Restore ───────────────────────────────────────────── */

  function armAudioUnlockForRestoredTimer() {
    const unlock = () => {
      audio.ensureContext();
      if (state.status === 'running') startAmbient();
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }

  function restoreTimer() {
    const t = saved?.timer;
    if (!t || typeof t !== 'object') return;
    if (t.patternId && PATTERNS[t.patternId]) {
      state.patternId = t.patternId;
    }
    if (Number.isInteger(t.durationMin) && t.durationMin >= 0) {
      state.durationMin = t.durationMin;
    }
    const prepTotal = Math.max(0, Number(t.prepTotalMs) || 0);
    const goalMs = targetMs();
    const now = Date.now();

    if (t.status === 'complete') {
      if (saved?.date === today && Number(t.elapsedMs) > 0) {
        state.status = 'complete';
        state.elapsedMs = Number(t.elapsedMs);
        state.prepTotalMs = prepTotal;
      }
      return;
    }

    if (t.status === 'paused') {
      const remPrep = Math.max(0, Number(t.prepRemainingMs) || 0);
      const elapsed = Math.max(0, Number(t.elapsedMs) || 0);
      if (remPrep > 0 || elapsed > 0) {
        state.status = 'paused';
        state.prepTotalMs = Math.max(prepTotal, remPrep);
        state.prepRemainingMs = remPrep;
        state.elapsedMs = goalMs > 0 ? Math.min(goalMs, elapsed) : elapsed;
        state.startedClockTs = typeof t.startedClockTs === 'number' ? t.startedClockTs : null;
        state.lastPhaseKey = typeof t.lastPhaseKey === 'string' ? t.lastPhaseKey : '';
      }
      return;
    }

    if (t.status === 'prep') {
      const prepEndAt = typeof t.prepEndAt === 'number' ? t.prepEndAt : null;
      if (prepEndAt !== null && prepEndAt > now) {
        state.status = 'prep';
        state.prepEndAt = prepEndAt;
        state.prepRemainingMs = prepEndAt - now;
        state.prepTotalMs = Math.max(prepTotal, state.prepRemainingMs);
        state.startedClockTs = typeof t.startedClockTs === 'number' ? t.startedClockTs : now;
        armAudioUnlockForRestoredTimer();
        startBackground();
        return;
      }
      if (prepEndAt !== null) {
        const overrun = Math.max(0, now - prepEndAt);
        if (goalMs > 0 && overrun >= goalMs) {
          if (overrun - goalMs < MAX_RESTORE_OVERDUE_MS) {
            const finishedAt = prepEndAt + goalMs;
            if (todayKey(new Date(finishedAt)) === today) {
              recordSession(goalMs, finishedAt);
            }
            state.status = 'complete';
            state.elapsedMs = goalMs;
            state.prepTotalMs = prepTotal;
          }
          persist();
          return;
        }
        if (goalMs === 0 && overrun > MAX_RESTORE_OPEN_MS) {
          persist();
          return;
        }
        state.status = 'running';
        state.runAnchorTs = prepEndAt;
        state.elapsedMs = overrun;
        state.prepTotalMs = prepTotal;
        state.startedClockTs = typeof t.startedClockTs === 'number' ? t.startedClockTs : prepEndAt;
        const info = getPhaseAtElapsed(state.patternId, overrun);
        state.lastPhaseKey = info ? `${info.cycleIndex}:${info.phaseIndex}` : '';
        armAudioUnlockForRestoredTimer();
        startBackground();
        persist();
      }
      return;
    }

    if (t.status === 'running') {
      const anchor = typeof t.runAnchorTs === 'number' ? t.runAnchorTs : null;
      const elapsed = anchor !== null ? Math.max(0, now - anchor) : Math.max(0, Number(t.elapsedMs) || 0);
      if (goalMs > 0 && elapsed >= goalMs) {
        if (elapsed - goalMs < MAX_RESTORE_OVERDUE_MS) {
          const finishedAt = (anchor ?? now - elapsed) + goalMs;
          if (todayKey(new Date(finishedAt)) === today) {
            recordSession(goalMs, finishedAt);
          }
          state.status = 'complete';
          state.elapsedMs = goalMs;
          state.prepTotalMs = prepTotal;
        }
        persist();
        return;
      }
      if (goalMs === 0 && elapsed > MAX_RESTORE_OPEN_MS) {
        persist();
        return;
      }
      state.status = 'running';
      state.runAnchorTs = anchor ?? (now - elapsed);
      state.elapsedMs = elapsed;
      state.prepTotalMs = prepTotal;
      state.startedClockTs = typeof t.startedClockTs === 'number' ? t.startedClockTs : state.runAnchorTs;
      const info = getPhaseAtElapsed(state.patternId, elapsed);
      state.lastPhaseKey = info ? `${info.cycleIndex}:${info.phaseIndex}` : '';
      armAudioUnlockForRestoredTimer();
      startBackground();
    }
  }

  /* ── Boot ──────────────────────────────────────────────── */

  // Each pattern button carries its own waveform, one cycle wide.
  patternBtns.forEach((b) => {
    const P = PATTERNS[b.dataset.pattern];
    let d = '';
    for (let i = 0; i <= 60; i++) {
      const v = i === 60 ? getVolumeAt(P.id, 0) : getVolumeAt(P.id, (P.cycleSec * i) / 60);
      d += `${i ? 'L' : 'M'}${(1 + (28 * i) / 60).toFixed(2)} ${(12 - v * 10).toFixed(2)}`;
    }
    b.querySelector('path').setAttribute('d', d);
  });

  hintEl.textContent = coarsePointer.matches ? 'Tap the paper to begin.' : 'Press space to begin.';

  restoreTimer();
  body.dataset.pattern = state.patternId;
  readTheme();
  measure();
  settleView();
  if (state.status === 'idle') feedPaper();
  renderChrome();
})(typeof window !== 'undefined' ? window : globalThis);
