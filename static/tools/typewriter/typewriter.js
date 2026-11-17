(() => {
  const STORAGE_KEY = 'memo-tools-typewriter-v1';
  const SENTINEL = '​';
  const BELL_ZONE = 7; // columns before the right margin where the bell rings

  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;
  const stage = $('stage');
  const scene = $('scene');
  const linesEl = $('lines');
  const headPos = $('head-pos');
  const head = $('head');
  const led = $('led');
  const beamPos = $('beam-pos');
  const beamAim = $('beam-aim');
  const beam = $('beam');
  const input = $('input');
  const probe = $('probe');
  const countEl = $('count');
  const live = $('live');
  const soundBtn = $('sound-btn');
  const copyBtn = $('copy-btn');
  const saveBtn = $('save-btn');
  const newBtn = $('new-btn');
  const prefsBtn = $('prefs-btn');
  const prefs = $('prefs');
  const kelvinEl = $('kelvin');
  const kelvinOut = $('kelvin-out');
  const papers = $('papers');

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  let text = '';
  let soundOn = true;
  let kelvin = 3400;
  let paper = 'bond';
  let ch = 14;
  let lh = 40;
  let cols = 48;
  let visible = 12;
  let state = { paras: 1, last: 1, w: 0, x: 0 };
  let composing = false;
  let pendingEl = null;
  const lineEls = new Map();

  /* ── Sound ─────────────────────────────────────────────
     Everything is synthesized: filtered noise for the clack of the typebar,
     a short sine drop for the platen, sine partials for the bell. */

  const snd = (() => {
    let ac = null;
    let out = null;
    let noise = null;
    // Band-passed noise loses most of its energy in the filter, so it gets its own makeup gain.
    const NOISE_GAIN = 2.8;

    function ctx() {
      if (!soundOn) return null;
      if (ac) {
        if (ac.state === 'suspended') ac.resume();
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

      // A small room, so the machine sits on a desk instead of inside your head.
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

    function bus(pan, panTo, dur) {
      if (!ac.createStereoPanner) return out;
      const p = ac.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      if (panTo != null) {
        p.pan.setValueAtTime(clamp(pan, -1, 1), ac.currentTime);
        p.pan.linearRampToValueAtTime(clamp(panTo, -1, 1), ac.currentTime + dur);
      }
      p.connect(out);
      return p;
    }

    function env(g, t, peak, a, d) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }

    function hit(t, to, o) {
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
      g.connect(to);
      src.start(t, Math.random() * 1.2);
      src.stop(t + a + o.d + 0.03);
    }

    function tone(t, to, o) {
      const osc = ac.createOscillator();
      osc.type = o.type || 'sine';
      osc.frequency.setValueAtTime(o.f, t);
      if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.d);
      const g = ac.createGain();
      const a = o.a == null ? 0.001 : o.a;
      env(g, t, o.g, a, o.d);
      osc.connect(g);
      g.connect(to);
      osc.start(t);
      osc.stop(t + a + o.d + 0.03);
    }

    function ratchet(t, to, gain) {
      hit(t, to, { f: 3100 + Math.random() * 500, q: 5, g: gain, d: 0.012 });
      hit(t, to, { f: 950, q: 2, g: gain * 0.7, d: 0.02 });
    }

    return {
      wake() { ctx(); },

      strike(pan, code) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        const to = bus(pan);
        // Each typebar has its own voice, plus a little variation per stroke.
        const key = 0.9 + ((code || 0) % 9) * 0.022;
        const det = key * (0.97 + Math.random() * 0.06);
        const v = 0.82 + Math.random() * 0.3;
        hit(t, to, { f: 2500 * det, q: 0.9, g: 1.35 * v, a: 0.001, d: 0.055 });
        hit(t, to, { type: 'highpass', f: 6200, q: 0.7, g: 0.2 * v, a: 0.0005, d: 0.014 });
        hit(t, to, { f: 880 * det, q: 2.6, g: 0.6 * v, d: 0.07 });
        hit(t, to, { f: 3900 * det, q: 16, g: 0.3 * v, d: 0.11 });
        tone(t, to, { f: 185 * det, f2: 82, g: 0.8 * v, d: 0.08 });
        // typebar falling back into the basket
        hit(t + 0.052 + Math.random() * 0.014, to, { f: 1650 * det, q: 2.2, g: 0.07, d: 0.022 });
      },

      space(pan) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        const to = bus(pan);
        const v = 0.85 + Math.random() * 0.25;
        hit(t, to, { f: 640, q: 1.3, g: 0.6 * v, d: 0.08 });
        hit(t, to, { f: 1900, q: 1.5, g: 0.16 * v, d: 0.03 });
        tone(t, to, { f: 140, f2: 68, g: 0.5 * v, d: 0.1 });
        hit(t + 0.06, to, { f: 1200, q: 2, g: 0.05, d: 0.02 });
      },

      back(pan) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        const to = bus(pan);
        hit(t, to, { f: 1500, q: 1.4, g: 0.3, d: 0.03 });
        hit(t, to, { type: 'highpass', f: 5200, q: 0.7, g: 0.08, d: 0.012 });
        tone(t, to, { f: 165, f2: 95, g: 0.26, d: 0.06 });
        ratchet(t + 0.028, to, 0.07);
      },

      dud() {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        tone(t, out, { f: 120, f2: 70, g: 0.2, d: 0.07 });
        hit(t, out, { f: 500, q: 1, g: 0.12, d: 0.04 });
      },

      release(pan) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        const to = bus(pan);
        hit(t, to, { f: 1300, q: 1.6, g: 0.035, d: 0.016 });
        hit(t, to, { type: 'highpass', f: 4500, q: 0.7, g: 0.02, d: 0.01 });
      },

      shift(down) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        tone(t, out, { f: down ? 105 : 130, f2: 62, g: down ? 0.26 : 0.14, d: 0.1 });
        hit(t, out, { f: down ? 560 : 800, q: 1.2, g: down ? 0.16 : 0.08, d: 0.05 });
      },

      bell(pan) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        const to = bus(pan * 0.5);
        const f = 2640;
        tone(t, to, { f, g: 0.24, d: 1.7 });
        tone(t, to, { f: f * 2.76, g: 0.06, d: 0.75 });
        tone(t, to, { f: f * 5.4, g: 0.025, d: 0.3 });
        tone(t, to, { f: f / 2, g: 0.04, d: 0.9 });
        hit(t, to, { f: 5200, q: 2, g: 0.1, d: 0.02 });
      },

      feed(pan, n) {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        const to = bus(pan);
        for (let i = 0; i < n; i++) ratchet(t + i * 0.042, to, 0.13);
      },

      // Line feed, then the carriage runs back along the rail and hits its stop.
      carriage(panFrom, panTo, ms, delay) {
        if (!ctx()) return;
        const dur = ms / 1000;
        const t = ac.currentTime + 0.001 + (delay || 0);
        const to = bus(panFrom, panTo, dur + (delay || 0));
        ratchet(t, to, 0.14);
        ratchet(t + 0.04, to, 0.12);
        const n = Math.max(3, Math.round(dur / 0.019));
        for (let i = 1; i <= n; i++) {
          const u = i / (n + 1);
          ratchet(t + 0.03 + dur * u + (Math.random() - 0.5) * 0.004, to, 0.05 + 0.05 * Math.sin(Math.PI * u));
        }
        hit(t, to, { type: 'lowpass', f: 520, q: 0.7, g: 0.1, a: dur * 0.35, d: dur * 0.75 });
        const end = t + dur;
        tone(end, to, { f: 132, f2: 58, g: 0.3, d: 0.15 });
        hit(end, to, { f: 430, q: 1, g: 0.18, d: 0.09 });
        hit(end, to, { f: 2300, q: 1.4, g: 0.14, d: 0.03 });
      },

      // Pulling the sheet out of the platen.
      pull() {
        if (!ctx()) return;
        const t = ac.currentTime + 0.001;
        for (let i = 0; i < 16; i++) ratchet(t + i * 0.021 + i * i * 0.0006, out, 0.09);
        hit(t, out, { type: 'highpass', f: 2600, q: 0.6, g: 0.1, a: 0.18, d: 0.3 });
      },
    };
  })();

  /* ── Layout ────────────────────────────────────────────── */

  const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/;
  const cw = (c) => (c.length > 1 || WIDE.test(c) ? 2 : 1);
  const widthOf = (chars) => chars.reduce((n, c) => n + cw(c), 0);

  // Break like a typist: after the bell, the next space returns the carriage.
  // A word that still runs into the margin is carried to the next line.
  function wrap(para) {
    const out = [];
    let line = [];
    let w = 0;
    let lastSpace = -1;
    for (const c of para) {
      const k = cw(c);
      if (c === ' ' && w > 0 && w >= cols - BELL_ZONE) {
        out.push(line);
        line = [];
        w = 0;
        lastSpace = -1;
        continue;
      }
      if (w + k > cols) {
        if (lastSpace >= 0) {
          const carry = line.slice(lastSpace + 1);
          out.push(line.slice(0, lastSpace));
          line = carry;
          w = widthOf(carry);
        } else {
          out.push(line);
          line = [];
          w = 0;
        }
        lastSpace = -1;
      }
      if (c === ' ') lastSpace = line.length;
      line.push(c);
      w += k;
    }
    out.push(line);
    return out;
  }

  function tail() {
    const paras = text.split('\n');
    const lines = [];
    let last = 1;
    for (let p = paras.length - 1; p >= 0 && lines.length < visible; p--) {
      const wrapped = wrap(paras[p]);
      if (p === paras.length - 1) last = wrapped.length;
      for (let i = wrapped.length - 1; i >= 0 && lines.length < visible; i--) {
        lines.unshift({ id: p + ':' + i, chars: wrapped[i] });
      }
    }
    return { lines, paras: paras.length, last };
  }

  function measure() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    root.style.setProperty('--stage-h', h + 'px');
    root.style.setProperty('--stage-top', (vv ? vv.offsetTop : 0) + 'px');
    ch = probe.getBoundingClientRect().width / probe.textContent.length;
    lh = parseFloat(getComputedStyle(stage).fontSize) * 1.72;
    cols = clamp(Math.floor(Math.min(window.innerWidth * 0.86, 1180) / ch), 14, 66);
    const railY = scene.offsetTop;
    visible = clamp(Math.ceil(railY / lh) + 1, 4, 16);
    root.style.setProperty('--ch', ch + 'px');
    root.style.setProperty('--cols', cols);
    root.style.setProperty('--n', visible);
  }

  /* ── Rendering ─────────────────────────────────────────── */

  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function rng(h) {
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  // No two strikes land the same: each letter keeps its own pressure and tilt.
  function glyph(c, id, i, strike) {
    const s = document.createElement('span');
    s.className = 'c' + (cw(c) === 2 ? ' w' : '') + (strike ? ' strike' : '');
    s.textContent = c;
    if (c !== ' ') {
      const r = rng(hash(id + '|' + i + c));
      s.style.opacity = (0.78 + r() * 0.22).toFixed(2);
      s.style.transform = `translateY(${((r() - 0.5) * 1.6).toFixed(2)}px) rotate(${((r() - 0.5) * 1.8).toFixed(2)}deg)`;
    }
    return s;
  }

  function syncLine(el, id, chars, animate) {
    const cur = el._chars || [];
    let k = 0;
    while (k < cur.length && k < chars.length && cur[k] === chars[k]) k++;
    while (el.childNodes.length > k) el.lastChild.remove();
    const strike = animate && chars.length - k <= 2;
    for (let i = k; i < chars.length; i++) el.appendChild(glyph(chars[i], id, i, strike));
    el._chars = chars;
  }

  function render(animate) {
    if (pendingEl) {
      pendingEl.remove();
      pendingEl = null;
    }
    const t = tail();
    const want = new Set(t.lines.map((l) => l.id));
    for (const [id, el] of lineEls) {
      if (!want.has(id)) {
        el.remove();
        lineEls.delete(id);
      }
    }
    t.lines.forEach((l, i) => {
      let el = lineEls.get(l.id);
      if (!el) {
        el = document.createElement('div');
        el.className = 'line';
        lineEls.set(l.id, el);
      }
      if (linesEl.children[i] !== el) linesEl.insertBefore(el, linesEl.children[i] || null);
      syncLine(el, l.id, l.chars, animate);
    });
    const w = widthOf(t.lines[t.lines.length - 1].chars);
    const x = (w - cols / 2 + 0.5) * ch;
    document.body.classList.toggle('has-text', text.length > 0);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    countEl.textContent = words + (words === 1 ? ' word' : ' words');
    return { paras: t.paras, last: t.last, w, x };
  }

  // The lamp leans toward the middle of the page: right at the left margin,
  // straight up in the centre, left at the right margin.
  const AIM_MAX = 13;

  function moveHead(x, ms, ease) {
    const still = reducedMotion.matches || ms === 0;
    if (ms == null) {
      headPos.style.transition = '';
      beamPos.style.transition = '';
      beamAim.style.transition = '';
    } else {
      headPos.style.transition = still ? 'none' : `transform ${ms}ms ${ease || 'linear'}`;
      beamPos.style.transition = still ? 'none' : `transform ${Math.round(ms * 1.25 + 90)}ms ${ease || 'linear'}`;
      beamAim.style.transition = still ? 'none' : `transform ${Math.round(ms * 1.6 + 260)}ms cubic-bezier(0.3, 0, 0.2, 1)`;
    }
    const aim = -clamp(x / (cols * ch / 2), -1, 1) * AIM_MAX;
    headPos.style.transform = `translateX(${x.toFixed(2)}px)`;
    beamPos.style.transform = `translateX(${x.toFixed(2)}px)`;
    beamAim.style.transform = `rotate(${aim.toFixed(2)}deg)`;
  }

  function feedPaper(dir) {
    if (reducedMotion.matches) return;
    linesEl.getAnimations().forEach((a) => a.cancel());
    linesEl.animate(
      [{ transform: `translateY(${dir * lh}px)` }, { transform: 'translateY(0)' }],
      { duration: 190, easing: 'cubic-bezier(0.3, 0.9, 0.3, 1)' }
    );
  }

  function kick() {
    led.classList.add('on');
    setTimeout(() => led.classList.remove('on'), 70);
    if (reducedMotion.matches) return;
    head.classList.remove('kick');
    void head.offsetWidth;
    head.classList.add('kick');
    // The lamp shakes a little with every blow.
    const a = (Math.random() < 0.5 ? -1 : 1) * (0.25 + Math.random() * 0.2);
    beam.animate(
      [
        { transform: 'rotate(0deg)', opacity: 1 },
        { transform: `rotate(${a}deg)`, opacity: 1, offset: 0.18 },
        { transform: `rotate(${-a * 0.45}deg)`, opacity: 0.985, offset: 0.5 },
        { transform: 'rotate(0deg)', opacity: 0.97 },
      ],
      { duration: 300, easing: 'ease-out' }
    );
  }

  const panAt = (w) => clamp((w / cols - 0.5) * 1.1, -0.7, 0.7);

  function update(reason) {
    const before = state;
    const now = render(reason !== 'resize' && reason !== 'load');
    state = now;

    if (reason === 'resize' || reason === 'load') {
      moveHead(now.x, 0);
      return;
    }

    const delta = now.paras !== before.paras ? Math.sign(now.paras - before.paras) : now.last - before.last;

    if (delta > 0) {
      const ms = clamp(150 + Math.abs(before.x - now.x) * 0.36, 170, 520);
      snd.carriage(panAt(before.w), panAt(now.w), ms, reason === 'enter' ? 0 : 0.05);
      feedPaper(1);
      moveHead(now.x, ms, 'cubic-bezier(0.45, 0, 0.2, 1)');
    } else if (delta < 0) {
      snd.feed(panAt(now.w), 2);
      feedPaper(-1);
      moveHead(now.x, 170, 'cubic-bezier(0.3, 0.8, 0.3, 1)');
    } else {
      moveHead(now.x, null);
      if (reason === 'char' && before.w < cols - BELL_ZONE && now.w >= cols - BELL_ZONE) snd.bell(panAt(now.w));
    }
    if (reason !== 'back') kick();
    persist();
  }

  /* ── Typing ────────────────────────────────────────────── */

  const clean = (s) => s
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/ /g, ' ')
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f​﻿]/g, '');

  let idleTimer = 0;
  function markTyping() {
    setPrefs(false);
    document.body.classList.add('typing');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.remove('typing'), 4000);
  }

  function type(raw) {
    const s = clean(raw);
    if (!s) return;
    const pan = panAt(state.w);
    text += s;
    markTyping();
    if (s === '\n') {
      update('enter');
    } else if (s.length <= 2 && Array.from(s).length === 1) {
      if (s === ' ') snd.space(pan);
      else snd.strike(pan, s.codePointAt(0));
      update('char');
    } else {
      const n = Math.min(5, s.length);
      for (let i = 0; i < n; i++) setTimeout(() => snd.strike(pan, 97 + i * 3), i * 38);
      update('paste');
    }
  }

  function backspace() {
    markTyping();
    if (!text) {
      snd.dud();
      return;
    }
    const code = text.charCodeAt(text.length - 1);
    const pair = code >= 0xdc00 && code <= 0xdfff && text.length > 1;
    text = text.slice(0, pair ? -2 : -1);
    snd.back(panAt(state.w));
    update('back');
  }

  function resetInput() {
    input.value = SENTINEL;
    try {
      input.setSelectionRange(1, 1);
    } catch { /* not focusable yet */ }
  }

  // The textarea only ever holds a sentinel, so every keyboard (hardware, touch,
  // IME, dead keys) reports its edits through the same input event.
  function flush() {
    const v = input.value;
    if (v.includes(SENTINEL)) {
      const added = v.replace(SENTINEL, '');
      if (added) type(added);
    } else if (v === '') {
      backspace();
    } else {
      // The sentinel was replaced (accent menu, autocorrect): swap the last letter.
      backspace();
      type(v);
    }
    resetInput();
  }

  function showPending(s) {
    if (pendingEl) pendingEl.remove();
    pendingEl = null;
    if (!s) return;
    pendingEl = document.createElement('span');
    pendingEl.className = 'pending';
    pendingEl.textContent = s;
    const lastLine = linesEl.lastElementChild;
    if (lastLine) lastLine.appendChild(pendingEl);
  }

  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => {
    composing = false;
    setTimeout(() => {
      showPending('');
      flush();
    }, 0);
  });
  input.addEventListener('input', () => {
    if (composing) {
      showPending(input.value.replace(SENTINEL, ''));
      return;
    }
    flush();
  });

  const HOLD = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']);
  input.addEventListener('keydown', (e) => {
    snd.wake();
    if (HOLD.has(e.key)) {
      e.preventDefault();
      return;
    }
    if (e.metaKey || e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        saveText();
      } else if (k === 'a' || k === 'z' || k === 'y') {
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'Shift' && !e.repeat) snd.shift(true);
  });
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') snd.shift(false);
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) snd.release(panAt(state.w));
  });

  // Any key typed while focus is elsewhere lands on the page.
  document.addEventListener('keydown', (e) => {
    if (e.target === input || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest('button, a') && (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab')) return;
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') input.focus({ preventScroll: true });
  });

  stage.addEventListener('pointerdown', (e) => {
    snd.wake();
    setPrefs(false);
    if (e.target !== input) e.preventDefault();
    input.focus({ preventScroll: true });
  });
  stage.addEventListener('click', () => input.focus({ preventScroll: true }));
  input.addEventListener('focus', resetInput);

  let moved = 0;
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    if (moved > 24) {
      moved = 0;
      document.body.classList.remove('typing');
    }
  });

  /* ── Chrome ────────────────────────────────────────────── */

  let saveTimer = 0;
  function persistNow() {
    clearTimeout(saveTimer);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ text, sound: soundOn, kelvin, paper }));
    } catch { /* storage blocked: the page still works for this visit */ }
  }
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persistNow, 300);
  }

  function say(msg) {
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  function flash(btn, label) {
    const old = btn.dataset.label || btn.textContent;
    btn.dataset.label = old;
    btn.textContent = label;
    say(label);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.textContent = old; }, 1400);
  }

  function refocus() {
    if (finePointer.matches) input.focus({ preventScroll: true });
  }

  function renderSound() {
    soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(soundOn));
  }

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    renderSound();
    if (soundOn) snd.bell(0);
    persistNow();
    refocus();
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      flash(copyBtn, 'Copied');
    } catch {
      flash(copyBtn, 'Copy failed');
    }
    refocus();
  });

  function saveText() {
    if (!text) return;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const name = `typewriter-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.txt`;
    const url = URL.createObjectURL(new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  saveBtn.addEventListener('click', () => {
    saveText();
    refocus();
  });

  let armTimer = 0;
  function disarm() {
    clearTimeout(armTimer);
    newBtn.classList.remove('armed');
    newBtn.textContent = 'New sheet';
  }

  newBtn.addEventListener('click', () => {
    if (!text) {
      refocus();
      return;
    }
    if (!newBtn.classList.contains('armed')) {
      newBtn.classList.add('armed');
      newBtn.textContent = 'Pull this sheet?';
      say('Press again to discard this sheet.');
      armTimer = setTimeout(disarm, 3500);
      return;
    }
    disarm();
    snd.pull();
    // The old sheet leaves as a ghost, so anything typed meanwhile lands on the new one.
    const ghost = reducedMotion.matches ? null : linesEl.cloneNode(true);
    text = '';
    linesEl.getAnimations().forEach((a) => a.cancel());
    update('back');
    moveHead(state.x, 320, 'cubic-bezier(0.45, 0, 0.2, 1)');
    persistNow();
    say('New sheet.');
    if (ghost) {
      ghost.removeAttribute('id');
      linesEl.parentNode.appendChild(ghost);
      const done = () => ghost.remove();
      ghost.animate(
        [{ transform: 'translateY(0)', opacity: 1 }, { transform: `translateY(${-lh * 5}px)`, opacity: 0 }],
        { duration: 420, easing: 'cubic-bezier(0.5, 0, 0.8, 0.4)', fill: 'forwards' }
      ).finished.then(done, done);
      setTimeout(done, 900);
    }
    refocus();
  });

  /* ── Light & paper ─────────────────────────────────────── */

  // Colour of a black body at a given temperature (Tanner Helland's fit), 0..1.
  function blackbody(k) {
    const t = k / 100;
    const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
    const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [r, g, b].map((v) => clamp(v, 0, 255) / 255);
  }

  // What that light looks like on white paper. The eye adapts to most of the
  // tint, so only part of it survives. Above candlelight, green keeps more than
  // blue, which pulls a warm lamp toward cream instead of orange, the way it
  // reads on a real sheet.
  const PAPER_WHITE = [255, 253, 248];
  function lampColor(k, strength) {
    const c = blackbody(k);
    c[2] = Math.max(c[2], 0.12);
    const m = Math.max(c[0], c[1], c[2]);
    const warm = clamp((3400 - k) / 1400, 0, 1);
    const depth = [0.3, 0.18 + 0.12 * warm, 0.3];
    return c.map((v, i) => Math.round(Math.pow(v / m, depth[i] * strength) * PAPER_WHITE[i]));
  }

  function applyLight(k) {
    kelvin = clamp(Math.round(k / 100) * 100, +kelvinEl.min, +kelvinEl.max);
    const glow = lampColor(kelvin, 1);
    const hot = glow.map((v) => Math.round(v + (255 - v) * 0.55));
    root.style.setProperty('--glow-rgb', glow.join(', '));
    root.style.setProperty('--hot-rgb', hot.join(', '));
    kelvinEl.value = kelvin;
    kelvinOut.textContent = kelvin + ' K';
  }

  const PAPERS = ['smooth', 'bond', 'laid', 'cotton'];
  function applyPaper(name) {
    paper = PAPERS.includes(name) ? name : 'bond';
    root.dataset.paper = paper;
    papers.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.paper === paper)));
  }

  function setPrefs(open) {
    if (prefs.hidden === !open) return;
    if (open) {
      // Sit just above the controls, however many rows they wrap to.
      const top = prefsBtn.parentElement.getBoundingClientRect().top;
      prefs.style.bottom = Math.round(window.innerHeight - top + 8) + 'px';
    }
    prefs.hidden = !open;
    prefsBtn.setAttribute('aria-expanded', String(open));
  }

  {
    const lo = +kelvinEl.min;
    const hi = +kelvinEl.max;
    const stops = [];
    for (let i = 0; i <= 8; i++) stops.push(`rgb(${lampColor(lo + ((hi - lo) * i) / 8, 2.4).join(', ')})`);
    kelvinEl.style.setProperty('--kelvin-track', `linear-gradient(90deg, ${stops.join(', ')})`);
  }

  prefsBtn.addEventListener('click', () => {
    setPrefs(prefs.hidden);
    if (!prefs.hidden) kelvinEl.focus({ preventScroll: true });
    else refocus();
  });
  kelvinEl.addEventListener('input', () => {
    applyLight(+kelvinEl.value);
    persist();
  });
  papers.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-paper]');
    if (!b) return;
    applyPaper(b.dataset.paper);
    persistNow();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !prefs.hidden) {
      setPrefs(false);
      refocus();
    }
  });

  /* ── Boot ──────────────────────────────────────────────── */

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.text === 'string') text = saved.text;
    if (saved && saved.sound === false) soundOn = false;
    if (saved && Number.isFinite(saved.kelvin)) kelvin = saved.kelvin;
    if (saved && typeof saved.paper === 'string') paper = saved.paper;
  } catch { /* start with a blank sheet */ }

  linesEl.addEventListener('animationend', (e) => {
    if (e.target.classList) e.target.classList.remove('strike');
  });
  head.addEventListener('animationend', (e) => {
    if (e.target === head) head.classList.remove('kick');
  });

  function relayout() {
    measure();
    update('resize');
  }

  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(relayout);
  };
  window.addEventListener('resize', onResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
    window.visualViewport.addEventListener('scroll', onResize);
  }
  window.addEventListener('pagehide', persistNow);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) persistNow();
  });

  renderSound();
  applyLight(kelvin);
  applyPaper(paper);
  measure();
  update('load');
  resetInput();
  if (finePointer.matches) input.focus({ preventScroll: true });
})();
