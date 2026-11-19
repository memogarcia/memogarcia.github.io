// Fails when a source file is longer than MAX_LINES, so files stay small enough to read in one sitting.
// Run: node scripts/check-line-limit.mjs          (staged files, used by the pre-commit hook)
//      node scripts/check-line-limit.mjs --all    (every tracked or new file in the working tree)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const MAX_LINES = 500;
const CHECKED_EXT = /\.(ts|tsx|js|mjs|cjs|css|scss|html|py|sh)$/;
const SKIPPED_DIRS = /^(node_modules|public|resources|themes|content|static\/img)\//;

// Files that were already over the limit when the check was added. Split one, then delete its line.
const LEGACY = new Set([
  'assets/blog/style.css',
  'scripts/tools.test.cjs',
  'static/tools/breathing/breathing.css',
  'static/tools/breathing/breathing.js',
  'static/tools/fasting/fasting.css',
  'static/tools/fasting/fasting.js',
  'static/tools/meditation/meditation.css',
  'static/tools/meditation/meditation.js',
  'static/tools/pomodoro/pomodoro.css',
  'static/tools/pomodoro/pomodoro.js',
  'static/tools/typewriter/typewriter.css',
  'static/tools/typewriter/typewriter.js',
  'static/tools/zenkaku-hankaku/converter.css',
  'static/tools/zenkaku-hankaku/converter.js',
]);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const all = process.argv.includes('--all');

const files = (all
  ? git('ls-files', '-z', '--cached', '--others', '--exclude-standard')
  : git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'))
  .split('\0')
  .filter((f) => f && CHECKED_EXT.test(f) && !SKIPPED_DIRS.test(f) && !LEGACY.has(f))
  .filter((f) => !all || existsSync(f));

function countLines(text) {
  if (!text) return 0;
  const newlines = text.split('\n').length - 1;
  return text.endsWith('\n') ? newlines : newlines + 1;
}

const tooLong = [];
for (const file of files) {
  // Staged mode reads the index, so a fix that is not staged yet does not count.
  const text = all ? readFileSync(file, 'utf8') : git('show', `:${file}`);
  const lines = countLines(text);
  if (lines > MAX_LINES) tooLong.push({ file, lines });
}

if (tooLong.length) {
  console.error(`Files over ${MAX_LINES} lines (split them into smaller modules):`);
  for (const { file, lines } of tooLong) console.error(`  ${file}: ${lines} lines`);
  process.exit(1);
}
console.log(`Line limit OK (${files.length} ${files.length === 1 ? 'file' : 'files'} checked, max ${MAX_LINES}).`);
