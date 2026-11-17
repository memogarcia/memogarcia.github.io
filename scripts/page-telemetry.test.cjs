const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const root = join(__dirname, '..');
const source = readFileSync(join(root, 'static/js/page-telemetry.js'), 'utf8');
function mount(options = {}) {
  let clock = 0, timer;
  const storage = options.storage || new Map();
  const listeners = {}, events = [], requests = [];
  const on = (name, callback) => { listeners[name] = callback; };
  const document = {
    currentScript: { dataset: options.post ? { section: 'posts', page: '/posts/example/' } : {} },
    visibilityState: 'visible', hasFocus: () => true, addEventListener: on,
  };
  const navigator = { sendBeacon: (url, body) => { events.push(JSON.parse(body)); return true; }, ...options.navigator };
  const context = { document, navigator, window: {},
    Date: { now: () => (options.now || 1800000000000) + clock },
    sessionStorage: options.blockStorage ? { getItem() { throw Error(); }, setItem() { throw Error(); } } : {
      getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value)
    },
    location: { origin: 'https://memo.mx', pathname: options.post ? '/posts/example/' : '/tools/typewriter/', search: '?private=text', hash: '#private', ...options.location },
    performance: { now: () => clock }, crypto: require('node:crypto'),
    addEventListener: on, setInterval: (fn) => { timer = fn; },
    fetch: (url, request) => { requests.push(request); return Promise.resolve(); },
  };
  runInNewContext(source, context);
  runInNewContext(source, context);
  return { events, requests, document, navigator, storage, advance: (ms) => { clock += ms; },
    fire: (name, event = {}) => listeners[name]?.(event), tick: () => timer?.() };
}
const app = mount();
assert.equal(app.events.length, 2, 'One view and initial snapshot despite double load');
assert.match(app.events[0].key, /^tel_pub_[a-f0-9]{64}$/);
const event = () => app.events.at(-1).events[0];
const initialSession = event().sessionID;
app.advance(30_000); app.tick();
assert.equal(event().properties.active_seconds, 30);
app.advance(60_000); app.tick();
assert.equal(event().properties.open_seconds, 90);
assert.equal(event().properties.active_seconds, 60, 'Idle time stops after a minute');
app.fire('keydown', { key: 'PRIVATE TEXT' });
app.advance(10_000); app.fire('blur');
assert.equal(event().properties.active_seconds, 70);
app.advance(30_000); app.tick();
assert.equal(event().properties.active_seconds, 70, 'Unfocused time is not active');
app.fire('focus'); app.advance(10_000);
app.document.visibilityState = 'hidden'; app.fire('visibilitychange');
app.advance(90_000); app.tick();
app.fire('pagehide');
assert.equal(event().properties.active_seconds, 80);
assert.equal(event().properties.open_seconds, 230);
assert.equal(event().properties.ended, true);
const count = app.events.length; app.fire('pagehide'); app.tick();
assert.equal(app.events.length, count, 'No duplicate end or heartbeat after pagehide');
app.document.visibilityState = 'visible'; app.fire('pageshow', { persisted: true });
assert.equal(event().sessionID, initialSession, 'BFCache restoration keeps the browsing session');
assert.equal(event().properties.visit_index, 2);
assert.equal(event().properties.open_seconds, 0);
assert.ok(!JSON.stringify(app.events).includes('PRIVATE'));
assert.ok(!JSON.stringify(app.events).includes('private'));
assert.equal(mount({ post: true }).events[0].events[0].properties.section, 'posts');
assert.equal(mount({ post: true, location: { pathname: '/posts/unlisted/' } }).events.length, 0);
assert.equal(mount({ location: { pathname: '/tools/unknown/' } }).events.length, 0);
assert.equal(mount({ location: { origin: 'http://localhost:8000' } }).events.length, 0);
for (const navigator of [{ doNotTrack: '1' }, { globalPrivacyControl: true }, { webdriver: true }]) {
  assert.equal(mount({ navigator }).events.length, 0);
}
app.navigator.globalPrivacyControl = true; const before = app.events.length;
app.advance(30_000); app.tick(); assert.equal(app.events.length, before);
const fallback = mount({ navigator: { sendBeacon: () => false } });
assert.equal(fallback.requests.length, 2);
assert.equal(fallback.requests[0].credentials, 'omit');
for (const file of readdirSync(join(root, 'static/tools'), { recursive: true })) {
  if (!file.endsWith('index.html')) continue;
  assert.match(readFileSync(join(root, 'static/tools', file), 'utf8'), /src="\/js\/page-telemetry.js" defer/);
}
assert.match(readFileSync(join(root, 'layouts/partials/memo/head.html'), 'utf8'), /hugo.IsProduction .IsPage \(eq .Section "posts"\)/);
console.log('Page sessions: duration, idle/hidden/focus time, BFCache, privacy, payload and page coverage passed.');

const shared = new Map();
const first = mount({ storage: shared });
const next = mount({ storage: shared, post: true, now: 1800000010000 });
const again = mount({ storage: shared, now: 1800000020000 });
const firstEvent = first.events[0].events[0];
assert.equal(next.events[0].events[0].sessionID, firstEvent.sessionID);
assert.equal(again.events[0].events[0].sessionID, firstEvent.sessionID);
assert.notEqual(again.events[0].events[0].properties.visit_id, firstEvent.properties.visit_id);
assert.equal(again.events[0].events[0].properties.visit_index, 3);
assert.notEqual(mount({ storage: shared, now: 1800002000000 }).events[0].events[0].sessionID, firstEvent.sessionID);
const idle = mount(); const idleSession = idle.events[0].events[0].sessionID;
idle.advance(1800001); idle.tick(); idle.fire('keydown');
assert.notEqual(idle.events.at(-1).events[0].sessionID, idleSession, 'Idle heartbeats do not extend the session');
assert.equal(idle.events.at(-1).events[0].properties.visit_index, 1);
assert.equal(mount({ blockStorage: true }).events.length, 2);
const denied = new Map(); mount({storage: denied, navigator: {doNotTrack:'1'}}); assert.equal(denied.size, 0);
console.log('Cross-page sessions: ordering, repeated URLs, timeout, blocked storage and opt-outs passed.');
