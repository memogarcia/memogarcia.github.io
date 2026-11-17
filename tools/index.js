// The lamp drifts toward the pointer, and each card's shadow falls away from it.
(() => {
  const root = document.documentElement;
  const cards = Array.from(document.querySelectorAll('.card'));
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let tx = window.innerWidth * 0.5;
  let ty = window.innerHeight * 0.08;
  let x = tx;
  let y = ty;
  let raf = 0;

  function cast() {
    const reach = Math.max(window.innerWidth, window.innerHeight);
    for (const card of cards) {
      const r = card.getBoundingClientRect();
      const dx = r.left + r.width / 2 - x;
      const dy = r.top + r.height / 2 - y;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / reach);
      const len = 6 + 18 * k;
      card.style.setProperty('--sx', `${((dx / d) * len).toFixed(1)}px`);
      card.style.setProperty('--sy', `${((dy / d) * len).toFixed(1)}px`);
      card.style.setProperty('--lit', (1 - k).toFixed(2));
    }
  }

  function frame() {
    x += (tx - x) * 0.08;
    y += (ty - y) * 0.08;
    root.style.setProperty('--lx', `${x.toFixed(1)}px`);
    root.style.setProperty('--ly', `${y.toFixed(1)}px`);
    cast();
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(frame) : 0;
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  if (!still) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      tx = e.clientX;
      ty = e.clientY;
      kick();
    }, { passive: true });
  }
  window.addEventListener('scroll', cast, { passive: true });
  window.addEventListener('resize', () => {
    if (still) {
      tx = window.innerWidth * 0.5;
      x = tx;
    }
    kick();
    cast();
  });
  frame();
})();
