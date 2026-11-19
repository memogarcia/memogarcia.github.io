// Cut — The one place that brings every view in line with the current project.
import * as E from './engine/index.ts';
import { scheduleAllAudioFrom } from './audio.ts';
import { updateHistoryButtons } from './history.ts';
import { renderInspector } from './inspector.ts';
import { renderMediaBin } from './media-bin.ts';
import { syncMediaPool, syncMediaToTime } from './media-pool.ts';
import { pausePlayback, renderPreview, sizePreviewCanvas } from './playback.ts';
import { project, S } from './state.ts';
import { renderRuler, renderTimelineClips } from './timeline.ts';
import type { StateChangeOpts } from './types.ts';

export function onStateChanged(opts: StateChangeOpts = {}): void {
  syncMediaPool();
  if (opts.resize) sizePreviewCanvas();
  updateHistoryButtons();
  if (opts.media) renderMediaBin();
  renderRuler(Boolean(opts.forceRuler));
  renderTimelineClips();
  renderInspector();
  if (S.playing) {
    if (E.computeProjectDuration(project().clips) <= 0) {
      pausePlayback();
      return;
    }
    scheduleAllAudioFrom(S.playhead);
  }
  syncMediaToTime(S.playhead, S.playing);
  renderPreview();
}

export function renderAll(): void {
  onStateChanged({ media: true, resize: true, forceRuler: true });
}
