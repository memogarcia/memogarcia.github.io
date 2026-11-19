// Run: node scripts/cut.test.cjs  (Node 22.18+ strips the TypeScript types natively)
const assert = require('node:assert/strict');
const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src/tools/cut');
const E = require(path.join(SRC, 'engine/index.ts'));

const readDir = (dir, ext) => readdirSync(dir)
  .filter((f) => f.endsWith(ext))
  .sort()
  .map((f) => readFileSync(path.join(dir, f), 'utf8'))
  .join('\n');

// 1. HTML & index registration checks
{
  const cutHtml = readFileSync(path.join(SRC, 'index.html'), 'utf8') + readDir(path.join(SRC, 'partials'), '.html');
  assert.match(cutHtml, /<h1 class="brand">Cut<\/h1>/);
  assert.match(cutHtml, /src="\/tools\/theme\.js"/);
  assert.match(cutHtml, /src="\/js\/page-telemetry\.js" defer/);
  assert.match(cutHtml, /src="\/tools\/analytics\.js" defer/);
  assert.match(cutHtml, /src="\/tools\/cut\/cut\.js"/);
  assert.match(cutHtml, /href="\/tools\/cut\/cut\.css"/);
  assert.ok(!cutHtml.includes('no accounts or tracking'));

  const toolsIndex = readFileSync(path.join(ROOT, 'static/tools/index.html'), 'utf8');
  assert.match(toolsIndex, /href="\/tools\/cut\/"/);
  assert.match(toolsIndex, /https:\/\/memo\.mx\/tools\/cut\//);

  // Interactive track-toggle buttons must not sit inside aria-hidden="true"
  assert.ok(!cutHtml.includes('<div class="track-headers" aria-hidden="true">'));

  // Mobile toast must reset top: auto when pinning bottom, and ruler canvas stays sticky
  const cutCss = readDir(path.join(SRC, 'styles'), '.css');
  assert.match(cutCss, /#ruler-canvas\s*\{[^}]*position:\s*sticky;/);
  assert.match(cutCss, /@media\s*\(max-width:\s*760px\)[\s\S]*\.toast\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*20px;/);
}

// 2. Split clip math (respects speed and clears internal fades & transitions)
{
  const media = { id: 'm1', kind: 'video', name: 'Clip 1', duration: 10 };
  const clip = E.createVideoClip(media, 1, {
    duration: 4,
    sourceStart: 0.5,
    speed: 2,
    fadeIn: 0.5,
    fadeOut: 0.5,
    transitionIn: { type: 'dissolve', duration: 0.5 },
  });
  assert.equal(E.splitClipAt([clip], clip.id, 1.05), null);
  assert.equal(E.splitClipAt([clip], clip.id, 6.0), null);

  const res = E.splitClipAt([clip], clip.id, 2.5);
  assert.ok(res);
  assert.equal(res.clips.length, 2);
  const [left, right] = res.clips;
  assert.equal(left.start, 1);
  assert.equal(left.duration, 1.5);
  assert.equal(left.sourceStart, 0.5);
  assert.equal(left.fadeIn, 0.5);
  assert.equal(left.fadeOut, 0);
  assert.equal(left.transitionIn.type, 'dissolve');

  assert.equal(right.start, 2.5);
  assert.equal(right.duration, 2.5);
  assert.equal(right.sourceStart, 3.5);
  assert.equal(right.fadeIn, 0);
  assert.equal(right.fadeOut, 0.5);
  assert.equal(right.transitionIn.type, 'none');
}

// 3. Left and right trim clamping
{
  const media = { id: 'm2', kind: 'video', name: 'Clip 2', duration: 8 };
  const clip = E.createVideoClip(media, 2, { duration: 4, sourceStart: 1, speed: 1 });

  const trimmedIn = E.trimClipLeft(clip, 3);
  assert.equal(trimmedIn.start, 3);
  assert.equal(trimmedIn.duration, 3);
  assert.equal(trimmedIn.sourceStart, 2);

  const clampedLeft = E.trimClipLeft(clip, 0);
  assert.equal(clampedLeft.start, 1);
  assert.equal(clampedLeft.sourceStart, 0);
  assert.equal(clampedLeft.duration, 5);

  const clampedRight = E.trimClipRight(clip, 20);
  assert.equal(clampedRight.duration, 7);

  const minRight = E.trimClipRight(clip, 2.01);
  assert.equal(minRight.duration, E.MIN_CLIP_DURATION);
}

// 4. Speed updates duration proportionally
{
  const media = { id: 'm3', kind: 'video', name: 'Clip 3', duration: 6 };
  const clip = E.createVideoClip(media, 0, { duration: 6, speed: 1 });
  const fast = E.setClipSpeed(clip, 2);
  assert.equal(fast.speed, 2);
  assert.equal(fast.duration, 3);
  const back = E.setClipSpeed(fast, 1);
  assert.equal(back.duration, 6);
}

// 5. Snapping, overlap resolution, gap closing, and ripple delete
{
  const snap = E.snapMoveStart(3.92, 2, [0, 4, 8], 0.15);
  assert.equal(snap.start, 4);
  assert.equal(snap.snappedTo, 4);

  const endSnap = E.snapMoveStart(1.93, 2, [0, 4, 8], 0.15);
  assert.equal(endSnap.start, 2);
  assert.equal(endSnap.snappedTo, 4);

  const c1 = E.createVideoClip({ id: 'a', kind: 'image', name: 'A' }, 1.5, { duration: 2 });
  const c2 = E.createVideoClip({ id: 'b', kind: 'image', name: 'B' }, 6.0, { duration: 3 });
  const closed = E.closeGaps([c2, c1], 'video');
  const byId = Object.fromEntries(closed.map((c) => [c.id, c]));
  assert.equal(byId[c1.id].start, 0);
  assert.equal(byId[c2.id].start, 2);

  // Overlap resolution: moving c2 on top of c1 packs them cleanly without overlap
  const overlapping = [
    { ...c1, start: 0, duration: 4 },
    { ...c2, start: 1, duration: 3 },
  ];
  const resolved = E.resolveVideoTrackOverlap(overlapping, c2.id);
  const sorted = resolved.sort((a, b) => a.start - b.start);
  assert.ok(sorted[0].start + sorted[0].duration <= sorted[1].start + 1e-6);

  // Ripple delete removes clip and pulls later video clips left
  const r1 = E.createVideoClip({ id: 'a', kind: 'image', name: 'A' }, 0, { duration: 3 });
  const r2 = E.createVideoClip({ id: 'b', kind: 'image', name: 'B' }, 3, { duration: 2 });
  const r3 = E.createVideoClip({ id: 'c', kind: 'image', name: 'C' }, 5, { duration: 4 });
  const caption = E.createTextClip(6, { duration: 2 });
  const music = E.createAudioClip({ id: 'mu', kind: 'audio', name: 'Bed', duration: 9 }, 0);
  const afterRipple = E.rippleDeleteClip([r1, r2, r3, caption, music], r2.id);
  assert.equal(afterRipple.length, 4);
  assert.equal(afterRipple.find((c) => c.id === r3.id).start, 3);
  // Captions after the cut move with the picture; a bed that spans the cut stays put.
  assert.equal(afterRipple.find((c) => c.id === caption.id).start, 4);
  assert.equal(afterRipple.find((c) => c.id === music.id).start, 0);
}

// 6. Seam transitions detection & evaluation
{
  const v1 = E.createVideoClip({ id: 'm1', kind: 'procedural', name: 'A' }, 0, { duration: 4 });
  const v2 = E.createVideoClip({ id: 'm2', kind: 'procedural', name: 'B' }, 4, {
    duration: 4,
    transitionIn: { type: 'dissolve', duration: 0.6 },
  });
  const seams = E.getAdjacentVideoSeams([v1, v2]);
  assert.equal(seams.length, 1);
  assert.equal(seams[0].time, 4);
  assert.equal(seams[0].nextId, v2.id);

  assert.equal(E.getTransitionStateAt([v1, v2], 3.5), null);
  const mid = E.getTransitionStateAt([v1, v2], 4.3);
  assert.ok(mid);
  assert.equal(mid.type, 'dissolve');
  assert.ok(Math.abs(mid.progress - 0.5) < 0.02);
  assert.equal(E.getTransitionStateAt([v1, v2], 4.8), null);
}

// 7. SRT parser, script-to-captions, and applyTextStyleToAll
{
  const srt = `1
00:00:01,000 --> 00:00:03,500
First line of subtitle

2
00:00:04,000 --> 00:00:06,250
Second line
with wrap`;
  const cues = E.parseSrt(srt);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].start, 1);
  assert.equal(cues[0].duration, 2.5);
  assert.equal(cues[1].start, 4);
  assert.equal(cues[1].duration, 2.25);
  assert.equal(cues[1].text, 'Second line\nwith wrap');

  const scriptClips = E.scriptToCaptions('Hook line\nMiddle point\nClosing CTA', 9, 'pill');
  assert.equal(scriptClips.length, 3);
  assert.equal(scriptClips[0].start, 0);
  assert.equal(scriptClips[1].start, 3);
  assert.equal(scriptClips[2].start, 6);
  assert.equal(scriptClips[0].preset, 'pill');

  const styled = E.applyTextStyleToAll(
    [
      { ...scriptClips[0], preset: 'editorial', fontSize: 52, y: 0.5 },
      scriptClips[1],
    ],
    scriptClips[0].id
  );
  assert.equal(styled[1].preset, 'editorial');
  assert.equal(styled[1].fontSize, 52);
  assert.equal(styled[1].y, 0.5);
}

