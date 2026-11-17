((globalScope) => {
  const STORAGE_KEY = 'memo-tools-zenkaku-hankaku-v1';

  const PRESETS = {
    standard: {
      letters: 'half',
      digits: 'half',
      symbols: 'half',
      spaces: 'half',
      katakana: 'full',
      jpPunct: 'full',
      normalizeVariants: false,
    },
    allFull: {
      letters: 'full',
      digits: 'full',
      symbols: 'full',
      spaces: 'full',
      katakana: 'full',
      jpPunct: 'full',
      normalizeVariants: false,
    },
    allHalf: {
      letters: 'half',
      digits: 'half',
      symbols: 'half',
      spaces: 'half',
      katakana: 'half',
      jpPunct: 'half',
      normalizeVariants: false,
    },
  };

  // JIS X 0201 Half-width Katakana <-> Full-width Katakana
  const KANA_PAIRS = [
    ['ｦ', 'ヲ'], ['ｧ', 'ァ'], ['ｨ', 'ィ'], ['ｩ', 'ゥ'], ['ｪ', 'ェ'],
    ['ｫ', 'ォ'], ['ｬ', 'ャ'], ['ｭ', 'ュ'], ['ｮ', 'ョ'], ['ｯ', 'ッ'],
    ['ｰ', 'ー'], ['ｱ', 'ア'], ['ｲ', 'イ'], ['ｳ', 'ウ'], ['ｴ', 'エ'],
    ['ｵ', 'オ'], ['ｶ', 'カ'], ['ｷ', 'キ'], ['ｸ', 'ク'], ['ｹ', 'ケ'],
    ['ｺ', 'コ'], ['ｻ', 'サ'], ['ｼ', 'シ'], ['ｽ', 'ス'], ['ｾ', 'セ'],
    ['ｿ', 'ソ'], ['ﾀ', 'タ'], ['ﾁ', 'チ'], ['ﾂ', 'ツ'], ['ﾃ', 'テ'],
    ['ﾄ', 'ト'], ['ﾅ', 'ナ'], ['ﾆ', 'ニ'], ['ﾇ', 'ヌ'], ['ﾈ', 'ネ'],
    ['ﾉ', 'ノ'], ['ﾊ', 'ハ'], ['ﾋ', 'ヒ'], ['ﾌ', 'フ'], ['ﾍ', 'ヘ'],
    ['ﾎ', 'ホ'], ['ﾏ', 'マ'], ['ﾐ', 'ミ'], ['ﾑ', 'ム'], ['ﾒ', 'メ'],
    ['ﾓ', 'モ'], ['ﾔ', 'ヤ'], ['ﾕ', 'ユ'], ['ﾖ', 'ヨ'], ['ﾗ', 'ラ'],
    ['ﾘ', 'リ'], ['ﾙ', 'ル'], ['ﾚ', 'レ'], ['ﾛ', 'ロ'], ['ﾜ', 'ワ'],
    ['ﾝ', 'ン'], ['ﾞ', '゛'], ['ﾟ', '゜'],
  ];

  // Voiced and semi-voiced Katakana (two half-width chars <-> one full-width char)
  const VOICED_KANA_PAIRS = [
    ['ｶﾞ', 'ガ'], ['ｷﾞ', 'ギ'], ['ｸﾞ', 'グ'], ['ｹﾞ', 'ゲ'], ['ｺﾞ', 'ゴ'],
    ['ｻﾞ', 'ザ'], ['ｼﾞ', 'ジ'], ['ｽﾞ', 'ズ'], ['ｾﾞ', 'ゼ'], ['ｿﾞ', 'ゾ'],
    ['ﾀﾞ', 'ダ'], ['ﾁﾞ', 'ヂ'], ['ﾂﾞ', 'ヅ'], ['ﾃﾞ', 'デ'], ['ﾄﾞ', 'ド'],
    ['ﾊﾞ', 'バ'], ['ﾋﾞ', 'ビ'], ['ﾌﾞ', 'ブ'], ['ﾍﾞ', 'ベ'], ['ﾎﾞ', 'ボ'],
    ['ﾊﾟ', 'パ'], ['ﾋﾟ', 'ピ'], ['ﾌﾟ', 'プ'], ['ﾍﾟ', 'ペ'], ['ﾎﾟ', 'ポ'],
    ['ｳﾞ', 'ヴ'], ['ﾜﾞ', 'ヷ'], ['ｦﾞ', 'ヺ'],
  ];

  const JP_PUNCT_PAIRS = [
    ['｡', '。'],
    ['｢', '「'],
    ['｣', '」'],
    ['､', '、'],
    ['･', '・'],
  ];

  const EXTRA_SYMBOL_PAIRS = [
    ['¢', '￠'],
    ['£', '￡'],
    ['¬', '￢'],
    ['¯', '￣'],
    ['¦', '￤'],
    ['¥', '￥'],
    ['₩', '￦'],
  ];

  const HALF_KANA_TO_FULL = new Map(KANA_PAIRS);
  const FULL_KANA_TO_HALF = new Map(KANA_PAIRS.map(([h, f]) => [f, h]));
  const HALF_VOICED_TO_FULL = new Map(VOICED_KANA_PAIRS);

  for (const [h, f] of VOICED_KANA_PAIRS) {
    FULL_KANA_TO_HALF.set(f, h);
  }

  // Handle decomposed NFD full-width katakana (e.g. カ + \u3099) or mixed (カ + ﾞ)
  const DECOMPOSED_TO_FULL = new Map();
  for (const [halfSeq, fullPrecomposed] of VOICED_KANA_PAIRS) {
    const baseHalf = halfSeq[0];
    const markHalf = halfSeq[1];
    const baseFull = HALF_KANA_TO_FULL.get(baseHalf);
    if (baseFull) {
      const combining = markHalf === 'ﾞ' ? '\u3099' : '\u309A';
      const standalone = markHalf === 'ﾞ' ? '\u309B' : '\u309C';
      DECOMPOSED_TO_FULL.set(baseFull + combining, fullPrecomposed);
      DECOMPOSED_TO_FULL.set(baseFull + markHalf, fullPrecomposed);
      DECOMPOSED_TO_FULL.set(baseFull + standalone, fullPrecomposed);
      DECOMPOSED_TO_FULL.set(baseHalf + combining, fullPrecomposed);
    }
  }

  const HALF_PUNCT_TO_FULL = new Map(JP_PUNCT_PAIRS);
  const FULL_PUNCT_TO_HALF = new Map(JP_PUNCT_PAIRS.map(([h, f]) => [f, h]));

  const HALF_EXTRA_SYM_TO_FULL = new Map(EXTRA_SYMBOL_PAIRS);
  const FULL_EXTRA_SYM_TO_HALF = new Map(EXTRA_SYMBOL_PAIRS.map(([h, f]) => [f, h]));

  const DASH_VARIANTS = new Set(['\u2212', '\u2010', '\u2011', '\u2012', '\u2013']);
  const WAVE_DASH = '\u301C';

  function isHalfAsciiLetter(code) {
    return (code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A);
  }

  function isFullAsciiLetter(code) {
    return (code >= 0xFF21 && code <= 0xFF3A) || (code >= 0xFF41 && code <= 0xFF5A);
  }

  function isHalfAsciiDigit(code) {
    return code >= 0x30 && code <= 0x39;
  }

  function isFullAsciiDigit(code) {
    return code >= 0xFF10 && code <= 0xFF19;
  }

  function isHalfAsciiSymbol(code) {
    return (
      (code >= 0x21 && code <= 0x2F) ||
      (code >= 0x3A && code <= 0x40) ||
      (code >= 0x5B && code <= 0x60) ||
      (code >= 0x7B && code <= 0x7E)
    );
  }

  function isFullAsciiSymbol(code) {
    return (
      (code >= 0xFF01 && code <= 0xFF0F) ||
      (code >= 0xFF1A && code <= 0xFF20) ||
      (code >= 0xFF3B && code <= 0xFF40) ||
      (code >= 0xFF5B && code <= 0xFF5E)
    );
  }

  // Marks that ride on the previous character: combining marks, ZWJ,
  // variation selectors, and emoji skin tones. No rule converts them.
  const GLUE_RE = /^[\p{M}‍︀-️\u{1F3FB}-\u{1F3FF}]$/u;

  function convertChar(ch, rules) {
    // Katakana
    if (rules.katakana === 'full' && HALF_KANA_TO_FULL.has(ch)) return HALF_KANA_TO_FULL.get(ch);
    if (rules.katakana === 'half' && FULL_KANA_TO_HALF.has(ch)) return FULL_KANA_TO_HALF.get(ch);

    // Japanese punctuation (。、「」・ <-> ｡｢｣､･)
    if (rules.jpPunct === 'full' && HALF_PUNCT_TO_FULL.has(ch)) return HALF_PUNCT_TO_FULL.get(ch);
    if (rules.jpPunct === 'half' && FULL_PUNCT_TO_HALF.has(ch)) return FULL_PUNCT_TO_HALF.get(ch);

    // Spaces (' ' <-> '　')
    if (rules.spaces === 'full' && ch === ' ') return '　';
    if (rules.spaces === 'half' && ch === '　') return ' ';

    const code = ch.codePointAt(0);

    // Letters
    if (rules.letters === 'full' && isHalfAsciiLetter(code)) return String.fromCodePoint(code + 0xFEE0);
    if (rules.letters === 'half' && isFullAsciiLetter(code)) return String.fromCodePoint(code - 0xFEE0);

    // Digits
    if (rules.digits === 'full' && isHalfAsciiDigit(code)) return String.fromCodePoint(code + 0xFEE0);
    if (rules.digits === 'half' && isFullAsciiDigit(code)) return String.fromCodePoint(code - 0xFEE0);

    // Symbols
    if (rules.symbols === 'full') {
      if (isHalfAsciiSymbol(code)) return String.fromCodePoint(code + 0xFEE0);
      if (HALF_EXTRA_SYM_TO_FULL.has(ch)) return HALF_EXTRA_SYM_TO_FULL.get(ch);
      if (rules.normalizeVariants) {
        if (ch === WAVE_DASH) return '～';
        if (DASH_VARIANTS.has(ch)) return '－';
      }
    } else if (rules.symbols === 'half') {
      if (isFullAsciiSymbol(code)) return String.fromCodePoint(code - 0xFEE0);
      if (FULL_EXTRA_SYM_TO_HALF.has(ch)) return FULL_EXTRA_SYM_TO_HALF.get(ch);
      if (rules.normalizeVariants) {
        if (ch === WAVE_DASH) return '~';
        if (DASH_VARIANTS.has(ch)) return '-';
      }
    }

    return ch;
  }

  // Splits text into units that convert on their own: one character, or a kana
  // with its voicing mark. Where a unit starts and ends depends only on the
  // text, never on the rules, so a unit keeps its place when the rules change.
  function segmentWidth(text, rawRules) {
    const rules = { ...PRESETS.standard, ...(rawRules || {}) };
    const segs = [];
    if (!text) return segs;

    const chars = Array.from(text);

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const next = i + 1 < chars.length ? chars[i + 1] : '';
      let src = ch;
      let out;

      // Two-character katakana (half-width voiced/semi-voiced or NFD decomposed)
      const composed = next ? HALF_VOICED_TO_FULL.get(ch + next) || DECOMPOSED_TO_FULL.get(ch + next) : undefined;
      if (composed) {
        src = ch + next;
        if (rules.katakana === 'full') out = composed;
        else if (rules.katakana === 'half') out = FULL_KANA_TO_HALF.get(composed);
        else out = src;
        i += 1;
      } else {
        out = convertChar(ch, rules);
      }

      if (ch !== '\n' && ch !== '\r') {
        while (i + 1 < chars.length && GLUE_RE.test(chars[i + 1])) {
          src += chars[i + 1];
          out += chars[i + 1];
          i += 1;
        }
      }

      segs.push({ src, out });
    }

    return segs;
  }

  function convertWidth(text, rawRules) {
    let out = '';
    for (const seg of segmentWidth(text, rawRules)) out += seg.out;
    return out;
  }

  function classifyChar(ch) {
    if (ch === '\n' || ch === '\r') return 'newline';
    if (ch === '\u3000') return 'full-space';

    const code = ch.codePointAt(0);

    if (
      isFullAsciiLetter(code) ||
      isFullAsciiDigit(code) ||
      isFullAsciiSymbol(code) ||
      FULL_EXTRA_SYM_TO_HALF.has(ch)
    ) {
      return 'full-ascii';
    }

    if (HALF_KANA_TO_FULL.has(ch) || HALF_PUNCT_TO_FULL.has(ch)) {
      return 'half-kana';
    }

    if (
      (code >= 0x20 && code <= 0x7E) ||
      HALF_EXTRA_SYM_TO_FULL.has(ch) ||
      ch === '\t'
    ) {
      return 'half-ascii';
    }

    // Native CJK / Hiragana / Full-width Katakana / CJK symbols / Emoji
    if (
      (code >= 0x1100 && code <= 0x11FF) ||
      (code >= 0x2E80 && code <= 0x9FFF) ||
      (code >= 0xAC00 && code <= 0xD7AF) ||
      (code >= 0xF900 && code <= 0xFAFF) ||
      (code >= 0xFE30 && code <= 0xFE6F) ||
      (code >= 0x20000 && code <= 0x3FFFF) ||
      (code >= 0x1F000 && code <= 0x1FAFF)
    ) {
      return 'jp-wide';
    }

    return 'other-half';
  }

  function analyzeText(text) {
    const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
    const stats = {
      chars: 0,
      full: 0,
      half: 0,
      widthUnits: 0,
      bytes: encoder ? encoder.encode(text || '').length : Buffer.byteLength(text || '', 'utf8'),
      fullAscii: 0,
      fullSpaces: 0,
      halfKana: 0,
    };

    if (!text) return stats;

    for (const ch of text) {
      const kind = classifyChar(ch);
      if (kind === 'newline') continue;
      stats.chars += 1;
      if (kind === 'full-ascii' || kind === 'full-space' || kind === 'jp-wide') {
        stats.full += 1;
        stats.widthUnits += 2;
      } else {
        stats.half += 1;
        stats.widthUnits += 1;
      }
      if (kind === 'full-ascii') stats.fullAscii += 1;
      if (kind === 'full-space') stats.fullSpaces += 1;
      if (kind === 'half-kana') stats.halfKana += 1;
    }

    return stats;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PRESETS, convertWidth, segmentWidth, classifyChar, analyzeText };
  }

  if (typeof document === 'undefined') return;

  // --- Browser UI ---
  const SAMPLE_TEXT = [
    '山田　ﾀﾛｳ（ＹＡＭＡＤＡ　ＴＡＲＯ）',
    '〒１５０－０００１　東京都渋谷区神宮前１－２－３',
    'ﾒｰﾙ：ｔａｒｏ．ｙａｍａｄａ＠ｅｘａｍｐｌｅ．ｊｐ',
    'ﾒﾓ：ﾋﾞｰﾙとｺｰﾋｰを２本、１０：３０〜１２：００に注文｡',
  ].join('\n');

  const RULE_KEYS = ['letters', 'digits', 'symbols', 'spaces', 'katakana', 'jpPunct'];

  // Past this many units the fair copy is drawn as ruled text instead of cells.
  const CELL_LIMIT = 4000;
  const ANIMATE_LIMIT = 600;
  const MAX_COLS = 20;

  const SEAL_STATES = {
    allHalf: { char: '半', label: 'To half-width', route: '全角 → 半角' },
    allFull: { char: '全', label: 'To full-width', route: '半角 → 全角' },
    standard: { char: '標', label: 'Japanese standard', route: '標準' },
    custom: { char: '混', label: 'Custom rules', route: '混合' },
  };

  const KIND_LABELS = {
    'full-ascii': 'full-width ASCII/symbol',
    'full-space': 'full-width ideographic space',
    'half-kana': 'half-width katakana/punctuation',
    'half-ascii': 'half-width',
    'jp-wide': 'full-width',
    'other-half': 'half-width',
  };

  const els = {
    sheet: document.getElementById('sheet'),
    presetButtons: [...document.querySelectorAll('.preset-btn')],
    segGroups: [...document.querySelectorAll('.seg[data-rule]')],
    advancedDetails: document.querySelector('.advanced-rules'),
    normalizeVariants: document.getElementById('normalize-variants'),
    input: document.getElementById('input-text'),
    output: document.getElementById('output-text'),
    cells: document.getElementById('output-cells'),
    cellsScroll: document.getElementById('cells-scroll'),
    inputStats: document.getElementById('input-stats'),
    outputStats: document.getElementById('output-stats'),
    outputBytes: document.getElementById('output-bytes'),
    diagnosticSummary: document.getElementById('diagnostic-summary'),
    inspectLegend: document.getElementById('inspect-legend'),
    sampleBtn: document.getElementById('sample-btn'),
    pasteBtn: document.getElementById('paste-btn'),
    clearBtn: document.getElementById('clear-btn'),
    inspectBtn: document.getElementById('inspect-btn'),
    swapBtn: document.getElementById('swap-btn'),
    copyBtn: document.getElementById('copy-btn'),
    seal: document.getElementById('seal-btn'),
    sealChar: document.getElementById('seal-char'),
    sealLabel: document.getElementById('seal-label'),
    sealRoute: document.getElementById('seal-route'),
    gridDims: document.getElementById('grid-dims'),
  };

  const MAX_SAVED_INPUT_CHARS = 200_000;

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function savePrefs() {
    const advancedOpen = Boolean(els.advancedDetails?.open);
    const rawInput = els.input.value;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        rules,
        inspectMode,
        advancedOpen,
        inputText: rawInput.length <= MAX_SAVED_INPUT_CHARS ? rawInput : '',
      }));
    } catch {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules, inspectMode, advancedOpen }));
      } catch {}
    }
  }

  const saved = loadPrefs();
  const rules = { ...PRESETS.allHalf, ...(saved?.rules || {}) };
  let inspectMode = Boolean(saved?.inspectMode);
  let outputText = '';
  let slots = [];
  let plainMode = false;
  let metrics = null;
  let cols = MAX_COLS;

  if (typeof saved?.inputText === 'string') {
    els.input.value = saved.inputText;
  }
  if (els.advancedDetails && typeof saved?.advancedOpen === 'boolean') {
    els.advancedDetails.open = saved.advancedOpen;
  }

  function matchingPreset() {
    for (const [name, preset] of Object.entries(PRESETS)) {
      if (RULE_KEYS.every((k) => rules[k] === preset[k])) {
        return name;
      }
    }
    return null;
  }

  function syncControlsUI() {
    const activePreset = matchingPreset();
    els.presetButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.preset === activePreset));
    });

    els.segGroups.forEach((group) => {
      const val = rules[group.dataset.rule];
      group.querySelectorAll('button').forEach((btn) => {
        if (!btn.dataset.val) return;
        btn.setAttribute('aria-pressed', String(btn.dataset.val === val));
      });
    });

    const seal = SEAL_STATES[activePreset || 'custom'];
    els.sealChar.textContent = seal.char;
    els.sealLabel.textContent = seal.label;
    els.sealRoute.textContent = seal.route;
    els.seal.setAttribute(
      'aria-label',
      `Direction: ${seal.label}. Press to switch to ${activePreset === 'allHalf' ? 'full-width' : 'half-width'}.`,
    );

    els.normalizeVariants.checked = Boolean(rules.normalizeVariants);
    els.inspectBtn.setAttribute('aria-pressed', String(inspectMode));
    els.sheet.classList.toggle('inspect', inspectMode);
    els.inspectLegend.hidden = !inspectMode;
  }

  function formatStats(s) {
    return `${s.chars} chars · ${s.full} full · ${s.half} half · ${s.widthUnits}w`;
  }

  // --- Layout: how many squares fit, and how tall the draft is ---
  // The sheet is sized from the grid outwards, so the frame hugs the squares
  // and nothing is left over at the edges.
  function layout() {
    if (typeof getComputedStyle !== 'function') return;
    const root = document.documentElement;
    const cs = getComputedStyle(els.sheet);
    const px = (name) => parseFloat(cs.getPropertyValue(name)) || 0;
    const u = px('--u') || 13;
    metrics = {
      u,
      pitch: u * 2 + (px('--gap') || 12),
      minRows: parseInt(cs.getPropertyValue('--min-rows'), 10) || 8,
      maxRows: parseInt(cs.getPropertyValue('--max-rows'), 10) || 18,
    };

    const bodyStyle = getComputedStyle(document.body);
    const avail = Math.min(
      document.body.clientWidth - parseFloat(bodyStyle.paddingLeft) - parseFloat(bodyStyle.paddingRight),
      px('--max-w') || 1304,
    );
    const pages = parseInt(cs.getPropertyValue('--pages'), 10) || 2;
    const padX = px('--pad-x');
    const gutterW = px('--gutter-w');
    const frame = (px('--body-pad') + px('--body-border')) * 2;
    const scrollbar = els.cellsScroll.offsetWidth - els.cellsScroll.clientWidth;
    const pageAvail = (avail - padX * 2 - gutterW) / pages;

    cols = Math.max(4, Math.min(MAX_COLS, Math.floor((pageAvail - frame - scrollbar - 1) / (u * 2))));
    const pageW = cols * u * 2 + 1 + frame + scrollbar;
    root.style.setProperty('--cols', String(cols));
    root.style.setProperty('--page-w', `${pageW}px`);
    root.style.setProperty('--sb', `${scrollbar / 2}px`);
    root.style.setProperty('--sheet-w', `${pageW * pages + gutterW + padX * 2}px`);

    autosize();
    printDims();
  }

  function autosize() {
    if (!metrics) return;
    els.input.style.height = 'auto';
    const rows = Math.ceil(els.input.scrollHeight / metrics.pitch);
    els.input.style.height = `${Math.max(metrics.minRows, Math.min(metrics.maxRows, rows)) * metrics.pitch}px`;
  }

  // Manuscript paper prints its own size in the margin (20×20). So does this one.
  function printDims() {
    if (!metrics) return;
    const rows = Math.max(metrics.minRows, Math.round(els.cells.offsetHeight / metrics.pitch));
    els.gridDims.textContent = `${cols} × ${rows}`;
  }

  // --- Cells ---
  // Some characters outside the full-width ranges still draw a full square in
  // Japanese fonts (※, →, ①). Measure those once so they get a cell that fits.
  const wideCache = new Map();
  let measure = null;

  function looksWide(ch) {
    if (wideCache.has(ch)) return wideCache.get(ch);
    let wide = false;
    try {
      if (measure === null) {
        const ctx = document.createElement('canvas').getContext('2d');
        const cs = getComputedStyle(els.cells);
        ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
        measure = { ctx, ref: ctx.measureText('あ').width };
      }
      wide = measure.ref > 0 && measure.ctx.measureText(ch).width > measure.ref * 0.75;
    } catch {
      measure = measure || { ctx: { measureText: () => ({ width: 0 }) }, ref: 0 };
    }
    wideCache.set(ch, wide);
    return wide;
  }

  function makeCells(out) {
    const cells = [];
    for (const ch of out) {
      if (ch === '\r') continue;
      if (cells.length && GLUE_RE.test(ch)) {
        cells[cells.length - 1].textContent += ch;
        continue;
      }
      const kind = classifyChar(ch);
      const drawnWide = kind === 'other-half' && looksWide(ch);
      const wide = kind === 'full-ascii' || kind === 'full-space' || kind === 'jp-wide' || drawnWide;
      const cell = document.createElement('i');
      let cls = wide ? 'c f' : 'c';
      if (kind === 'full-ascii' || kind === 'full-space' || kind === 'half-kana') cls += ` k-${kind}`;
      if (ch === ' ') cls += ' sp';
      if (ch === '\t') cls += ' tab';
      cell.className = cls;
      cell.textContent = ch === '\t' ? '' : ch;
      const codeHex = `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
      cell.title = `${codeHex} · ${drawnWide ? 'drawn wide in this font' : KIND_LABELS[kind] || 'half-width'}`;
      cells.push(cell);
    }
    return cells;
  }

  function buildSlot(seg) {
    const node = document.createElement('span');
    if (seg.src === '\n') {
      node.className = 'br';
      node.textContent = '\n';
    } else {
      node.className = 's';
      node.replaceChildren(...makeCells(seg.out));
    }
    return { src: seg.src, out: seg.out, node };
  }

  function animationContext() {
    if (typeof Element === 'undefined' || typeof Element.prototype.animate !== 'function') return null;
    if (globalScope.matchMedia && globalScope.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
    if (!metrics) return null;
    const cs = getComputedStyle(els.sheet);
    return {
      u: metrics.u,
      seal: cs.getPropertyValue('--seal').trim() || '#cf3f27',
      ink: cs.getPropertyValue('--ink').trim() || '#1d1b18',
    };
  }

  // Re-ink one slot after a rule change. A cell that changes width is squeezed
  // or stretched into its new size, in wet seal ink that dries to black.
  function morph(slot, out, anim, order) {
    const before = slot.node.children.length === 1 ? slot.node.children[0] : null;
    const wasWide = Boolean(before && before.classList.contains('f'));
    const cells = makeCells(out);
    slot.out = out;
    slot.node.replaceChildren(...cells);
    if (!anim) return;

    const delay = Math.min(order * 7, 500);
    for (const cell of cells) {
      const isWide = cell.classList.contains('f');
      if (before && cells.length === 1 && wasWide !== isWide) {
        const from = wasWide ? anim.u * 2 : anim.u;
        const to = isWide ? anim.u * 2 : anim.u;
        cell.animate(
          [
            { width: `${from}px`, transform: `scaleX(${from / to})` },
            { width: `${to}px`, transform: 'scaleX(1)' },
          ],
          { duration: 380, delay, easing: 'cubic-bezier(0.3, 0.9, 0.3, 1)', fill: 'backwards' },
        );
      } else {
        cell.animate(
          [{ transform: 'scale(1.25)', opacity: 0.3 }, { transform: 'scale(1)', opacity: 1 }],
          { duration: 260, delay, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
      }
      cell.animate([{ color: anim.seal }, { color: anim.ink }], { duration: 900, delay, easing: 'ease-out' });
    }
  }

  // Newly written slots strike the paper, like type.
  function strike(fresh) {
    if (!fresh.length || fresh.length > ANIMATE_LIMIT) return;
    if (!animationContext()) return;
    const typed = fresh.length <= 2;
    fresh.forEach((slot, i) => {
      for (const cell of slot.node.children) {
        cell.animate(
          [{ opacity: 0, transform: 'scale(1.3)' }, { opacity: 1, transform: 'scale(1)' }],
          {
            duration: typed ? 130 : 220,
            delay: typed ? 0 : Math.min(i * 4, 320),
            easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
            fill: 'backwards',
          },
        );
      }
    });
  }

  function renderPlain(text) {
    const nodes = [];
    let plainBuf = '';
    const flushPlain = () => {
      if (plainBuf) {
        nodes.push(document.createTextNode(plainBuf));
        plainBuf = '';
      }
    };

    for (const ch of text) {
      const kind = classifyChar(ch);
      if (kind === 'full-ascii' || kind === 'full-space' || kind === 'half-kana') {
        flushPlain();
        const mark = document.createElement('mark');
        mark.className = `tok k-${kind}`;
        mark.textContent = ch;
        nodes.push(mark);
      } else {
        plainBuf += ch;
      }
    }
    flushPlain();
    els.cells.replaceChildren(...nodes);
  }

  function renderSheet(segs, reason) {
    const plain = segs.length > CELL_LIMIT;
    els.sheet.classList.toggle('is-empty', segs.length === 0);
    els.cells.classList.toggle('plain', plain);

    if (plain) {
      renderPlain(outputText);
      slots = [];
      plainMode = true;
      return;
    }
    if (plainMode) {
      els.cells.replaceChildren();
      plainMode = false;
    }

    // Same draft, new rules: re-ink the slots that changed, where they sit.
    if (reason === 'rules' && slots.length === segs.length && segs.every((seg, i) => seg.src === slots[i].src)) {
      const anim = animationContext();
      let order = 0;
      for (let i = 0; i < segs.length; i++) {
        if (slots[i].out === segs[i].out) continue;
        morph(slots[i], segs[i].out, order < ANIMATE_LIMIT ? anim : null, order);
        order += 1;
      }
      return;
    }

    // The draft changed: keep the slots before and after the edit, rebuild the middle.
    const same = (slot, seg) => slot.src === seg.src && slot.out === seg.out;
    const max = Math.min(slots.length, segs.length);
    let head = 0;
    while (head < max && same(slots[head], segs[head])) head += 1;
    let tail = 0;
    while (tail < max - head && same(slots[slots.length - 1 - tail], segs[segs.length - 1 - tail])) tail += 1;

    const fresh = segs.slice(head, segs.length - tail).map(buildSlot);
    const removed = slots.slice(head, slots.length - tail);
    const kept = slots.slice(slots.length - tail);
    const next = slots.slice(0, head).concat(fresh, kept);

    if (typeof els.cells.insertBefore === 'function') {
      for (const slot of removed) slot.node.remove();
      const frag = document.createDocumentFragment();
      for (const slot of fresh) frag.appendChild(slot.node);
      els.cells.insertBefore(frag, kept.length ? kept[0].node : null);
    } else {
      els.cells.replaceChildren(...next.map((slot) => slot.node));
    }

    slots = next;
    if (reason === 'input') strike(fresh);
  }

  function renderDiagnostics(inStats, outStats, inputText) {
    if (!inputText) {
      els.diagnosticSummary.textContent = 'Ready. Paste or type Japanese text to convert.';
      return;
    }
    const flags = [];
    if (outStats.fullAscii > 0) flags.push(`${outStats.fullAscii} full-width ASCII`);
    if (outStats.fullSpaces > 0) flags.push(`${outStats.fullSpaces} full-width ${outStats.fullSpaces === 1 ? 'space' : 'spaces'}`);
    if (outStats.halfKana > 0) flags.push(`${outStats.halfKana} half-width katakana`);

    const prefix = inputText !== outputText ? 'Converted' : 'No changes';
    const tail = flags.length
      ? `Output includes ${flags.join(', ')}.`
      : 'No full-width ASCII, full-width spaces, or half-width katakana remain.';
    const long = plainMode ? ' Long text is shown without cells.' : '';
    els.diagnosticSummary.textContent = `${prefix} (${inStats.widthUnits}w → ${outStats.widthUnits}w). ${tail}${long}`;
  }

  // reason: 'input' when the draft changed, 'rules' when only the rules did, 'init' on load.
  function update(reason) {
    const inputText = els.input.value;
    const segs = segmentWidth(inputText, rules);
    outputText = '';
    for (const seg of segs) outputText += seg.out;
    els.output.value = outputText;
    if (reason !== 'init' && inputText && outputText) window.memoToolTelemetry?.converted();

    renderSheet(segs, reason);

    const inStats = analyzeText(inputText);
    const outStats = analyzeText(outputText);
    els.inputStats.textContent = formatStats(inStats);
    els.outputStats.textContent = formatStats(outStats);
    els.outputBytes.textContent = `${outStats.bytes} UTF-8 B`;
    renderDiagnostics(inStats, outStats, inputText);

    autosize();
    printDims();
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    const keepVariants = rules.normalizeVariants;
    Object.assign(rules, preset, { normalizeVariants: keepVariants });
    syncControlsUI();
    update('rules');
    savePrefs();
  }

  // --- Events ---
  els.seal.addEventListener('click', () => {
    applyPreset(matchingPreset() === 'allHalf' ? 'allFull' : 'allHalf');
    if (animationContext()) {
      els.seal.animate(
        [
          { scale: '1.16', rotate: '-8deg' },
          { scale: '0.88', rotate: '-1deg', offset: 0.42 },
          { scale: '1', rotate: '-3deg' },
        ],
        { duration: 340, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
      );
    }
  });

  els.presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });

  els.segGroups.forEach((group) => {
    const ruleName = group.dataset.rule;
    group.querySelectorAll('button').forEach((btn) => {
      if (!btn.dataset.val) return;
      btn.addEventListener('click', () => {
        rules[ruleName] = btn.dataset.val;
        syncControlsUI();
        update('rules');
        savePrefs();
      });
    });
  });

  els.normalizeVariants.addEventListener('change', () => {
    rules.normalizeVariants = els.normalizeVariants.checked;
    update('rules');
    savePrefs();
  });

  els.input.addEventListener('input', () => {
    update('input');
    savePrefs();
  });

  els.sampleBtn.addEventListener('click', () => {
    els.input.value = SAMPLE_TEXT;
    update('input');
    savePrefs();
    els.input.focus();
  });

  els.clearBtn.addEventListener('click', () => {
    els.input.value = '';
    update('input');
    savePrefs();
    els.input.focus();
  });

  els.pasteBtn.addEventListener('click', async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      els.diagnosticSummary.textContent = 'Clipboard read is unavailable here. Press Cmd/Ctrl+V inside the Draft.';
      els.input.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      els.input.value = text;
      update('input');
      savePrefs();
    } catch {
      els.diagnosticSummary.textContent = 'Clipboard read was blocked by your browser. Press Cmd/Ctrl+V inside the Draft.';
      els.input.focus();
    }
  });

  els.advancedDetails?.addEventListener('toggle', savePrefs);
  window.addEventListener('pagehide', savePrefs);
  window.addEventListener('beforeunload', savePrefs);

  els.inspectBtn.addEventListener('click', () => {
    inspectMode = !inspectMode;
    syncControlsUI();
    savePrefs();
  });

  els.swapBtn.addEventListener('click', () => {
    els.input.value = outputText;
    for (const key of RULE_KEYS) {
      if (rules[key] === 'full') rules[key] = 'half';
      else if (rules[key] === 'half') rules[key] = 'full';
    }
    syncControlsUI();
    update('input');
    savePrefs();
    els.input.focus();
  });

  let copyTimer = null;
  els.copyBtn.addEventListener('click', async () => {
    if (!outputText) return;
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(outputText);
      els.copyBtn.textContent = 'Copied';
      els.copyBtn.disabled = true;
    } catch {
      els.copyBtn.textContent = 'Copy failed';
      els.diagnosticSummary.textContent = 'Copy was blocked. Select the fair copy and press Cmd/Ctrl+C.';
    }
    copyTimer = setTimeout(() => {
      els.copyBtn.textContent = 'Copy';
      els.copyBtn.disabled = false;
    }, 1600);
  });

  if (typeof ResizeObserver !== 'undefined') {
    let lastWidth = -1;
    new ResizeObserver(() => {
      const width = document.body.clientWidth;
      if (width === lastWidth) return;
      lastWidth = width;
      layout();
    }).observe(document.body);
  }

  syncControlsUI();
  layout();
  update('init');
})(typeof window !== 'undefined' ? window : globalThis);
