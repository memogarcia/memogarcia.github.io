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

  function convertWidth(text, rawRules) {
    const rules = { ...PRESETS.standard, ...(rawRules || {}) };
    if (!text) return '';

    const chars = Array.from(text);
    const out = [];

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const next = i + 1 < chars.length ? chars[i + 1] : '';
      const pair = ch + next;

      // 1. Two-character Katakana (half-width voiced/semi-voiced or NFD decomposed)
      if (rules.katakana !== 'keep' && next) {
        const composed = HALF_VOICED_TO_FULL.get(pair) || DECOMPOSED_TO_FULL.get(pair);
        if (composed) {
          out.push(rules.katakana === 'full' ? composed : FULL_KANA_TO_HALF.get(composed));
          i += 1;
          continue;
        }
      }

      // 2. Single-character Katakana
      if (rules.katakana === 'full' && HALF_KANA_TO_FULL.has(ch)) {
        out.push(HALF_KANA_TO_FULL.get(ch));
        continue;
      }
      if (rules.katakana === 'half' && FULL_KANA_TO_HALF.has(ch)) {
        out.push(FULL_KANA_TO_HALF.get(ch));
        continue;
      }

      // 3. Japanese punctuation (。、「」・ <-> ｡｢｣､･)
      if (rules.jpPunct === 'full' && HALF_PUNCT_TO_FULL.has(ch)) {
        out.push(HALF_PUNCT_TO_FULL.get(ch));
        continue;
      }
      if (rules.jpPunct === 'half' && FULL_PUNCT_TO_HALF.has(ch)) {
        out.push(FULL_PUNCT_TO_HALF.get(ch));
        continue;
      }

      // 4. Spaces (' ' <-> '　')
      if (rules.spaces === 'full' && ch === ' ') {
        out.push('\u3000');
        continue;
      }
      if (rules.spaces === 'half' && ch === '\u3000') {
        out.push(' ');
        continue;
      }

      const code = ch.codePointAt(0);

      // 5. Letters
      if (rules.letters === 'full' && isHalfAsciiLetter(code)) {
        out.push(String.fromCodePoint(code + 0xFEE0));
        continue;
      }
      if (rules.letters === 'half' && isFullAsciiLetter(code)) {
        out.push(String.fromCodePoint(code - 0xFEE0));
        continue;
      }

      // 6. Digits
      if (rules.digits === 'full' && isHalfAsciiDigit(code)) {
        out.push(String.fromCodePoint(code + 0xFEE0));
        continue;
      }
      if (rules.digits === 'half' && isFullAsciiDigit(code)) {
        out.push(String.fromCodePoint(code - 0xFEE0));
        continue;
      }

      // 7. Symbols
      if (rules.symbols === 'full') {
        if (isHalfAsciiSymbol(code)) {
          out.push(String.fromCodePoint(code + 0xFEE0));
          continue;
        }
        if (HALF_EXTRA_SYM_TO_FULL.has(ch)) {
          out.push(HALF_EXTRA_SYM_TO_FULL.get(ch));
          continue;
        }
        if (rules.normalizeVariants) {
          if (ch === WAVE_DASH) {
            out.push('～');
            continue;
          }
          if (DASH_VARIANTS.has(ch)) {
            out.push('－');
            continue;
          }
        }
      } else if (rules.symbols === 'half') {
        if (isFullAsciiSymbol(code)) {
          out.push(String.fromCodePoint(code - 0xFEE0));
          continue;
        }
        if (FULL_EXTRA_SYM_TO_HALF.has(ch)) {
          out.push(FULL_EXTRA_SYM_TO_HALF.get(ch));
          continue;
        }
        if (rules.normalizeVariants) {
          if (ch === WAVE_DASH) {
            out.push('~');
            continue;
          }
          if (DASH_VARIANTS.has(ch)) {
            out.push('-');
            continue;
          }
        }
      }

      out.push(ch);
    }

    return out.join('');
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
    module.exports = { PRESETS, convertWidth, classifyChar, analyzeText };
  }

  if (typeof document === 'undefined') return;

  // --- Browser UI ---
  const SAMPLE_TEXT = [
    '山田　ﾀﾛｳ（ＹＡＭＡＤＡ　ＴＡＲＯ）',
    '〒１５０－０００１　東京都渋谷区神宮前１－２－３',
    'ﾒｰﾙ：ｔａｒｏ．ｙａｍａｄａ＠ｅｘａｍｐｌｅ．ｊｐ',
    'ﾒﾓ：ﾋﾞｰﾙとｺｰﾋｰを２本、１０：３０〜１２：００に注文｡',
  ].join('\n');

  const els = {
    presetButtons: [...document.querySelectorAll('.preset-btn')],
    segGroups: [...document.querySelectorAll('.seg[data-rule]')],
    normalizeVariants: document.getElementById('normalize-variants'),
    input: document.getElementById('input-text'),
    output: document.getElementById('output-text'),
    outputInspect: document.getElementById('output-inspect'),
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
  };

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rules, inspectMode }));
    } catch {}
  }

  const saved = loadPrefs();
  const rules = { ...PRESETS.allHalf, ...(saved?.rules || {}) };
  let inspectMode = Boolean(saved?.inspectMode);

  function matchingPreset() {
    const keys = ['letters', 'digits', 'symbols', 'spaces', 'katakana', 'jpPunct'];
    for (const [name, preset] of Object.entries(PRESETS)) {
      if (keys.every((k) => rules[k] === preset[k])) {
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
      const ruleName = group.dataset.rule;
      const val = rules[ruleName];
      group.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.val === val));
      });
    });

    els.normalizeVariants.checked = Boolean(rules.normalizeVariants);
    els.inspectBtn.setAttribute('aria-pressed', String(inspectMode));
    els.output.hidden = inspectMode;
    els.outputInspect.hidden = !inspectMode;
    els.inspectLegend.hidden = !inspectMode;
  }

  function formatStats(s) {
    return `${s.chars} chars · ${s.full} full · ${s.half} half · ${s.widthUnits}w`;
  }

  function renderInspectView(text) {
    if (!text) {
      const placeholder = document.createElement('span');
      placeholder.className = 'inspect-empty';
      placeholder.textContent = 'Converted text appears here immediately.';
      els.outputInspect.replaceChildren(placeholder);
      return;
    }

    const frag = document.createDocumentFragment();
    let plainBuf = '';

    const flushPlain = () => {
      if (plainBuf) {
        frag.appendChild(document.createTextNode(plainBuf));
        plainBuf = '';
      }
    };

    for (const ch of text) {
      const kind = classifyChar(ch);
      if (kind === 'full-ascii' || kind === 'full-space' || kind === 'half-kana') {
        flushPlain();
        const mark = document.createElement('mark');
        mark.className = `tok tok-${kind}`;
        const codeHex = `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;
        const label = kind === 'full-space'
          ? 'Full-width ideographic space'
          : kind === 'full-ascii'
            ? 'Full-width ASCII/symbol'
            : 'Half-width katakana/punctuation';
        mark.title = `${codeHex} · ${label}`;
        mark.textContent = ch;
        frag.appendChild(mark);
      } else {
        plainBuf += ch;
      }
    }
    flushPlain();
    els.outputInspect.replaceChildren(frag);
  }

  function renderDiagnostics(inStats, outStats, inputText, outputText) {
    if (!inputText) {
      els.diagnosticSummary.textContent = 'Ready. Paste or type Japanese text to convert.';
      return;
    }
    const flags = [];
    if (outStats.fullAscii > 0) flags.push(`${outStats.fullAscii} full-width ASCII`);
    if (outStats.fullSpaces > 0) flags.push(`${outStats.fullSpaces} full-width ${outStats.fullSpaces === 1 ? 'space' : 'spaces'}`);
    if (outStats.halfKana > 0) flags.push(`${outStats.halfKana} half-width katakana`);

    const changed = inputText !== outputText;
    const prefix = changed ? 'Converted' : 'No changes';
    const tail = flags.length
      ? `Output includes ${flags.join(', ')}.`
      : 'No full-width ASCII, full-width spaces, or half-width katakana remain.';
    els.diagnosticSummary.textContent = `${prefix} (${inStats.widthUnits}w → ${outStats.widthUnits}w). ${tail}`;
  }

  function update() {
    const inputText = els.input.value;
    const outputText = convertWidth(inputText, rules);
    els.output.value = outputText;

    const inStats = analyzeText(inputText);
    const outStats = analyzeText(outputText);
    els.inputStats.textContent = formatStats(inStats);
    els.outputStats.textContent = formatStats(outStats);
    els.outputBytes.textContent = `${outStats.bytes} UTF-8 B`;

    if (inspectMode) {
      renderInspectView(outputText);
    }
    renderDiagnostics(inStats, outStats, inputText, outputText);
  }

  // --- Events ---
  els.presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[btn.dataset.preset];
      if (!preset) return;
      const keepVariants = rules.normalizeVariants;
      Object.assign(rules, preset, { normalizeVariants: keepVariants });
      syncControlsUI();
      update();
      savePrefs();
    });
  });

  els.segGroups.forEach((group) => {
    const ruleName = group.dataset.rule;
    group.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        rules[ruleName] = btn.dataset.val;
        syncControlsUI();
        update();
        savePrefs();
      });
    });
  });

  els.normalizeVariants.addEventListener('change', () => {
    rules.normalizeVariants = els.normalizeVariants.checked;
    update();
    savePrefs();
  });

  els.input.addEventListener('input', update);

  els.sampleBtn.addEventListener('click', () => {
    els.input.value = SAMPLE_TEXT;
    update();
    els.input.focus();
  });

  els.clearBtn.addEventListener('click', () => {
    els.input.value = '';
    update();
    els.input.focus();
  });

  els.pasteBtn.addEventListener('click', async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      els.diagnosticSummary.textContent = 'Clipboard read is unavailable here. Press Cmd/Ctrl+V inside the Input box.';
      els.input.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      els.input.value = text;
      update();
    } catch {
      els.diagnosticSummary.textContent = 'Clipboard read was blocked by your browser. Press Cmd/Ctrl+V inside the Input box.';
      els.input.focus();
    }
  });

  els.inspectBtn.addEventListener('click', () => {
    inspectMode = !inspectMode;
    syncControlsUI();
    if (inspectMode) {
      renderInspectView(els.output.value);
    }
    savePrefs();
  });

  els.swapBtn.addEventListener('click', () => {
    els.input.value = els.output.value;
    for (const key of ['letters', 'digits', 'symbols', 'spaces', 'katakana', 'jpPunct']) {
      if (rules[key] === 'full') rules[key] = 'half';
      else if (rules[key] === 'half') rules[key] = 'full';
    }
    syncControlsUI();
    update();
    savePrefs();
    els.input.focus();
  });

  let copyTimer = null;
  els.copyBtn.addEventListener('click', async () => {
    const text = els.output.value;
    if (!text) return;
    clearTimeout(copyTimer);
    try {
      await navigator.clipboard.writeText(text);
      els.copyBtn.textContent = 'Copied';
      els.copyBtn.disabled = true;
    } catch {
      els.copyBtn.textContent = 'Copy failed';
      els.diagnosticSummary.textContent = 'Copy was blocked. Select the Output text and press Cmd/Ctrl+C.';
    }
    copyTimer = setTimeout(() => {
      els.copyBtn.textContent = 'Copy';
      els.copyBtn.disabled = false;
    }, 1600);
  });

  syncControlsUI();
  update();
})(typeof window !== 'undefined' ? window : globalThis);
