(() => {
  const STORAGE_KEY = 'memo-tools-pomodoro-v1';
  const MIN = 60_000;
  const HOUR = 60 * MIN; // one turn of the ring
  const PHASES = ['focus', 'short', 'long'];
  const NAME = { focus: 'focus', short: 'short break', long: 'long break' };
  const DUR_KEY = { focus: 'focusMin', short: 'shortMin', long: 'longMin' };
  const STATUS = { idle: 'not started', running: 'running', paused: 'paused', complete: 'done' };
  const BASE_TITLE = document.title;
  // Breaks are lit like moonlight, so the room tells you which one you are in.
  const BREAK_LIGHT = { k: 8000, strength: 2.4 };

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const body = document.body;
  const scene = $('scene');
  const scale = $('scale');
  const ring = $('ring');
  const dial = $('dial');
  const timeEl = $('time');
  const phaseEl = $('phase');
  const statusEl = $('status');
  const intentionEl = $('intention');
  const hintEl = $('hint');
  const live = $('live');
  const startBtn = $('start-btn');
  const resetBtn = $('reset-btn');
  const skipBtn = $('skip-btn');
  const soundBtn = $('sound-btn');
  const prefsBtn = $('prefs-btn');
  const logBtn = $('log-btn');
  const prefsEl = $('prefs');
  const logEl = $('log');
  const kelvinEl = $('kelvin');
  const kelvinOut = $('kelvin-out');
  const papers = $('papers');
  const ambients = $('ambients');
  const roundsEl = $('rounds');
  const tickEl = $('tick');
  const autoBreakEl = $('auto-break');
  const autoFocusEl = $('auto-focus');
  const notifyEl = $('notify');
  const logEmpty = $('log-empty');
  const logList = $('log-list');
  const logActions = $('log-actions');
  const logCopy = $('log-copy');
  const logClear = $('log-clear');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const K_MIN = 2000;
  const K_MAX = 9000;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const pad = (n) => String(n).padStart(2, '0');
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function dayKey(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function hhmm(ts) {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fmt(ms) {
    const s = Math.ceil(Math.max(0, ms) / 1000);
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  }

  function span(totalMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  }

  /* ── Saved state ───────────────────────────────────────── */

  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch { /* start fresh */ }
  if (!saved || typeof saved !== 'object') saved = {};

  const was = saved.settings && typeof saved.settings === 'object' ? saved.settings : {};
  const whole = (v, lo, hi, fallback) => (Number.isFinite(v) ? clamp(Math.round(v), lo, hi) : fallback);

  const settings = {
    focusMin: whole(was.focusMin, 1, 60, 25),
    shortMin: whole(was.shortMin, 1, 60, 5),
    longMin: whole(was.longMin, 1, 60, 15),
    interval: whole(was.interval, 1, 12, 4),
    tick: was.tick === true,
    ambient: ['rain', 'warm'].includes(was.ambient) ? was.ambient : 'off',
    autoBreak: was.autoBreak === true,
    autoFocus: was.autoFocus === true,
    notify: was.notify === true,
  };

  let soundOn = typeof saved.sound === 'boolean' ? saved.sound : was.chime !== 'off';
  let kelvin = Number.isFinite(saved.kelvin) ? saved.kelvin : 3400;
  let paper = typeof saved.paper === 'string' ? saved.paper : 'bond';
  let day = dayKey();
  const sameDay = saved.date === day;
  let sessions = sameDay && Array.isArray(saved.sessions)
    ? saved.sessions.filter((s) => s && typeof s.start === 'string' && typeof s.end === 'string' && Number.isFinite(s.minutes))
    : [];
  let hinted = saved.hinted === true || sessions.length > 0;

  const durMs = (phase) => settings[DUR_KEY[phase]] * MIN;
  const firstPhase = PHASES.includes(saved.phase) ? saved.phase : 'focus';

  const state = {
    phase: firstPhase,
    status: 'idle', // idle | running | paused | complete
    totalMs: durMs(firstPhase),
    remainingMs: durMs(firstPhase),
    endAt: null,
    startedAt: null,
    cycleCount: sameDay && Number.isInteger(saved.cycleCount) ? saved.cycleCount : 0,
    intention: typeof saved.intention === 'string' ? saved.intention : '',
  };

  // A timer that ran out while the page was closed still finished. Count it.
  let finishedWhileAway = false;
  {
    const t = saved.timer;
    if (t && typeof t === 'object' && PHASES.includes(t.phase)) {
      const total = Number.isFinite(t.totalMs) && t.totalMs > 0 ? t.totalMs : durMs(t.phase);
      if (t.status === 'running' && Number.isFinite(t.endAt)) {
        const left = t.endAt - Date.now();
        if (left > 0 || sameDay) {
          state.phase = t.phase;
          state.status = 'running';
          state.totalMs = total;
          state.endAt = t.endAt;
          state.remainingMs = clamp(left, 0, HOUR);
          state.startedAt = Number.isFinite(t.startedAt) ? t.startedAt : null;
          finishedWhileAway = left <= 0;
        }
      } else if (t.status === 'paused' && Number.isFinite(t.remainingMs) && t.remainingMs > 0) {
        state.phase = t.phase;
        state.status = 'paused';
        state.totalMs = total;
        state.remainingMs = clamp(t.remainingMs, 1000, HOUR);
        state.startedAt = Number.isFinite(t.startedAt) ? t.startedAt : null;
      } else if (t.status === 'complete' && sameDay) {
        state.phase = t.phase;
        state.status = 'complete';
        state.remainingMs = 0;
      } else if (t.status === 'idle') {
        state.phase = t.phase;
        state.totalMs = state.remainingMs = durMs(t.phase);
      }
    }
  }

  function remaining() {
    if (state.status === 'running' && state.endAt !== null) return Math.max(0, state.endAt - Date.now());
    return Math.max(0, state.remainingMs);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: day,
        settings,
        sound: soundOn,
        kelvin,
        paper,
        hinted,
        phase: state.phase,
        cycleCount: state.cycleCount,
        intention: state.intention,
        sessions,
        timer: {
          phase: state.phase,
          status: state.status,
          totalMs: state.totalMs,
          remainingMs: remaining(),
          endAt: state.endAt,
          startedAt: state.startedAt,
        },
      }));
    } catch { /* storage blocked: the timer still works for this visit */ }
  }

  /* ── Sound ─────────────────────────────────────────────
     Everything is synthesized: filtered noise for the ratchet and the
     escapement, sine partials for the bell. Same bench as the typewriter. */

  const snd = (() => {
    let ac = null;
    let out = null;
    let noise = null;
    let brown = null;
    let amb = null;
    const NOISE_GAIN = 2.8;

    function ctx() {
      if (!soundOn) return null;
      if (ac) {
        if (ac.state === 'suspended') ac.resume().catch(() => {});
        return ac;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC({ latencyHint: 'interactive' });

      out = ac.createGain();
      out.gain.value = 0.8;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.knee.value = 8;
      comp.ratio.value = 3;
      comp.attack.value = 0.002;
      comp.release.value = 0.1;
      out.connect(comp);
      comp.connect(ac.destination);

      // A small room, so the timer sits on a desk instead of inside your head.
      const len = Math.floor(ac.sampleRate * 0.45);
      const ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = ir.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.4);
      }
      const verb = ac.createConvolver();
      verb.buffer = ir;
      const wet = ac.createGain();
      wet.gain.value = 0.22;
      out.connect(verb);
      verb.connect(wet);
      wet.connect(ac.destination);

      noise = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.5), ac.sampleRate);
      const nd = noise.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      return ac;
    }

    function env(g, t, peak, a, d) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }

    function hit(t, o) {
      const src = ac.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const f = ac.createBiquadFilter();
      f.type = o.type || 'bandpass';
      f.frequency.value = o.f;
      f.Q.value = o.q == null ? 1 : o.q;
      const g = ac.createGain();
      const a = o.a == null ? 0.001 : o.a;
      env(g, t, o.g * NOISE_GAIN, a, o.d);
      src.connect(f);
      f.connect(g);
      g.connect(out);
      src.start(t, Math.random() * 1.2);
      src.stop(t + a + o.d + 0.03);
    }

    function tone(t, o) {
      const osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(o.f, t);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
      const g = ac.createGain();
      const a = o.a == null ? 0.001 : o.a;
      env(g, t, o.g, a, o.d);
      osc.connect(g);
      g.connect(out);
      osc.start(t);
      osc.stop(t + a + o.d + 0.03);
    }

    function ratchet(t, gain) {
      hit(t, { f: 3100 + Math.random() * 500, q: 5, g: gain, d: 0.012 });
      hit(t, { f: 950, q: 2, g: gain * 0.7, d: 0.02 });
    }

    // One blow of the hammer on the bell.
    function strike(t, v, ringOut) {
      const f = 2380;
      tone(t, { f, g: 0.17 * v, d: ringOut ? 1.9 : 0.17 });
      tone(t, { f: f * 2.76, g: 0.045 * v, d: ringOut ? 0.8 : 0.09 });
      tone(t, { f: f / 2, g: 0.03 * v, d: ringOut ? 1 : 0.12 });
      hit(t, { f: 5200, q: 2, g: 0.07 * v, d: 0.016 });
    }

    function stopAmbient() {
      if (!amb) return;
      const { src, lfo, g } = amb;
      amb = null;
      const now = ac.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      src.stop(now + 0.35);
      lfo.stop(now + 0.35);
    }

    return {
      wake() { ctx(); },

      // Winding past a minute mark.
      detent(up) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        ratchet(t, up ? 0.14 : 0.09);
        if (up) tone(t, { f: 150, f2: 92, g: 0.07, d: 0.04 });
      },

      // The lamp running round the ring to a new setting, then hitting its stop.
      travel(ms) {
        if (!ctx()) return;
        const dur = ms / 1000;
        const t = ac.currentTime + 0.001;
        const n = Math.max(4, Math.round(dur / 0.03));
        for (let i = 0; i < n; i++) {
          const u = i / n;
          ratchet(t + dur * u + (Math.random() - 0.5) * 0.004, 0.05 + 0.06 * Math.sin(Math.PI * u));
        }
        tone(t + dur, { f: 132, f2: 62, g: 0.2, d: 0.12 });
        hit(t + dur, { f: 520, q: 1, g: 0.12, d: 0.07 });
      },

      // The escapement letting one tooth go.
      tick(odd) {
        if (!ctx() || ac.state !== 'running') return;
        const t = ac.currentTime + 0.001;
        hit(t, { f: odd ? 2700 : 2350, q: 3.4, g: 0.045, d: 0.012 });
        hit(t, { f: 900, q: 2, g: 0.02, d: 0.02 });
      },

      // Start: the mechanism catches.
      clunk() {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        hit(t, { f: 640, q: 1.3, g: 0.4, d: 0.08 });
        hit(t, { f: 1900, q: 1.5, g: 0.12, d: 0.03 });
        tone(t, { f: 140, f2: 68, g: 0.36, d: 0.1 });
      },

      // Pause: it lets go.
      release() {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        hit(t, { f: 1300, q: 1.6, g: 0.14, d: 0.02 });
        tone(t, { f: 165, f2: 95, g: 0.16, d: 0.06 });
      },

      // Focus ends the way a kitchen timer does, with the hammer rattling on
      // the bell. A break ends with two plain strikes.
      ring(full) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.02;
        if (!full) {
          strike(t, 0.9, true);
          strike(t + 0.46, 0.75, true);
          return;
        }
        const n = 26;
        for (let i = 0; i < n; i++) {
          const fade = i > n - 7 ? (n - i) / 7 : 1;
          strike(t + i * 0.052 + (Math.random() - 0.5) * 0.006, (0.7 + Math.random() * 0.3) * (0.45 + 0.55 * fade), i === n - 1);
        }
      },

      ding() {
        if (!ctx()) return;
        strike(ac.currentTime + 0.001, 0.8, true);
      },

      ambient(mode) {
        stopAmbient();
        if (mode !== 'rain' && mode !== 'warm') return;
        if (!ctx()) return;
        if (!brown) {
          const length = ac.sampleRate * 4;
          brown = ac.createBuffer(1, length, ac.sampleRate);
          const ch = brown.getChannelData(0);
          let last = 0;
          for (let i = 0; i < length; i++) {
            last = (last + 0.028 * (Math.random() * 2 - 1)) / 1.028;
            ch[i] = last * 3.1;
          }
          // blend the ends so the loop has no seam
          const fade = Math.floor(length * 0.05);
          for (let i = 0; i < fade; i++) {
            const w = i / fade;
            ch[i] = ch[i] * w + ch[length - fade + i] * (1 - w);
          }
        }
        const rain = mode === 'rain';
        const src = ac.createBufferSource();
        src.buffer = brown;
        src.loop = true;
        const f = ac.createBiquadFilter();
        f.type = rain ? 'bandpass' : 'lowpass';
        f.frequency.value = rain ? 950 : 420;
        f.Q.value = rain ? 0.55 : 0.7;
        const lfo = ac.createOscillator();
        const depth = ac.createGain();
        lfo.frequency.value = 0.14;
        depth.gain.value = rain ? 240 : 70;
        lfo.connect(depth);
        depth.connect(f.frequency);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, ac.currentTime);
        g.gain.exponentialRampToValueAtTime(rain ? 0.11 : 0.15, ac.currentTime + 0.9);
        src.connect(f);
        f.connect(g);
        g.connect(ac.destination);
        src.start();
        lfo.start();
        amb = { src, lfo, g };
      },
    };
  })();

  /* ── Clock ─────────────────────────────────────────────
     A hidden tab stops animation frames and slows its timers down to as
     little as one a minute. A worker keeps its own, so the bell still rings
     on time when you are looking at something else. */

  const clock = (() => {
    let worker = null;
    let iv = 0;
    let on = false;
    try {
      const src = 'let t=0;onmessage=(e)=>{clearInterval(t);if(e.data)t=setInterval(()=>postMessage(0),200)}';
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = () => onTick();
      worker.onerror = () => {
        worker = null;
        api.run(on);
      };
    } catch {
      worker = null;
    }
    const api = {
      run(next) {
        on = next;
        clearInterval(iv);
        if (worker) worker.postMessage(on ? 1 : 0);
        else if (on) iv = setInterval(onTick, 200);
      },
    };
    return api;
  })();

  /* ── Scale ─────────────────────────────────────────────── */

  {
    const NS = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180;
      const sin = Math.sin(a);
      const cos = -Math.cos(a);
      const major = i % 5 === 0;
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', (95.5 * sin).toFixed(2));
      line.setAttribute('y1', (95.5 * cos).toFixed(2));
      line.setAttribute('x2', ((major ? 86.5 : 91.5) * sin).toFixed(2));
      line.setAttribute('y2', ((major ? 86.5 : 91.5) * cos).toFixed(2));
      if (major) line.setAttribute('class', 'major');
      scale.appendChild(line);
      if (major) {
        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', (113 * sin).toFixed(2));
        text.setAttribute('y', (113 * cos).toFixed(2));
        text.textContent = String(i);
        scale.appendChild(text);
      }
    }
  }

  /* ── Light ─────────────────────────────────────────────── */

  // Colour of a black body at a given temperature (Tanner Helland's fit), 0..1.
  function blackbody(k) {
    const t = k / 100;
    const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [r, g, b].map((v) => clamp(v, 0, 255) / 255);
  }

  // What that light looks like on white paper. The eye adapts to most of the
  // tint, so only part of it survives.
  const PAPER_WHITE = [255, 253, 248];
  function lampColor(k, strength) {
    const c = blackbody(k);
    c[2] = Math.max(c[2], 0.12);
    const m = Math.max(c[0], c[1], c[2]);
    const warm = clamp((3400 - k) / 1400, 0, 1);
    const depth = [0.3, 0.18 + 0.12 * warm, 0.3];
    return c.map((v, i) => Math.pow(v / m, depth[i] * strength) * PAPER_WHITE[i]);
  }

  let lightNow = null;
  let lightRaf = 0;

  function paintLight(glow) {
    const hot = glow.map((v) => Math.round(v + (255 - v) * 0.55));
    root.style.setProperty('--glow-rgb', glow.map(Math.round).join(', '));
    root.style.setProperty('--hot-rgb', hot.join(', '));
  }

  // The lamp warms up for focus and cools down for a break.
  function setLight(animate) {
    const to = state.phase === 'focus' ? lampColor(kelvin, 1) : lampColor(BREAK_LIGHT.k, BREAK_LIGHT.strength);
    cancelAnimationFrame(lightRaf);
    if (!animate || !lightNow || reducedMotion.matches || document.hidden) {
      lightNow = to;
      paintLight(to);
      return;
    }
    const from = lightNow.slice();
    const t0 = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - t0) / 900);
      const e = u * u * (3 - 2 * u);
      lightNow = from.map((v, i) => v + (to[i] - v) * e);
      paintLight(lightNow);
      if (u < 1) lightRaf = requestAnimationFrame(step);
    };
    lightRaf = requestAnimationFrame(step);
  }

  function applyKelvin(k) {
    kelvin = clamp(Math.round(k / 100) * 100, K_MIN, K_MAX);
    kelvinEl.value = kelvin;
    kelvinOut.textContent = `${kelvin} K`;
    setLight(false);
  }

  const PAPERS = ['smooth', 'bond', 'laid', 'cotton'];
  function applyPaper(name) {
    paper = PAPERS.includes(name) ? name : 'bond';
    root.dataset.paper = paper;
    papers.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.paper === paper)));
  }

  /* ── Drawing ───────────────────────────────────────────── */

  let wind = null; // a turn of the ring in progress
  let lastSec = -1;
  let lastMin = -1;
  let moveTimer = 0;

  // How the mechanism gets to its next angle: 'run', 'wind', 'travel' or 'still'.
  function move(mode, ms) {
    clearTimeout(moveTimer);
    scene.dataset.move = mode;
    if (ms) moveTimer = setTimeout(() => { scene.dataset.move = 'run'; }, ms);
  }

  function say(msg) {
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  function nextPhase(counted) {
    if (state.phase !== 'focus') return 'focus';
    const n = counted ? state.cycleCount : state.cycleCount + 1;
    return n % settings.interval === 0 ? 'long' : 'short';
  }

  function render() {
    const left = wind && wind.moved ? wind.min * MIN : remaining();
    scene.style.setProperty('--a', `${((left / HOUR) * 360).toFixed(3)}deg`);

    const txt = fmt(left);
    if (timeEl.textContent !== txt) timeEl.textContent = txt;

    const m = Math.ceil(left / MIN);
    if (m !== lastMin) {
      lastMin = m;
      dial.setAttribute('aria-valuenow', String(m));
      dial.setAttribute('aria-valuetext', `${m} ${m === 1 ? 'minute' : 'minutes'} left, ${NAME[state.phase]}, ${STATUS[state.status]}`);
    }

    const name = cap(NAME[state.phase]);
    let title = BASE_TITLE;
    if (state.status === 'running') title = `${txt} · ${name}`;
    else if (state.status === 'paused') title = `Paused ${txt} · ${name}`;
    else if (state.status === 'complete') title = `Done · ${name}`;
    if (document.title !== title) document.title = title;
  }

  function rollover() {
    const now = dayKey();
    if (now === day) return;
    day = now;
    sessions = [];
    state.cycleCount = 0;
  }

  function renderLog() {
    const n = sessions.length;
    const total = sessions.reduce((sum, s) => sum + s.minutes, 0);
    logBtn.textContent = n ? `${n} ${n === 1 ? 'session' : 'sessions'} · ${span(total)}` : '0 sessions';
    logEmpty.hidden = n > 0;
    logList.hidden = n === 0;
    logActions.hidden = n === 0;
    logList.replaceChildren();
    for (const s of [...sessions].reverse()) {
      const li = document.createElement('li');
      const when = document.createElement('span');
      when.textContent = `${s.start}-${s.end}`;
      const dur = document.createElement('span');
      dur.textContent = `${s.minutes}m`;
      const what = document.createElement('span');
      what.className = s.note ? 'what' : 'what blank';
      what.textContent = s.note || 'focus';
      li.append(when, dur, what);
      logList.appendChild(li);
    }
  }

  function renderChrome() {
    rollover();
    disarm();
    body.dataset.phase = state.phase;
    body.dataset.state = state.status;

    const round = `${(state.cycleCount % settings.interval) + 1}/${settings.interval}`;
    const name = state.phase === 'focus' ? `focus ${round}` : NAME[state.phase];
    const next = NAME[nextPhase(true)];
    let line = name;
    let under = '';
    let action = `Start ${NAME[state.phase]}`;
    let label = 'Start';
    if (state.status === 'running') {
      under = `until ${hhmm(state.endAt)}`;
      action = `Pause ${NAME[state.phase]}`;
      label = 'Pause';
    } else if (state.status === 'paused') {
      under = 'paused';
      action = `Resume ${NAME[state.phase]}`;
      label = 'Resume';
    } else if (state.status === 'complete') {
      line = `done. ${next} next`;
      action = `Start ${next}`;
      label = action;
    }
    phaseEl.textContent = line;
    statusEl.textContent = under;
    startBtn.textContent = label;
    timeEl.setAttribute('aria-label', action);
    timeEl.title = action;

    hintEl.hidden = hinted;
    renderLog();
    lastMin = -1;
    render();
    stir();
  }

  /* ── Timer ─────────────────────────────────────────────── */

  // Put the dial at the start of a phase. The lamp runs round to it.
  function enter(phase, quiet) {
    clock.run(false);
    snd.ambient('off');
    state.phase = phase;
    state.status = 'idle';
    state.totalMs = state.remainingMs = durMs(phase);
    state.endAt = null;
    state.startedAt = null;
    move('travel', 620);
    if (!quiet) snd.travel(460);
    setLight(true);
  }

  function start(from) {
    if (state.status === 'running') return;
    snd.wake();
    if (state.status === 'complete') enter(nextPhase(true));
    const now = from == null ? Date.now() : from;
    if (state.status === 'idle') {
      window.memoToolTelemetry?.cancel();
      if (state.phase === 'focus') window.memoToolTelemetry?.begin();
      state.startedAt = now;
      state.totalMs = state.remainingMs;
    }
    state.endAt = now + state.remainingMs;
    state.status = 'running';
    lastSec = -1;
    hinted = true;
    clock.run(true);
    if (state.phase === 'focus') snd.ambient(settings.ambient);
    snd.clunk();
    renderChrome();
    persist();
    say(`${cap(NAME[state.phase])} started.`);
  }

  function pause() {
    if (state.status !== 'running') return;
    state.remainingMs = remaining();
    state.endAt = null;
    state.status = 'paused';
    clock.run(false);
    snd.ambient('off');
    snd.release();
    renderChrome();
    persist();
    say(`${cap(NAME[state.phase])} paused.`);
  }

  function toggle() {
    if (state.status === 'running') pause();
    else start();
  }

  function go(phase, msg) {
    enter(phase);
    renderChrome();
    persist();
    say(msg || `${cap(NAME[phase])}.`);
  }

  function notify(title, text) {
    if (!settings.notify || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      new Notification(title, { body: text });
    } catch { /* some browsers only allow this from a service worker */ }
  }

  // away: the phase ran out while the page was closed, so there is nobody to ring for.
  function complete(away) {
    const done = state.phase;
    const endTs = state.endAt == null ? Date.now() : state.endAt;
    clock.run(false);
    snd.ambient('off');

    if (done === 'focus') {
      window.memoToolTelemetry?.finish();
      rollover();
      state.cycleCount += 1;
      sessions.push({
        day,
        start: hhmm(state.startedAt == null ? endTs - state.totalMs : state.startedAt),
        end: hhmm(endTs),
        minutes: Math.max(1, Math.round(state.totalMs / MIN)),
        note: state.intention.trim(),
      });
    }

    state.status = 'complete';
    state.remainingMs = 0;
    state.endAt = null;
    state.startedAt = null;
    const next = nextPhase(true);

    if (!away) {
      snd.ring(done === 'focus');
      notify(`${cap(NAME[done])} is over`, `${cap(NAME[next])} is next.`);
      body.classList.remove('rang');
      void body.offsetWidth;
      body.classList.add('rang');
      setTimeout(() => body.classList.remove('rang'), 2000);
    }

    // Carry straight on if asked to, unless the machine was asleep so long
    // that the next phase would be over before anyone saw it start.
    const auto = done === 'focus' ? settings.autoBreak : settings.autoFocus;
    if (auto && !away && Date.now() - endTs < durMs(next)) {
      enter(next, true);
      start(endTs);
      say(`${cap(NAME[done])} is over. ${cap(NAME[next])} started.`);
      return;
    }
    renderChrome();
    persist();
    say(`${cap(NAME[done])} is over. ${cap(NAME[next])} is next.`);
  }

  function onTick() {
    if (state.status !== 'running' || (wind && wind.moved)) return;
    const left = remaining();
    if (left <= 0) {
      complete(false);
      return;
    }
    const sec = Math.ceil(left / 1000);
    if (sec === lastSec) return;
    lastSec = sec;
    if (settings.tick && !document.hidden) snd.tick(sec % 2 === 1);
    render();
  }

  // Winding sets the time. Before a phase starts it also becomes that phase's
  // length from now on; once it is running it only changes this run.
  function setMinutes(m) {
    const ms = clamp(m, 1, 60) * MIN;
    if (state.status === 'idle') {
      state.totalMs = state.remainingMs = ms;
      settings[DUR_KEY[state.phase]] = ms / MIN;
    } else {
      state.totalMs = Math.max(MIN, state.totalMs - remaining() + ms);
      state.remainingMs = ms;
      if (state.status === 'running') state.endAt = Date.now() + ms;
    }
    lastSec = -1;
    hinted = true;
    renderChrome();
    persist();
  }

  /* ── Destructive actions ask once ──────────────────────── */

  let armed = null;

  function disarm() {
    if (!armed) return;
    clearTimeout(armed.timer);
    if (armed.btn) {
      armed.btn.classList.remove('armed');
      armed.btn.textContent = armed.label;
    }
    armed = null;
  }

  // Throwing away a running timer, or the log, takes a second press.
  function twice(key, btn, ask, fn, always) {
    const atRisk = always || state.status === 'running' || state.status === 'paused';
    if (!atRisk || (armed && armed.key === key)) {
      disarm();
      fn();
      return;
    }
    disarm();
    armed = { key, btn, label: btn ? btn.textContent : '', timer: setTimeout(disarm, 3500) };
    if (btn) {
      btn.classList.add('armed');
      btn.textContent = ask;
    }
    say(`${ask} Press again to confirm.`);
  }

  const reset = () => twice('reset', resetBtn, 'Reset this one?', () => go(state.phase, `${cap(NAME[state.phase])} reset.`));
  const skip = () => twice('skip', skipBtn, 'Skip this one?', () => {
    const next = nextPhase(state.status === 'complete');
    go(next, `Skipped to ${NAME[next]}.`);
  });
  const pick = (phase) => {
    if (phase === state.phase && state.status === 'idle') return;
    twice(`pick:${phase}`, skipBtn, `Switch to ${NAME[phase]}?`, () => go(phase));
  };

  /* ── Winding ───────────────────────────────────────────── */

  function point(e) {
    const box = ring.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    return {
      deg: ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360,
      dist: Math.hypot(dx, dy),
      r: box.width / 2,
    };
  }

  dial.addEventListener('pointerdown', (e) => {
    if (e.button || wind) return;
    const p = point(e);
    if (p.dist < p.r * 0.56 || p.dist > p.r * 1.38) return;
    snd.wake();
    if (state.status === 'complete') {
      enter(nextPhase(true), true);
      renderChrome();
    }
    const min = remaining() / MIN;
    wind = { id: e.pointerId, last: p.deg, acc: min * 6, min: Math.round(min), moved: false, x: e.clientX, y: e.clientY };
    try {
      dial.setPointerCapture(e.pointerId);
    } catch { /* the pointer is already gone */ }
  });

  dial.addEventListener('pointermove', (e) => {
    if (!wind || e.pointerId !== wind.id) return;
    const p = point(e);
    let d = p.deg - wind.last;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    wind.last = p.deg;
    if (!wind.moved) {
      if (Math.hypot(e.clientX - wind.x, e.clientY - wind.y) < 5) return;
      wind.moved = true;
      body.classList.add('winding');
      move('wind');
    }
    // The ring has stops at one minute and at a full turn, like the real thing.
    wind.acc = clamp(wind.acc + d, 6, 360);
    const m = Math.round(wind.acc / 6);
    if (m === wind.min) return;
    snd.detent(m > wind.min);
    wind.min = m;
    render();
  });

  function endWind(e, cancelled) {
    if (!wind || e.pointerId !== wind.id) return;
    const w = wind;
    wind = null;
    body.classList.remove('winding');
    if (cancelled) {
      move('run');
      lastSec = -1;
      render();
      return;
    }
    if (w.moved) {
      move('run');
      setMinutes(w.min);
      return;
    }
    // A tap on the scale sets that minute, and the lamp runs round to it.
    const m = Math.round(point(e).deg / 6);
    if (m < 1) return;
    move('travel', 620);
    snd.travel(420);
    setMinutes(m);
  }

  dial.addEventListener('pointerup', (e) => endWind(e, false));
  dial.addEventListener('pointercancel', (e) => endWind(e, true));

  function nudge(by) {
    if (state.status === 'complete') enter(nextPhase(true), true);
    const now = Math.round(remaining() / MIN);
    const m = clamp(now + by, 1, 60);
    if (m === now && state.status !== 'running') return;
    move('wind', 160);
    snd.detent(by > 0);
    setMinutes(m);
  }

  const NUDGE = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5, Home: -60, End: 60 };

  /* ── Chrome ────────────────────────────────────────────── */

  let quietTimer = 0;
  const panelOpen = () => !prefsEl.hidden || !logEl.hidden;

  // While it runs and nobody touches anything, the controls step back.
  function stir() {
    body.classList.remove('quiet');
    clearTimeout(quietTimer);
    if (state.status !== 'running') return;
    quietTimer = setTimeout(() => {
      if (state.status === 'running' && !panelOpen() && !wind) body.classList.add('quiet');
    }, 4000);
  }
  for (const type of ['pointermove', 'pointerdown', 'keydown', 'focusin']) {
    document.addEventListener(type, stir, { passive: true });
  }

  function flash(btn, label) {
    const old = btn.dataset.label || btn.textContent;
    btn.dataset.label = old;
    btn.textContent = label;
    say(label);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = old; }, 1400);
  }

  function setPanel(which) {
    for (const [el, btn] of [[prefsEl, prefsBtn], [logEl, logBtn]]) {
      const open = el === which;
      if (open) {
        // Sit just above the controls, however many rows they wrap to.
        const top = btn.parentElement.getBoundingClientRect().top;
        el.style.bottom = `${Math.round(window.innerHeight - top + 8)}px`;
      }
      el.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    }
    stir();
  }

  function renderSound() {
    soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(soundOn));
  }

  function toggleSound() {
    soundOn = !soundOn;
    renderSound();
    if (soundOn) {
      snd.ding();
      if (state.status === 'running' && state.phase === 'focus') snd.ambient(settings.ambient);
    } else {
      snd.ambient('off');
    }
    persist();
    say(soundOn ? 'Sound on.' : 'Sound off.');
  }

  function renderPrefs() {
    roundsEl.value = settings.interval;
    tickEl.checked = settings.tick;
    autoBreakEl.checked = settings.autoBreak;
    autoFocusEl.checked = settings.autoFocus;
    const canNotify = typeof Notification !== 'undefined';
    if (!canNotify || Notification.permission !== 'granted') settings.notify = false;
    notifyEl.checked = settings.notify;
    notifyEl.disabled = !canNotify;
    ambients.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ambient === settings.ambient)));
  }

  timeEl.addEventListener('click', toggle);
  startBtn.addEventListener('click', toggle);
  resetBtn.addEventListener('click', reset);
  skipBtn.addEventListener('click', skip);
  soundBtn.addEventListener('click', toggleSound);
  prefsBtn.addEventListener('click', () => {
    setPanel(prefsEl.hidden ? prefsEl : null);
    if (!prefsEl.hidden) kelvinEl.focus({ preventScroll: true });
  });
  logBtn.addEventListener('click', () => setPanel(logEl.hidden ? logEl : null));
  $('stage').addEventListener('pointerdown', () => {
    if (panelOpen()) setPanel(null);
  });

  kelvinEl.addEventListener('input', () => {
    applyKelvin(+kelvinEl.value);
    persist();
  });
  papers.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-paper]');
    if (!b) return;
    applyPaper(b.dataset.paper);
    persist();
  });
  ambients.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-ambient]');
    if (!b) return;
    settings.ambient = b.dataset.ambient;
    renderPrefs();
    snd.ambient(state.status === 'running' && state.phase === 'focus' ? settings.ambient : 'off');
    persist();
  });
  roundsEl.addEventListener('change', () => {
    settings.interval = whole(Number(roundsEl.value), 1, 12, settings.interval);
    renderPrefs();
    renderChrome();
    persist();
  });
  tickEl.addEventListener('change', () => {
    settings.tick = tickEl.checked;
    if (settings.tick) snd.tick(true);
    persist();
  });
  autoBreakEl.addEventListener('change', () => {
    settings.autoBreak = autoBreakEl.checked;
    persist();
  });
  autoFocusEl.addEventListener('change', () => {
    settings.autoFocus = autoFocusEl.checked;
    persist();
  });
  notifyEl.addEventListener('change', async () => {
    let ok = false;
    if (notifyEl.checked && typeof Notification !== 'undefined') {
      try {
        ok = (Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()) === 'granted';
      } catch { /* treated as refused */ }
      if (!ok) say('Notifications are blocked for this site in the browser.');
    }
    settings.notify = ok;
    renderPrefs();
    persist();
  });

  intentionEl.addEventListener('input', () => {
    state.intention = intentionEl.value;
    persist();
  });
  intentionEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') intentionEl.blur();
  });

  logCopy.addEventListener('click', async () => {
    const text = [`Pomodoro log, ${day}`]
      .concat(sessions.map((s) => `${s.start}-${s.end}  ${s.minutes}m  ${s.note || 'focus'}`))
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      flash(logCopy, 'Copied');
    } catch {
      flash(logCopy, 'Copy failed');
    }
  });
  logClear.addEventListener('click', () => twice('clear', logClear, 'Clear today?', () => {
    sessions = [];
    renderLog();
    persist();
    say('Log cleared.');
  }, true));

  document.addEventListener('keydown', (e) => {
    const el = e.target;
    const tag = el && el.tagName;
    if (e.key === 'Escape') {
      if (panelOpen()) setPanel(null);
      else if (tag === 'INPUT') el.blur();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return;

    if (e.key in NUDGE) {
      e.preventDefault();
      nudge(NUDGE[e.key]);
      return;
    }
    if (e.code === 'Space') {
      if (tag === 'BUTTON' || tag === 'A') return; // the focused control gets it
      e.preventDefault();
      toggle();
      return;
    }
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'r') reset();
    else if (k === 'n') skip();
    else if (k === 'm') toggleSound();
    else if (k === '1') pick('focus');
    else if (k === '2') pick('short');
    else if (k === '3') pick('long');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      persist();
      return;
    }
    lastSec = -1;
    if (state.status === 'running') onTick();
    else renderChrome();
  });
  window.addEventListener('pagehide', persist);

  /* ── Boot ──────────────────────────────────────────────── */

  {
    const stops = [];
    for (let i = 0; i <= 8; i++) {
      stops.push(`rgb(${lampColor(K_MIN + ((K_MAX - K_MIN) * i) / 8, 2.4).map(Math.round).join(', ')})`);
    }
    kelvinEl.style.setProperty('--kelvin-track', `linear-gradient(90deg, ${stops.join(', ')})`);
  }

  intentionEl.value = state.intention;
  renderSound();
  renderPrefs();
  applyPaper(paper);
  applyKelvin(kelvin);

  if (finishedWhileAway) {
    complete(true);
  } else {
    renderChrome();
    if (state.status === 'running') clock.run(true);
  }

  // Let the first frame land where it belongs before anything is allowed to glide.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (scene.dataset.move === 'still') move('run');
  }));

  // Sound needs a gesture. If the page came back with a timer already running,
  // the first touch brings the ambience back.
  if (state.status === 'running') {
    const unlock = () => {
      snd.wake();
      if (state.status === 'running' && state.phase === 'focus') snd.ambient(settings.ambient);
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }
})();
