// Builds the TypeScript tools in src/tools into static/tools (served by Hugo as-is).
// Run: node scripts/build-tools.mjs [--watch]
import { build, context } from 'esbuild';
import { mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WATCH = process.argv.includes('--watch');

// Each tool: TS entry, CSS entry, and an HTML shell assembled from partials.
const TOOLS = [
  {
    name: 'cut',
    src: 'src/tools/cut',
    out: 'static/tools/cut',
    js: { entry: 'main.ts', out: 'cut.js' },
    css: { entry: 'styles/index.css', out: 'cut.css' },
    html: { entry: 'index.html', out: 'index.html' },
  },
];

const INCLUDE_RE = /^([ \t]*)<!--\s*@include\s+(\S+)\s*-->[ \t]*$/gm;

// Resolves `<!-- @include partials/file.html -->` lines, keeping the indentation of the marker.
function assembleHtml(file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`Circular @include: ${file}`);
  const next = new Set(seen).add(file);
  const raw = readFileSync(file, 'utf8');
  return raw.replace(INCLUDE_RE, (_, indent, rel) => {
    const body = assembleHtml(path.join(path.dirname(file), rel), next).replace(/\n$/, '');
    return body.split('\n').map((line) => (line ? indent + line : line)).join('\n');
  });
}

function writeHtml(tool) {
  const html = assembleHtml(path.join(ROOT, tool.src, tool.html.entry));
  writeFileSync(path.join(ROOT, tool.out, tool.html.out), html);
}

// Site-absolute URLs in CSS (`/fonts/...`) are served by Hugo; leave them as written.
const siteAbsoluteUrls = {
  name: 'site-absolute-urls',
  setup(b) {
    b.onResolve({ filter: /^\// }, (args) => (args.kind === 'url-token' ? { path: args.path, external: true } : undefined));
  },
};

function esbuildOptions(tool) {
  const common = {
    bundle: true,
    minify: !WATCH,
    sourcemap: WATCH ? 'inline' : false,
    logLevel: 'info',
    legalComments: 'none',
  };
  return [
    {
      ...common,
      entryPoints: [path.join(ROOT, tool.src, tool.js.entry)],
      outfile: path.join(ROOT, tool.out, tool.js.out),
      format: 'iife',
      target: ['es2022', 'safari15'],
    },
    {
      ...common,
      entryPoints: [path.join(ROOT, tool.src, tool.css.entry)],
      outfile: path.join(ROOT, tool.out, tool.css.out),
      target: ['chrome100', 'safari15', 'firefox100'],
      plugins: [siteAbsoluteUrls],
    },
  ];
}

for (const tool of TOOLS) {
  mkdirSync(path.join(ROOT, tool.out), { recursive: true });
  writeHtml(tool);
  if (WATCH) {
    for (const opts of esbuildOptions(tool)) {
      const ctx = await context(opts);
      await ctx.watch();
    }
    watch(path.join(ROOT, tool.src), { recursive: true }, (_, file) => {
      if (file && file.endsWith('.html')) {
        try {
          writeHtml(tool);
          console.log(`[${tool.name}] rebuilt ${tool.html.out}`);
        } catch (err) {
          console.error(err.message);
        }
      }
    });
  } else {
    await Promise.all(esbuildOptions(tool).map((opts) => build(opts)));
  }
}

if (WATCH) console.log('Watching src/tools for changes…');
