// Run: node scripts/tools.test.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { runInNewContext } = require('node:vm');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8');
}

// 1. CSS & HTML structural checks
{
  const sharedCss = read('static/tools/shared.css');
  const blogCss = read('assets/blog/style.css');
  assert.match(blogCss, /max-width:\s*880px;/);
  assert.match(sharedCss, /max-width:\s*880px;/, 'tools shared.css body max-width should match main site (880px)');
  assert.match(sharedCss, /\.site-header\s*\{[\s\S]*?min-height:\s*112px;/, 'tools site-header height should match main site (112px)');
  assert.match(sharedCss, /@media\s*\(max-width:\s*600px\)/, 'tools shared.css mobile breakpoint should match 600px');

  const fastingCss = read('static/tools/fasting/fasting.css');
  assert.match(fastingCss, /\.preset-chip\s*\{[^}]*align-items:\s*center;/, 'fasting .preset-chip must align-items center');
  assert.doesNotMatch(fastingCss, /\.preset-chip\s*\{[^}]*align-items:\s*baseline;/);
  assert.match(fastingCss, /\.spotlight-card,\s*\.inspector-card\s*\{[^}]*max-width:\s*100%;/);
  assert.match(fastingCss, /\.benefits-section\s*\{[^}]*max-width:\s*100%;/);
  assert.match(fastingCss, /\.history-drawer\s*\{[^}]*max-width:\s*100%;/);
  assert.match(fastingCss, /\.hourly-item-tags\s*\{[^}]*margin:\s*6px 0 0;/);

  const breathingHtml = read('static/tools/breathing/index.html');
  assert.doesNotMatch(breathingHtml, /<span>4-7-8<\/span>\s*<small>4-7-8<\/small>/);
  assert.match(breathingHtml, /id="breath-core"[^>]*r="92"/);
  assert.match(breathingHtml, /class="dial-bezel-inner"[^>]*r="138"/);

  const fastingHtml = read('static/tools/fasting/index.html');
  assert.match(fastingHtml, /id="reset-now-quick-btn"/);
  assert.match(fastingHtml, /class="fast-toolbar"/);
}

// 2. Unit helper checks from tool modules
{
  const breathing = require(path.join(ROOT, 'static/tools/breathing/breathing.js'));
  assert.equal(breathing.getCycleDurationMs('box'), 16_000);
  assert.equal(breathing.getCycleDurationMs('478'), 19_000);
  assert.equal(breathing.getOrbRadius(0), 94);
  assert.equal(breathing.getOrbRadius(1), 138);
  assert.ok(breathing.getOrbRadius(0) > 92, 'breathing orb min radius must stay outside steady core circle (r=92)');

  const fasting = require(path.join(ROOT, 'static/tools/fasting/fasting.js'));
  assert.equal(fasting.formatGoalLabel(16 * 60), '16h');
  assert.equal(fasting.formatGoalLabel(16 * 60 + 30), '16h 30m');
  assert.equal(fasting.clampGoalMinutes(0, 10), 60);
  const prog = fasting.computeFastProgress(1_000_000, 16 * 60, 1_000_000 + 8 * 3_600_000);
  assert.equal(prog.pct, 50);
  assert.equal(prog.currentHour, 8);

  const meditation = require(path.join(ROOT, 'static/tools/meditation/meditation.js'));
  assert.equal(meditation.formatMinutes(65), '1 h 5 min');
  assert.equal(meditation.clampMinutes(500), 120);
  assert.equal(meditation.stickFraction(120), 1);
  assert.ok(meditation.stickFraction(5) < meditation.stickFraction(45));
  assert.deepEqual(
    meditation.bellEvents({ durationMin: 10, intervalMode: '5', endBells: 3 }, 0, 600_000).map((e) => [e.id, e.atMs, e.count]),
    [['int:300000', 300_000, 1], ['close', 600_000, 3]],
  );
  // Open sits have no closing bell. They ring when each 30 minute stick burns out.
  assert.deepEqual(
    meditation.bellEvents({ durationMin: 0, intervalMode: '10', endBells: 3 }, 1_200_000, 2_400_000).map((e) => e.id),
    ['stick:1800000', 'int:2400000'],
  );
  assert.deepEqual(meditation.bellEvents({ durationMin: 10, intervalMode: 'half', endBells: 1 }, 300_000, 480_000), []);
  // A sit logged yesterday and one today make a two day streak.
  assert.equal(meditation.computeStreakDays([{ day: '2026-11-16' }, { day: '2026-11-17' }], new Date(2026, 10, 17, 9)), 2);

  const converter = require(path.join(ROOT, 'static/tools/zenkaku-hankaku/converter.js'));
  assert.equal(converter.convertWidth('ＡＢＣ　１２３', converter.PRESETS.allHalf), 'ABC 123');
}

// 3. Minimal HTML-backed DOM mock for end-to-end persistence & reload checks
function parseAttrs(tagStr) {
  const attrs = {};
  const dataset = {};
  const re = /([a-zA-Z0-9_-]+)(?:="([^"]*)")?/g;
  let m;
  let first = true;
  while ((m = re.exec(tagStr))) {
    if (first) {
      first = false;
      continue;
    }
    const [, k, v = ''] = m;
    attrs[k] = v;
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
      dataset[camel] = v;
    }
  }
  return { attrs, dataset };
}

