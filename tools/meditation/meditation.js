((globalScope) => {
  const STORAGE_KEY = 'memo-tools-meditation-v1';
  const RING_RADIUS = 158;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const PRESET_MINUTES = [5, 10, 15, 20, 30, 45, 0];

  const DEFAULT_SETTINGS = {
    bell: 'bowl',
    volume: 70,
    ambient: 'off',
    prepSec: 0,
    intervalMode: 'off', // 'off' | '5' | '10' | 'half'
    startBell: true,
    endBells: 3,
    hideClock: false,
    autoZen: false,
    notify: false,
  };

  function clampCustomMinutes(val) {
    const n = Math.round(Number(val));
    if (!Number.isFinite(n)) return 10;
    return Math.max(1, Math.min(180, n));
  }

  function formatMMSS(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function formatCountdownMMSS(ms) {
    const totalSec = Math.max(0, Math.ceil(ms / 1000));
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function computeIntervalTimestampsMs(durationMin, intervalMode) {
    if (intervalMode === 'off') return [];
    const totalMs = durationMin > 0 ? durationMin * 60_000 : 0;
    if (intervalMode === 'half') {
      return totalMs >= 120_000 ? [Math.floor(totalMs / 2)] : [];
    }
    const stepMin = Number(intervalMode);
    if (!Number.isFinite(stepMin) || stepMin <= 0) return [];
    const stepMs = stepMin * 60_000;
    const marks = [];
    if (totalMs > 0) {
      for (let t = stepMs; t < totalMs; t += stepMs) {
        marks.push(t);
      }
    }
    return marks;
  }

  function computeStreakDays(sessions, referenceDate = new Date()) {
    if (!Array.isArray(sessions) || sessions.length === 0) return 0;
    const days = new Set(sessions.map((s) => s.day).filter(Boolean));
    const keyForOffset = (offset) => {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let offset = days.has(keyForOffset(0)) ? 0 : 1;
    if (!days.has(keyForOffset(offset))) return 0;
    let streak = 0;
    while (days.has(keyForOffset(offset))) {
      streak += 1;
      offset += 1;
    }
    return streak;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      PRESET_MINUTES,
      clampCustomMinutes,
      formatMMSS,
      formatCountdownMMSS,
      computeIntervalTimestampsMs,
      computeStreakDays,
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

  function formatTotalDuration(totalMin) {
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
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
      /* Continue in memory when storage is unavailable. */
    }
  }

  class MeditationAudio {
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

    playBell(kind, volumePct, count = 1, soft = false) {
      if (kind === 'off' || volumePct <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx) return;
      const baseLevel = Math.max(0.01, Math.min(1, volumePct / 100)) * (soft ? 0.55 : 1);
      const spacing = kind === 'tingsha' ? 1.5 : 1.7;

      for (let i = 0; i < count; i++) {
        const start = ctx.currentTime + 0.02 + i * spacing;
        const level = baseLevel * (i === 0 ? 1 : 0.82);
        if (kind === 'bowl') {
          this.#singingBowl(ctx, start, 432, level * 0.34, 4.0);
        } else if (kind === 'temple') {
          this.#templeBell(ctx, start, 216, level * 0.38, 4.8);
        } else if (kind === 'tingsha') {
          this.#tingsha(ctx, start, level * 0.22);
        } else if (kind === 'chime') {
          this.#softChime(ctx, start, 528, level * 0.26);
        }
      }
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
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      if (mode === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.value = 960;
        filter.Q.value = 0.55;
        lfo.frequency.value = 0.14;
        lfoGain.gain.value = 230;
      } else if (mode === 'wind') {
        filter.type = 'bandpass';
        filter.frequency.value = 340;
        filter.Q.value = 1.4;
        lfo.frequency.value = 0.08;
        lfoGain.gain.value = 180;
      } else if (mode === 'stream') {
        filter.type = 'bandpass';
        filter.frequency.value = 1350;
        filter.Q.value = 0.8;
        lfo.frequency.value = 0.22;
        lfoGain.gain.value = 360;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 410;
        filter.Q.value = 0.7;
        lfo.frequency.value = 0.11;
        lfoGain.gain.value = 65;
      }

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const master = ctx.createGain();
      const targetGain = (volumePct / 100) * (mode === 'warm' ? 0.22 : 0.16);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(Math.max(0.002, targetGain), ctx.currentTime + 0.9);

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
        master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        setTimeout(() => {
          try { src.stop(); } catch {}
          try { lfo.stop(); } catch {}
        }, 310);
      } catch {}
    }

    #singingBowl(ctx, start, freq, level, dur) {
      const partials = [
        { ratio: 1, amp: 1, d: dur },
        { ratio: 1.0035, amp: 0.62, d: dur * 0.92 },
        { ratio: 2.756, amp: 0.26, d: dur * 0.6 },
      ];
      this.#playPartials(ctx, start, freq, level, partials);
    }

    #templeBell(ctx, start, freq, level, dur) {
      const partials = [
        { ratio: 1, amp: 1, d: dur },
        { ratio: 1.5, amp: 0.45, d: dur * 0.8 },
        { ratio: 2.0, amp: 0.35, d: dur * 0.68 },
        { ratio: 3.01, amp: 0.18, d: dur * 0.45 },
      ];
      this.#playPartials(ctx, start, freq, level, partials);
    }

    #tingsha(ctx, start, level) {
      const partials = [
        { ratio: 1, amp: 0.9, d: 2.8 },
        { ratio: 1.008, amp: 0.85, d: 2.7 },
        { ratio: 2.31, amp: 0.3, d: 1.6 },
      ];
      this.#playPartials(ctx, start, 1568, level, partials);
    }

    #softChime(ctx, start, freq, level) {
      const partials = [
        { ratio: 1, amp: 1, d: 2.4 },
        { ratio: 2, amp: 0.28, d: 1.6 },
      ];
      this.#playPartials(ctx, start, freq, level, partials);
    }

    #playPartials(ctx, start, freq, level, partials) {
      partials.forEach(({ ratio, amp, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * ratio, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(level * amp, start + 0.016);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + d + 0.05);
      });
    }
  }

  const els = {
    body: document.body,
    favicon: document.getElementById('favicon'),
    presetBtns: [...document.querySelectorAll('.preset-chip[data-min]')],
    customMinBtn: document.getElementById('custom-min-btn'),
    customMinWrap: document.getElementById('custom-min-wrap'),
    customMinInput: document.getElementById('custom-min-input'),
    customMinApply: document.getElementById('custom-min-apply'),
    ticksGroup: document.getElementById('dial-ticks'),
    progressRing: document.getElementById('dial-progress'),
    handGroup: document.getElementById('dial-hand-group'),
    eyebrow: document.getElementById('med-eyebrow'),
    timeDisplay: document.getElementById('time-display'),
    hiddenClockMark: document.getElementById('hidden-clock-mark'),
    scheduleLine: document.getElementById('schedule-line'),
    quickPrep: document.getElementById('quick-prep'),
    quickInterval: document.getElementById('quick-interval'),
    hideClockBtn: document.getElementById('hide-clock-btn'),
    noteInput: document.getElementById('note-input'),
    toggleBtn: document.getElementById('toggle-btn'),
    finishBtn: document.getElementById('finish-btn'),
    resetBtn: document.getElementById('reset-btn'),
    soundQuickBtn: document.getElementById('sound-quick-btn'),
    zenBtn: document.getElementById('zen-btn'),
    zenExit: document.getElementById('zen-exit'),
    settingsBtn: document.getElementById('settings-btn'),
    liveStatus: document.getElementById('live-status'),
    statsSummary: document.getElementById('stats-summary'),
    historyCount: document.getElementById('history-count'),
    historyEmpty: document.getElementById('history-empty'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    dialog: document.getElementById('settings-dialog'),
    settingsForm: document.getElementById('settings-form'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    settingsResetBtn: document.getElementById('settings-reset-btn'),
    optBell: document.getElementById('opt-bell'),
    optEndBells: document.getElementById('opt-end-bells'),
    optVolume: document.getElementById('opt-volume'),
    optVolumeLabel: document.getElementById('opt-volume-label'),
    optAmbient: document.getElementById('opt-ambient'),
    optStartBell: document.getElementById('opt-start-bell'),
    optAutoZen: document.getElementById('opt-auto-zen'),
    optNotifyBtn: document.getElementById('opt-notify-btn'),
    testBellBtn: document.getElementById('test-bell-btn'),
  };

  // 12 quiet dial ticks
  const tickLines = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const rOuter = 150;
    const rInner = 139;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', (180 + rInner * Math.cos(angle)).toFixed(2));
    line.setAttribute('y1', (180 + rInner * Math.sin(angle)).toFixed(2));
    line.setAttribute('x2', (180 + rOuter * Math.cos(angle)).toFixed(2));
    line.setAttribute('y2', (180 + rOuter * Math.sin(angle)).toFixed(2));
    els.ticksGroup.appendChild(line);
    tickLines.push(line);
  }

  els.progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  els.progressRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;

  const audio = new MeditationAudio();
  const saved = loadStore();
  const settings = { ...DEFAULT_SETTINGS, ...(saved?.settings || {}) };
  let sessions = Array.isArray(saved?.sessions) ? saved.sessions : [];

  const initialMin = Number.isInteger(saved?.durationMin) && saved.durationMin >= 0 ? saved.durationMin : 10;
  const initialCustomMin = Number.isInteger(saved?.customMin) && saved.customMin >= 1 ? saved.customMin : 25;

  const state = {
    durationMin: initialMin, // 0 = Open
    customMin: initialCustomMin,
    isCustom: !PRESET_MINUTES.includes(initialMin),
    status: 'idle', // 'idle' | 'prep' | 'running' | 'paused' | 'complete'
    prepRemainingMs: 0,
    prepEndAt: null,
    elapsedMs: 0,
    runAnchorTs: null,
    startedAt: null,
    firedIntervals: new Set(),
    note: typeof saved?.note === 'string' ? saved.note : '',
    zen: false,
    bellBeforeMute: settings.bell !== 'off' ? settings.bell : 'bowl',
  };

  els.noteInput.value = state.note;

  let rafId = null;
  let bgInterval = null;
  let idleInterval = null;
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
      durationMin: state.durationMin,
      customMin: state.customMin,
      settings,
      note: state.note,
      sessions: sessions.slice(-100),
    });
  }

  function announce(text) {
    els.liveStatus.textContent = text;
  }

  function targetMs() {
    return state.durationMin > 0 ? state.durationMin * 60_000 : 0;
  }

  function sendNotification(title, body) {
    if (!settings.notify || typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {}
    }
  }

  function updateFavicon(progress, status) {
    const bucket = `${status}:${Math.round(progress * 20)}`;
    if (bucket === lastFaviconBucket) return;
    lastFaviconBucket = bucket;

    const stroke = status === 'prep' ? '#8a6434' : '#364a32';
    const r = 12;
    const c = 2 * Math.PI * r;
    const offset = status === 'idle' ? c : c * (1 - Math.max(0, Math.min(1, progress)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#faf7f2"/><circle cx="16" cy="16" r="12" fill="none" stroke="#e2ddd2" stroke-width="3"/><circle cx="16" cy="16" r="12" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 16 16)"/><circle cx="16" cy="16" r="3" fill="${stroke}"/></svg>`;
    els.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function renderDial() {
    const goal = targetMs();
    const isHiddenWhileRunning = settings.hideClock && (state.status === 'running' || state.status === 'paused');

    els.timeDisplay.hidden = isHiddenWhileRunning;
    els.hiddenClockMark.hidden = !isHiddenWhileRunning;

    const elapsed = currentElapsedMs();
    const prepRem = currentPrepRemainingMs();
    let progress = 0;
    if (state.status === 'prep') {
      const totalPrep = Math.max(1000, settings.prepSec * 1000);
      progress = 1 - prepRem / totalPrep;
    } else if (state.status === 'complete') {
      progress = 1;
    } else if (state.status === 'running' || state.status === 'paused') {
      if (goal > 0) {
        progress = Math.min(1, elapsed / goal);
      } else {
        // Open mode sweeps once every 5 minutes calmly
        progress = (elapsed % 300_000) / 300_000;
      }
    }

    const offset = RING_CIRCUMFERENCE * (1 - progress);
    els.progressRing.style.strokeDashoffset = `${offset.toFixed(2)}`;
    els.handGroup.setAttribute('transform', `rotate(${(progress * 360).toFixed(2)} 180 180)`);

    const passedTicks = Math.floor(progress * 12);
    for (let i = 0; i < 12; i++) {
      tickLines[i].classList.toggle('passed', state.status !== 'idle' && state.status !== 'prep' && i <= passedTicks);
    }

    if (state.status === 'prep') {
      const sec = Math.max(1, Math.ceil(prepRem / 1000));
      els.eyebrow.textContent = 'Settle in';
      els.timeDisplay.textContent = `00:${String(sec).padStart(2, '0')}`;
      els.scheduleLine.textContent = 'Take your seat before the opening bell';
      document.title = `Settle (${sec}s) · Meditation`;
    } else if (state.status === 'idle') {
      els.eyebrow.textContent = state.durationMin === 0 ? 'Open Sitting' : 'Silent Sitting';
      els.timeDisplay.textContent = state.durationMin === 0 ? 'Open' : formatMMSS(goal);
      els.scheduleLine.textContent = state.durationMin > 0
        ? `Ends at ${formatClockTime(Date.now() + goal)}`
        : 'Count-up timer with no fixed end';
      document.title = 'Meditation · Memo Garcia';
    } else if (state.status === 'complete') {
      els.eyebrow.textContent = 'Complete';
      els.timeDisplay.textContent = formatMMSS(elapsed);
      els.scheduleLine.textContent = 'Sit logged locally';
      document.title = 'Done · Meditation · Memo Garcia';
    } else {
      const prefix = state.status === 'paused' ? 'Paused · ' : '';
      els.eyebrow.textContent = `${prefix}Sitting`;
      if (goal > 0) {
        const rem = Math.max(0, goal - elapsed);
        els.timeDisplay.textContent = formatCountdownMMSS(rem);
        els.scheduleLine.textContent = isHiddenWhileRunning
          ? 'Clock hidden while sitting'
          : state.status === 'paused'
            ? 'Paused'
            : `Ends at ${formatClockTime(Date.now() + rem)}`;
        document.title = isHiddenWhileRunning
          ? 'Sitting · Meditation'
          : `${formatCountdownMMSS(rem)} · Meditation`;
      } else {
        els.timeDisplay.textContent = formatMMSS(elapsed);
        els.scheduleLine.textContent = isHiddenWhileRunning
          ? 'Clock hidden while sitting'
          : state.status === 'paused'
            ? 'Paused'
            : 'Open sitting';
        document.title = isHiddenWhileRunning
          ? 'Sitting · Meditation'
          : `${formatMMSS(elapsed)} · Meditation`;
      }
    }

    updateFavicon(progress, state.status);
  }

  function renderHistory() {
    const today = todayKey();
    const todaysSits = sessions.filter((s) => s.day === today);
    const todayMin = todaysSits.reduce((sum, s) => sum + s.minutes, 0);
    const streak = computeStreakDays(sessions);
    const sitWord = todaysSits.length === 1 ? 'sit' : 'sits';
    const dayWord = streak === 1 ? 'day' : 'days';
    els.statsSummary.textContent = `${todaysSits.length} ${sitWord} today (${formatTotalDuration(todayMin)}) · ${streak} ${dayWord} streak`;

    els.historyCount.textContent = String(sessions.length);
    els.historyEmpty.hidden = sessions.length > 0;
    els.historyList.hidden = sessions.length === 0;
    els.clearHistoryBtn.hidden = sessions.length === 0;

    if (sessions.length > 0) {
      els.historyList.replaceChildren();
      [...sessions].reverse().forEach((item) => {
        const li = document.createElement('li');
        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-time';
        timeSpan.textContent = `${item.day.slice(5)} ${item.time}`;

        const noteSpan = document.createElement('span');
        noteSpan.className = item.note ? 'history-note' : 'history-note empty-note';
        noteSpan.textContent = item.note || (item.open ? 'Open sit' : 'Silent sit');

        const durSpan = document.createElement('span');
        durSpan.className = 'history-dur';
        durSpan.textContent = `${item.minutes}m`;

        li.append(timeSpan, noteSpan, durSpan);
        els.historyList.appendChild(li);
      });
    }
  }

  function renderChrome() {
    els.body.dataset.state = state.status;
    els.body.dataset.mode = state.durationMin === 0 ? 'open' : 'timed';
    els.body.dataset.zen = state.zen ? 'true' : 'false';
    els.zenExit.hidden = !state.zen;

    els.presetBtns.forEach((btn) => {
      const val = btn.dataset.min;
      if (val === 'custom') {
        btn.setAttribute('aria-pressed', String(state.isCustom));
        btn.textContent = state.isCustom ? `Custom (${state.customMin}m)` : 'Custom';
      } else {
        btn.setAttribute('aria-pressed', String(!state.isCustom && Number(val) === state.durationMin));
      }
    });

    els.customMinWrap.hidden = !state.isCustom || state.status === 'running' || state.status === 'prep';
    els.customMinInput.value = String(state.customMin);

    els.quickPrep.value = String(settings.prepSec);
    els.quickInterval.value = settings.intervalMode;
    els.quickInterval.disabled = state.durationMin === 0;
    els.hideClockBtn.setAttribute('aria-pressed', String(settings.hideClock));
    els.hideClockBtn.textContent = settings.hideClock ? 'Clock: Hidden' : 'Hide clock';

    if (state.status === 'running' || state.status === 'prep') {
      els.toggleBtn.textContent = 'Pause';
    } else if (state.status === 'paused') {
      els.toggleBtn.textContent = 'Resume';
    } else if (state.status === 'complete') {
      els.toggleBtn.textContent = 'Sit Again';
    } else {
      els.toggleBtn.textContent = 'Begin Sit';
    }

    const canFinish = (state.status === 'running' || state.status === 'paused') && currentElapsedMs() >= 10_000;
    els.finishBtn.hidden = !canFinish;

    const soundOn = settings.bell !== 'off';
    els.soundQuickBtn.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
    els.soundQuickBtn.setAttribute('aria-pressed', String(soundOn));

    renderHistory();
    renderDial();
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

  function finishSit(playClosingBell = true) {
    stopLoop();
    audio.stopAmbient();
    if (playClosingBell) {
      audio.playBell(settings.bell, settings.volume, settings.endBells, false);
    }

    const minutes = Math.max(1, Math.round(state.elapsedMs / 60_000));
    sessions.push({
      day: todayKey(),
      time: formatClockTime(Date.now()),
      minutes,
      open: state.durationMin === 0,
      note: state.note.trim(),
    });
    sendNotification('Meditation complete', `${minutes} minute sit finished.`);

    state.status = 'complete';
    state.runAnchorTs = null;
    state.prepEndAt = null;
    renderChrome();
    persist();
    announce(`Meditation complete. ${minutes} minutes logged.`);
  }

  function checkIntervalBells(prevElapsed, nextElapsed) {
    if (state.durationMin === 0 || settings.intervalMode === 'off') return;
    const marks = computeIntervalTimestampsMs(state.durationMin, settings.intervalMode);
    for (const mark of marks) {
      if (!state.firedIntervals.has(mark) && prevElapsed < mark && nextElapsed >= mark) {
        state.firedIntervals.add(mark);
        audio.playBell(settings.bell, settings.volume, 1, true);
      }
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
        state.firedIntervals.clear();
        if (settings.startBell) {
          audio.playBell(settings.bell, settings.volume, 1, false);
        }
        if (settings.ambient !== 'off') {
          audio.startAmbient(settings.ambient, settings.volume);
        }
        renderChrome();
        announce('Opening bell. Sit started.');
      } else if (renderVisuals) {
        renderDial();
      }
      return true;
    }

    if (state.status !== 'running') return false;

    const prevElapsed = state.elapsedMs;
    const nextElapsed = currentElapsedMs();
    state.elapsedMs = nextElapsed;
    const goal = targetMs();

    if (goal > 0 && nextElapsed >= goal) {
      state.elapsedMs = goal;
      finishSit(true);
      return false;
    }

    checkIntervalBells(prevElapsed, nextElapsed);

    const canFinish = nextElapsed >= 10_000;
    if (els.finishBtn.hidden === canFinish) {
      els.finishBtn.hidden = !canFinish;
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

  function beginSit() {
    audio.ensureContext();
    if (state.status === 'idle' || state.status === 'complete') {
      state.elapsedMs = 0;
      state.firedIntervals.clear();
      state.startedAt = Date.now();
      if (settings.autoZen) state.zen = true;

      if (settings.prepSec > 0) {
        state.status = 'prep';
        state.prepRemainingMs = settings.prepSec * 1000;
        state.prepEndAt = Date.now() + state.prepRemainingMs;
        renderChrome();
        startLoop();
        announce(`Settle in for ${settings.prepSec} seconds.`);
        return;
      }

      state.status = 'running';
      state.runAnchorTs = Date.now();
      if (settings.startBell) {
        audio.playBell(settings.bell, settings.volume, 1, false);
      }
      if (settings.ambient !== 'off') {
        audio.startAmbient(settings.ambient, settings.volume);
      }
      renderChrome();
      startLoop();
      announce('Meditation started.');
      return;
    }

    if (state.status === 'paused') {
      if (state.prepRemainingMs > 0) {
        state.status = 'prep';
        state.prepEndAt = Date.now() + state.prepRemainingMs;
      } else {
        state.status = 'running';
        state.runAnchorTs = Date.now() - state.elapsedMs;
      }
      if (state.status === 'running' && settings.ambient !== 'off') {
        audio.startAmbient(settings.ambient, settings.volume);
      }
      renderChrome();
      startLoop();
      announce('Meditation resumed.');
    }
  }

  function pauseSit() {
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
    announce('Meditation paused.');
  }

  function resetSit() {
    stopLoop();
    audio.stopAmbient();
    state.status = 'idle';
    state.prepRemainingMs = 0;
    state.prepEndAt = null;
    state.elapsedMs = 0;
    state.runAnchorTs = null;
    state.firedIntervals.clear();
    renderChrome();
    announce('Meditation timer reset.');
  }

  function setDuration(minutes, isCustom = false) {
    state.durationMin = minutes;
    state.isCustom = isCustom;
    if (isCustom) state.customMin = minutes;
    if (state.status !== 'idle') resetSit();
    else renderChrome();
    persist();
  }

  function toggleSound() {
    if (settings.bell === 'off') {
      settings.bell = state.bellBeforeMute || 'bowl';
    } else {
      state.bellBeforeMute = settings.bell;
      settings.bell = 'off';
    }
    renderChrome();
    persist();
    announce(settings.bell === 'off' ? 'Sound muted.' : 'Sound enabled.');
  }

  function toggleZen(force) {
    state.zen = typeof force === 'boolean' ? force : !state.zen;
    renderChrome();
    announce(state.zen ? 'Zen mode enabled.' : 'Zen mode exited.');
  }

  function syncSettingsUI() {
    els.optBell.value = settings.bell;
    els.optEndBells.value = String(settings.endBells);
    els.optVolume.value = settings.volume;
    els.optVolumeLabel.textContent = `${settings.volume}%`;
    els.optAmbient.value = settings.ambient;
    els.optStartBell.checked = settings.startBell;
    els.optAutoZen.checked = settings.autoZen;
    updateNotifyUI();
  }

  function updateNotifyUI() {
    if (typeof Notification === 'undefined') {
      els.optNotifyBtn.textContent = 'Unsupported';
      els.optNotifyBtn.disabled = true;
      return;
    }
    if (Notification.permission === 'denied') {
      els.optNotifyBtn.textContent = 'Blocked in browser';
      settings.notify = false;
      return;
    }
    els.optNotifyBtn.textContent = settings.notify && Notification.permission === 'granted' ? 'On' : 'Off';
  }

  function applySettingsFromUI() {
    settings.bell = els.optBell.value;
    if (settings.bell !== 'off') state.bellBeforeMute = settings.bell;
    settings.endBells = Number(els.optEndBells.value) === 1 ? 1 : 3;
    settings.volume = Math.max(0, Math.min(100, Number(els.optVolume.value)));
    settings.ambient = els.optAmbient.value;
    settings.startBell = els.optStartBell.checked;
    settings.autoZen = els.optAutoZen.checked;

    if (state.status === 'running') {
      if (settings.ambient === 'off') audio.stopAmbient();
      else audio.startAmbient(settings.ambient, settings.volume);
    }
    renderChrome();
    persist();
  }

  // --- Event Listeners ---
  els.presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.min;
      if (val === 'custom') {
        const mins = clampCustomMinutes(els.customMinInput.value || state.customMin);
        setDuration(mins, true);
        els.customMinInput.focus();
      } else {
        setDuration(Number(val), false);
      }
    });
  });

  els.customMinApply.addEventListener('click', () => {
    const mins = clampCustomMinutes(els.customMinInput.value);
    els.customMinInput.value = String(mins);
    setDuration(mins, true);
  });

  els.customMinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      els.customMinApply.click();
    }
  });

  els.quickPrep.addEventListener('change', () => {
    settings.prepSec = Number(els.quickPrep.value) || 0;
    persist();
  });

  els.quickInterval.addEventListener('change', () => {
    settings.intervalMode = els.quickInterval.value;
    persist();
  });

  els.hideClockBtn.addEventListener('click', () => {
    settings.hideClock = !settings.hideClock;
    renderChrome();
    persist();
    announce(settings.hideClock ? 'Clock hidden while sitting.' : 'Clock visible.');
  });

  els.noteInput.addEventListener('input', () => {
    state.note = els.noteInput.value;
    persist();
  });

  els.noteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      els.noteInput.blur();
    }
  });

  els.toggleBtn.addEventListener('click', () => {
    if (state.status === 'running' || state.status === 'prep') pauseSit();
    else beginSit();
  });

  els.finishBtn.addEventListener('click', () => {
    const elapsed = currentElapsedMs();
    if (elapsed >= 10_000) {
      state.elapsedMs = elapsed;
      finishSit(false);
    }
  });

  els.resetBtn.addEventListener('click', resetSit);
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

  els.testBellBtn.addEventListener('click', () => {
    const choice = els.optBell.value === 'off' ? 'bowl' : els.optBell.value;
    audio.playBell(choice, Number(els.optVolume.value), 1, false);
  });

  els.optNotifyBtn.addEventListener('click', async () => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      try {
        const res = await Notification.requestPermission();
        settings.notify = res === 'granted';
      } catch {
        settings.notify = false;
      }
    } else if (Notification.permission === 'granted') {
      settings.notify = !settings.notify;
    }
    updateNotifyUI();
    persist();
  });

  els.settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applySettingsFromUI();
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
    announce('Cleared sitting log.');
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
      if (state.status === 'running' || state.status === 'prep') pauseSit();
      else beginSit();
    } else if (k === 'r') {
      e.preventDefault();
      resetSit();
    } else if (k === 'h') {
      e.preventDefault();
      els.hideClockBtn.click();
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
    } else if (e.key === 'Escape' && state.zen) {
      toggleZen(false);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && (state.status === 'running' || state.status === 'prep')) {
      advanceTick(true);
    }
  });

  idleInterval = setInterval(() => {
    if (state.status === 'idle') renderDial();
  }, 15_000);

  window.addEventListener('beforeunload', () => {
    clearInterval(idleInterval);
    persist();
  });

  renderChrome();
})(typeof window !== 'undefined' ? window : globalThis);
