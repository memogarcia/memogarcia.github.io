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

## Checks and publishing

Do not run Hugo locally; this repository's agent rules prohibit it. Pull requests and manual runs of **Build and Deploy Hugo Site** build with Hugo 0.128.0, run checks, and attach a `blog-preview` artifact without deploying. Only a push to `master` deploys that workflow's build.

After downloading a built artifact to `public/`, serve it locally:

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory public
```

Local checks that do not run Hugo:

```sh
node scripts/theme.test.cjs
node scripts/code.test.cjs
node scripts/search.test.cjs
python3 scripts/check-site.py public
```

The last check requires a generated site. Builds write only to `public/`; workflows deploy that folder. The ignored `preview/` folder contains the earlier design snapshots and is not published. Legacy images in `content/img/` are mounted at `/img/` alongside new images in `static/img/`.
