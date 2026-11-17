((globalScope) => {
  const STORAGE_KEY = 'memo-tools-meditation-v1';
  const MAX_MIN = 120;
  const OPEN_STICK_MIN = 30;
  const LOOKAHEAD_MS = 180_000;
  const MIN_LOG_MS = 60_000;
  const MAX_SESSIONS = 2000;
  const MAX_RESTORE_OPEN_MS = 12 * 60 * 60 * 1000;
  const MAX_RESTORE_OVERDUE_MS = 24 * 60 * 60 * 1000;

  const BELL_KINDS = ['bowl', 'temple', 'tingsha', 'off'];
  const ROOM_KINDS = ['off', 'rain', 'wind', 'stream'];
  const INCENSE_KINDS = ['sandalwood', 'aloeswood', 'hinoki', 'plum'];
  const INTERVAL_MODES = ['off', '5', '10', 'half'];

  const DEFAULT_SETTINGS = {
    bell: 'bowl',
    volume: 70,
    ambient: 'off',
    prepSec: 0,
    intervalMode: 'off',
    startBell: true,
    endBells: 3,
    incense: 'sandalwood',
    sound: true,
  };

  function clampMinutes(val) {
    const n = Math.round(Number(val));
    if (!Number.isFinite(n)) return 10;
    return Math.max(1, Math.min(MAX_MIN, n));
  }

  // Share of the longest stick. Not linear, so a 5 minute stick is still a stick.
  function stickFraction(min) {
    const m = min > 0 ? Math.min(MAX_MIN, min) : OPEN_STICK_MIN;
    return 0.25 + 0.75 * Math.sqrt(m / MAX_MIN);
  }

  function formatMinutes(min) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  function dayKey(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function computeStreakDays(sessions, referenceDate = new Date()) {
    if (!Array.isArray(sessions) || sessions.length === 0) return 0;
    const days = new Set(sessions.map((s) => s.day).filter(Boolean));
    const keyForOffset = (offset) => {
      const d = new Date(referenceDate);
      d.setDate(d.getDate() - offset);
      return dayKey(d.getTime());
    };
    let offset = days.has(keyForOffset(0)) ? 0 : 1;
    let streak = 0;
    while (days.has(keyForOffset(offset))) {
      streak += 1;
      offset += 1;
    }
    return streak;
  }

  // Every bell a sit owes between two points of elapsed time: (fromMs, toMs].
  // An open sit has no closing bell. It rings once each time a stick burns out.
  function bellEvents({ durationMin, intervalMode, endBells }, fromMs, toMs) {
    const out = [];
    const total = durationMin > 0 ? durationMin * 60_000 : 0;
    const stickMs = OPEN_STICK_MIN * 60_000;
    const stepMs = intervalMode === '5' || intervalMode === '10' ? Number(intervalMode) * 60_000 : 0;
    const from = Math.max(0, fromMs);

    if (stepMs > 0) {
      const limit = total > 0 ? Math.min(toMs, total - 1) : toMs;
      for (let t = (Math.floor(from / stepMs) + 1) * stepMs; t <= limit; t += stepMs) {
        if (total === 0 && t % stickMs === 0) continue;
        out.push({ id: `int:${t}`, atMs: t, count: 1, soft: true });
      }
    }

    if (total > 0) {
      const half = Math.floor(total / 2);
      if (intervalMode === 'half' && total >= 120_000 && half > from && half <= toMs) {
        out.push({ id: 'half', atMs: half, count: 1, soft: true });
      }
      if (total > from && total <= toMs) {
        out.push({ id: 'close', atMs: total, count: endBells === 1 ? 1 : 3, soft: false });
      }
    } else {
      for (let t = (Math.floor(from / stickMs) + 1) * stickMs; t <= toMs; t += stickMs) {
        out.push({ id: `stick:${t}`, atMs: t, count: 1, soft: false });
      }
    }

    return out.sort((a, b) => a.atMs - b.atMs);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { clampMinutes, stickFraction, formatMinutes, computeStreakDays, bellEvents };
  }

  if (typeof document === 'undefined') return;

  const BASE_TITLE = document.title || 'Meditation Timer';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TILT = (1.4 * Math.PI) / 180;
  const root = document.documentElement;
  const body = document.body;
  const $ = (id) => document.getElementById(id);
  const all = (cls) => [...document.querySelectorAll(`.${cls}`)];
  const clock = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const media = (q) => (typeof window.matchMedia === 'function' ? window.matchMedia(q) : { matches: false });
  const reducedMotion = media('(prefers-reduced-motion: reduce)');

  function setVar(el, name, value) {
    if (!el || !el.style) return;
    if (el.style.setProperty) el.style.setProperty(name, value);
    else el.style[name] = value;
  }

  function formatClock(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function smooth(a, b, x) {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // ── Storage ─────────────────────────────────────────────

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

  // ── Sound ───────────────────────────────────────────────

  // Each partial is [frequency ratio, level, seconds to fall 60 dB]. The close
  // pairs beat against each other, which is the slow wobble a real bowl has.
  const BELLS = {
    bowl: {
      f: 262, level: 0.3, attack: 0.008, gap: 3.4,
      tap: { f: 1900, q: 1.2, level: 0.1, dur: 0.05 },
      partials: [[1, 1, 10], [1.004, 0.55, 9], [2.71, 0.42, 6], [2.722, 0.2, 5.5], [5.15, 0.16, 3], [8.1, 0.06, 1.6]],
    },
    temple: {
      f: 131, level: 0.34, attack: 0.012, gap: 4.2,
      tap: { f: 700, q: 0.8, level: 0.16, dur: 0.09 },
      partials: [[1, 1, 12], [1.006, 0.5, 11], [2, 0.5, 8], [2.41, 0.3, 6], [3, 0.26, 5], [4.1, 0.14, 3.2], [5.4, 0.08, 2]],
    },
    tingsha: {
      f: 2540, level: 0.12, attack: 0.003, gap: 2.6,
      tap: { f: 6000, q: 1, level: 0.05, dur: 0.02 },
      partials: [[1, 1, 6], [1.0045, 0.9, 5.6], [2.32, 0.3, 3], [2.33, 0.22, 2.8], [3.9, 0.1, 1.4]],
    },
  };

  // Each layer is [filter, Hz, Q, level, wobble Hz, wobble depth in Hz, loop seconds, gust depth].
  // Two loops of different lengths, so the room does not repeat every few seconds.
  const ROOMS = {
    rain: { level: 0.34, layers: [['bandpass', 2600, 0.45, 0.9, 0.13, 600, 7, 0], ['lowpass', 420, 0.5, 0.5, 0.07, 110, 11, 0]] },
    wind: { level: 0.42, layers: [['bandpass', 380, 1.5, 1, 0.06, 210, 11, 0.45], ['bandpass', 860, 2.4, 0.3, 0.11, 380, 7, 0.2]] },
    stream: { level: 0.3, layers: [['bandpass', 1500, 0.9, 0.8, 0.31, 520, 7, 0], ['bandpass', 640, 0.8, 0.7, 0.19, 230, 11, 0]] },
  };

  class Sound {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.on = true;
      this.volume = 0.7;
      this.buffers = new Map();
      this.room = null;
    }

    level() {
      return this.on ? Math.pow(this.volume, 1.6) : 0;
    }

    now() {
      return this.ctx ? this.ctx.currentTime : 0;
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state !== 'running') {
          try {
            const p = this.ctx.resume();
            if (p && p.catch) p.catch(() => {});
          } catch { /* Stays suspended until the next gesture. */ }
        }
        return this.ctx;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        const ctx = new AudioCtx();
        const master = ctx.createGain();
        master.gain.value = this.level();
        if (ctx.createDynamicsCompressor) {
          // Three closing bells overlap. This keeps the sum from clipping.
          const comp = ctx.createDynamicsCompressor();
          comp.threshold.value = -14;
          comp.knee.value = 18;
          comp.ratio.value = 3;
          comp.attack.value = 0.01;
          comp.release.value = 0.4;
          master.connect(comp);
          comp.connect(ctx.destination);
        } else {
          master.connect(ctx.destination);
        }
        this.ctx = ctx;
        this.master = master;
      } catch {
        return null;
      }
      return this.ctx;
    }

    setLevel(on, volumePct) {
      this.on = Boolean(on);
      this.volume = Math.max(0, Math.min(1, Number(volumePct) / 100));
      if (!this.master) return;
      try {
        const t = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setTargetAtTime(this.level(), t, 0.04);
      } catch {
        this.master.gain.value = this.level();
      }
    }

    // Schedules on the audio clock, so a throttled tab still rings on time.
    // Returns a handle, or null when nothing could be scheduled.
    bell(kind, delaySec, count = 1, soft = false) {
      const def = BELLS[kind];
      if (!def) return null;
      const ctx = this.ensure();
      if (!ctx) return null;
      // A stopped clock would ring late by however long it stays stopped.
      if (delaySec > 1 && ctx.state !== 'running') return null;
      try {
        const startAt = ctx.currentTime + Math.max(0.03, delaySec);
        const bus = ctx.createGain();
        bus.gain.value = soft ? 0.5 : 1;
        bus.connect(this.master);
        const sources = [];
        for (let i = 0; i < count; i++) {
          this.#strike(ctx, bus, sources, def, startAt + i * def.gap, i === 0 ? 1 : 0.85);
        }
        return {
          startAt,
          cancel() {
            sources.forEach((s) => { try { s.stop(); } catch { /* Already stopped. */ } });
            try { bus.disconnect(); } catch { /* Already gone. */ }
          },
        };
      } catch {
        return null;
      }
    }

    #strike(ctx, bus, sources, def, t, vel) {
      for (const [ratio, amp, decay] of def.partials) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = def.f * ratio;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(def.level * amp * vel, t + def.attack);
        gain.gain.setTargetAtTime(0, t + def.attack, decay / 6.9);
        osc.connect(gain);
        gain.connect(bus);
        osc.start(t);
        osc.stop(t + decay * 1.15 + 0.1);
        sources.push(osc);
      }
      // The mallet: a short knock before the metal takes over.
      const tap = ctx.createBufferSource();
      tap.buffer = this.#noise(ctx, 'white', 1);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = def.tap.f;
      filter.Q.value = def.tap.q;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(def.tap.level * vel, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + def.tap.dur);
      tap.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      tap.start(t);
      tap.stop(t + def.tap.dur + 0.02);
      sources.push(tap);
    }

    #noise(ctx, kind, seconds) {
      const key = `${kind}:${seconds}`;
      if (this.buffers.has(key)) return this.buffers.get(key);
      const length = Math.floor(ctx.sampleRate * seconds);
      const buf = ctx.createBuffer(1, length, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        if (kind === 'white') {
          ch[i] = white;
        } else {
          b0 = 0.99765 * b0 + white * 0.099046;
          b1 = 0.963 * b1 + white * 0.2965164;
          b2 = 0.57 * b2 + white * 1.0526913;
          ch[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
        }
      }
      // Blend the head into the tail so the loop has no seam.
      const fade = Math.min(4000, Math.floor(length * 0.05));
      for (let i = 0; i < fade; i++) {
        const w = i / fade;
        ch[i] = ch[i] * w + ch[length - fade + i] * (1 - w);
      }
      this.buffers.set(key, buf);
      return buf;
    }

    startRoom(mode) {
      this.stopRoom();
      const def = ROOMS[mode];
      if (!def) return;
      const ctx = this.ensure();
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, now);
        out.gain.exponentialRampToValueAtTime(def.level, now + 2.5);
        out.connect(this.master);
        const sources = [];
        for (const [type, freq, q, level, lfoHz, lfoDepth, seconds, gust] of def.layers) {
          const src = ctx.createBufferSource();
          src.buffer = this.#noise(ctx, 'pink', seconds);
          src.loop = true;
          const filter = ctx.createBiquadFilter();
          filter.type = type;
          filter.frequency.value = freq;
          filter.Q.value = q;
          const gain = ctx.createGain();
          gain.gain.value = level;
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.value = lfoHz;
          lfoGain.gain.value = lfoDepth;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          if (gust > 0) {
            const swell = ctx.createOscillator();
            const swellGain = ctx.createGain();
            swell.frequency.value = lfoHz * 0.61;
            swellGain.gain.value = level * gust;
            swell.connect(swellGain);
            swellGain.connect(gain.gain);
            swell.start();
            sources.push(swell);
          }
          src.connect(filter);
          filter.connect(gain);
          gain.connect(out);
          src.start();
          lfo.start();
          sources.push(src, lfo);
        }
        this.room = { out, sources, ctx };
      } catch {
        this.room = null;
      }
    }

    stopRoom() {
      if (!this.room) return;
      const { out, sources, ctx } = this.room;
      this.room = null;
      try {
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setTargetAtTime(0, now, 0.25);
        setTimeout(() => {
          sources.forEach((s) => { try { s.stop(); } catch { /* Already stopped. */ } });
          try { out.disconnect(); } catch { /* Already gone. */ }
        }, 1400);
      } catch { /* Nothing to fade. */ }
    }
  }

  // ── Smoke ───────────────────────────────────────────────

  // A thread of points leaves the ember and is carried by a slow, divergence-free
  // flow. Near the ember the flow is switched off, so the thread rises straight,
  // then it wavers and folds the way incense smoke does in still air.
  function createSmoke(canvas) {
    const g = canvas && canvas.getContext ? canvas.getContext('2d') : null;
    const CAP = 460;
    const LIFE = 13;
    const TAU = Math.PI * 2;
    const DRIFT = 30;

    // [wavelength x, wavelength y, rad/s, speed px/s]
    const modes = [[310, 420, 0.21, 15], [-190, 260, 0.34, 12], [120, 150, 0.52, 8], [-75, 95, 0.8, 5], [520, 700, 0.12, 18]]
      .map(([lx, ly, w, speed], i) => {
        const kx = TAU / lx;
        const ky = TAU / ly;
        const k = Math.hypot(kx, ky);
        return { kx, ky, w, u: (speed * ky) / k, v: (-speed * kx) / k, ph: i * 1.7 + 0.3 };
      });

    // Incense smoke is a thin sheet seen edge on. Its two edges read as bright
    // threads, with a fainter veil between them.
    const ribbons = [-1, 0, 1].map((side) => ({
      side,
      x: new Float32Array(CAP),
      y: new Float32Array(CAP),
      age: new Float32Array(CAP),
      d: new Float32Array(CAP),
      start: 0,
      n: 0,
    }));

    const ptr = { x: -9999, y: -9999, vx: 0, vy: 0 };
    let w = 0;
    let h = 0;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let emit = 0;
    let target = 0;
    let t = Math.random() * 100;
    let raf = 0;
    let last = 0;
    let rgb = '255, 255, 255';
    let density = 1;

    function step(dt) {
      t += dt;
      emit += (target - emit) * Math.min(1, dt * 1.6);
      if (target === 0 && emit < 0.02) emit = 0;
      const draft = Math.sin(t * 0.13) * 5 + Math.sin(t * 0.071 + 1.3) * 4;
      ptr.vx *= 0.86;
      ptr.vy *= 0.86;

      for (const r of ribbons) {
        while (r.n && r.age[r.start] + dt > LIFE) {
          r.start = (r.start + 1) % CAP;
          r.n -= 1;
        }
        for (let j = 0; j < r.n; j++) {
          const i = (r.start + j) % CAP;
          r.age[i] += dt;
          const x = r.x[i];
          const y = r.y[i];
          const height = oy - y;
          const loose = smooth(25, 230, height);
          let u = 0;
          let v = 0;
          for (const m of modes) {
            const c = Math.cos(m.kx * x + m.ky * (y + DRIFT * t) + m.w * t + m.ph);
            u += m.u * c;
            v += m.v * c;
          }
          const rise = 26 + 26 * smooth(0, 90, height) - 16 * smooth(220, 640, height);
          let dx = (u * loose + draft * smooth(0, 300, height) + r.side * 2.4 * smooth(10, 200, height)) * dt;
          let dy = (-rise + v * loose * 0.7) * dt;
          const px = x - ptr.x;
          const py = y - ptr.y;
          const d2 = px * px + py * py;
          if (d2 < 8100) {
            const f = 1 - Math.sqrt(d2) / 90;
            dx += ptr.vx * f * f * 0.5 * dt;
            dy += ptr.vy * f * f * 0.5 * dt;
          }
          r.x[i] = x + dx;
          r.y[i] = y + dy;
        }
        if (emit > 0) {
          if (r.n === CAP) {
            r.start = (r.start + 1) % CAP;
            r.n -= 1;
          }
          const i = (r.start + r.n) % CAP;
          r.x[i] = ox + r.side * 0.6;
          r.y[i] = oy;
          r.age[i] = 0;
          r.d[i] = emit;
          r.n += 1;
        }
      }
    }

    function draw() {
      if (!g) return;
      g.setTransform(scale, 0, 0, scale, 0, 0);
      g.clearRect(0, 0, w, h);
      g.lineCap = 'round';
      g.strokeStyle = `rgb(${rgb})`;
      for (const r of ribbons) {
        for (let j = 1; j < r.n; j++) {
          const i0 = (r.start + j - 1) % CAP;
          const i1 = (r.start + j) % CAP;
          const dx = r.x[i1] - r.x[i0];
          const dy = r.y[i1] - r.y[i0];
          const len = Math.hypot(dx, dy);
          if (len > 40) continue;
          const age = r.age[i1];
          const life = age / LIFE;
          const width = r.side ? 1.1 + 9 * Math.pow(life, 1.2) : 1.6 + 46 * Math.pow(life, 1.25);
          const body = r.side
            ? 0.5 * Math.pow(1 - life, 1.3) / (1 + width / 5)
            : 0.36 * Math.pow(1 - life, 1.6) / (1 + width / 10);
          // Wide strokes overlap many times along the thread, so each one carries less.
          const tone = r.d[i1] * density * body * Math.min(1, age / 0.25);
          // A stretched segment is cut into short pieces, or its round caps would bead.
          const pieces = Math.min(8, Math.max(1, Math.ceil(len / (width * 0.35))));
          const alpha = tone * Math.min(1, Math.max(len / pieces, 0.5) / width) * 1.6;
          if (alpha < 0.003) continue;
          g.globalAlpha = Math.min(1, alpha);
          g.lineWidth = width;
          for (let k = 0; k < pieces; k++) {
            g.beginPath();
            g.moveTo(r.x[i0] + (dx * k) / pieces, r.y[i0] + (dy * k) / pieces);
            g.lineTo(r.x[i0] + (dx * (k + 1)) / pieces, r.y[i0] + (dy * (k + 1)) / pieces);
            g.stroke();
          }
        }
      }
      g.globalAlpha = 1;
    }

    function alive() {
      return target > 0 || emit > 0 || ribbons.some((r) => r.n > 0);
    }

    function frame() {
      raf = 0;
      const now = clock();
      if (now - last >= 30) {
        // A throttled tab gets few frames. Take several small steps so the smoke keeps real time.
        const span = Math.min(0.6, (now - last) / 1000);
        const steps = Math.ceil(span / 0.034);
        last = now;
        for (let i = 0; i < steps; i++) step(span / steps);
        draw();
      }
      if (alive()) raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (!g || raf || reducedMotion.matches) return;
      last = clock();
      raf = requestAnimationFrame(frame);
    }

    function prewarm(seconds) {
      for (let i = 0; i < seconds * 30; i++) step(1 / 30);
      draw();
    }

    return {
      resize(cssW, cssH) {
        w = cssW;
        h = cssH;
        if (!g) return;
        scale = (window.devicePixelRatio || 1) >= 2 ? 1 : 0.75;
        canvas.width = Math.max(1, Math.round(cssW * scale));
        canvas.height = Math.max(1, Math.round(cssH * scale));
        draw();
      },
      setOrigin(x, y) {
        if (reducedMotion.matches && (x !== ox || y !== oy)) {
          for (const r of ribbons) {
            for (let j = 0; j < r.n; j++) {
              const i = (r.start + j) % CAP;
              r.x[i] += x - ox;
              r.y[i] += y - oy;
            }
          }
          ox = x;
          oy = y;
          draw();
          return;
        }
        ox = x;
        oy = y;
      },
      setColor(nextRgb, nextDensity) {
        rgb = nextRgb;
        density = nextDensity;
      },
      setEmit(on, warm = false) {
        target = on ? 1 : 0;
        if (reducedMotion.matches) {
          // No motion: a still plume while the stick burns, and nothing after.
          ribbons.forEach((r) => { r.n = 0; });
          emit = target;
          if (on) prewarm(11);
          else draw();
          return;
        }
        if (on && warm) {
          emit = 1;
          prewarm(11);
        }
        kick();
      },
      pointer(x, y, vx, vy) {
        ptr.x = x;
        ptr.y = y;
        ptr.vx = vx;
        ptr.vy = vy;
      },
      kick,
    };
  }

  // ── Elements and state ──────────────────────────────────

  const els = {
    stage: $('stage'),
    stick: $('stick'),
    flecks: $('flecks'),
    smoke: $('smoke'),
    light: $('light'),
    status: $('status'),
    toggleBtn: $('toggle-btn'),
    endBtn: $('end-btn'),
    soundBtn: $('sound-btn'),
    incenseBtn: $('incense-btn'),
    bellBtn: $('bell-btn'),
    logBtn: $('log-btn'),
    panels: { incense: $('panel-incense'), bell: $('panel-bell'), log: $('panel-log') },
    len: $('len'),
    lenOut: $('len-out'),
    volume: $('volume'),
    volumeOut: $('volume-out'),
    stats: $('stats'),
    noteRow: $('note-row'),
    noteInput: $('note-input'),
    logEmpty: $('log-empty'),
    logList: $('log-list'),
    clearBtn: $('clear-btn'),
    live: $('live'),
  };

  const sound = new Sound();
  const smoke = createSmoke(els.smoke);
  const saved = loadStore();

  function readSettings(raw) {
    const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
    // Older versions muted by setting the bell to "off" and remembering the real one.
    if (raw && raw.sound === undefined && raw.bell === 'off' && BELL_KINDS.includes(saved?.bellBeforeMute)) {
      s.bell = saved.bellBeforeMute;
      s.sound = false;
    }
    if (!BELL_KINDS.includes(s.bell)) s.bell = 'bowl';
    if (!ROOM_KINDS.includes(s.ambient)) s.ambient = 'off';
    if (!INCENSE_KINDS.includes(s.incense)) s.incense = 'sandalwood';
    if (!INTERVAL_MODES.includes(String(s.intervalMode))) s.intervalMode = 'off';
    s.intervalMode = String(s.intervalMode);
    s.prepSec = [0, 5, 10, 15].includes(Number(s.prepSec)) ? Number(s.prepSec) : 0;
    s.endBells = Number(s.endBells) === 1 ? 1 : 3;
    s.volume = Math.max(0, Math.min(100, Number(s.volume) || 0));
    s.startBell = Boolean(s.startBell);
    s.sound = Boolean(s.sound);
    return s;
  }

  const settings = readSettings(saved?.settings);
  let sessions = Array.isArray(saved?.sessions)
    ? saved.sessions.filter((s) => s && typeof s.day === 'string' && Number.isFinite(s.minutes))
    : [];

  const state = {
    durationMin: Number.isInteger(saved?.durationMin) && saved.durationMin >= 0 ? Math.min(MAX_MIN, saved.durationMin) : 10, // 0 = open
    status: 'idle', // 'idle' | 'prep' | 'running' | 'paused' | 'complete'
    prepRemainingMs: 0,
    prepEndAt: null,
    elapsedMs: 0,
    runAnchorTs: null,
    startedAt: null,
    bellCursorMs: 0,
    lastMinutes: 0,
  };

  const geo = { ashY: 500, maxLen: 300, canvasW: 800, stickIndex: -1, ashFrom: null, ashLimit: 12 };
  const scheduled = new Map();
  let lastSliderMin = state.durationMin > 0 ? state.durationMin : 10;
  let openPanel = null;
  let tickTimer = null;
  let quietTimer = 0;
  let lightingTimer = 0;
  let wakeLock = null;

  sound.setLevel(settings.sound, settings.volume);

  const isSitting = () => state.status === 'prep' || state.status === 'running';
  const goalMs = () => (state.durationMin > 0 ? state.durationMin * 60_000 : 0);
  const stickMs = () => (state.durationMin > 0 ? goalMs() : OPEN_STICK_MIN * 60_000);

  function currentPrepRemainingMs() {
    if (state.status === 'prep' && state.prepEndAt !== null) return Math.max(0, state.prepEndAt - Date.now());
    return Math.max(0, state.prepRemainingMs);
  }

  function currentElapsedMs() {
    if (state.status === 'running' && state.runAnchorTs !== null) return Math.max(0, Date.now() - state.runAnchorTs);
    return Math.max(0, state.elapsedMs);
  }

  function persist() {
    const timer = state.status !== 'idle'
      ? {
          status: state.status,
          durationMin: state.durationMin,
          elapsedMs: currentElapsedMs(),
          runAnchorTs: state.runAnchorTs,
          prepRemainingMs: currentPrepRemainingMs(),
          prepEndAt: state.prepEndAt,
          startedAt: state.startedAt,
          bellCursorMs: state.bellCursorMs,
        }
      : null;
    saveStore({ durationMin: state.durationMin, settings, sessions: sessions.slice(-MAX_SESSIONS), timer });
  }

  function announce(text) {
    els.live.textContent = text;
  }

  // ── Bells on the audio clock ────────────────────────────

  function cancelScheduled() {
    scheduled.forEach((h) => h.cancel());
    scheduled.clear();
  }

  function cancelFuture() {
    const now = sound.now();
    for (const [id, h] of scheduled) {
      if (h.startAt > now + 0.1) {
        h.cancel();
        scheduled.delete(id);
      }
    }
  }

  // A bell is due. If the audio clock already rang it, leave it. If the clock
  // was stopped (a locked phone), ring now when it still makes sense to.
  function settleBell(id, play, count, soft) {
    const h = scheduled.get(id);
    scheduled.delete(id);
    if (h && sound.now() >= h.startAt - 0.08) return;
    if (h) h.cancel();
    if (play) sound.bell(settings.bell, 0, count, soft);
  }

  function serviceBells(elapsed) {
    const cfg = { durationMin: state.durationMin, intervalMode: settings.intervalMode, endBells: settings.endBells };
    for (const e of bellEvents(cfg, state.bellCursorMs, elapsed + LOOKAHEAD_MS)) {
      if (e.atMs <= elapsed) {
        settleBell(e.id, e.id === 'close' || elapsed - e.atMs < 5000, e.count, e.soft);
      } else if (!scheduled.has(e.id)) {
        const h = sound.bell(settings.bell, (e.atMs - elapsed) / 1000, e.count, e.soft);
        if (h) scheduled.set(e.id, h);
      }
    }
    state.bellCursorMs = elapsed;
  }

  // ── Screen wake lock ────────────────────────────────────

  async function holdAwake() {
    if (typeof navigator === 'undefined' || !navigator.wakeLock || wakeLock || document.hidden) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      wakeLock = lock;
      lock.addEventListener('release', () => {
        if (wakeLock === lock) wakeLock = null;
      });
      if (!isSitting()) releaseAwake();
    } catch { /* The sit still runs. The screen may sleep. */ }
  }

  function releaseAwake() {
    if (!wakeLock) return;
    const lock = wakeLock;
    wakeLock = null;
    try {
      const p = lock.release();
      if (p && p.catch) p.catch(() => {});
    } catch { /* Already released. */ }
  }

  // ── Scene ───────────────────────────────────────────────

  function readSmokeStyle() {
    if (typeof getComputedStyle !== 'function') return;
    const cs = getComputedStyle(root);
    smoke.setColor(cs.getPropertyValue('--smoke-rgb').trim() || '255, 255, 255', parseFloat(cs.getPropertyValue('--smoke-k')) || 1);
  }

  function layout() {
    const W = window.innerWidth || 1024;
    const H = window.innerHeight || 768;
    geo.ashY = Math.round(H * (W < 700 ? 0.64 : 0.69));
    geo.maxLen = Math.max(110, Math.min(H * 0.54, geo.ashY - 64, 540));
    geo.canvasW = Math.min(W, 1100);
    setVar(root, '--ash-y', `${geo.ashY}px`);
    setVar(els.smoke, 'left', `${-geo.canvasW / 2}px`);
    setVar(els.smoke, 'top', `${-geo.ashY}px`);
    setVar(els.smoke, 'width', `${geo.canvasW}px`);
    setVar(els.smoke, 'height', `${geo.ashY}px`);
    smoke.resize(geo.canvasW, geo.ashY);
    renderBurn();
  }

  function addFleck(sceneX) {
    if (!els.flecks || !document.createElementNS) return;
    const bowlScale = 260 / Math.min(250, (window.innerWidth || 1024) * 0.6);
    const fleck = document.createElementNS(SVG_NS, 'ellipse');
    const cx = 130 + sceneX * bowlScale + (Math.random() - 0.5) * 26;
    const cy = 23 + (Math.random() - 0.4) * 6;
    fleck.setAttribute('class', 'fleck');
    fleck.setAttribute('cx', cx.toFixed(1));
    fleck.setAttribute('cy', cy.toFixed(1));
    fleck.setAttribute('rx', (2 + Math.random() * 3).toFixed(1));
    fleck.setAttribute('ry', (0.7 + Math.random() * 0.7).toFixed(1));
    fleck.setAttribute('transform', `rotate(${(Math.random() * 40 - 20).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})`);
    els.flecks.appendChild(fleck);
    if (els.flecks.childElementCount > 60 && els.flecks.firstElementChild) els.flecks.firstElementChild.remove();
  }

  function dropAsh(ashLen, rem) {
    const landX = Math.sin(TILT) * rem;
    const piece = document.createElement('i');
    if (!piece.animate || reducedMotion.matches || document.hidden) {
      addFleck(landX);
      return;
    }
    piece.className = 'ash-fall';
    setVar(piece, 'top', `${-(rem + ashLen)}px`);
    setVar(piece, 'height', `${ashLen}px`);
    els.stick.appendChild(piece);
    const side = Math.random() < 0.5 ? -1 : 1;
    const fall = piece.animate(
      [
        { transform: 'translate(0, 0) rotate(-2.5deg)', opacity: 1 },
        { transform: `translate(${side * (3 + Math.random() * 5)}px, ${rem}px) rotate(${side * 70}deg)`, opacity: 1, offset: 0.92 },
        { transform: `translate(${side * 9}px, ${rem + 2}px) rotate(${side * 88}deg)`, opacity: 0 },
      ],
      { duration: 320 + Math.sqrt(rem) * 34, easing: 'cubic-bezier(0.55, 0, 0.9, 0.55)' },
    );
    fall.onfinish = () => {
      piece.remove();
      addFleck(landX + side * 6);
    };
  }

  function flare() {
    body.classList.add('lighting');
    clearTimeout(lightingTimer);
    lightingTimer = setTimeout(() => body.classList.remove('lighting'), 1100);
  }

  function renderBurn() {
    const len = geo.maxLen * stickFraction(state.durationMin);
    const burning = state.status === 'running' || state.status === 'paused' || state.status === 'complete';
    const elapsed = burning ? currentElapsedMs() : 0;
    const span = stickMs();
    const timed = state.durationMin > 0;
    const stickIndex = timed ? 0 : Math.floor(elapsed / span);
    const p = timed ? Math.min(1, elapsed / span) : (elapsed % span) / span;
    const burnt = len * p;
    const rem = len - burnt;

    if (stickIndex !== geo.stickIndex) {
      // An open sit lights a new stick when the last one burns out.
      if (geo.stickIndex >= 0 && stickIndex > geo.stickIndex && state.status === 'running') flare();
      geo.stickIndex = stickIndex;
      geo.ashFrom = null;
    }
    if (geo.ashFrom === null || burnt < geo.ashFrom) geo.ashFrom = Math.max(0, burnt - Math.random() * 8);

    let ash = burning ? burnt - geo.ashFrom : 0;
    const spent = state.status === 'complete' && rem < 0.5;
    if (ash > 0.5 && (ash >= geo.ashLimit || spent)) {
      dropAsh(ash, rem);
      geo.ashFrom = burnt;
      geo.ashLimit = 9 + Math.random() * 9;
      ash = 0;
    }

    const ex = Math.sin(TILT) * rem;
    const ey = -Math.cos(TILT) * rem;
    setVar(root, '--len', `${len.toFixed(1)}px`);
    setVar(root, '--rem', `${rem.toFixed(2)}px`);
    setVar(root, '--ash', `${ash.toFixed(2)}px`);
    setVar(root, '--ex', `${ex.toFixed(2)}px`);
    setVar(root, '--ey', `${ey.toFixed(2)}px`);
    smoke.setOrigin(geo.canvasW / 2 + ex, geo.ashY + ey - 2);
  }

  // ── Chrome ──────────────────────────────────────────────

  function statusText() {
    const goal = goalMs();
    const elapsed = currentElapsedMs();
    if (state.status === 'idle') {
      return goal > 0
        ? `${formatMinutes(state.durationMin)} · ends ${formatClock(Date.now() + goal + settings.prepSec * 1000)}`
        : 'Open sit';
    }
    if (state.status === 'prep') return 'Settle in';
    if (state.status === 'running') {
      return goal > 0
        ? `Ends ${formatClock(state.runAnchorTs + goal)}`
        : `Open · ${formatMinutes(Math.floor(elapsed / 60_000))}`;
    }
    if (state.status === 'paused') {
      if (state.prepRemainingMs > 0) return 'Paused';
      return goal > 0
        ? `Paused · ${formatMinutes(Math.ceil((goal - elapsed) / 60_000))} left`
        : `Paused · ${formatMinutes(Math.floor(elapsed / 60_000))}`;
    }
    return `Sat ${formatMinutes(state.lastMinutes)}`;
  }

  function renderStatus() {
    const text = statusText();
    if (els.status.textContent !== text) els.status.textContent = text;
  }

  function renderLog() {
    const today = dayKey(Date.now());
    const todays = sessions.filter((s) => s.day === today);
    const todayMin = todays.reduce((sum, s) => sum + s.minutes, 0);
    const streak = computeStreakDays(sessions);
    els.stats.textContent = `${todays.length} ${todays.length === 1 ? 'sit' : 'sits'} today (${formatMinutes(todayMin)}) · ${streak} day streak`;

    const has = sessions.length > 0;
    els.logEmpty.hidden = has;
    els.logList.hidden = !has;
    els.clearBtn.hidden = !has;
    els.noteRow.hidden = !has;
    els.logBtn.textContent = has ? `Log (${sessions.length})` : 'Log';
    if (!has) return;

    const last = sessions[sessions.length - 1];
    if (els.noteInput.value !== (last.note || '')) els.noteInput.value = last.note || '';

    els.logList.replaceChildren();
    sessions.slice(-80).reverse().forEach((item) => {
      const li = document.createElement('li');
      const when = document.createElement('span');
      when.className = 'log-when';
      when.textContent = `${item.day.slice(5)} ${item.time || ''}`;
      const note = document.createElement('span');
      note.className = 'log-note';
      note.textContent = item.note || (item.open ? 'Open sit' : '');
      const min = document.createElement('span');
      min.className = 'log-min';
      min.textContent = formatMinutes(item.minutes);
      li.append(when, note, min);
      els.logList.appendChild(li);
    });
  }

  const segs = {};

  function renderChrome() {
    body.dataset.state = state.status;
    body.dataset.incense = settings.incense;

    const busy = state.status === 'prep' || state.status === 'running' || state.status === 'paused';
    els.toggleBtn.textContent = isSitting() ? 'Pause'
      : state.status === 'paused' ? 'Resume'
        : state.status === 'complete' ? 'New stick'
          : 'Light';
    els.endBtn.hidden = !busy;
    els.incenseBtn.hidden = busy;
    if (busy && openPanel === 'incense') showPanel(null);
    els.light.setAttribute('aria-label', state.status === 'complete' ? 'Set a new stick' : 'Light the incense');

    els.soundBtn.textContent = settings.sound ? 'Sound on' : 'Sound off';
    els.soundBtn.setAttribute('aria-pressed', String(settings.sound));

    if (state.durationMin > 0) lastSliderMin = state.durationMin;
    els.len.value = String(lastSliderMin);
    els.lenOut.textContent = state.durationMin > 0 ? formatMinutes(state.durationMin) : 'Open';
    els.volume.value = String(settings.volume);
    els.volumeOut.textContent = `${settings.volume}%`;

    segs.min(state.durationMin);
    segs.incense(settings.incense);
    segs.prep(settings.prepSec);
    segs.bell(settings.bell);
    segs.start(settings.startBell ? 1 : 0);
    segs.end(settings.endBells);
    segs.interval(settings.intervalMode);
    segs.ambient(settings.ambient);

    document.title = isSitting() ? 'Sitting · Meditation'
      : state.status === 'paused' ? 'Paused · Meditation'
        : state.status === 'complete' ? 'Done · Meditation'
          : BASE_TITLE;

    renderStatus();
    renderBurn();
    wake();
  }

  function showPanel(name) {
    openPanel = name;
    for (const [key, panel] of Object.entries(els.panels)) panel.hidden = key !== name;
    els.incenseBtn.setAttribute('aria-expanded', String(name === 'incense'));
    els.bellBtn.setAttribute('aria-expanded', String(name === 'bell'));
    els.logBtn.setAttribute('aria-expanded', String(name === 'log'));
    if (name === 'log') renderLog();
    wake();
  }

  // The chrome leaves while you sit and comes back when you move.
  function wake() {
    body.classList.remove('quiet');
    clearTimeout(quietTimer);
    if (!isSitting() || openPanel) return;
    quietTimer = setTimeout(() => {
      if (isSitting() && !openPanel) body.classList.add('quiet');
    }, 4000);
  }

  // ── Sit ─────────────────────────────────────────────────

  function stopTicking() {
    if (tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function startTicking() {
    stopTicking();
    tickTimer = setInterval(tick, 500);
  }

  function startBurning() {
    window.memoToolTelemetry?.cancel();
    window.memoToolTelemetry?.begin();
    state.status = 'running';
    state.prepEndAt = null;
    state.prepRemainingMs = 0;
    state.elapsedMs = 0;
    state.bellCursorMs = 0;
    state.runAnchorTs = Date.now();
    geo.stickIndex = -1;
    geo.ashFrom = 0;
    settleBell('open', settings.startBell, 1, false);
    if (settings.ambient !== 'off') sound.startRoom(settings.ambient);
    smoke.setEmit(true);
    serviceBells(0);
    renderChrome();
    persist();
    announce('The stick is lit. Sit started.');
  }

  function recordSit(elapsedMs, endedAt) {
    const minutes = Math.max(1, Math.round(elapsedMs / 60_000));
    sessions.push({
      day: dayKey(endedAt),
      time: formatClock(endedAt),
      minutes,
      open: state.durationMin === 0,
      note: '',
    });
    return minutes;
  }

  function finishSit(endedAt = Date.now()) {
    stopTicking();
    cancelScheduled();
    sound.stopRoom();
    smoke.setEmit(false);
    releaseAwake();
    state.runAnchorTs = null;
    state.prepEndAt = null;
    state.prepRemainingMs = 0;

    if (state.elapsedMs < MIN_LOG_MS) {
      resetSit('Sit ended. Under a minute, so nothing was logged.');
      return;
    }
    window.memoToolTelemetry?.finish();
    state.lastMinutes = recordSit(state.elapsedMs, endedAt);
    state.status = 'complete';
    renderChrome();
    renderLog();
    persist();
    announce(`Sit complete. ${formatMinutes(state.lastMinutes)} logged.`);
  }

  function tick() {
    readSmokeStyle();
    if (state.status === 'prep') {
      if (currentPrepRemainingMs() <= 0) startBurning();
      return;
    }
    if (state.status !== 'running') return;
    const elapsed = currentElapsedMs();
    const goal = goalMs();
    if (goal > 0 && elapsed >= goal) {
      state.elapsedMs = goal;
      serviceBells(goal);
      finishSit(state.runAnchorTs + goal);
      return;
    }
    state.elapsedMs = elapsed;
    serviceBells(elapsed);
    renderBurn();
    renderStatus();
  }

  function beginSit() {
    sound.ensure();
    readSmokeStyle();
    if (state.status === 'idle') {
      state.startedAt = Date.now();
      holdAwake();
      startTicking();
      if (settings.prepSec > 0) {
        state.status = 'prep';
        state.prepRemainingMs = settings.prepSec * 1000;
        state.prepEndAt = Date.now() + state.prepRemainingMs;
        if (settings.startBell) {
          const h = sound.bell(settings.bell, settings.prepSec, 1, false);
          if (h) scheduled.set('open', h);
        }
        renderChrome();
        persist();
        announce(`Settle in for ${settings.prepSec} seconds.`);
        return;
      }
      flare();
      startBurning();
      return;
    }
    if (state.status === 'paused') {
      holdAwake();
      startTicking();
      if (state.prepRemainingMs > 0) {
        state.status = 'prep';
        state.prepEndAt = Date.now() + state.prepRemainingMs;
        if (settings.startBell) {
          const h = sound.bell(settings.bell, state.prepRemainingMs / 1000, 1, false);
          if (h) scheduled.set('open', h);
        }
      } else {
        state.status = 'running';
        state.runAnchorTs = Date.now() - state.elapsedMs;
        if (settings.ambient !== 'off') sound.startRoom(settings.ambient);
        smoke.setEmit(true);
        serviceBells(state.elapsedMs);
      }
      renderChrome();
      persist();
      announce('Sit resumed.');
    }
  }

  function pauseSit() {
    if (!isSitting()) return;
    if (state.status === 'prep') {
      state.prepRemainingMs = currentPrepRemainingMs();
      state.prepEndAt = null;
    } else {
      state.elapsedMs = currentElapsedMs();
      state.runAnchorTs = null;
    }
    stopTicking();
    cancelScheduled();
    sound.stopRoom();
    smoke.setEmit(false);
    releaseAwake();
    state.status = 'paused';
    renderChrome();
    persist();
    announce('Sit paused.');
  }

  function resetSit(message = 'A new stick is set.') {
    stopTicking();
    cancelScheduled();
    sound.stopRoom();
    smoke.setEmit(false);
    releaseAwake();
    state.status = 'idle';
    state.prepRemainingMs = 0;
    state.prepEndAt = null;
    state.elapsedMs = 0;
    state.runAnchorTs = null;
    state.startedAt = null;
    state.bellCursorMs = 0;
    geo.stickIndex = -1;
    geo.ashFrom = null;
    renderChrome();
    persist();
    announce(message);
  }

  function endSit() {
    if (state.status === 'running') state.elapsedMs = currentElapsedMs();
    if (state.status === 'prep' || (state.status === 'paused' && state.prepRemainingMs > 0)) {
      resetSit('Sit ended before it started.');
      return;
    }
    finishSit();
  }

  function primaryAction() {
    if (isSitting()) pauseSit();
    else if (state.status === 'complete') resetSit();
    else beginSit();
  }

  function setDuration(minutes) {
    if (state.status !== 'idle' && state.status !== 'complete') return;
    state.durationMin = minutes;
    if (state.status === 'complete') {
      resetSit();
      return;
    }
    geo.stickIndex = -1;
    renderChrome();
    persist();
  }

  // Bells changed mid-sit: drop what was scheduled and let the next tick redo it.
  function rescheduleBells() {
    cancelFuture();
    if (state.status === 'running') serviceBells(currentElapsedMs());
  }

  function resync() {
    if (!isSitting()) return;
    tick();
    if (state.status !== 'running') return;
    cancelFuture();
    serviceBells(currentElapsedMs());
  }

  // ── Events ──────────────────────────────────────────────

  function bindSeg(cls, key, onPick) {
    const buttons = all(cls);
    buttons.forEach((btn) => btn.addEventListener('click', () => onPick(btn.dataset[key])));
    return (value) => buttons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset[key] === String(value))));
  }

  function changeSetting(key, value) {
    settings[key] = value;
    renderChrome();
    persist();
  }

  segs.min = bindSeg('pick-min', 'min', (v) => setDuration(Number(v)));
  segs.incense = bindSeg('pick-incense', 'incense', (v) => changeSetting('incense', v));
  segs.prep = bindSeg('pick-prep', 'prep', (v) => changeSetting('prepSec', Number(v)));
  segs.bell = bindSeg('pick-bell', 'bell', (v) => {
    changeSetting('bell', v);
    rescheduleBells();
    sound.bell(v, 0, 1, false);
  });
  segs.start = bindSeg('pick-start', 'start', (v) => changeSetting('startBell', v === '1'));
  segs.end = bindSeg('pick-end', 'end', (v) => {
    changeSetting('endBells', Number(v) === 1 ? 1 : 3);
    rescheduleBells();
  });
  segs.interval = bindSeg('pick-interval', 'interval', (v) => {
    changeSetting('intervalMode', v);
    rescheduleBells();
  });
  segs.ambient = bindSeg('pick-ambient', 'ambient', (v) => {
    changeSetting('ambient', v);
    if (state.status !== 'running') return;
    if (v === 'off') sound.stopRoom();
    else sound.startRoom(v);
  });

  els.len.addEventListener('input', () => setDuration(clampMinutes(els.len.value)));

  els.volume.addEventListener('input', () => {
    settings.volume = Math.max(0, Math.min(100, Number(els.volume.value) || 0));
    els.volumeOut.textContent = `${settings.volume}%`;
    sound.setLevel(settings.sound, settings.volume);
    persist();
  });

  function toggleSound() {
    settings.sound = !settings.sound;
    sound.setLevel(settings.sound, settings.volume);
    renderChrome();
    persist();
    announce(settings.sound ? 'Sound on.' : 'Sound off.');
  }

  // Ending a sit and clearing the log both ask twice.
  function armable(btn, idleText, armedText, hint, action) {
    let timer = 0;
    const disarm = () => {
      clearTimeout(timer);
      btn.classList.remove('armed');
      btn.textContent = idleText;
    };
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('armed')) {
        btn.classList.add('armed');
        btn.textContent = armedText;
        announce(hint);
        timer = setTimeout(disarm, 3500);
        return;
      }
      disarm();
      action();
    });
  }

  els.toggleBtn.addEventListener('click', primaryAction);
  els.light.addEventListener('click', () => {
    if (state.status === 'idle' || state.status === 'complete') primaryAction();
    // Hand focus back to the page, so Space pauses instead of pressing the stick again.
    els.light.blur();
  });
  armable(els.endBtn, 'End sit', 'End now?', 'Press again to end the sit.', endSit);
  armable(els.clearBtn, 'Clear log', 'Clear every sit?', 'Press again to clear the log.', () => {
    sessions = [];
    renderLog();
    persist();
    announce('Log cleared.');
  });
  els.soundBtn.addEventListener('click', toggleSound);
  els.incenseBtn.addEventListener('click', () => showPanel(openPanel === 'incense' ? null : 'incense'));
  els.bellBtn.addEventListener('click', () => showPanel(openPanel === 'bell' ? null : 'bell'));
  els.logBtn.addEventListener('click', () => showPanel(openPanel === 'log' ? null : 'log'));

  els.noteInput.addEventListener('input', () => {
    const last = sessions[sessions.length - 1];
    if (!last) return;
    last.note = els.noteInput.value.trim();
    const first = els.logList.querySelector('.log-note');
    if (first) first.textContent = last.note || (last.open ? 'Open sit' : '');
    persist();
  });

  els.stage.addEventListener('pointerdown', () => {
    if (openPanel) showPanel(null);
  });

  let lastPointer = null;
  document.addEventListener('pointermove', (e) => {
    wake();
    const now = clock();
    const x = e.clientX - ((window.innerWidth || 0) - geo.canvasW) / 2;
    const y = e.clientY;
    if (lastPointer && now - lastPointer.t < 120 && now > lastPointer.t) {
      const dt = (now - lastPointer.t) / 1000;
      const clamp = (v) => Math.max(-700, Math.min(700, v));
      smoke.pointer(x, y, clamp((x - lastPointer.x) / dt), clamp((y - lastPointer.y) / dt));
    }
    lastPointer = { x, y, t: now };
  });
  document.addEventListener('pointerdown', wake);
  document.addEventListener('focusin', wake);

  document.addEventListener('keydown', (e) => {
    wake();
    if (e.key === 'Escape') {
      if (openPanel) showPanel(null);
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target && e.target.tagName;
    // Space and letters belong to whatever control has focus.
    if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'A' || tag === 'SUMMARY') return;
    if (e.code === 'Space') {
      e.preventDefault();
      primaryAction();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleSound();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      persist();
      return;
    }
    if (isSitting()) {
      holdAwake();
      sound.ensure();
      resync();
      smoke.kick();
    }
  });

  window.addEventListener('resize', layout);
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);

  const themeBtn = document.querySelector('.theme-control');
  if (themeBtn) themeBtn.addEventListener('click', () => setTimeout(readSmokeStyle, 0));

  setInterval(() => {
    if (state.status === 'idle') renderStatus();
  }, 20_000);

  // ── Restore ─────────────────────────────────────────────

  function armAudioUnlock() {
    const unlock = () => {
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
      sound.ensure();
      if (state.status === 'running' && settings.ambient !== 'off' && !sound.room) sound.startRoom(settings.ambient);
      resync();
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);
  }

  function resumeRunning(anchor, elapsed, startedAt) {
    state.status = 'running';
    state.runAnchorTs = anchor;
    state.elapsedMs = elapsed;
    state.startedAt = startedAt;
    state.bellCursorMs = elapsed;
    renderBurn();
    smoke.setEmit(true, true);
    armAudioUnlock();
    holdAwake();
    startTicking();
  }

  function restoreTimer() {
    const t = saved?.timer;
    if (!t || typeof t !== 'object') return;
    if (Number.isInteger(t.durationMin) && t.durationMin >= 0) state.durationMin = Math.min(MAX_MIN, t.durationMin);
    const goal = goalMs();
    const now = Date.now();
    const startedAt = typeof t.startedAt === 'number' ? t.startedAt : null;

    if (t.status === 'complete') {
      if (Number(t.elapsedMs) >= MIN_LOG_MS && (startedAt === null || now - startedAt < MAX_RESTORE_OVERDUE_MS)) {
        state.status = 'complete';
        state.elapsedMs = Number(t.elapsedMs);
        state.lastMinutes = Math.max(1, Math.round(state.elapsedMs / 60_000));
      }
      return;
    }

    if (t.status === 'paused') {
      const remPrep = Math.max(0, Number(t.prepRemainingMs) || 0);
      const elapsed = Math.max(0, Number(t.elapsedMs) || 0);
      if (remPrep > 0 || elapsed > 0) {
        state.status = 'paused';
        state.prepRemainingMs = elapsed > 0 ? 0 : remPrep;
        state.elapsedMs = goal > 0 ? Math.min(goal, elapsed) : elapsed;
        state.bellCursorMs = state.elapsedMs;
        state.startedAt = startedAt;
      }
      return;
    }

    let anchor = null;
    if (t.status === 'prep') {
      const prepEndAt = typeof t.prepEndAt === 'number' ? t.prepEndAt : null;
      if (prepEndAt === null) return;
      if (prepEndAt > now) {
        state.status = 'prep';
        state.prepEndAt = prepEndAt;
        state.prepRemainingMs = prepEndAt - now;
        state.startedAt = startedAt ?? now;
        armAudioUnlock();
        holdAwake();
        startTicking();
        return;
      }
      anchor = prepEndAt;
    } else if (t.status === 'running') {
      anchor = typeof t.runAnchorTs === 'number' ? t.runAnchorTs : now - Math.max(0, Number(t.elapsedMs) || 0);
    } else {
      return;
    }

    const elapsed = Math.max(0, now - anchor);
    if (goal > 0 && elapsed >= goal) {
      // It burned out while the page was closed. Log it for when it ended.
      if (elapsed - goal < MAX_RESTORE_OVERDUE_MS) {
        state.elapsedMs = goal;
        state.lastMinutes = recordSit(goal, anchor + goal);
        state.status = 'complete';
      }
      persist();
      return;
    }
    if (goal === 0 && elapsed > MAX_RESTORE_OPEN_MS) {
      persist();
      return;
    }
    resumeRunning(anchor, elapsed, startedAt ?? anchor);
  }

  readSmokeStyle();
  layout();
  restoreTimer();
  renderChrome();
  renderLog();
})(typeof window !== 'undefined' ? window : globalThis);
