"""Validate a Hugo build without invoking Hugo. Run: python3 scripts/check-site.py public"""
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlparse
import xml.etree.ElementTree as ET

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'public')
repo = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.h1 = self.headers = self.pre = self.blocks = 0
        self.assets = []
        self.canonical = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        self.h1 += tag == 'h1'
        self.headers += 'site-header' in classes
        self.pre += tag == 'pre'
        self.blocks += 'code-block' in classes
        if tag == 'script' and 'src' in attrs:
            self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet':
            self.assets.append(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs['href']


assert (root / 'index.html').is_file(), 'Build artifact missing: index.html'
assert (root / 'CNAME').read_text().strip() == 'memo.mx'
assert not any(path.is_file() for folder in root.rglob('node_modules') for path in folder.rglob('*')), 'Dependency files leaked into build'
for folder in ('preview', 'content', 'themes', 'layouts', 'scripts'):
    assert not (root / folder).exists(), f'Source folder leaked into build: {folder}'

posts = 0
drafts = 0
for source in (repo / 'content/posts').glob('*.md'):
    front = source.read_text().split('---', 2)[1]
    draft = bool(re.search(r'^draft:\s*true\s*$', front, re.M))
    date_match = re.search(r'^date:\s*(.+)$', front, re.M)
    # Some existing posts use a one-digit hour, which Hugo accepts.
    date_text = re.sub(r'T(\d):', r'T0\1:', date_match[1].strip().strip('"\'').replace('Z', '+00:00')) if date_match else '0001-01-01T00:00:00+00:00'
    date = datetime.fromisoformat(date_text)
    if date.tzinfo is None:
        date = date.replace(tzinfo=timezone.utc)
    path = root / 'posts' / source.stem / 'index.html'
    if draft or date > datetime.now(timezone.utc):
        assert not path.exists(), f'Draft/future post published: {source.name}'
        drafts += 1
    else:
        assert path.is_file(), f'Published post missing: {source.name}'
        posts += 1

checked = 0
for path in root.rglob('*.html'):
    if path.relative_to(root).parts[0] in ('tools', 'little-pond'):
        continue
    page = Page(path.read_text())
    if not page.headers:  # Hugo alias redirects have no site layout.
        continue
    assert page.h1 == 1, f'Expected one page title: {path}'
    assert page.canonical, f'Missing canonical URL: {path}'
    assert page.pre == page.blocks, f'Unstyled code blocks: {path}'
    for asset in page.assets:
        url = urlparse(asset)
        if url.netloc and url.netloc not in ('memo.mx', '127.0.0.1:4174', 'localhost:4174'):
            continue
        assert (root / unquote(url.path).lstrip('/')).is_file(), f'Missing asset: {asset}'
    checked += 1

for route in ('labs', 'about', 'archives', 'search'):
    assert (root / route / 'index.html').is_file(), f'Missing page: {route}'
assert 'class=lab-index' in (root / 'labs/index.html').read_text() or 'class="lab-index"' in (root / 'labs/index.html').read_text(), 'Labs layout missing'
focus = Page((root / 'posts/focus/index.html').read_text())
assert any('/blog/posts/focus.' in asset for asset in focus.assets), 'Focus stylesheet missing'
normal = Page((root / 'posts/complexity/index.html').read_text())
assert not any('/blog/posts/focus.' in asset for asset in normal.assets), 'Focus stylesheet leaked'
index = json.loads((root / 'index.json').read_text())
assert any('/posts/focus/' in page['permalink'] for page in index), 'Search index missing posts'
ET.parse(root / 'index.xml')
ET.parse(root / 'sitemap.xml')
assert (root / 'img/me-main-page.png').is_file(), 'Legacy image mount missing'
assert (root / 'img/chapter-1-title.png').is_file(), 'New image mount missing'
print(f'Checked {checked} pages, {posts} published posts, {drafts} excluded drafts/future posts, assets, code blocks, RSS, sitemap, search, and page styles.')
