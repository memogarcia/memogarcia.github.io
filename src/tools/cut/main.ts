// Cut — Local-first browser video editor. Entry point bundled to /tools/cut/cut.js.
import { wireCanvasInteractions } from './canvas-interact.ts';
import { wireEvents } from './events.ts';
import { wireInspectorControls } from './inspector-events.ts';
import { buildInspectorGrids } from './inspector.ts';
import { wireKeyboard } from './keyboard.ts';
import { buildCaptionPresetCards } from './media-bin.ts';
import { restoreSavedSession } from './persist.ts';
import { wireTransitionPopover } from './popover.ts';
import { renderAll } from './refresh.ts';
import { S } from './state.ts';

buildInspectorGrids();
buildCaptionPresetCards();
wireEvents();
wireInspectorControls();
wireTransitionPopover();
wireCanvasInteractions();
wireKeyboard();
renderAll();
S.restored = restoreSavedSession().catch(() => {});