function makeElement(tagName, attrs = {}, dataset = {}) {
  const listeners = new Map();
  const classes = new Set((attrs.class || '').split(/\s+/).filter(Boolean));
  const children = [];
  const el = {
    tagName: tagName.toUpperCase(),
    id: attrs.id || '',
    attrs: { ...attrs },
    dataset: { ...dataset },
    style: { setProperty(k, v) { this[k] = v; } },
    value: attrs.value ?? '',
    checked: 'checked' in attrs,
    open: 'open' in attrs,
    hidden: 'hidden' in attrs,
    disabled: 'disabled' in attrs,
    tabIndex: 0,
    textContent: '',
    innerHTML: '',
    href: attrs.href || '',
    title: attrs.title || '',
    scrollTop: 0,
    children,
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      toggle: (x, force) => {
        if (force === undefined ? !classes.has(x) : Boolean(force)) {
          classes.add(x);
          return true;
        }
        classes.delete(x);
        return false;
      },
      contains: (x) => classes.has(x),
    },
    setAttribute(k, v) {
      this.attrs[k] = String(v);
      if (k === 'open') this.open = true;
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
        this.dataset[camel] = String(v);
      }
    },
    getAttribute(k) {
      return k in this.attrs ? this.attrs[k] : null;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const arr = listeners.get(type);
      if (arr) {
        const idx = arr.indexOf(fn);
        if (idx !== -1) arr.splice(idx, 1);
      }
    },
    dispatchEvent(evt) {
      const e = typeof evt === 'string' ? { type: evt, target: this, preventDefault() {} } : { target: this, preventDefault() {}, ...evt };
      for (const fn of [...(listeners.get(e.type) || [])]) fn(e);
    },
    click() {
      this.dispatchEvent({ type: 'click', target: this, preventDefault() {} });
    },
    focus() {},
    blur() {},
    showModal() { this.open = true; },
    close() { this.open = false; },
    append(...nodes) { children.push(...nodes); },
    appendChild(node) { children.push(node); return node; },
    replaceChildren(...nodes) { children.length = 0; children.push(...nodes); },
    querySelector(sel) {
      return queryFrom(children, sel)[0] || null;
    },
    querySelectorAll(sel) {
      return queryFrom(children, sel);
    },
    getBoundingClientRect() {
      return { top: 0, bottom: 200 };
    },
  };
  Object.defineProperty(el, 'className', {
    get: () => [...classes].join(' '),
    set: (val) => {
      classes.clear();
      String(val).split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
    },
  });
  return el;
}

