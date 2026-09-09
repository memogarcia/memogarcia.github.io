const themes = ['light', 'dark', 'device'];
let theme = 'device';
try {
  const saved = localStorage.getItem('pref-theme');
  if (themes.includes(saved)) theme = saved;
} catch { /* Device appearance remains available when storage is blocked. */ }
document.documentElement.dataset.theme = theme;

document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.theme-control');
  const next = () => themes[(themes.indexOf(theme) + 1) % themes.length];
  const render = () => {
    document.documentElement.dataset.theme = theme;
    button.title = `Theme: ${theme}. Switch to ${next()}.`;
    button.setAttribute('aria-label', button.title);
  };
  render();
  button.hidden = false;
  button.addEventListener('click', () => {
    theme = next();
    render();
    try {
      localStorage.setItem('pref-theme', theme);
    } catch { /* Keep the choice for this page when storage is blocked. */ }
  });
});
