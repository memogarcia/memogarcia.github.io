const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

(async () => {
  let search, fail = false, requests = 0;
  const input = { value: '', dataset: { index: '/index.json' }, addEventListener: (_, fn) => { search = fn; } };
  const status = {};
  const results = { children: [], replaceChildren() { this.children = []; }, append(node) { this.children.push(node); } };
  runInNewContext(readFileSync(`${__dirname}/../assets/blog/search.js`, 'utf8'), {
    URL,
    document: {
      querySelector: id => ({ '#search-input': input, '#search-status': status, '#search-results': results })[id],
      createElement: () => ({ children: [], append(node) { this.children.push(node); } }),
    },
    fetch: async () => {
      requests++;
      return { ok: !fail, json: async () => [{ title: '<b>Focus</b>', content: 'Just say no.', permalink: 'https://memo.mx/posts/focus/' }] };
    },
  });
  await search();
  assert.equal(requests, 0);
  fail = true; input.value = 'focus'; await search();
  assert.match(status.textContent, /could not load/);
  fail = false; await search();
  assert.equal(status.textContent, '1 result');
  assert.equal(results.children[0].children[0].textContent, '<b>Focus</b>');
  assert.equal(results.children[0].children[0].href, '/posts/focus/');
  input.value = 'JUST SAY'; await search();
  assert.equal(status.textContent, '1 result');
  input.value = 'absent'; await search();
  assert.equal(results.children.length, 0);
  assert.equal(status.textContent, '0 results');
  assert.equal(requests, 2);

  // Verify ?q= query parameter pre-fills and searches on load
  const qInput = { value: '', dataset: { index: '/index.json' }, addEventListener() {} };
  const qStatus = {};
  const qResults = { children: [], replaceChildren() { this.children = []; }, append(node) { this.children.push(node); } };
  runInNewContext(readFileSync(`${__dirname}/../assets/blog/search.js`, 'utf8'), {
    URL,
    URLSearchParams,
    window: { location: { search: '?q=focus' } },
    document: {
      querySelector: id => ({ '#search-input': qInput, '#search-status': qStatus, '#search-results': qResults })[id],
      createElement: () => ({ children: [], append(node) { this.children.push(node); } }),
    },
    fetch: async () => ({
      ok: true,
      json: async () => [{ title: 'Focus', content: 'Just say no.', permalink: 'https://memo.mx/posts/focus/' }],
    }),
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(qInput.value, 'focus');
  assert.equal(qStatus.textContent, '1 result');
  assert.equal(qResults.children[0].children[0].href, '/posts/focus/');

  console.log('Search matching, safe titles, empty states, query param init, and failure/retry checks passed.');
})();
