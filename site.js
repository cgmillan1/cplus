/* C Plus public website: language, intro, 3D photos, fly-through, portfolio viewer and estimate form. */
{
  /* client links that point at index.html?p=... go to the client app */
  const tok = new URLSearchParams(location.search).get('p');
  if (tok) location.replace('proyecto.html?p=' + encodeURIComponent(tok));

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  /* ---------- projects (real C Plus photos) ---------- */
  const P = [
    ['pergola-blanca', 'pergola', 'White pergola over a new deck', 'Pérgola blanca sobre un deck nuevo', 'wide'],
    ['deck-montana', 'deck', 'Deck with a mountain view', 'Deck con vista a las montañas', 'tall'],
    ['cocina-azul', 'kitchen', 'Navy kitchen with handmade-look tile', 'Cocina azul marino con azulejo artesanal', ''],
    ['ducha-marmol', 'bath', 'Marble-look shower with niche and bench', 'Regadera tipo mármol con nicho y banca', 'tall'],
    ['pergola-patio', 'pergola', 'Wood pergola over the patio', 'Pérgola de madera sobre el patio', ''],
    ['piso-azulejo', 'floor', 'Black and white patterned tile floor', 'Piso de azulejo blanco y negro con diseño', 'wide'],
    ['deck-vidrio', 'deck', 'Wood deck with glass railing', 'Deck de madera con barandal de vidrio', 'tall'],
    ['cocina-madera', 'kitchen', 'Stone backsplash in a wood kitchen', 'Backsplash de piedra en cocina de madera', ''],
    ['bano-hexagono', 'bath', 'Hexagon marble bathroom floor', 'Piso de baño de mármol hexagonal', 'tall'],
    ['piso-vinil', 'floor', 'Wood-look plank floor, upstairs room', 'Piso tipo madera en cuarto de arriba', ''],
    ['cocina-cuarzo', 'kitchen', 'Mosaic backsplash and quartz counters', 'Backsplash de mosaico y cubierta de cuarzo', ''],
    ['pergola-lado', 'pergola', 'Pergola, side view', 'Pérgola, vista lateral', 'wide'],
    ['sotano-sala', 'basement', 'Finished basement room', 'Cuarto de sótano terminado', ''],
    ['cocina-blanca', 'kitchen', 'Chevron backsplash with white cabinets', 'Backsplash en zigzag con gabinetes blancos', 'tall'],
    ['cocina-azul-estufa', 'kitchen', 'Range wall with stainless hood', 'Pared de la estufa con campana de acero', ''],
    ['piso-laminado', 'floor', 'Dark plank floor', 'Piso de tablas oscuras', 'tall'],
    ['cocina-vidrio', 'kitchen', 'Glass tile backsplash', 'Backsplash de azulejo de vidrio', ''],
    ['deck-trasero', 'deck', 'Backyard deck with stairs', 'Deck trasero con escalones', 'tall'],
    ['cocina-azul-isla', 'kitchen', 'Navy cabinets and quartz island', 'Gabinetes azul marino e isla de cuarzo', ''],
    ['piso-escalera', 'floor', 'Plank floor at the stair landing', 'Piso de tablas junto a la escalera', 'wide'],
    ['cocina-mosaico', 'kitchen', 'Mosaic backsplash behind the range', 'Backsplash de mosaico detrás de la estufa', ''],
    ['sotano-escalera', 'basement', 'Basement with new carpet and stairs', 'Sótano con alfombra nueva y escalera', ''],
    ['cocina-espiga', 'kitchen', 'Herringbone backsplash', 'Backsplash en espiga', ''],
    ['piso-pasillo', 'floor', 'Plank floor through the hallway', 'Piso de tablas en el pasillo', 'tall']
  ];
  const CAT = { pergola: ['Pergola', 'Pérgola'], deck: ['Deck', 'Deck'], kitchen: ['Kitchen', 'Cocina'], bath: ['Tile and shower', 'Azulejo y regadera'], floor: ['Floor', 'Piso'], basement: ['Basement', 'Sótano'] };

  /* ---------- language ---------- */
  const ES = {
    skip: 'Saltar al contenido', navWork: 'Proyectos', navServices: 'Servicios', navApp: 'Tu proyecto', navEstimate: 'Cotización gratis',
    kicker: 'Pérgolas · Decks · Azulejo · Pisos', h1a: 'Le sumamos un', h1b: 'a tu casa.',
    heroP: 'Proyectos exteriores, azulejo y pisos a la medida, diseñados y construidos para tu casa. Ves cada paso, cada pago y cada foto desde tu teléfono.',
    ctaEstimate: 'Pide tu cotización gratis', ctaWork: 'Mira nuestro trabajo en 3D',
    hint3d: 'Mueve el mouse sobre la foto: es una escena 3D hecha de un proyecto real de C Plus.', hint3dTouch: 'Desliza el dedo sobre la foto: es una escena 3D hecha de un proyecto real de C Plus.',
    flyH: 'Recorre nuestro trabajo', flyP: 'Baja para avanzar entre proyectos reales de C Plus.', flyIntro: 'Un recorrido corto en 3D por proyectos reales de C Plus. Es opcional: tómalo o ve directo a tu cotización.', flyGo: 'Hacer el recorrido en 3D', flySkip: 'Ir a la cotización gratis', flyExit: 'Salir del recorrido',
    servE: 'Lo que construimos', servH: 'Un plus en cada proyecto', servP: 'Un mismo equipo desde el diseño hasta la limpieza final, para remodelaciones grandes y arreglos pequeños.',
    s1h: 'Pérgolas', s1p: 'Prefabricadas o totalmente a la medida, de modernas a clásicas, para darle sombra y estilo a tu patio.',
    s2h: 'Decks', s2p: 'Decks de madera y composite, escaleras y barandales, para descansar o recibir visitas.',
    s3h: 'Azulejo y regaderas', s3p: 'Pisos, paredes, regaderas con nicho y banca, y superficies de azulejo a la medida.',
    s4h: 'Cocinas y backsplash', s4p: 'Backsplash, cubiertas y cambios en gabinetes que transforman todo el cuarto.',
    s5h: 'Pisos', s5p: 'Pisos de tablas, laminado y azulejo, con transiciones limpias y zoclos nuevos.',
    s6h: 'Sótanos y remodelaciones', s6p: 'Remodelaciones completas y sótanos terminados: espacios cómodos para trabajar, divertirse y estar en familia.',
    x1h: 'Reparaciones pequeñas', x1p: 'Ayuda rápida para esos arreglos que se van acumulando.',
    x2h: 'Planeación y permisos', x2p: 'Te ayudamos a planear el proyecto y a sacar los permisos que necesite.',
    galE: 'Portafolio', galH: 'Cada foto se abre en 3D', galP: 'Toca un proyecto para entrar en él. Puedes apagar el 3D cuando quieras para ver la foto original.',
    fAll: 'Todos', fPergola: 'Pérgolas', fDeck: 'Decks', fKitchen: 'Cocinas', fBath: 'Azulejo y regaderas', fFloor: 'Pisos', fBasement: 'Sótanos',
    v3d: 'Vista 3D', prev: 'Anterior', next: 'Siguiente', close: 'Cerrar',
    procE: 'Cómo trabajamos', procH: 'Fácil de principio a fin',
    p1h: 'Visita y cotización', p1p: 'Vamos a tu casa, medimos y te mandamos una cotización clara.',
    p2h: 'Plan y aprobación', p2p: 'Apruebas la cotización, el diseño y el calendario de pagos antes de empezar.',
    p3h: 'Construimos', p3p: 'El equipo trabaja y sube avances y fotos a la página de tu proyecto.',
    p4h: 'Entrega final', p4p: 'Revisamos contigo el trabajo terminado y cerramos cada detalle.',
    appE: 'Tu proyecto, en vivo', appH: 'Sigue tu proyecto desde tu teléfono', appP: 'Cada cliente tiene una página privada de su proyecto. Ya no tienes que preguntarte qué está pasando en tu casa.',
    a1: 'El avance, los pasos hechos y lo que sigue', a2: 'Tu cotización, separada en materiales y mano de obra', a3: 'Cuánto has pagado y cuánto falta', a4: 'Apruebas cualquier cambio antes de que se haga', a5: 'Fotos de cada etapa y mensajes con el equipo',
    phoneAria: 'Ejemplo de la página del proyecto de un cliente', demoTag: 'Ejemplo', demoTitle: 'Pérgola del patio', demoMat: 'Materiales', demoLab: 'Mano de obra', demoPaid: 'Pagado $7,540', demoLeft: 'Falta $4,060',
    ds1: 'Postes y bases', ds2: 'Vigas', ds3: 'Travesaños y listones', ds4: 'Tinte y limpieza', demoNote: 'Números de ejemplo, solo para ilustrar.',
    estE: 'Cotización gratis', estH: '¿Qué estás esperando?', estP: 'Cuéntanos de tu proyecto y te llamamos. También puedes llamarnos o escribirnos.',
    stars: 'Calificación de 5 estrellas en Google',
    fName: 'Nombre', fPhone: 'Teléfono', fEmail: 'Correo', fContact: 'Teléfono o correo, para poder contactarte.', fCity: 'Ciudad', fService: 'Servicio', other: 'Otra cosa', fMsg: 'Cuéntanos del proyecto', fSend: 'Enviar solicitud',
    okH: '¡Gracias!', okP: 'Recibimos tu solicitud y te contactaremos pronto.',
    tag: 'Le sumamos un plus a tu casa.', contractorLogin: 'Entrada del contratista',
    errName: 'Escribe tu nombre.', errContact: 'Escribe un teléfono o un correo.', errEmail: 'Revisa el correo.', errSend: 'No se pudo enviar. Llámanos al (385) 358-6145.', errMany: 'Hay muchas solicitudes en este momento. Llámanos al (385) 358-6145.', sending: 'Enviando…',
    title: 'Pérgolas, decks, azulejo y pisos en Utah | C Plus LLC',
    revE: 'Reseñas', revH: 'Lo que dicen nuestros clientes', revCount: '7 reseñas en Google', onGoogle: 'Reseña en Google', fiveStar: 'Reseña de 5 estrellas',
    revAll: 'Ver todas las reseñas en Google', revWrite: '¿Trabajaste con nosotros? Deja tu reseña',
    stars: '5.0 con 7 reseñas en Google', areaH: 'Dónde trabajamos', areaUC: 'Condado de Utah:', areaSL: 'Condado de Salt Lake:', areaMore: '¿Estás cerca? Pregúntanos, viajamos por el proyecto correcto.',
    fPics: 'Agrega fotos del espacio (opcional, hasta 5)', removePic: 'Quitar foto', uploading: 'Subiendo fotos…', errPics: 'No se pudieron subir las fotos. Envía sin fotos o llámanos.',
    footArea: 'South Jordan, UT · Atendemos el Condado de Utah y el Condado de Salt Lake',
    langAsk: 'Prefer English?', langGo: 'View in English'
  };
  const EN_EXTRA = { removePic: 'Remove photo', uploading: 'Uploading photos…', errPics: 'The photos could not be uploaded. Send without photos or call us.', hint3dTouch: 'Drag your finger over the photo: it is a 3D scene made from a real C Plus project.', errName: 'Please type your name.', errContact: 'Please add a phone or an email.', errEmail: 'Please check the email.', errSend: 'We could not send it. Call us at (385) 358-6145.', errMany: 'We are getting many requests right now. Call us at (385) 358-6145.', sending: 'Sending…' };
  const nodes = $$('[data-i18n]'), EN = {};
  nodes.forEach(n => { EN[n.dataset.i18n] ??= n.textContent; });
  $$('[data-i18n-aria]').forEach(n => { EN[n.dataset.i18nAria] = n.getAttribute('aria-label'); });
  EN.title = document.title; Object.assign(EN, EN_EXTRA);
  /* each language has its own page (index.html and es.html) so Google can show the right one */
  const PAGE = document.documentElement.dataset.page === 'es' ? 'es' : 'en';
  let L = PAGE, pref = null;
  try { pref = localStorage.getItem('cplus-lang'); } catch (_) {}
  const t = k => (L === 'es' ? ES[k] : EN[k]) ?? EN[k] ?? k;
  const cap = p => p[L === 'es' ? 3 : 2], catName = c => CAT[c][L === 'es' ? 1 : 0];
  function apply() {
    document.documentElement.lang = L;
    nodes.forEach(n => { n.textContent = t(n.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(n => n.setAttribute('aria-label', t(n.dataset.i18nAria)));
    $$('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === L)));
    $$('[data-cap]').forEach(n => { const p = P[+n.dataset.cap]; n.textContent = cap(p); });
    $$('[data-catname]').forEach(n => { n.textContent = catName(n.dataset.catname); });
    $$('[data-alt]').forEach(n => { n.alt = cap(P[+n.dataset.alt]); });
    if (viewerIdx >= 0) $('#vCap').textContent = cap(P[viewerIdx]);
    document.title = t('title');
  }
  const otherPage = lang => (lang === 'es' ? 'es.html' : './') + location.hash;
  $$('[data-lang]').forEach(b => b.addEventListener('click', () => {
    try { localStorage.setItem('cplus-lang', b.dataset.lang); } catch (_) {}
    if (b.dataset.lang !== PAGE) location.href = otherPage(b.dataset.lang);
  }));
  /* suggest the other language once, never redirect on our own */
  const bar = $('#langBar'), wants = pref || ((navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en');
  if (bar && wants !== PAGE) {
    $('#langGo').href = otherPage(wants); bar.hidden = false;
    $('#langGo').addEventListener('click', () => { try { localStorage.setItem('cplus-lang', wants); } catch (_) {} });
    $('#langNo').addEventListener('click', () => { bar.hidden = true; try { localStorage.setItem('cplus-lang', PAGE); } catch (_) {} });
  }

  if (matchMedia('(hover: none)').matches) { const h = document.querySelector('[data-i18n=hint3d]'); if (h) h.dataset.i18n = 'hint3dTouch'; }
  /* ---------- intro + nav ---------- */
  const root = document.documentElement;
  if (!reduce) root.classList.add('anim');
  setTimeout(() => root.classList.add('done'), reduce ? 0 : 1100);
  const nav = $('.nav'); let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('solid', y > 40);
    nav.classList.toggle('hide', y > 500 && y > lastY && !nav.contains(document.activeElement));
    lastY = y;
  }, { passive: true });

  /* ---------- hero: the pergola photo as a live 3D scene ---------- */
  const hero = window.Depth3D && Depth3D.make($('#heroCanvas'), { amount: 0.045, pointerHost: $('.hero') });
  if (hero) hero.show('pergola-blanca').catch(() => {});

  /* ---------- hero intro: the pergola builds itself in liquid metal, then hands off to the 3D photo ---------- */
  (() => {
    const box = $('.hero3d'), heroEl = $('.hero');
    if (!box || !heroEl) return;
    const T = PAGE === 'es' ? { skip: 'Saltar', replay: 'Ver cómo se construye' } : { skip: 'Skip', replay: 'Watch it build' };
    const saveData = navigator.connection && navigator.connection.saveData;
    const vid = document.createElement('video');
    vid.className = 'heroVid'; vid.muted = true; vid.playsInline = true; vid.preload = 'auto';
    vid.setAttribute('muted', ''); vid.setAttribute('playsinline', ''); vid.setAttribute('aria-hidden', 'true');
    const src = innerWidth < 760 ? 'img/pergola-build-sm.mp4?v=2' : 'img/pergola-build.mp4?v=2';
    const bar = document.createElement('div'); bar.className = 'heroBar'; bar.innerHTML = '<i></i>';
    const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'heroSkip'; skip.textContent = T.skip;
    const again = document.createElement('button'); again.type = 'button'; again.className = 'heroAgain';
    again.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><span>${T.replay}</span>`;
    box.appendChild(vid); heroEl.append(again);

    let raf = 0;
    const tick = () => { if (vid.duration) bar.firstChild.style.transform = `scaleX(${vid.currentTime / vid.duration})`; raf = requestAnimationFrame(tick); };
    const finish = () => {
      cancelAnimationFrame(raf);
      heroEl.classList.remove('building'); heroEl.classList.add('built');
      setTimeout(() => { vid.pause(); }, 1200);
    };
    const play = () => {
      if (!vid.src) vid.src = src;
      vid.currentTime = 0;
      heroEl.classList.remove('built'); heroEl.classList.add('building');
      bar.firstChild.style.transform = 'scaleX(0)';
      const go = vid.play();
      if (go && go.catch) go.catch(finish);
      raf = requestAnimationFrame(tick);
    };
    vid.addEventListener('ended', finish);
    vid.addEventListener('error', finish);
    again.addEventListener('click', play);

    /* background video: the page is usable the whole time, like the Sonec site */
    if (reduce || saveData) { heroEl.classList.add('built'); return; }
    vid.src = src;
    setTimeout(play, 300);
    setTimeout(() => { if (!vid.currentTime) finish(); }, 4000);
  })();

  /* ---------- fly-through: photos placed in 3D space, scroll moves the camera ---------- */
  const FLY = [0, 1, 2, 3, 4, 6, 7, 5, 10];
  const stage = $('#stage');
  stage.innerHTML = FLY.map((k, i) => { const p = P[k], tall = p[4] === 'tall';
    return `<figure class="card3d${tall ? ' tall' : ''}" data-i="${i}"><img src="img/${p[0]}.webp" data-alt="${k}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}"><figcaption><small data-catname="${p[1]}"></small><span data-cap="${k}"></span></figcaption></figure>`; }).join('');
  const cards = $$('.card3d'), fly = $('.fly'), flyProg = $('#flyProg');
  if (reduce) { root.classList.add('noFly'); fly.classList.remove('closed'); $('.flyBtns').hidden = true; }
  else {
    const GAP = 1150;
    let ticking = false;
    const draw = () => {
      ticking = false;
      const r = fly.getBoundingClientRect(), span = r.height - innerHeight, closed = fly.classList.contains('closed');
      const p = closed ? 0 : Math.min(1, Math.max(0, -r.top / span));
      flyProg.style.transform = `scaleX(${p})`;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const cam = closed ? -450 : p * (cards.length - 0.4) * GAP, narrow = innerWidth < 640, side = narrow ? innerWidth * 0.1 : innerWidth * 0.2;
      cards.forEach((c, i) => {
        const z = cam - i * GAP - 300, s = i % 2 ? 1 : -1;
        const op = z < -4200 ? 0 : z < -2600 ? (z + 4200) / 1600 : z > 420 ? 0 : z > 80 ? 1 - (z - 80) / 340 : 1;
        c.style.visibility = op <= 0 ? 'hidden' : 'visible';
        c.style.opacity = op.toFixed(3);
        c.style.transform = `translate3d(${s * side}px,${(i % 3 - 1) * 30}px,${z}px) rotateY(${s * -14}deg)`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    addEventListener('resize', draw); draw();
    /* the walk-through is optional: it only takes over the scroll after the visitor asks for it */
    const go = $('#flyGo'), exit = $('#flyExit');
    go.setAttribute('aria-expanded', 'false');
    const close = () => { fly.classList.add('closed'); go.setAttribute('aria-expanded', 'false'); };
    go.addEventListener('click', () => {
      fly.classList.remove('closed'); go.setAttribute('aria-expanded', 'true'); draw();
      scrollTo({ top: fly.offsetTop + 2, behavior: 'smooth' }); setTimeout(() => exit.focus({ preventScroll: true }), 700);
    });
    exit.addEventListener('click', () => { close(); scrollTo({ top: $('#services').offsetTop - 60 }); draw(); });
    /* scrolling past the end closes it again, so the page stays short afterwards */
    addEventListener('scroll', () => {
      if (fly.classList.contains('closed') || fly.getBoundingClientRect().bottom > 0) return;
      const before = fly.offsetHeight; close(); scrollTo(0, Math.max(0, scrollY - (before - fly.offsetHeight))); draw();
    }, { passive: true });
  }

  /* ---------- tilt cards toward the pointer ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--ry', `${x * 10}deg`); el.style.setProperty('--rx', `${-y * 10}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--ry', '0deg'); el.style.setProperty('--rx', '0deg'); });
  });

  /* ---------- portfolio grid + 3D viewer ---------- */
  const grid = $('#grid');
  grid.innerHTML = P.map((p, i) => `<li class="${p[4]}" data-c="${p[1]}"><button data-open="${i}"><img src="img/${p[0]}.webp" data-alt="${i}" alt="" loading="lazy"><span class="b3d" aria-hidden="true">3D</span><span class="cap" data-cap="${i}"></span></button></li>`).join('');
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $$('#grid li').forEach(li => { const show = b.dataset.f === 'all' || li.dataset.c === b.dataset.f; li.hidden = !show; li.classList.remove('pop'); if (show && !reduce) { void li.offsetWidth; li.classList.add('pop'); } });
  }));
  const dlg = $('#viewer'), vBox = $('.vBox'), vImg = $('#vImg'), v3dBtn = $('#v3d');
  let viewer = null, viewerIdx = -1, lastFocus = null;
  const visibleIdx = () => $$('#grid li:not([hidden]) [data-open]').map(b => +b.dataset.open);
  async function open(i) {
    viewerIdx = i; const p = P[i];
    $('#vCap').textContent = cap(p); vImg.src = `img/${p[0]}.webp`; vImg.alt = cap(p);
    if (!dlg.open) { lastFocus = document.activeElement; dlg.showModal(); }
    if (!viewer && window.Depth3D) viewer = Depth3D.make($('#vCanvas'), { amount: 0.06 });
    if (!viewer) { vBox.classList.add('flat'); v3dBtn.hidden = true; return; }
    try { await viewer.show(p[0]); } catch (_) { vBox.classList.add('flat'); }
  }
  const step = d => { const v = visibleIdx(), k = v.indexOf(viewerIdx); open(v[(k + d + v.length) % v.length]); };
  grid.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) open(+b.dataset.open); });
  $('#vPrev').onclick = () => step(-1); $('#vNext').onclick = () => step(1);
  $('#vClose').onclick = () => dlg.close();
  dlg.addEventListener('close', () => { viewerIdx = -1; lastFocus && lastFocus.focus(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  v3dBtn.onclick = () => { const on = v3dBtn.getAttribute('aria-pressed') !== 'true'; v3dBtn.setAttribute('aria-pressed', String(on)); vBox.classList.toggle('flat', !on); viewer && viewer.set3D(on); };
  let sx = 0; dlg.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); });

  apply();

  /* ---------- reveal on scroll, process line, phone counters ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    $$('.rvkids').forEach(g => [...g.children].forEach((c, k) => c.style.setProperty('--d', `${k * 90}ms`)));
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    $$('.rv, .rvkids').forEach(n => io.observe(n));
  } else $$('.rv, .rvkids').forEach(n => n.classList.add('in'));
  const once = (el, fn) => { if (!('IntersectionObserver' in window)) return fn(); const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { fn(); o.disconnect(); } }, { threshold: 0.4 }); o.observe(el); };
  once($('#steps'), () => $('#steps').style.setProperty('--sp', 1));
  once($('.phone'), () => {
    const ring = $('.ring'), num = $('#ringNum'), goal = 65;
    ring.style.setProperty('--p', goal);
    if (reduce) { num.textContent = goal + '%'; return; }
    const t0 = performance.now(); const tick = n => { const k = Math.min(1, (n - t0) / 1800), v = Math.round(goal * (1 - Math.pow(1 - k, 3))); num.textContent = v + '%'; if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
  });

  /* ---------- photos for the quote ---------- */
  let pics = [];
  const picList = $('#picList'), fpics = $('#fpics');
  const shrink = file => new Promise(res => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); c.toBlob(b => res(b), 'image/jpeg', 0.82); };
    img.onerror = () => { URL.revokeObjectURL(url); res(null); };
    img.src = url;
  });
  const drawPics = () => { picList.innerHTML = pics.map((p, i) => `<li><img src="${p.url}" alt=""><button type="button" data-rmpic="${i}" aria-label="${t('removePic')}"><svg class="ix" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join(''); };
  fpics.addEventListener('change', () => {
    [...fpics.files].filter(f => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name)).forEach(f => { if (pics.length < 5) pics.push({ file: f, url: URL.createObjectURL(f) }); });
    fpics.value = ''; drawPics();
  });
  picList.addEventListener('click', e => { const b = e.target.closest('[data-rmpic]'); if (!b) return; const [p] = pics.splice(+b.dataset.rmpic, 1); URL.revokeObjectURL(p.url); drawPics(); fpics.focus(); });

  /* ---------- estimate form (goes to the contractor panel) ---------- */
  const f = $('#estf'), err = $('#ferr'), ok = $('#fok'), btn = f.querySelector('[type=submit]');
  f.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const v = Object.fromEntries(new FormData(f)); Object.keys(v).forEach(k => v[k] = String(v[k] || '').trim());
    if (v.website) return; /* bots fill the hidden field */
    delete v.website;
    const bad = (name, msg) => { err.textContent = t(msg); f.elements[name].setAttribute('aria-invalid', 'true'); f.elements[name].focus(); };
    [...f.elements].forEach(x => x.removeAttribute && x.removeAttribute('aria-invalid'));
    if (!v.name) return bad('name', 'errName');
    if (!v.phone && !v.email) return bad('phone', 'errContact');
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return bad('email', 'errEmail');
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = t('sending');
    try {
      if (!window.API || !API.ready) throw new Error('not configured');
      const paths = [];
      if (pics.length) {
        btn.textContent = t('uploading');
        const folder = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
        try { for (let i = 0; i < pics.length; i++) { const blob = await shrink(pics[i].file); if (blob) paths.push(await API.uploadLeadPhoto(blob, folder, i + 1)); } }
        catch (x) { console.error(x); err.textContent = t('errPics'); btn.disabled = false; btn.textContent = t('fSend'); return; }
      }
      await API.submitLead({ ...v, lang: L, pics: paths });
      $('.pics').hidden = true;
      [...f.querySelectorAll('label, .two, .hint, .err, button')].forEach(x => x.hidden = true);
      ok.hidden = false; ok.setAttribute('tabindex', '-1'); ok.focus();
    } catch (x) {
      console.error(x);
      err.textContent = t(/too many/i.test(x.message || '') ? 'errMany' : 'errSend');
      btn.disabled = false; btn.textContent = t('fSend');
    }
  });
}