function matchSelector(el, sel) {
  const s = sel.trim();
  if (s === '.advanced-rules') return el.classList.contains('advanced-rules');
  if (s === '.preset-btn') return el.classList.contains('preset-btn');
  if (s === '.seg[data-rule]') return el.classList.contains('seg') && 'rule' in el.dataset;
  if (s === '.phase-tabs [role="tab"]') return el.attrs.role === 'tab';
  if (s === '.pattern-tabs [role="tab"]') return el.attrs.role === 'tab';
  if (s === '.dur-chip[data-dur]') return el.classList.contains('dur-chip') && 'dur' in el.dataset;
  if (s === '.preset-chip[data-preset]') return el.classList.contains('preset-chip') && 'preset' in el.dataset;
  if (s === '.preset-chip[data-min]') return el.classList.contains('preset-chip') && 'min' in el.dataset;
  if (s === '.filter-chip[data-filter]') return el.classList.contains('filter-chip') && 'filter' in el.dataset;
  if (s === '.hourly-item') return el.classList.contains('hourly-item');
  if (s === '.phase-pill-fill') return el.classList.contains('phase-pill-fill');
  if (s === 'button') return el.tagName === 'BUTTON';
  if (s.startsWith('.')) return el.classList.contains(s.slice(1));
  if (s.startsWith('#')) return el.id === s.slice(1);
  return el.tagName.toLowerCase() === s.toLowerCase();
}

function queryFrom(list, sel) {
  const out = [];
  for (const el of list) {
    if (!el || typeof el !== 'object' || !el.classList) continue;
    if (matchSelector(el, sel)) out.push(el);
    if (el.children?.length) out.push(...queryFrom(el.children, sel));
  }
  return out;
}

function mountTool({ htmlPath, jsPath, storageMap = new Map(), nowMs = 1_760_000_000_000 }) {
  const html = read(htmlPath);
  const allEls = [];
  const byId = new Map();

  const tagRe = /<(div|section|details|summary|button|input|select|option|p|span|h1|h2|ul|ol|li|svg|circle|g|dialog|form|textarea|link|main|header|footer)\b([^>]*)>/gi;
  let m;
  let curSeg = null;
  while ((m = tagRe.exec(html))) {
    const [, rawTag, rawAttr] = m;
    const tag = rawTag.toLowerCase();
    const { attrs, dataset } = parseAttrs(`${tag} ${rawAttr}`);
    const el = makeElement(tag, attrs, dataset);
    allEls.push(el);
    if (el.id) byId.set(el.id, el);
    if (tag === 'div' && el.classList.contains('seg')) {
      curSeg = el;
    } else if (tag === 'button' && curSeg) {
      curSeg.appendChild(el);
    } else if (tag === 'select') {
      curSeg = el;
    }
  }
  // Connect <option> default values for quick <select>s
  for (const el of allEls) {
    if (el.tagName === 'SELECT' && !el.value) {
      if (el.id === 'quick-prep') el.value = '5';
      if (el.id === 'quick-interval') el.value = 'off';
    }
  }

  const docListeners = new Map();
  const winListeners = new Map();
  const document = {
    title: '',
    hidden: false,
    body: makeElement('body'),
    documentElement: { dataset: {}, style: { setProperty(k, v) { this[k] = v; } } },
    getElementById: (id) => byId.get(id) || makeElement('div', { id }),
    querySelector: (sel) => queryFrom(allEls, sel)[0] || null,
    querySelectorAll: (sel) => queryFrom(allEls, sel),
    createElement: (tag) => makeElement(tag),
    createElementNS: (_, tag) => makeElement(tag),
    createDocumentFragment: () => makeElement('fragment'),
    createTextNode: (t) => ({ textContent: String(t) }),
    addEventListener: (t, fn) => {
      if (!docListeners.has(t)) docListeners.set(t, []);
      docListeners.get(t).push(fn);
    },
    removeEventListener: (t, fn) => {
      const a = docListeners.get(t);
      if (a && a.includes(fn)) a.splice(a.indexOf(fn), 1);
    },
    dispatchEvent: (e) => {
      const type = typeof e === 'string' ? e : e.type;
      for (const fn of [...(docListeners.get(type) || [])]) fn(typeof e === 'string' ? { type, target: document, key: '' } : e);
    },
  };

  let clock = nowMs;
  class FakeDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock]));
    }
    static now() { return clock; }
  }

  const localStorage = {
    getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => { storageMap.set(k, String(v)); },
    removeItem: (k) => { storageMap.delete(k); },
  };

  const window = {
    location: { protocol: 'http:' },
    localStorage,
    confirm: () => true,
    matchMedia: () => ({ matches: false }),
    addEventListener: (t, fn) => {
      if (!winListeners.has(t)) winListeners.set(t, []);
      winListeners.get(t).push(fn);
    },
    dispatchEvent: (e) => {
      const type = typeof e === 'string' ? e : e.type;
      for (const fn of [...(winListeners.get(type) || [])]) fn({ type });
    },
  };
  Object.assign(window, { window });

  let nextId = 1;
  const ctx = {
    window,
    globalThis: window,
    document,
    localStorage,
    Date: FakeDate,
    navigator: {},
    AudioContext: class {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
      }
      createGain() {
        return { gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} };
      }
      createOscillator() {
        return { frequency: { setValueAtTime() {}, value: 440 }, type: 'sine', connect() {}, start() {}, stop() {} };
      }
      createBiquadFilter() { return { type: 'lowpass', frequency: { value: 1000 }, Q: { value: 1 }, connect() {} }; }
      createBuffer(_, len) { return { getChannelData: () => new Float32Array(len) }; }
      createBufferSource() { return { buffer: null, loop: false, connect() {}, start() {}, stop() {} }; }
      resume() {}
    },
    requestAnimationFrame: () => nextId++,
    cancelAnimationFrame: () => {},
    setInterval: () => nextId++,
    clearInterval: () => {},
    setTimeout: () => nextId++,
    clearTimeout: () => {},
    Math, Number, String, Boolean, Array, Object, Set, Map, JSON, RegExp, Error, URL, encodeURIComponent, TextEncoder, Buffer,
  };

  runInNewContext(read(jsPath), ctx);

  return {
    el: (id) => byId.get(id),
    queryAll: (sel) => queryFrom(allEls, sel),
    query: (sel) => queryFrom(allEls, sel)[0],
    document,
    window,
    storageMap,
    advanceClock: (ms) => { clock += ms; },
  };
}

