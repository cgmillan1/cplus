/* Scroll-built house: a small card in the bottom-right corner.
   The house goes site prep -> foundation -> framing -> dry-in -> siding -> finished as the visitor scrolls the page. */
(() => {
  const es = (document.documentElement.dataset.page || document.documentElement.lang || '').startsWith('es');
  const T = es
    ? { steps: ['Terreno', 'Cimientos', 'Madera', 'Cerramiento', 'Fachada', 'Terminada'], step: (n) => `Paso ${n} de 6`, done: 'Lista', cta: 'Cotiza la tuya gratis', hide: 'Ocultar', label: 'Una casa que se construye mientras bajas' }
    : { steps: ['Site Prep', 'Foundation', 'Framing', 'Dry-in', 'Siding & Paint', 'Finished'], step: (n) => `Step ${n} of 6`, done: 'Done', cta: 'Get your free quote', hide: 'Hide', label: 'A house that builds as you scroll' };
  try { if (sessionStorage.getItem('cplus-build') === 'off') return; } catch (_) {}

  const el = document.createElement('aside');
  el.className = 'build';
  el.setAttribute('aria-label', T.label);
  el.innerHTML = `
    <div class="bFrame">
      ${[1, 2, 3, 4, 5, 6].map((n) => `<img class="bL" src="img/build-${n}.jpg" alt="" width="720" height="480" ${n > 1 ? 'loading="lazy"' : ''} decoding="async">`).join('')}
      <i class="bEdge" aria-hidden="true"></i>
    </div>
    <div class="bMeta">
      <div class="bTxt"><span class="bStep"></span><strong class="bName"></strong></div>
      <a class="bCta" href="#estimate">${T.cta} <span aria-hidden="true">&#8594;</span></a>
    </div>
    <div class="bBar" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <button type="button" class="bX" aria-label="${T.hide}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  document.body.appendChild(el);

  const layers = [...el.querySelectorAll('.bL')];
  const segs = [...el.querySelectorAll('.bBar i')];
  const edge = el.querySelector('.bEdge'), stepEl = el.querySelector('.bStep'), nameEl = el.querySelector('.bName');
  // Each later stage rises in over its own stretch of the page, with pauses between.
  const windows = [0, 1, 2, 3, 4].map((i) => [0.04 + i * 0.18, 0.16 + i * 0.18]);
  const ease = (x) => x * x * (3 - 2 * x);
  const clamp = (x) => Math.min(1, Math.max(0, x));
  let last = -1, ticking = false;

  function draw() {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp(scrollY / max) : 0;
    el.classList.toggle('mini', scrollY < 80);
    let stage = 0, edgeAt = -1;
    windows.forEach(([a, b], i) => {
      const r = ease(clamp((p - a) / (b - a)));
      layers[i + 1].style.clipPath = `inset(${(1 - r) * 100}% 0 0 0)`;
      if (r > 0.5) stage = i + 1;
      if (r > 0.01 && r < 0.99) edgeAt = (1 - r) * 100;
    });
    edge.style.opacity = edgeAt < 0 ? 0 : 1;
    if (edgeAt >= 0) edge.style.top = edgeAt + '%';
    el.querySelector('.bFrame').style.setProperty('--z', (1.08 - 0.08 * p).toFixed(4));
    segs.forEach((s, i) => s.classList.toggle('f', i <= stage));
    if (stage !== last) {
      last = stage;
      stepEl.textContent = stage === 5 ? T.done : T.step(stage + 1);
      nameEl.textContent = T.steps[stage];
      el.classList.toggle('done', stage === 5);
    }
  }
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  draw();
  // Shown from the landing screen, once the intro has faded.
  setTimeout(() => el.classList.add('on'), 1400);

  el.querySelector('.bX').addEventListener('click', () => {
    el.remove();
    removeEventListener('scroll', ask);
    try { sessionStorage.setItem('cplus-build', 'off'); } catch (_) {}
  });

  // Stay out of the way: while the language bar shows, while the 3D walk-through runs,
  // and while someone types in a form on a phone.
  const bar = document.getElementById('langBar'), fly = document.getElementById('work');
  const sync = () => {
    el.classList.toggle('lift', !!bar && !bar.hidden);
    el.classList.toggle('away', !!fly && !fly.classList.contains('closed'));
  };
  const mo = new MutationObserver(sync);
  if (bar) mo.observe(bar, { attributes: true, attributeFilter: ['hidden'] });
  if (fly) mo.observe(fly, { attributes: true, attributeFilter: ['class'] });
  sync();
  document.addEventListener('focusin', (e) => { if (e.target.matches('input,textarea,select')) el.classList.add('typing'); });
  document.addEventListener('focusout', () => el.classList.remove('typing'));
})();
