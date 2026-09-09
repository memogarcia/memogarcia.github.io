// Run: node scripts/theme.test.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(`${__dirname}/../assets/blog/theme.js`, 'utf8');

function mount(saved, blocked = false) {
  let ready, click;
  const button = {
    hidden: true,
    setAttribute(name, value) { this[name] = value; },
    addEventListener: (_, fn) => { click = fn; },
  };
  const document = {
    documentElement: { dataset: {} },
    addEventListener: (_, fn) => { ready = fn; },
    querySelector: () => button,
  };
  const storage = new Map([['pref-theme', saved]]);
  const localStorage = {
    getItem(key) { if (blocked) throw new Error('Blocked'); return storage.get(key); },
    setItem(key, value) { if (blocked) throw new Error('Blocked'); storage.set(key, value); },
  };
  runInNewContext(source, { document, localStorage });
  ready();
  return { document, button, storage, click: () => click() };
}

for (const saved of [null, 'invalid', 'light', 'dark', 'device']) {
  const app = mount(saved);
  const expected = ['light', 'dark'].includes(saved) ? saved : 'device';
  assert.equal(app.document.documentElement.dataset.theme, expected);
  assert.equal(app.button.hidden, false);
  const modes = ['light', 'dark', 'device'];
  for (let step = 1; step <= 3; step++) {
    const next = modes[(modes.indexOf(expected) + step) % modes.length];
    assert.match(app.button['aria-label'], new RegExp(`Switch to ${next}`));
    app.click();
    assert.equal(app.document.documentElement.dataset.theme, next);
    assert.equal(mount(app.storage.get('pref-theme')).document.documentElement.dataset.theme, next);
  }
}
const blocked = mount('dark', true);
assert.equal(blocked.document.documentElement.dataset.theme, 'device');
blocked.click();
assert.equal(blocked.document.documentElement.dataset.theme, 'light');
console.log('Theme cycle, accessible labels, persistence, and blocked-storage checks passed.');
