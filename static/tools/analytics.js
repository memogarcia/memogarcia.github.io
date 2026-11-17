// Static tools bypass Hugo's analytics partial. Keep this ID in sync with config.yml.
(() => {
  'use strict';
  const measurementId = 'G-ZRB1GGCC9B';
  if (location.protocol !== 'https:' || location.hostname !== 'memo.mx') return;
  if (navigator.globalPrivacyControl || navigator.webdriver) return;
  if ([navigator.doNotTrack, window.doNotTrack, navigator.msDoNotTrack]
    .some((value) => value === '1' || value === 'yes')) return;
  if (window.memoToolsAnalyticsLoaded) return;
  window.memoToolsAnalyticsLoaded = true;

  // A dedicated write-only public key. No cookies, tool inputs or identifiers.
  const telemetryKey = 'tel_pub_73d038b5f46d81325026b48fb92e9a96a14898afc44bf1e493e07a98c2a6ec78';
  const telemetryEndpoint = 'https://telemetry.magneticenterprises.com/v1/events';
  const routes = ['/tools/', '/tools/pomodoro/', '/tools/breathing/',
    '/tools/meditation/', '/tools/fasting/', '/tools/zenkaku-hankaku/', '/tools/typewriter/'];
  if (!routes.includes(location.pathname)) return;
  const telemetryBody = JSON.stringify({
    schemaVersion: 1,
    platform: 'web',
    key: telemetryKey,
    events: [{ name: 'page_viewed', properties: { path: location.pathname } }],
  });
  // Keep either provider's failure from stopping the other or the tool itself.
  try {
    if (!(navigator.sendBeacon && navigator.sendBeacon(telemetryEndpoint, telemetryBody))) {
      fetch(telemetryEndpoint, {
        method: 'POST', body: telemetryBody, keepalive: true, credentials: 'omit',
      }).catch(() => {});
    }
  } catch {}

  // Never include query strings, fragments, or tool input in our page-view data.
  let referrer = '';
  try { referrer = new URL(document.referrer).origin; } catch {}
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_location: location.origin + location.pathname,
    page_referrer: referrer,
    page_title: document.title,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.append(script);
})();
