(() => {
  const STORAGE_KEY = 'memo-tools-pomodoro-v1';
  const RING_RADIUS = 158;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

  const DEFAULT_SETTINGS = {
    focusMin: 25,
    shortMin: 5,
    longMin: 15,
    interval: 4,
    chime: 'bell',
    volume: 70,
    ambient: 'off',
    tick: false,
    autoBreak: false,
    autoFocus: false,
    notify: false,
  };

  const PHASE_LABEL = {
    focus: 'Focus',
    short: 'Short Break',
    long: 'Long Break',
  };

  function todayKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* Storage unavailable; keep working in memory. */
    }
  }

  // --- Audio Synthesis (Web Audio API, zero external assets) ---
  class SoundEngine {
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

    playCompletion(kind, volumePct, isBreakEnd = false) {
      if (kind === 'off' || volumePct <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx) return;

      const gain = Math.max(0.01, Math.min(1, volumePct / 100));
      const now = ctx.currentTime + 0.02;

      if (kind === 'bell') {
        this.#singingBowl(ctx, now, isBreakEnd ? 528 : 432, gain * 0.34);
        if (!isBreakEnd) {
          this.#singingBowl(ctx, now + 1.15, 432, gain * 0.22);
        }
      } else if (kind === 'chime') {
        const notes = isBreakEnd ? [523.25, 659.25, 783.99] : [392.0, 587.33];
        notes.forEach((freq, idx) => {
          this.#softNote(ctx, now + idx * 0.24, freq, gain * 0.25, 1.8);
        });
      } else if (kind === 'wood') {
        this.#woodTap(ctx, now, 780, gain * 0.32);
        this.#woodTap(ctx, now + 0.19, 920, gain * 0.28);
      }
    }

    playTick(volumePct, oddSecond) {
      if (volumePct <= 0) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const master = Math.max(0.01, volumePct / 100);
      const len = Math.floor(ctx.sampleRate * 0.012);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.18));
      }

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = oddSecond ? 2600 : 2300;
      filter.Q.value = 3.2;

      const gain = ctx.createGain();
      gain.gain.value = master * 0.055;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(ctx.currentTime);
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
        // Smooth loop splice at ends
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
      filter.frequency.value = mode === 'rain' ? 950 : 420;
      filter.Q.value = mode === 'rain' ? 0.55 : 0.7;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.14;
      lfoGain.gain.value = mode === 'rain' ? 240 : 70;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      const master = ctx.createGain();
      const targetGain = (volumePct / 100) * (mode === 'rain' ? 0.16 : 0.22);
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

    #singingBowl(ctx, start, freq, level) {
      const partials = [
        { ratio: 1, amp: 1, dur: 3.4 },
        { ratio: 1.0035, amp: 0.65, dur: 3.2 },
        { ratio: 2.756, amp: 0.28, dur: 2.1 },
      ];
      partials.forEach(({ ratio, amp, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * ratio, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(level * amp, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    }

    #softNote(ctx, start, freq, level, dur) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(level, start + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
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

  // --- DOM References ---
  const els = {
    body: document.body,
    favicon: document.getElementById('favicon'),
    tabs: [...document.querySelectorAll('.phase-tabs [role="tab"]')],
    ticksGroup: document.getElementById('dial-ticks'),
    progressRing: document.getElementById('dial-progress'),
    handGroup: document.getElementById('dial-hand-group'),
    eyebrow: document.getElementById('phase-eyebrow'),
    timeDisplay: document.getElementById('time-display'),
    scheduleLine: document.getElementById('schedule-line'),
    intentionInput: document.getElementById('intention-input'),
    toggleBtn: document.getElementById('toggle-btn'),
    resetBtn: document.getElementById('reset-btn'),
    addMinuteBtn: document.getElementById('add-minute-btn'),
    skipBtn: document.getElementById('skip-btn'),
    soundQuickBtn: document.getElementById('sound-quick-btn'),
    zenBtn: document.getElementById('zen-btn'),
    zenExit: document.getElementById('zen-exit'),
    settingsBtn: document.getElementById('settings-btn'),
    liveStatus: document.getElementById('live-status'),
    cycleDots: document.getElementById('cycle-dots'),
    todaySummary: document.getElementById('today-summary'),
    historyCount: document.getElementById('history-count'),
    historyEmpty: document.getElementById('history-empty'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    dialog: document.getElementById('settings-dialog'),
    settingsForm: document.getElementById('settings-form'),
    settingsCloseBtn: document.getElementById('settings-close-btn'),
    settingsResetBtn: document.getElementById('settings-reset-btn'),
    optFocus: document.getElementById('opt-focus'),
    optShort: document.getElementById('opt-short'),
    optLong: document.getElementById('opt-long'),
    optInterval: document.getElementById('opt-interval'),
    optChime: document.getElementById('opt-chime'),
    optVolume: document.getElementById('opt-volume'),
    optVolumeLabel: document.getElementById('opt-volume-label'),
    optAmbient: document.getElementById('opt-ambient'),
    optTick: document.getElementById('opt-tick'),
    optAutoBreak: document.getElementById('opt-auto-break'),
    optAutoFocus: document.getElementById('opt-auto-focus'),
    optNotifyBtn: document.getElementById('opt-notify-btn'),
    testChimeBtn: document.getElementById('test-chime-btn'),
  };

  // --- Build 60 Precision Watch Ticks ---
  const tickLines = [];
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const rOuter = 150;
    const rInner = isMajor ? 137 : 143;
    const x1 = (180 + rInner * Math.cos(angle)).toFixed(2);
    const y1 = (180 + rInner * Math.sin(angle)).toFixed(2);
    const x2 = (180 + rOuter * Math.cos(angle)).toFixed(2);
    const y2 = (180 + rOuter * Math.sin(angle)).toFixed(2);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    if (isMajor) line.classList.add('major');
    els.ticksGroup.appendChild(line);
    tickLines.push(line);
  }

  els.progressRing.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
  els.progressRing.style.strokeDashoffset = `${RING_CIRCUMFERENCE}`;

  const sound = new SoundEngine();

  // --- State Initialization ---
  const saved = loadStore();
  const settings = { ...DEFAULT_SETTINGS, ...(saved?.settings || {}) };
  const today = todayKey();
  let sessions = saved?.date === today && Array.isArray(saved?.sessions) ? saved.sessions : [];

  function phaseDurationMs(phase) {
    if (phase === 'focus') return settings.focusMin * 60_000;
    if (phase === 'short') return settings.shortMin * 60_000;
    return settings.longMin * 60_000;
  }

  let state = {
    phase: saved?.phase || 'focus',
    status: 'idle', // 'idle' | 'running' | 'paused' | 'complete'
    totalMs: phaseDurationMs(saved?.phase || 'focus'),
    remainingMs: phaseDurationMs(saved?.phase || 'focus'),
    endAt: null,
    cycleCount: saved?.date === today && Number.isInteger(saved?.cycleCount) ? saved.cycleCount : 0,
    intention: typeof saved?.intention === 'string' ? saved.intention : '',
    zen: false,
    soundBeforeMute: settings.chime !== 'off' ? settings.chime : 'bell',
  };

  // Restore running/paused timer cleanly if page was refreshed mid-session
  if (saved?.timer && saved.date === today) {
    const t = saved.timer;
    if (['focus', 'short', 'long'].includes(t.phase)) {
      state.phase = t.phase;
      state.totalMs = Math.max(60_000, Number(t.totalMs) || phaseDurationMs(t.phase));
      if (t.status === 'running' && typeof t.endAt === 'number') {
        const left = t.endAt - Date.now();
        if (left > 0) {
          state.status = 'running';
          state.endAt = t.endAt;
          state.remainingMs = left;
        } else {
          state.status = 'idle';
          state.remainingMs = phaseDurationMs(state.phase);
        }
      } else if (t.status === 'paused' && typeof t.remainingMs === 'number' && t.remainingMs > 0) {
        state.status = 'paused';
        state.remainingMs = Math.min(state.totalMs, t.remainingMs);
      } else {
        state.remainingMs = phaseDurationMs(state.phase);
      }
    }
  }

  els.intentionInput.value = state.intention;

  let rafId = null;
  let lastWholeSec = -1;
  let lastFaviconBucket = '';
  let idleClockInterval = null;

  function persist() {
    saveStore({
      date: todayKey(),
      settings,
      phase: state.phase,
      cycleCount: state.cycleCount,
      intention: state.intention,
      sessions,
      timer: {
        phase: state.phase,
        status: state.status,
        totalMs: state.totalMs,
        remainingMs: getRemainingMs(),
        endAt: state.endAt,
      },
    });
  }

  function getRemainingMs() {
    if (state.status === 'running' && state.endAt !== null) {
      return Math.max(0, state.endAt - Date.now());
    }
    return Math.max(0, state.remainingMs);
  }

  function formatMMSS(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  function announce(text) {
    els.liveStatus.textContent = text;
  }

  function updateFavicon(progress, phase, status) {
    const bucket = `${phase}:${status}:${Math.round(progress * 24)}`;
    if (bucket === lastFaviconBucket) return;
    lastFaviconBucket = bucket;

    const palette = {
      focus: '#364a32',
      short: '#9c4a2d',
      long: '#2e4c66',
    };
    const stroke = palette[phase] || '#364a32';
    const r = 12;
    const c = 2 * Math.PI * r;
    const offset = status === 'idle' ? c : c * (1 - Math.max(0, Math.min(1, progress)));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#faf7f2"/><circle cx="16" cy="16" r="12" fill="none" stroke="#e2ddd2" stroke-width="3"/><circle cx="16" cy="16" r="12" fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 16 16)"/><circle cx="16" cy="16" r="3" fill="${stroke}"/></svg>`;
    els.favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function renderDial() {
    const remaining = getRemainingMs();
    const total = Math.max(1000, state.totalMs);
    const elapsed = Math.max(0, total - remaining);
    const progress = state.status === 'complete' ? 1 : Math.min(1, elapsed / total);

    const offset = RING_CIRCUMFERENCE * (1 - progress);
    els.progressRing.style.strokeDashoffset = `${offset.toFixed(3)}`;
    els.handGroup.setAttribute('transform', `rotate(${(progress * 360).toFixed(2)} 180 180)`);

    const passedTicks = Math.floor(progress * 60);
    for (let i = 0; i < 60; i++) {
      tickLines[i].classList.toggle('passed', state.status !== 'idle' && i <= passedTicks);
    }

    const mmss = formatMMSS(remaining);
    if (els.timeDisplay.textContent !== mmss) {
      els.timeDisplay.textContent = mmss;
    }

    // Schedule / status line inside dial
    if (state.status === 'running' && state.endAt !== null) {
      els.scheduleLine.textContent = `Ends at ${formatClockTime(state.endAt)}`;
    } else if (state.status === 'paused') {
      els.scheduleLine.textContent = 'Paused';
    } else if (state.status === 'complete') {
      const next = getNextPhase(state.phase, state.cycleCount, true);
      els.scheduleLine.textContent = `Ready for ${PHASE_LABEL[next]}`;
    } else {
      els.scheduleLine.textContent = `Ends at ${formatClockTime(Date.now() + remaining)}`;
    }

    // Tab title
    if (state.status === 'running') {
      document.title = `${mmss} · ${PHASE_LABEL[state.phase]} · Memo Garcia`;
    } else if (state.status === 'paused') {
      document.title = `Paused (${mmss}) · ${PHASE_LABEL[state.phase]}`;
    } else if (state.status === 'complete') {
      document.title = `Done · ${PHASE_LABEL[state.phase]} · Memo Garcia`;
    } else {
      document.title = 'Pomodoro · Memo Garcia';
    }

    updateFavicon(progress, state.phase, state.status);
  }

  function renderChrome() {
    els.body.dataset.phase = state.phase;
    els.body.dataset.state = state.status;
    els.body.dataset.zen = state.zen ? 'true' : 'false';
    els.zenExit.hidden = !state.zen;

    els.tabs.forEach((tab) => {
      const active = tab.dataset.phase === state.phase;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    const cycleSlot = (state.cycleCount % settings.interval) + 1;
    if (state.phase === 'focus') {
      const prefix = state.status === 'paused' ? 'Paused · ' : state.status === 'complete' ? 'Done · ' : '';
      els.eyebrow.textContent = `${prefix}Focus · ${cycleSlot} / ${settings.interval}`;
    } else {
      const prefix = state.status === 'paused' ? 'Paused · ' : state.status === 'complete' ? 'Done · ' : '';
      els.eyebrow.textContent = `${prefix}${PHASE_LABEL[state.phase]}`;
    }

    if (state.status === 'running') {
      els.toggleBtn.textContent = 'Pause';
    } else if (state.status === 'paused') {
      els.toggleBtn.textContent = 'Resume';
    } else if (state.status === 'complete') {
      const next = getNextPhase(state.phase, state.cycleCount, true);
      els.toggleBtn.textContent = `Start ${PHASE_LABEL[next]}`;
    } else {
      els.toggleBtn.textContent = `Start ${PHASE_LABEL[state.phase]}`;
    }

    const soundOn = settings.chime !== 'off';
    els.soundQuickBtn.textContent = soundOn ? 'Sound: On' : 'Sound: Off';
    els.soundQuickBtn.setAttribute('aria-pressed', String(soundOn));

    renderMetaAndHistory();
    renderDial();
  }

  function renderMetaAndHistory() {
    // Roll over midnight seamlessly if page stays open across days
    const nowKey = todayKey();
    if (sessions.length && sessions[0].day && sessions[0].day !== nowKey) {
      sessions = [];
      state.cycleCount = 0;
    }

    // Cycle dots
    els.cycleDots.replaceChildren();
    const completedInCycle = state.cycleCount % settings.interval;
    for (let i = 0; i < settings.interval; i++) {
      const dot = document.createElement('span');
      dot.className = 'cycle-dot';
      if (i < completedInCycle) {
        dot.classList.add('done');
      } else if (i === completedInCycle && state.phase === 'focus') {
        dot.classList.add('current');
      }
      dot.title = i < completedInCycle ? `Session ${i + 1} completed` : `Session ${i + 1}`;
      els.cycleDots.appendChild(dot);
    }

    const totalMin = sessions.reduce((acc, s) => acc + s.minutes, 0);
    const count = sessions.length;
    const noun = count === 1 ? 'session' : 'sessions';
    els.todaySummary.textContent = count > 0
      ? `${count} ${noun} today (${formatTotalDuration(totalMin)})`
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
        timeSpan.textContent = `${item.start}–${item.end}`;

        const noteSpan = document.createElement('span');
        noteSpan.className = item.note ? 'history-note' : 'history-note empty-note';
        noteSpan.textContent = item.note || 'Focus session';

        const durSpan = document.createElement('span');
        durSpan.className = 'history-dur';
        durSpan.textContent = `${item.minutes}m`;

        li.append(timeSpan, noteSpan, durSpan);
        els.historyList.appendChild(li);
      });
    }
  }

  function getNextPhase(fromPhase = state.phase, cycleCount = state.cycleCount, alreadyIncremented = false) {
    if (fromPhase === 'focus') {
      const count = alreadyIncremented ? cycleCount : cycleCount + 1;
      return count % settings.interval === 0 ? 'long' : 'short';
    }
    return 'focus';
  }

  function startLoop() {
    stopLoop();
    const step = () => {
      if (state.status !== 'running') return;
      const remaining = getRemainingMs();
      const wholeSec = Math.ceil(remaining / 1000);
      if (wholeSec !== lastWholeSec) {
        lastWholeSec = wholeSec;
        if (settings.tick && wholeSec > 0) {
          sound.playTick(settings.volume, wholeSec % 2 === 1);
        }
      }
      if (remaining <= 0) {
        handlePhaseComplete();
        return;
      }
      renderDial();
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function sendNotification(title, body) {
    if (!settings.notify || typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch {}
    }
  }

  function handlePhaseComplete() {
    stopLoop();
    sound.stopAmbient();
    const finishedPhase = state.phase;
    const completedMinutes = Math.max(1, Math.round(state.totalMs / 60_000));

    sound.playCompletion(settings.chime, settings.volume, finishedPhase !== 'focus');

    if (finishedPhase === 'focus') {
      state.cycleCount += 1;
      const endTs = Date.now();
      const startTs = endTs - state.totalMs;
      sessions.push({
        day: todayKey(),
        start: formatClockTime(startTs),
        end: formatClockTime(endTs),
        minutes: completedMinutes,
        note: state.intention.trim(),
      });
      sendNotification('Focus session complete', 'Time for a break.');
    } else {
      sendNotification(`${PHASE_LABEL[finishedPhase]} complete`, 'Ready for the next focus session.');
    }

    const nextPhase = getNextPhase(finishedPhase, state.cycleCount, true);
    const shouldAuto = finishedPhase === 'focus' ? settings.autoBreak : settings.autoFocus;

    if (shouldAuto) {
      switchPhase(nextPhase, true);
      startTimer();
      announce(`${PHASE_LABEL[finishedPhase]} complete. Starting ${PHASE_LABEL[nextPhase]}.`);
    } else {
      state.status = 'complete';
      state.remainingMs = 0;
      state.endAt = null;
      announce(`${PHASE_LABEL[finishedPhase]} complete. Ready for ${PHASE_LABEL[nextPhase]}.`);
      renderChrome();
      persist();
    }
  }

  function startTimer() {
    sound.ensureContext();
    if (state.status === 'complete') {
      switchPhase(getNextPhase(state.phase, state.cycleCount, true), true);
    }
    const ms = getRemainingMs();
    if (ms <= 0) {
      state.totalMs = phaseDurationMs(state.phase);
      state.remainingMs = state.totalMs;
    }
    state.status = 'running';
    state.endAt = Date.now() + state.remainingMs;
    lastWholeSec = Math.ceil(state.remainingMs / 1000);
    if (settings.ambient !== 'off' && state.phase === 'focus') {
      sound.startAmbient(settings.ambient, settings.volume);
    }
    renderChrome();
    persist();
    startLoop();
    announce(`${PHASE_LABEL[state.phase]} started.`);
  }

  function pauseTimer() {
    if (state.status !== 'running') return;
    state.remainingMs = getRemainingMs();
    state.endAt = null;
    state.status = 'paused';
    stopLoop();
    sound.stopAmbient();
    renderChrome();
    persist();
    announce(`${PHASE_LABEL[state.phase]} paused.`);
  }

  function resetTimer() {
    stopLoop();
    sound.stopAmbient();
    state.status = 'idle';
    state.totalMs = phaseDurationMs(state.phase);
    state.remainingMs = state.totalMs;
    state.endAt = null;
    renderChrome();
    persist();
    announce(`${PHASE_LABEL[state.phase]} reset.`);
  }

  function switchPhase(phase, internal = false) {
    stopLoop();
    sound.stopAmbient();
    state.phase = phase;
    state.status = 'idle';
    state.totalMs = phaseDurationMs(phase);
    state.remainingMs = state.totalMs;
    state.endAt = null;
    renderChrome();
    persist();
    if (!internal) {
      announce(`Switched to ${PHASE_LABEL[phase]}.`);
    }
  }

  function skipPhase() {
    stopLoop();
    sound.stopAmbient();
    const next = getNextPhase(state.phase, state.cycleCount, state.status === 'complete');
    switchPhase(next, true);
    announce(`Skipped to ${PHASE_LABEL[next]}.`);
  }

  function addMinute() {
    if (state.status === 'complete') return;
    const extra = 60_000;
    state.totalMs += extra;
    if (state.status === 'running' && state.endAt !== null) {
      state.endAt += extra;
    } else {
      state.remainingMs += extra;
    }
    renderDial();
    persist();
    announce('Added 1 minute.');
  }

  function toggleSoundMute() {
    if (settings.chime === 'off') {
      settings.chime = state.soundBeforeMute || 'bell';
    } else {
      state.soundBeforeMute = settings.chime;
      settings.chime = 'off';
    }
    renderChrome();
    persist();
    announce(settings.chime === 'off' ? 'Sound muted.' : 'Sound enabled.');
  }

  function toggleZen(force) {
    state.zen = typeof force === 'boolean' ? force : !state.zen;
    renderChrome();
    announce(state.zen ? 'Zen mode enabled.' : 'Zen mode exited.');
  }

  // --- Settings Modal ---
  function syncSettingsUI() {
    els.optFocus.value = settings.focusMin;
    els.optShort.value = settings.shortMin;
    els.optLong.value = settings.longMin;
    els.optInterval.value = settings.interval;
    els.optChime.value = settings.chime;
    els.optVolume.value = settings.volume;
    els.optVolumeLabel.textContent = `${settings.volume}%`;
    els.optAmbient.value = settings.ambient;
    els.optTick.checked = settings.tick;
    els.optAutoBreak.checked = settings.autoBreak;
    els.optAutoFocus.checked = settings.autoFocus;
    updateNotifyButtonUI();
  }

  function updateNotifyButtonUI() {
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

  function openSettings() {
    syncSettingsUI();
    els.dialog.showModal();
  }

  function applySettingsFromUI() {
    const prevDurations = `${settings.focusMin}:${settings.shortMin}:${settings.longMin}`;
    settings.focusMin = Math.max(1, Math.min(120, Number(els.optFocus.value) || 25));
    settings.shortMin = Math.max(1, Math.min(60, Number(els.optShort.value) || 5));
    settings.longMin = Math.max(1, Math.min(90, Number(els.optLong.value) || 15));
    settings.interval = Math.max(1, Math.min(12, Number(els.optInterval.value) || 4));
    settings.chime = els.optChime.value;
    if (settings.chime !== 'off') state.soundBeforeMute = settings.chime;
    settings.volume = Math.max(0, Math.min(100, Number(els.optVolume.value)));
    settings.ambient = els.optAmbient.value;
    settings.tick = els.optTick.checked;
    settings.autoBreak = els.optAutoBreak.checked;
    settings.autoFocus = els.optAutoFocus.checked;

    const nextDurations = `${settings.focusMin}:${settings.shortMin}:${settings.longMin}`;
    if (state.status === 'idle' && prevDurations !== nextDurations) {
      state.totalMs = phaseDurationMs(state.phase);
      state.remainingMs = state.totalMs;
    }
    if (state.status === 'running' && state.phase === 'focus') {
      if (settings.ambient === 'off') {
        sound.stopAmbient();
      } else {
        sound.startAmbient(settings.ambient, settings.volume);
      }
    }
    renderChrome();
    persist();
  }

  // --- Event Listeners ---
  els.tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => {
      if (tab.dataset.phase !== state.phase) {
        switchPhase(tab.dataset.phase);
      }
    });
    tab.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const nextIdx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + els.tabs.length) % els.tabs.length;
      els.tabs[nextIdx].focus();
      switchPhase(els.tabs[nextIdx].dataset.phase);
    });
  });

  els.toggleBtn.addEventListener('click', () => {
    if (state.status === 'running') pauseTimer();
    else startTimer();
  });

  els.resetBtn.addEventListener('click', resetTimer);
  els.addMinuteBtn.addEventListener('click', addMinute);
  els.skipBtn.addEventListener('click', skipPhase);
  els.soundQuickBtn.addEventListener('click', toggleSoundMute);
  els.zenBtn.addEventListener('click', () => toggleZen(true));
  els.zenExit.addEventListener('click', () => toggleZen(false));
  els.settingsBtn.addEventListener('click', openSettings);
  els.settingsCloseBtn.addEventListener('click', () => els.dialog.close());

  els.dialog.addEventListener('click', (e) => {
    if (e.target === els.dialog) els.dialog.close();
  });

  els.optVolume.addEventListener('input', () => {
    els.optVolumeLabel.textContent = `${els.optVolume.value}%`;
  });

  els.testChimeBtn.addEventListener('click', () => {
    const chimeChoice = els.optChime.value === 'off' ? 'bell' : els.optChime.value;
    sound.playCompletion(chimeChoice, Number(els.optVolume.value), false);
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
    updateNotifyButtonUI();
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
    if (state.status === 'idle') {
      state.totalMs = phaseDurationMs(state.phase);
      state.remainingMs = state.totalMs;
    }
    renderChrome();
    persist();
  });

  els.intentionInput.addEventListener('input', () => {
    state.intention = els.intentionInput.value;
    persist();
  });

  els.intentionInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      els.intentionInput.blur();
    }
  });

  els.clearHistoryBtn.addEventListener('click', () => {
    sessions = [];
    renderMetaAndHistory();
    persist();
    announce('Cleared today\'s session log.');
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
      if (state.status === 'running') pauseTimer();
      else startTimer();
    } else if (k === 'r') {
      e.preventDefault();
      resetTimer();
    } else if (k === 'n') {
      e.preventDefault();
      skipPhase();
    } else if (k === 'z') {
      e.preventDefault();
      toggleZen();
    } else if (k === 'm') {
      e.preventDefault();
      toggleSoundMute();
    } else if (k === 's') {
      e.preventDefault();
      openSettings();
    } else if (k === '1') {
      switchPhase('focus');
    } else if (k === '2') {
      switchPhase('short');
    } else if (k === '3') {
      switchPhase('long');
    } else if (e.key === 'Escape' && state.zen) {
      toggleZen(false);
    }
  });

  // Catch up cleanly when tab returns from background sleep
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.status === 'running') {
      if (getRemainingMs() <= 0) {
        handlePhaseComplete();
      } else {
        renderDial();
      }
    }
  });

  // Keep idle "Ends at HH:MM" fresh every 15 seconds
  idleClockInterval = setInterval(() => {
    if (state.status === 'idle') renderDial();
  }, 15_000);

  window.addEventListener('beforeunload', () => {
    clearInterval(idleClockInterval);
    persist();
  });

  // Initial render
  renderChrome();
  if (state.status === 'running') {
    startLoop();
  }
})();
