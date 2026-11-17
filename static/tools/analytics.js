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