// 4. Breathing persistence across reload (pattern, custom dur, sound mute, history open, active timer)
{
  const storage = new Map();
  let app = mountTool({ htmlPath: 'static/tools/breathing/index.html', jsPath: 'static/tools/breathing/breathing.js', storageMap: storage, nowMs: 1_760_000_000_000 });
  app.queryAll('.pattern-tabs [role="tab"]').find((b) => b.dataset.pattern === '478').click();
  app.el('custom-dur-btn').click();
  assert.equal(app.el('custom-dur-wrap').hidden, false);
  app.el('custom-dur-input').value = '7';
  app.el('custom-dur-apply').click();
  assert.equal(app.el('custom-dur-wrap').hidden, true, 'Set should close custom duration editor');
  app.el('sound-quick-btn').click();
  app.el('history-drawer').open = true;
  app.el('history-drawer').dispatchEvent('toggle');
  app.el('toggle-btn').click(); // start (prep default 0 -> running immediately)

  // Reload 4s later -> running session should continue accurately at 06:56 left!
  let reloaded = mountTool({ htmlPath: 'static/tools/breathing/index.html', jsPath: 'static/tools/breathing/breathing.js', storageMap: storage, nowMs: 1_760_000_004_000 });
  assert.equal(reloaded.document.body.dataset.pattern, '478');
  assert.equal(reloaded.document.body.dataset.state, 'running');
  assert.equal(reloaded.el('custom-dur-btn').textContent, 'Custom (7m)');
  assert.equal(reloaded.el('sound-quick-btn').textContent, 'Sound: Off');
  assert.equal(reloaded.el('history-drawer').open, true);
  assert.equal(reloaded.el('session-line').textContent, '06:56 left');

  // Toggle sound back on and verify cueBeforeMute preference kept custom sound or tones
  reloaded.el('sound-quick-btn').click();
  assert.equal(reloaded.el('sound-quick-btn').textContent, 'Sound: On');
}

