# Memo Garcia's blog

The site uses custom Hugo layouts and handmade CSS. All published posts inherit the same layout, theme control, and code styling. PaperMod remains a fallback for existing shortcodes, RSS, and search-index generation; its visual styles are not loaded.

## Writing

1. Create `content/posts/your-post-name.md` with the front matter below.
2. Write Markdown below it. Use fenced code blocks with a language (`bash`, `yaml`, `python`, etc.) for syntax colors and Copy controls.
3. Put new images in `static/img/` and reference them as `/img/filename.png`.
4. Keep `draft: true` while writing. Change it to `false` when the post is ready for publication. Future-dated posts remain excluded until their date.

```markdown
---
title: "Your post title"
date: 2026-09-09T12:00:00+09:00
draft: true
---

Your writing starts here.
```

Front matter stays limited to `title`, `date`, and `draft`. Existing posts and URLs are unchanged. Labs continue to live in `content/posts/`; add their links to `content/labs/index.md` to include them in Labs.

## Styling

- `assets/blog/style.css`: shared design and light/dark palettes.
- `layouts/_default/`: article, list, archive, and search layouts; `_markup/` contains the code-block renderer.
- `layouts/partials/memo/`: shared header, metadata, footer, and post list.
- `assets/blog/posts/<post-filename>.css`: optional styling loaded only for that post. For example, `focus.css` styles `content/posts/focus.md`. No extra front matter is needed.

## Comments and reactions

Published posts, short stories, and the About page use [Giscus](https://giscus.app/) for comments and reactions, including thumbs up and thumbs down. Readers sign in with GitHub to participate. Threads live in the repository's Announcements discussion category and are created on the first comment or reaction.

`params.giscus` in `config.yml` holds the repository and category IDs. Set `enabled: false` to turn off the embed. The Giscus app must be installed on this repository and GitHub Discussions must remain enabled.

Threads use each page's URL path with strict matching. Changing a title keeps its thread; changing its URL path requires migrating the thread. The embed loads lazily and follows the site's Light, Dark, or Device theme. Preview builds link threads back to the canonical `memo.mx` page URL. Drafts and index pages have no embed. `layouts/partials/memo/comments-enabled.html` controls availability for both the embed and its backlink metadata.

`assets/blog/giscus.css` styles the iframe with the blog's Source Serif 4 font, quiet borders, and green controls. The `giscus-light.css` and `giscus-dark.css` palettes mirror `style.css`; update both when changing the site's colors. Hugo combines them into three fingerprinted stylesheets, including a Device theme that follows system appearance.

Localhost previews use Giscus's built-in themes because browsers can block its iframe from fetching local stylesheets. Review the custom theme on a public HTTPS preview or the published site.

## Checks and publishing

Do not run Hugo locally; this repository's agent rules prohibit it. Pull requests and manual runs of **Build and Deploy Hugo Site** build with Hugo 0.128.0, run checks, and attach a `blog-preview` artifact without deploying. Only a push to `master` deploys that workflow's build.

After downloading a built artifact to `public/`, serve it locally:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory public
```

Local checks that do not run Hugo:

```sh
node scripts/theme.test.cjs
node scripts/comments.test.cjs
node scripts/code.test.cjs
node scripts/search.test.cjs
node scripts/analytics.test.cjs
python3 scripts/check-site.py public
```

The last check requires a generated site. Builds write only to `public/`; workflows deploy that folder. The ignored `preview/` folder contains the earlier design snapshots and is not published. Legacy images in `content/img/` are mounted at `/img/` alongside new images in `static/img/`.

## Tools analytics

The seven static tools pages bypass Hugo's head partial. Each loads
`static/tools/analytics.js`, using the same Google Analytics stream as the blog:
`G-ZRB1GGCC9B`. Its test checks that the IDs stay aligned.

The loader runs only on `https://memo.mx`. It skips automated browsers, Do Not
Track and Global Privacy Control. It initializes one default page view, strips
query strings and fragments from the page URL, and reduces the referrer to its
origin. It adds no tool interaction events and reads no tool storage or inputs.
Google Signals and advertising personalization are disabled.

Enhanced Measurement was verified as enabled on 2026-11-17. Memo chose to
keep its automatic interaction reports alongside page views. This setting is
shared by the blog and tools; do not disable it without approval. The loader follows the blog's existing analytics policy;
there is no consent interface. Google Analytics can use analytics cookies.
See [Google's page-view configuration](https://developers.google.com/analytics/devguides/collection/ga4/views).
After deployment, confirm one page view per navigation in the browser network
panel and GA Realtime. Local tests do not prove GA receipt.

### Magnetic telemetry

The shared tools loader also sends `page_viewed` to
`https://telemetry.magneticenterprises.com/v1/events`, with only an allowlisted
public tools path. It uses the dedicated `memo-tools` public credential and
accepts requests only from `https://memo.mx`. Magnetic's registry stores the key
hash; its vault stores the encrypted credential. The browser key is intentionally
public and grants no read or administrative access.

The direct events integration avoids the generic page script's UTM collection.
It sends no referrer, query parameters, user identifiers, tool inputs or stored
history. It uses `sendBeacon`, falling back to a credential-free keepalive fetch.
It does not retry, so failed requests cannot duplicate visits. Collection uses
no cookies or local storage and respects the same privacy guards as GA.

Owning sources in `../magnetic`: `products/telemetry/apps/api/apps.toml`,
`products/telemetry/apps/api/src/events.rs` and
`products/telemetry/scripts/client-keys.mjs`.
