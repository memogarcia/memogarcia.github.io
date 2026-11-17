// Run: node scripts/analytics.test.cjs
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const root = join(__dirname, '..');
const source = readFileSync(join(root, 'static/tools/analytics.js'), 'utf8');
const config = readFileSync(join(root, 'config.yml'), 'utf8');
const id = config.match(/ID: "(G-[A-Z0-9]+)"/)[1];

function run(overrides = {}) {
  const scripts = [];
  const events = [];
  const requests = [];
  const context = {
    window: {}, navigator: { sendBeacon: (url, body) => { events.push({ url, body: JSON.parse(body) }); return true; } }, URL,
    fetch: (url, options) => { requests.push({ url, ...options }); return Promise.resolve(); },
    location: { protocol: 'https:', hostname: 'memo.mx', origin: 'https://memo.mx', pathname: '/tools/typewriter/', search: '?text=private', hash: '#private' },
    document: {
      title: 'Typewriter', referrer: 'https://example.com/private?token=secret',
      createElement: () => ({}), head: { append: (script) => scripts.push(script) },
    },
    ...overrides,
  };
  runInNewContext(source, context);
  runInNewContext(source, context);
  return { scripts, events, requests, commands: (context.window.dataLayer || []).map((command) => Array.from(command)) };
}

const result = run();
assert.equal(result.scripts.length, 1, 'Repeated initialization must not duplicate visits');
assert.equal(result.scripts[0].src, `https://www.googletagmanager.com/gtag/js?id=${id}`);
assert.equal(result.commands.length, 2);
const [, destination, options] = result.commands[1];
assert.equal(destination, id);
assert.equal(options.page_location, 'https://memo.mx/tools/typewriter/');
assert.equal(options.page_referrer, 'https://example.com');
assert.equal(options.allow_google_signals, false);
assert.equal(options.allow_ad_personalization_signals, false);
assert.ok(!JSON.stringify(result).includes('private'));
for (const navigator of [{ doNotTrack: '1' }, { doNotTrack: 'yes' }, { msDoNotTrack: '1' }, { globalPrivacyControl: true }, { webdriver: true }]) {
  const blocked = run({ navigator });
  assert.equal(blocked.scripts.length, 0);
  assert.equal(blocked.requests.length, 0);
  assert.equal(blocked.events.length, 0);
}
assert.equal(run({ window: { doNotTrack: '1' } }).scripts.length, 0);
for (const hostname of ['localhost', '127.0.0.1', 'preview.example.com']) {
  assert.equal(run({ location: { protocol: 'https:', hostname } }).scripts.length, 0);
}
assert.equal(run({ location: { protocol: 'file:', hostname: '' } }).scripts.length, 0);
function checkPages(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) checkPages(path);
    else if (entry.name.endsWith('.html')) {
      const html = readFileSync(path, 'utf8');
      assert.equal((html.match(/src="\/tools\/analytics.js" defer/g) || []).length, 1, path);
      assert.ok(!html.includes('no accounts or tracking'), path);
    }
  }
}
checkPages(join(root, 'static/tools'));
console.log('Tools analytics: coverage, destination, privacy signals, safe URLs, and duplicate prevention passed.');
