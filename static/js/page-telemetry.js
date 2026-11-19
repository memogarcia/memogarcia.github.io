// First-party browser counts and temporary tab sessions. Only our own records are read.
(() => {
  'use strict';
  const blocked = () => navigator.globalPrivacyControl || navigator.webdriver ||
    [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack]
      .some((value) => value === '1' || value === 'yes');
  if (location.origin !== 'https://memo.mx' || blocked() || window.memoPageTelemetry) return;
  const script = document.currentScript;
  const tools = ['/tools/', '/tools/pomodoro/', '/tools/breathing/', '/tools/meditation/',
    '/tools/fasting/', '/tools/zenkaku-hankaku/', '/tools/typewriter/', '/tools/cut/'];
  const section = script?.dataset.section === 'posts' ? 'posts' : 'tools';
  const path = section === 'posts' ? script.dataset.page : location.pathname;
  if (section === 'tools' ? !tools.includes(path) :
    !/^\/posts\/[a-zA-Z0-9_%.-]+\/$/.test(path || '') || path !== location.pathname) return;
  if (!crypto.randomUUID) return;
  window.memoPageTelemetry = true;
  let source = 'Direct';
  try {
    const ref = new URL(document.referrer);
    if (['http:', 'https:'].includes(ref.protocol) && !/^\d+(\.\d+){3}$/.test(ref.hostname)) source = ref.hostname.slice(0, 120);
  } catch { /* Missing referrer is direct or unavailable. */ }
  const language = /^[a-z]{2}$/i.test((navigator.language || '').split('-')[0])
    ? navigator.language.split('-')[0].toLowerCase() : 'Unknown';
  const campaignValue = new URLSearchParams(location.search).get('utm_campaign');
  const campaign = !campaignValue ? 'None' : ['newsletter', 'tools', 'blog', 'launch'].includes(campaignValue) ? campaignValue : 'Other';
  const audience = { source, language, campaign, tracking_version: 2 };
  const visitorKey = 'memo.telemetry.visitor.v1';
  const visitorLifetime = 30 * 24 * 60 * 60_000;
  function visitorID() {
    if (blocked()) return null;
    try {
      const now = Date.now();
      let record;
      try { record = JSON.parse(localStorage.getItem(visitorKey)); } catch { /* Replace malformed data. */ }
      if (record && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(record.id) &&
          Number.isFinite(record.createdAt) && now >= record.createdAt && now - record.createdAt < visitorLifetime) return record.id;
      const fresh = { id: crypto.randomUUID(), createdAt: now };
      localStorage.setItem(visitorKey, JSON.stringify(fresh));
      return fresh.id;
    } catch { return null; } // Unavailable storage means unmeasured visitors, never a fingerprint.
  }
  let action = null, converted = false;
  const visitContext = () => ({ session, visit, sequence, startedAt });
  window.memoToolTelemetry = {
    begin() {
      if (blocked() || ended || action || section !== 'tools' || path === '/tools/') return;
      action = { id: crypto.randomUUID(), context: visitContext() };
      send('tool_started', { path, section, action_id: action.id }, action.context);
    },
    finish() {
      if (!action) return;
      send('tool_completed', { path, section, action_id: action.id }, action.context);
      action = null;
    },
    cancel() { action = null; },
    converted() {
      if (converted) return;
      converted = true;
      this.begin(); this.finish();
    },
  };
  const key = 'tel_pub_73d038b5f46d81325026b48fb92e9a96a14898afc44bf1e493e07a98c2a6ec78';
  const endpoint = 'https://telemetry.magneticenterprises.com/v1/events';
  const idleMs = 60_000;
  const storageKey = 'memo.telemetry.session.v1';
  const sessionTimeout = 30 * 60_000;
  let session, visit, sequence, startedAt, activityAt, started, measured, lastInput, activeMs, ended;
  function saveSession() {
    if (blocked()) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ id: session, sequence, activityAt })); } catch { /* Storage can be blocked. */ }
  }
  function resumeSession() {
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey)); } catch { /* Use a page-only session. */ }
    const now = Date.now();
    const valid = saved && /^[a-f0-9-]{36}$/.test(saved.id) &&
      Number.isSafeInteger(saved.sequence) && saved.sequence > 0 && saved.sequence < 1000000 &&
      Number.isFinite(saved.activityAt) && now >= saved.activityAt && now - saved.activityAt < sessionTimeout;
    session = valid ? saved.id : crypto.randomUUID();
    sequence = valid ? saved.sequence + 1 : 1;
    visit = crypto.randomUUID();
    startedAt = activityAt = now;
    saveSession();
  }
  let visible = document.visibilityState === 'visible';
  let focused = document.hasFocus();
  function send(name, properties, context = visitContext()) {
    if (blocked()) return;
    const visitor = visitorID();
    const body = JSON.stringify({ schemaVersion: 1, platform: 'web', key,
      events: [{ id: crypto.randomUUID(), sessionID: context.session, name, properties: { ...audience, ...properties, ...(visitor ? { visitor_id: visitor } : {}), visit_id: context.visit, visit_index: context.sequence, started_at_ms: context.startedAt } }] });
    try {
      if (!(navigator.sendBeacon && navigator.sendBeacon(endpoint, body))) {
        fetch(endpoint, { method: 'POST', body, keepalive: true, credentials: 'omit' }).catch(() => {});
      }
    } catch { /* A blocked collector must not interrupt reading or using a tool. */ }
  }
  function measure() {
    const now = performance.now();
    if (visible && focused) activeMs += Math.max(0, Math.min(now, lastInput + idleMs) - measured);
    measured = now;
    return now;
  }
  function snapshot(final = false) {
    if (ended) return;
    const now = measure();
    send('page_session', { path, section,
      open_seconds: Math.floor((now - started) / 1000),
      active_seconds: Math.floor(activeMs / 1000), ended: final });
    if (final) ended = true;
  }
  function start() {
    converted = false;
    resumeSession();
    started = measured = lastInput = performance.now();
    activeMs = 0;
    ended = false;
    visible = document.visibilityState === 'visible';
    focused = document.hasFocus();
    send('page_viewed', { path, section });
    snapshot();
  }
  start();
  const interaction = () => {
    if (ended || blocked()) return;
    if (Date.now() - activityAt >= sessionTimeout) { snapshot(true); start(); }
    measure(); lastInput = performance.now(); activityAt = Date.now(); saveSession();
  };
  for (const event of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
    addEventListener(event, interaction, { passive: true });
  }
  addEventListener('focus', () => { interaction(); focused = true; });
  addEventListener('blur', () => { snapshot(); focused = false; });
  document.addEventListener('visibilitychange', () => {
    snapshot();
    visible = document.visibilityState === 'visible';
    if (visible) { focused = document.hasFocus(); interaction(); }
  });
  addEventListener('pagehide', () => snapshot(true));
  addEventListener('pageshow', (event) => { if (event.persisted && ended) start(); });
  setInterval(() => { if (visible && !ended) snapshot(); }, 30_000);
})();
