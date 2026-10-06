// Run: node scripts/comments.test.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(`${__dirname}/../assets/blog/comments.js`, 'utf8');

function mount(mode, present = true, origin = 'https://memo.mx') {
  let script, onChange, onLoad, frame;
  const messages = [];
  const documentElement = { dataset: { theme: mode } };
  const container = {
    dataset: {
      repo: 'owner/blog', mapping: 'pathname', strict: '1', loading: 'lazy',
      themeLight: '/blog/giscus-light-theme.hash.css',
      themeDark: '/blog/giscus-dark-theme.hash.css',
      themeDevice: '/blog/giscus-device-theme.hash.css',
    },
    querySelector: () => frame,
    addEventListener(event, callback, capture) {
      assert.equal(event, 'load');
      assert.equal(capture, true);
      onLoad = callback;
    },
    append(value) { script = value; },
  };
  runInNewContext(source, {
    URL,
    window: { location: { href: `${origin}/posts/focus/` } },
    document: {
      documentElement,
      querySelector: () => present ? container : null,
      createElement: () => ({ dataset: {} }),
    },
    MutationObserver: class {
      constructor(callback) { onChange = callback; }
      observe(target, options) {
        assert.equal(target, documentElement);
        assert.equal(options.attributes, true);
        assert.equal(options.attributeFilter.join(','), 'data-theme');
      }
    },
  });
  return {
    script,
    messages,
    setTheme(value) { documentElement.dataset.theme = value; onChange(); },
    loadFrame() {
      frame = { contentWindow: { postMessage(message, origin) {
        messages.push(JSON.parse(JSON.stringify({ message, origin })));
      } } };
      onLoad();
    },
  };
}

// Pages without comments must not load a third-party script or register observers.
assert.equal(mount('light', false).script, undefined);

for (const mode of ['light', 'dark', 'device', undefined]) {
  const app = mount(mode);
  const themeURL = value => `https://memo.mx/blog/giscus-${value}-theme.hash.css`;
  const expected = themeURL(['light', 'dark'].includes(mode) ? mode : 'device');
  assert.equal(app.script.src, 'https://giscus.app/client.js');
  assert.equal(app.script.dataset.theme, expected);
  assert.equal(app.script.dataset.loading, 'lazy');
  assert.equal(app.script.crossOrigin, 'anonymous');
  assert.equal(app.script.async, true);

  // Change appearance before the iframe exists, then load it later.
  app.setTheme('dark');
  assert.equal(app.script.dataset.theme, themeURL('dark'));
  assert.equal(app.messages.length, 0);
  app.loadFrame();
  assert.deepEqual(app.messages.pop(), {
    message: { giscus: { setConfig: { theme: themeURL('dark') } } },
    origin: 'https://giscus.app',
  });

  // The loaded frame follows manual themes and can return to device appearance.
  for (const next of ['light', 'dark', 'device']) {
    app.setTheme(next);
    assert.deepEqual(app.messages.pop(), {
      message: { giscus: { setConfig: { theme: themeURL(next) } } },
      origin: 'https://giscus.app',
    });
  }
}
// Built previews load their own CSS, rather than pointing to production assets.
assert.equal(mount('light', true, 'http://127.0.0.1:4174').script.dataset.theme,
  'http://127.0.0.1:4174/blog/giscus-light-theme.hash.css');
console.log('Comments loading, custom themes, delayed iframe loading, theme changes, preview URLs, and message-origin checks passed.');