// 8. History undo/redo
{
  let h = E.createHistory(E.createProject());
  assert.equal(h.past.length, 0);
  const t = E.createTextClip(0, { text: 'Hello' });
  h = E.commitHistory(h, { ...h.present, clips: [t], selectedClipId: t.id });
  assert.equal(h.present.clips.length, 1);
  h = E.undoHistory(h);
  assert.equal(h.present.clips.length, 0);
  assert.equal(h.future.length, 1);
  h = E.redoHistory(h);
  assert.equal(h.present.clips.length, 1);
}

// 9. Filters, Ken Burns, opacity fades, text animations, draw rects, timecodes
{
  assert.equal(E.buildCanvasFilter({ filter: 'none', brightness: 100, contrast: 100, saturation: 100 }), 'none');
  assert.match(E.buildCanvasFilter({ filter: 'bw', brightness: 110, contrast: 100, saturation: 100 }), /grayscale\(1\).*brightness\(1\.10\)/);

  const kbEnd = E.evalKenBurns({ duration: 4, kenBurns: 'zoom-in' }, 4);
  assert.ok(Math.abs(kbEnd.scale - 1.14) < 1e-6);

  assert.equal(E.computeClipOpacity({ duration: 4, fadeIn: 1, fadeOut: 1 }, 0.5), 0.5);
  assert.equal(E.computeClipOpacity({ duration: 4, fadeIn: 1, fadeOut: 1 }, 2.0), 1);
  assert.equal(E.computeClipOpacity({ duration: 4, fadeIn: 1, fadeOut: 1 }, 3.75), 0.25);

  const popStart = E.evalTextAnim({ duration: 3, animation: 'pop', fadeIn: 0.3, fadeOut: 0.3 }, 0);
  assert.equal(popStart.alpha, 0);
  const popMid = E.evalTextAnim({ duration: 3, animation: 'pop', fadeIn: 0.3, fadeOut: 0.3 }, 1.5);
  assert.equal(popMid.alpha, 1);
  assert.equal(popMid.scale, 1);

  const cover = E.computeDrawRect(1920, 1080, 720, 1280, 'cover', 1, 0.1, -0.05);
  assert.equal(Math.round(cover.h), 1280);
  assert.ok(cover.w > 720);

  const contain = E.computeDrawRect(1920, 1080, 720, 1280, 'contain', 1);
  assert.equal(Math.round(contain.w), 720);
  assert.ok(contain.h < 1280);

  assert.equal(E.formatTimecode(65.43), '01:05.4');
  assert.equal(E.formatTimecode(65.43, false), '01:05');
}

