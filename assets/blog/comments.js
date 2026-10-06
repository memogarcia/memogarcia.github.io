(() => {
  const container = document.querySelector('.giscus');
  if (!container) return;

  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.async = true;
  script.crossOrigin = 'anonymous';
  Object.assign(script.dataset, container.dataset);

  const updateTheme = () => {
    const mode = document.documentElement.dataset.theme;
    const theme = mode === 'light' || mode === 'dark' ? mode : 'preferred_color_scheme';
    script.dataset.theme = theme;
    container.querySelector('iframe.giscus-frame')?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      'https://giscus.app',
    );
  };

  updateTheme();
  // Apply the latest choice even when the lazy iframe loads after a theme change.
  container.addEventListener('load', updateTheme, true);
  new MutationObserver(updateTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  container.append(script);
})();
