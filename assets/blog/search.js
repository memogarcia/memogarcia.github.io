const input = document.querySelector('#search-input');
const status = document.querySelector('#search-status');
const results = document.querySelector('#search-results');
let pages;
let loading;

async function search() {
  const query = input.value.trim().toLocaleLowerCase();
  results.replaceChildren();
  if (!query) { status.textContent = 'Enter a word or phrase.'; return; }
  status.textContent = 'Searching…';
  try {
    loading ??= fetch(input.dataset.index).then(response => {
      if (!response.ok) throw new Error('Search index unavailable');
      return response.json();
    });
    pages ??= await loading;
    if (query !== input.value.trim().toLocaleLowerCase()) return;
    const matches = pages.filter(page => `${page.title} ${page.content}`.toLocaleLowerCase().includes(query));
    for (const page of matches) {
      const url = new URL(page.permalink);
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = url.pathname + url.search + url.hash;
      link.textContent = page.title;
      item.append(link);
      results.append(item);
    }
    status.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}`;
  } catch {
    loading = undefined;
    if (query !== input.value.trim().toLocaleLowerCase()) return;
    status.textContent = 'Search could not load. Try again or browse the archive.';
  }
}
input.addEventListener('input', search);