// 10. Regression checks: snapMoveStart rawStart comparison, preserveOrder overlap, CJK text wrap, media detection
{
  // End-edge snap at 7.05 (delta 0.05) must beat start-edge target 5.08 (delta 0.08 from proposedStart 5.0)
  const snapBest = E.snapMoveStart(5.0, 2, [7.05, 5.08], 0.2);
  assert.equal(snapBest.start, 5.05);
  assert.equal(snapBest.snappedTo, 7.05);

  // Expanding clip 1 via 0.25x speed (0..16) with preserveOrder pushes clip 2 & 3 right without reordering
  const s1 = E.createVideoClip({ id: 'm1', kind: 'video', name: 'A', duration: 4 }, 0, { duration: 4 });
  const s2 = E.createVideoClip({ id: 'm2', kind: 'video', name: 'B', duration: 4 }, 4, { duration: 4 });
  const s3 = E.createVideoClip({ id: 'm3', kind: 'video', name: 'C', duration: 3.6 }, 8, { duration: 3.6 });
  const slowed = [E.setClipSpeed(s1, 0.25), s2, s3];
  const packed = E.resolveVideoTrackOverlap(slowed, s1.id, { preserveOrder: true });
  const byId = Object.fromEntries(packed.map((c) => [c.id, c]));
  assert.equal(byId[s1.id].start, 0);
  assert.equal(byId[s1.id].duration, 16);
  assert.equal(byId[s2.id].start, 16);
  assert.equal(byId[s3.id].start, 20);

  // CJK spaceless text and long tokens must wrap within maxWidth
  const measure = (str) => Array.from(str).length * 20;
  const jpLines = E.wrapTextLines('ブラウザの中で動画を編集して書き出せます', 100, measure);
  assert.ok(jpLines.length >= 4);
  for (const line of jpLines) {
    assert.ok(measure(line) <= 100, `line overflowed: ${line}`);
  }
  const urlLines = E.wrapTextLines('Visit https://example.com/very/long/path now', 160, measure);
  for (const line of urlLines) {
    assert.ok(measure(line) <= 160, `url line overflowed: ${line}`);
  }

  // Extension fallbacks when OS MIME type is empty
  assert.equal(E.detectMediaKind('clip.mov', ''), 'video');
  assert.equal(E.detectMediaKind('clip.MKV', ''), 'video');
  assert.equal(E.detectMediaKind('photo.WEBP', ''), 'image');
  assert.equal(E.detectMediaKind('track.m4a', ''), 'audio');
  assert.equal(E.detectMediaKind('captions.srt', ''), 'subtitle');
  assert.equal(E.detectMediaKind('doc.pdf', 'application/pdf'), null);
}

