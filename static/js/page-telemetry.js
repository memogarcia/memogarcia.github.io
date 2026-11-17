// Anonymous page sessions. Nothing is read from text fields or browser storage.
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
  let session, started, measured, lastInput, activeMs, ended;
  let visible = document.visibilityState === 'visible';
  let focused = document.hasFocus();
  function send(name, properties) {
    if (blocked()) return;
    const body = JSON.stringify({ schemaVersion: 1, platform: 'web', key,
      events: [{ id: crypto.randomUUID(), sessionID: session, name, properties }] });
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
    session = crypto.randomUUID();
    started = measured = lastInput = performance.now();
    activeMs = 0;
    ended = false;
    visible = document.visibilityState === 'visible';
    focused = document.hasFocus();
    send('page_viewed', { path, section });
    snapshot();
  }
  start();
  const interaction = () => { measure(); lastInput = performance.now(); };
  for (const event of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
    addEventListener(event, interaction, { passive: true });
  }
  addEventListener('focus', () => { measure(); focused = true; lastInput = performance.now(); });
  addEventListener('blur', () => { snapshot(); focused = false; });
  document.addEventListener('visibilitychange', () => {
    snapshot();
    visible = document.visibilityState === 'visible';
    if (visible) { focused = document.hasFocus(); lastInput = performance.now(); }
  });
  addEventListener('pagehide', () => snapshot(true));
  addEventListener('pageshow', (event) => { if (event.persisted && ended) start(); });
  setInterval(() => { if (visible && !ended) snapshot(); }, 30_000);
})();