// 5. Fasting persistence across reload (goal, custom closed on apply, filter, inspectedHour, historyOpen, active fast)
{
  const storage = new Map();
  const app = mountTool({ htmlPath: 'static/tools/fasting/index.html', jsPath: 'static/tools/fasting/fasting.js', storageMap: storage, nowMs: 1_760_000_000_000 });
  app.el('custom-goal-btn').click();
  assert.equal(app.el('custom-goal-panel').hidden, false);
  app.el('custom-hours').value = '19';
  app.el('custom-minutes').value = '30';
  app.el('apply-custom-btn').click();
  assert.equal(app.el('custom-goal-panel').hidden, true, 'Set goal should close custom goal panel');

  app.queryAll('.filter-chip[data-filter]').find((c) => c.dataset.filter === '12-23').click();
  app.el('shift-minus-1h').click();
  assert.equal(app.el('reset-now-quick-btn').hidden, false);
  app.el('history-drawer').open = true;
  app.el('history-drawer').dispatchEvent('toggle');
  app.el('toggle-btn').click(); // start fast -> jumps inspector to current hour (Hour 1)
  assert.equal(app.el('insp-badge').textContent, 'Hour 1');
  app.el('next-hour-btn').click(); // inspect Hour 2 while fasting

  const reloaded = mountTool({ htmlPath: 'static/tools/fasting/index.html', jsPath: 'static/tools/fasting/fasting.js', storageMap: storage, nowMs: 1_760_000_060_000 });
  assert.equal(reloaded.document.body.dataset.state, 'running');
  assert.equal(reloaded.el('custom-goal-btn').textContent, 'Custom (19h 30m)');
  assert.equal(reloaded.el('custom-goal-panel').hidden, true);
  assert.equal(reloaded.queryAll('.filter-chip[data-filter]').find((c) => c.dataset.filter === '12-23').getAttribute('aria-pressed'), 'true');
  assert.equal(reloaded.el('insp-badge').textContent, 'Hour 2');
  assert.equal(reloaded.el('history-drawer').open, true);
}

// 6. Meditation persistence across reload (stick length, incense, paused sit, logged sit and its note)
{
  const storage = new Map();
  const start = new Date(2026, 10, 17, 23, 50, 0).getTime();
  const app = mountTool({ htmlPath: 'static/tools/meditation/index.html', jsPath: 'static/tools/meditation/meditation.js', storageMap: storage, nowMs: start });
  app.el('len').value = '18';
  app.el('len').dispatchEvent('input');
  app.queryAll('.pick-incense').find((b) => b.dataset.incense === 'hinoki').click();
  app.el('toggle-btn').click(); // light an 18 minute stick
  assert.equal(app.document.body.dataset.state, 'running');
  assert.equal(app.el('incense-btn').hidden, true, 'the stick cannot be swapped while it burns');
  app.advanceClock(12_000);
  app.el('toggle-btn').click(); // pause after 12s

  const paused = mountTool({ htmlPath: 'static/tools/meditation/index.html', jsPath: 'static/tools/meditation/meditation.js', storageMap: storage, nowMs: start + 20_000 });
  assert.equal(paused.document.body.dataset.state, 'paused');
  assert.equal(paused.document.body.dataset.incense, 'hinoki');
  assert.equal(paused.el('status').textContent, 'Paused · 18 min left');
  paused.el('toggle-btn').click(); // resume

  // Reopened after midnight, long after the stick burned out: logged for the day it ended.
  const done = mountTool({ htmlPath: 'static/tools/meditation/index.html', jsPath: 'static/tools/meditation/meditation.js', storageMap: storage, nowMs: start + 60 * 60_000 });
  assert.equal(done.document.body.dataset.state, 'complete');
  assert.equal(done.el('status').textContent, 'Sat 18 min');
  done.el('note-input').value = 'Breath counting';
  done.el('note-input').dispatchEvent('input');
  const stored = JSON.parse(storage.get('memo-tools-meditation-v1'));
  assert.equal(stored.sessions.length, 1);
  assert.equal(stored.sessions[0].day, '2026-11-18');
  assert.equal(stored.sessions[0].time, '00:08');
  assert.equal(stored.sessions[0].note, 'Breath counting');
}

