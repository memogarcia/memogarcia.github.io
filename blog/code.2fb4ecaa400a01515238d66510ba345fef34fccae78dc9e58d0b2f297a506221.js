document.querySelectorAll('.copy-code').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      await navigator.clipboard.writeText(button.closest('.code-block').querySelector('code').textContent);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy failed';
    }
    setTimeout(() => {
      button.textContent = 'Copy';
      button.disabled = false;
    }, 2000);
  });
});
