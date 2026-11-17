// Anonymous tab sessions. Only our temporary session record is read from storage.
(() => {
  'use strict';
  const blocked = () => navigator.globalPrivacyControl || navigator.webdriver ||
    [navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack]
      .some((value) => value === '1' || value === 'yes');
  if (location.origin !== 'https://memo.mx' || blocked() || window.memoPageTelemetry) return;
  const script = document.currentScript;
  const tools = ['/tools/', '/tools/pomodoro/', '/tools/breathing/', '/tools/meditation/',
    '/tools/fasting/', '/tools/zenkaku-hankaku/', '/tools/typewriter/'];
  const section = script?.dataset.section === 'posts' ? 'posts' : 'tools';
  const path = section === 'posts' ? script.dataset.page : location.pathname;
  if (section === 'tools' ? !tools.includes(path) :
    !/^\/posts\/[a-zA-Z0-9_%.-]+\/$/.test(path || '') || path !== location.pathname) return;
  if (!crypto.randomUUID) return;
  window.memoPageTelemetry = true;
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
  function send(name, properties) {
    if (blocked()) return;
    const body = JSON.stringify({ schemaVersion: 1, platform: 'web', key,
      events: [{ id: crypto.randomUUID(), sessionID: session, name, properties: { ...properties, visit_id: visit, visit_index: sequence, started_at_ms: startedAt } }] });
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