// 7. Pomodoro persistence across midnight reload
{
  const storage = new Map();
  const preMidnight = new Date(2026, 10, 14, 23, 55, 0).getTime();
  const postMidnight = new Date(2026, 10, 15, 0, 5, 0).getTime();
  const app = mountTool({ htmlPath: 'static/tools/pomodoro/index.html', jsPath: 'static/tools/pomodoro/pomodoro.js', storageMap: storage, nowMs: preMidnight });
  app.el('intention').value = 'Ship tools fixes';
  app.el('intention').dispatchEvent('input');
  app.el('start-btn').click(); // start 25m focus

  const reloaded = mountTool({ htmlPath: 'static/tools/pomodoro/index.html', jsPath: 'static/tools/pomodoro/pomodoro.js', storageMap: storage, nowMs: postMidnight });
  assert.equal(reloaded.document.body.dataset.state, 'running', 'active pomodoro timer must survive reload across midnight');
  assert.equal(reloaded.el('time').textContent, '15:00');
  assert.equal(reloaded.el('status').textContent, 'until 00:20');
  assert.equal(reloaded.el('intention').value, 'Ship tools fixes');
}

// 7b. A pomodoro that ran out while the page was closed is still logged, with its real times
{
  const storage = new Map();
  const started = new Date(2026, 10, 14, 10, 0, 0).getTime();
  const app = mountTool({ htmlPath: 'static/tools/pomodoro/index.html', jsPath: 'static/tools/pomodoro/pomodoro.js', storageMap: storage, nowMs: started });
  app.el('intention').value = 'Write the post';
  app.el('intention').dispatchEvent('input');
  app.el('start-btn').click();

  const later = mountTool({ htmlPath: 'static/tools/pomodoro/index.html', jsPath: 'static/tools/pomodoro/pomodoro.js', storageMap: storage, nowMs: started + 40 * 60_000 });
  assert.equal(later.document.body.dataset.state, 'complete');
  assert.equal(later.el('phase').textContent, 'done. short break next');
  assert.equal(later.el('log-btn').textContent, '1 session · 25m');
  const stored = JSON.parse(storage.get('memo-tools-pomodoro-v1'));
  assert.equal(stored.sessions.length, 1);
  assert.equal(stored.sessions[0].start, '10:00');
  assert.equal(stored.sessions[0].end, '10:25');
  assert.equal(stored.sessions[0].note, 'Write the post');
  assert.equal(stored.cycleCount, 1);
}

// 8. Zenkaku-Hankaku converter persistence (input text, rules, inspect mode, advanced open)
{
  const storage = new Map();
  const app = mountTool({ htmlPath: 'static/tools/zenkaku-hankaku/index.html', jsPath: 'static/tools/zenkaku-hankaku/converter.js', storageMap: storage });
  app.el('input-text').value = 'Ｈｅｌｌｏ　１２３';
  app.el('input-text').dispatchEvent('input');
  app.el('inspect-btn').click();
  const adv = app.query('.advanced-rules');
  adv.open = true;
  adv.dispatchEvent('toggle');

  const reloaded = mountTool({ htmlPath: 'static/tools/zenkaku-hankaku/index.html', jsPath: 'static/tools/zenkaku-hankaku/converter.js', storageMap: storage });
  assert.equal(reloaded.el('input-text').value, 'Ｈｅｌｌｏ　１２３');
  assert.equal(reloaded.el('output-text').value, 'Hello 123');
  assert.equal(reloaded.el('inspect-btn').getAttribute('aria-pressed'), 'true');
  assert.equal(reloaded.query('.advanced-rules').open, true);
}

console.log('Tools layout specs, math helpers, and localStorage persistence checks passed across all 5 tools.');