// 11. Regressions from the TypeScript migration review
{
  // Splitting a caption must not animate the cut: the halves keep alpha 1 at the seam.
  const cap = E.createTextClip(0, { duration: 4, animation: 'pop' });
  const split = E.splitClipAt([cap], cap.id, 2);
  const [left, right] = split.clips;
  assert.equal(E.evalTextAnim(left, left.duration - 0.01).alpha, 1);
  assert.equal(E.evalTextAnim(right, 0.01).alpha, 1);
  assert.equal(E.evalTextAnim(right, 0.01).scale, 1);
  // Missing fades still fall back to the default animation length
  assert.equal(E.evalTextAnim({ duration: 3, animation: 'fade' }, 0).alpha, 0);

  // Duplicating a clip places the copy right after the original (preserveOrder)
  const m1 = E.createVideoClip({ id: 'm1', kind: 'video', name: 'A', duration: 10 }, 0, { duration: 10 });
  const m2 = E.createVideoClip({ id: 'm2', kind: 'video', name: 'B', duration: 2 }, 10, { duration: 2 });
  const copy = { ...m1, id: 'copy', start: 10 };
  const dup = E.resolveVideoTrackOverlap([m1, m2, copy], copy.id, { preserveOrder: true });
  const at = Object.fromEntries(dup.map((c) => [c.id, c.start]));
  assert.deepEqual(at, { [m1.id]: 0, copy: 10, [m2.id]: 20 });

  // Timecode tenths survive floating-point error
  assert.equal(E.formatTimecode(61.3), '01:01.3');
  assert.equal(E.formatTimecode(0.3), '00:00.3');
  assert.equal(E.formatTimecode(59.99), '00:59.9');
  assert.equal(E.formatTimecode(119.95, false), '01:59');
}

// The editable reel has picture and music for the full 30 seconds, including after a speed cut.
{
  const { cutLastTrain, reelPhotos } = require(path.join(SRC, 'demo-sequence.ts'));
  const media = {
    route: { id: 'route', kind: 'procedural', duration: 9 },
    score: { id: 'score', kind: 'audio', duration: 30 },
  };
  for (const [id, name] of Object.entries(reelPhotos)) media[id] = { id, name, kind: 'image' };
  const clips = cutLastTrain(media);
  const shots = clips.filter((c) => c.track === 'video');
  let end = 0;
  for (const shot of shots) {
    assert.equal(shot.start, end);
    assert.ok(shot.sourceStart + shot.speed * shot.duration <= shot.mediaDuration);
    end += shot.duration;
  }
  assert.equal(end, 30);
  assert.equal(E.computeProjectDuration(clips), 30);
  const score = clips.find((c) => c.track === 'audio');
  assert.equal(score.start, 0);
  assert.equal(score.duration, end);
  const [normal, fast] = shots.filter((c) => c.mediaId === 'route');
  assert.equal(fast.sourceStart, normal.sourceStart + normal.duration * normal.speed);
  assert.equal(fast.speed, 2);
}

console.log('Cut engine, demo timing, transitions, captions, history, and HTML integration checks passed.');
