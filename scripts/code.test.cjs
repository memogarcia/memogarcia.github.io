// Run: node scripts/code.test.cjs
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

(async () => {
  for (const rejected of [false, true]) {
    let click, reset, copied;
    const code = 'key: "<value>"\n  nested: true';
    const button = {
      hidden: true,
      closest: () => ({ querySelector: () => ({ textContent: code }) }),
      addEventListener: (_, fn) => { click = fn; },
    };
    runInNewContext(readFileSync(`${__dirname}/../assets/blog/code.js`, 'utf8'), {
      document: { querySelectorAll: () => [button] },
      navigator: { clipboard: { async writeText(text) {
        if (rejected) throw new Error('Permission denied');
        copied = text;
      } } },
      setTimeout: fn => { reset = fn; },
    });
    assert.equal(button.hidden, false);
    await click();
    assert.equal(button.textContent, rejected ? 'Copy failed' : 'Copied');
    assert.equal(button.disabled, true);
    if (!rejected) assert.equal(copied, code);
    reset();
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, 'Copy');
  }
  console.log('Code copy fidelity, failure feedback, and retry checks passed.');
})();
