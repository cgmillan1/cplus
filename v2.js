/* C Plus v2: language, the 3D hero, the work grid (GSAP Flip), the 3D viewer, and the quote form with photos. */
{
  const tok = new URLSearchParams(location.search).get('p');
  if (tok) location.replace('proyecto.html?p=' + encodeURIComponent(tok));
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = () => window.gsap;

  /* ---------- the 24 real projects ---------- */
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

  /* ---------- language ---------- */
  const ES = {
    skip: 'Saltar al contenido', navServices: 'Servicios', navWork: 'Nuestro trabajo', navSteps: 'Cómo trabajamos', navReviews: 'Reseñas', cta: 'Pide tu cotización gratis',
    mOut: 'Afuera', mIn: 'Adentro', m1: 'Sombra y estilo para el patio', m2: 'Madera, composite, escaleras, barandales', m3: 'Nichos, bancas, pisos con diseño', m4: 'Backsplash, cubiertas, gabinetes', m5: 'Tablas, laminado y azulejo', m6: 'Cuartos terminados para la familia',
    mCard: 'Mira 24 proyectos en 3D', mCardS: 'Cada foto se abre como una escena',
    heroNote: 'Condado de Utah y Condado de Salt Lake', h1: 'Pérgolas, decks, azulejo y pisos para casas en Utah',
    lead: 'Un mismo equipo lo diseña y lo construye, en español o inglés. Sigues cada paso, pago y foto en la página de tu proyecto.',
    ctaWork: 'Ver nuestro trabajo', float: '5.0 con 7 reseñas',
    servH: 'Nuestros servicios, de pérgolas a sótanos', servP: 'Desde el primer dibujo hasta el piso barrido, para remodelaciones grandes y arreglos pequeños.',
    s1h: 'Pérgolas', s1p: 'Prefabricadas o a la medida, modernas o clásicas.', s2h: 'Decks', s2p: 'Madera y composite, escaleras y barandales.',
    s3h: 'Azulejo y regaderas', s3p: 'Paredes, pisos, nichos y bancas.', s4h: 'Cocinas y backsplash', s4p: 'Backsplash, cubiertas y cambios de gabinetes.',
    s5h: 'Pisos', s5p: 'Tablas, laminado y azulejo, con zoclo nuevo.', s6h: 'Sótanos y remodelaciones', s6p: 'Cuartos terminados, más arreglos pequeños y permisos.',
    vOut: 'Afuera', vIn: 'Adentro',
    workH: 'Proyectos recientes, cada uno en 3D', allWork: 'Recorre los 24', workP: 'Abre una foto y el cuarto se mueve con tu mouse o tu dedo. La profundidad sale de la foto real.',
    fAll: 'Todos', fPergola: 'Pérgolas', fDeck: 'Decks', fKitchen: 'Cocinas', fBath: 'Azulejo y regaderas', fFloor: 'Pisos', fBasement: 'Sótanos',
    procH: 'Los cuatro pasos de un proyecto con C Plus', p1h: '1. Visita y cotización', p1p: 'Vamos a tu casa, medimos y te mandamos una cotización clara, separada en materiales y mano de obra.',
    p2h: '2. Plan y aprobación', p2p: 'Apruebas el diseño, la cotización y el calendario de pagos antes de empezar.',
    p3h: '3. Construimos', p3p: 'El equipo sube avances y fotos a la página de tu proyecto, así siempre sabes cómo va.',
    p4h: '4. Entrega final', p4p: 'Revisamos contigo el trabajo terminado y cerramos cada detalle antes del último pago.',
    appH: 'La app del cliente: tu proyecto en tu teléfono', appP: 'Cada cliente recibe un enlace privado. Ya no tienes que llamar para saber cómo va.',
    a1: 'Pasos hechos y lo que sigue', a2: 'La cotización en materiales y mano de obra', a3: 'Lo que has pagado y lo que falta', a4: 'Cambios que apruebas antes de que se hagan', a5: 'Fotos de cada etapa y mensajes con el equipo',
    phoneAria: 'La página del proyecto de un cliente: una pérgola al 65 por ciento, materiales 6,400 dólares, mano de obra 5,200 dólares, en el paso de travesaños',
    demoTitle: 'Pérgola del patio', demoMat: 'Materiales', demoLab: 'Mano de obra', demoPaid: 'Pagado $7,540', demoLeft: 'Falta $4,060',
    ds1: 'Postes y bases', ds2: 'Vigas', ds3: 'Travesaños y listones', ds4: 'Tinte y limpieza',
    revH: 'Calificación de 5.0 en Google', revP: 'Siete reseñas hasta ahora, todas de cinco estrellas.', revAll: 'Ver las reseñas en Google',
    estH: 'Formulario de cotización: cuéntanos de tu proyecto', estP: 'Cuéntanos del proyecto y te llamamos. Las fotos del espacio nos ayudan a darte el precio.',
    cPhone: 'Teléfono', cEmail: 'Correo', cArea: 'Zona', cAreaV: 'Condado de Utah y Salt Lake',
    fName: 'Nombre', fPhone: 'Teléfono', fEmail: 'Correo', fCity: 'Ciudad', fService: 'Servicio', fMsg: 'Sobre el proyecto', oRepair: 'Un arreglo pequeño', oOther: 'Otra cosa',
    fPics: 'Agrega fotos del espacio, hasta 5', fSend: 'Enviar mi solicitud', errName: 'Escribe tu nombre.', errContact: 'Agrega un teléfono o un correo para llamarte.',
    closeH: 'Pide tu cotización gratis esta semana', closeP: 'Vamos, medimos y te mandamos la cotización, en español o inglés.',
    footArea: 'Atendemos el Condado de Utah y el Condado de Salt Lake.', fCol1: 'Contacto', fCol2: 'Síguenos', contractorLogin: 'Entrada del equipo',
    v3d: 'Vista 3D', prev: 'Anterior', next: 'Siguiente', close: 'Cerrar',
    langAsk: 'Prefer English?', langGo: 'View in English',
    removePic: 'Quitar foto', uploading: 'Subiendo fotos…', sending: 'Enviando…', errPics: 'No se pudieron subir las fotos. Envía sin fotos o llámanos.',
    errSend: 'No se pudo enviar. Llámanos al (385) 358-6145.', errMany: 'Hay muchas solicitudes ahora. Llámanos al (385) 358-6145.', okSent: '¡Gracias! Recibimos tu solicitud y te llamamos pronto.',
    title: 'Pérgolas, decks, azulejo y pisos en Utah | C Plus LLC'
  };
  const EN = { removePic: 'Remove photo', uploading: 'Uploading photos…', sending: 'Sending…', errPics: 'The photos could not be uploaded. Send without photos or call us.',
    errSend: 'We could not send it. Call us at (385) 358-6145.', errMany: 'We are getting many requests right now. Call us at (385) 358-6145.', okSent: 'Thank you! We have your request and will call you soon.' };
  const nodes = $$('[data-i18n]');
  nodes.forEach(n => { EN[n.dataset.i18n] ??= n.textContent; });
  $$('[data-i18n-aria]').forEach(n => { EN[n.dataset.i18nAria] ??= n.getAttribute('aria-label'); });
  EN.title = document.title; EN.langAsk = '¿Prefieres español?'; EN.langGo = 'Ver en español';
  let L = 'en', pref = null;
  try { pref = localStorage.getItem('cplus-lang'); } catch (_) {}
  if (pref === 'es') L = 'es';
  const t = k => (L === 'es' ? ES[k] : EN[k]) ?? EN[k] ?? k;
  const cap = p => p[L === 'es' ? 3 : 2];
  let viewerIdx = -1;
  function apply() {
    document.documentElement.lang = L;
    nodes.forEach(n => { n.textContent = t(n.dataset.i18n); });
    $$('[data-i18n-aria]').forEach(n => n.setAttribute('aria-label', t(n.dataset.i18nAria)));
    $$('.seg [data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === L)));
    $$('[data-alt]').forEach(n => { n.alt = cap(P[+n.dataset.alt]); });
    if (viewerIdx >= 0) $('#vCap').textContent = cap(P[viewerIdx]);
    $('#langBar [data-lang]').dataset.lang = L === 'es' ? 'en' : 'es';
    document.title = t('title');
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lang]'); if (!b) return;
    L = b.dataset.lang; try { localStorage.setItem('cplus-lang', L); } catch (_) {}
    $('#langBar').hidden = true; apply();
  });
  const wants = pref || ((navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en');
  if (!pref && wants !== L) $('#langBar').hidden = false;
  $('#langNo').addEventListener('click', () => { $('#langBar').hidden = true; try { localStorage.setItem('cplus-lang', L); } catch (_) {} });

  /* ---------- hero: the pergola as a live 3D scene ---------- */
  const hero = window.Depth3D && Depth3D.make($('#heroCanvas'), { amount: 0.04, pointerHost: $('.hero3d') });
  if (hero) hero.show('pergola-blanca').catch(() => {});

  /* nav menu items open the matching service photo */
  $$('[data-peek-go]').forEach(a => a.addEventListener('click', () => {
    const row = $(`[data-peek-to="${a.dataset.peekGo}"]`); if (row) setTimeout(() => { row.focus({ preventScroll: true }); row.dispatchEvent(new Event('mouseenter')); row.click(); }, 350);
  }));

  /* ---------- work grid: GSAP Flip re-flows the tiles when the filter changes ---------- */
  const grid = $('#grid');
  grid.innerHTML = P.map((p, i) => `<li data-c="${p[1]}"><button type="button" data-open="${i}"><img src="img/${p[0]}.jpg" data-alt="${i}" alt=""${i < 6 ? '' : ' loading="lazy"'}></button></li>`).join('');
  const items = $$('#grid li');
  let filter = 'all';
  const shown = () => { let n = 0; return items.map(li => { const ok = (filter === 'all' || li.dataset.c === filter) && n < 6; if (ok) n++; return ok; }); };
  shown().forEach((ok, k) => { items[k].hidden = !ok; });
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    filter = b.dataset.f; const vis = shown();
    const Flip = window.Flip, g = G();
    if (!Flip || !g || reduce) { vis.forEach((ok, k) => { items[k].hidden = !ok; }); return; }
    const state = Flip.getState(items);
    vis.forEach((ok, k) => { items[k].hidden = !ok; });
    Flip.from(state, {
      duration: 0.55, ease: 'power3.inOut', absolute: true, nested: true,
      onEnter: els => g.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out' }),
      onLeave: els => g.to(els, { opacity: 0, scale: 0.92, duration: 0.25, ease: 'power1.in' })
    });
  }));

  /* ---------- viewer: the photo grows out of its tile (GSAP), then turns into a 3D scene ---------- */
  const dlg = $('#viewer'), vBox = $('.vBox'), vStage = $('.vStage'), vImg = $('#vImg'), v3d = $('#v3d');
  let viewer = null, lastFocus = null;
  const visibleIdx = () => P.map((p, i) => i).filter(i => filter === 'all' || P[i][1] === filter);
  $('#allWork').addEventListener('click', e => { filter = 'all'; $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.f === 'all'))); shown().forEach((ok, k) => { items[k].hidden = !ok; }); open(0, items[0].querySelector('button')); });
  async function open(i, fromEl) {
    viewerIdx = i; const p = P[i];
    $('#vCap').textContent = cap(p); vImg.src = `img/${p[0]}.jpg`; vImg.alt = cap(p);
    if (!dlg.open) {
      lastFocus = document.activeElement; dlg.showModal();
      const g = G();
      if (g && fromEl && !reduce) {
        const a = fromEl.getBoundingClientRect(), b = vStage.getBoundingClientRect();
        g.fromTo(vStage, { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, opacity: 0.4 },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: 0.6, ease: 'expo.out' });
        g.fromTo('.vBar', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: 0.15, ease: 'power3.out' });
      }
    }
    if (!viewer && window.Depth3D) viewer = Depth3D.make($('#vCanvas'), { amount: 0.06 });
    if (!viewer) { vBox.classList.add('flat'); v3d.hidden = true; return; }
    try { await viewer.show(p[0]); } catch (_) { vBox.classList.add('flat'); }
  }
  const step = d => { const v = visibleIdx(), k = v.indexOf(viewerIdx); open(v[(k + d + v.length) % v.length]); };
  grid.addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) open(+b.dataset.open, b); });
  $('#vPrev').onclick = () => step(-1); $('#vNext').onclick = () => step(1); $('#vClose').onclick = () => dlg.close();
  dlg.addEventListener('close', () => { viewerIdx = -1; lastFocus && lastFocus.focus(); });
  dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  v3d.onclick = () => { const on = v3d.getAttribute('aria-pressed') !== 'true'; v3d.setAttribute('aria-pressed', String(on)); vBox.classList.toggle('flat', !on); viewer && viewer.set3D(on); };
  let sx = 0; dlg.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) step(dx < 0 ? 1 : -1); });

  /* the phone shows one example project, held still */
  $('.ring').style.setProperty('--p', 65); $('#ringNum').textContent = '65%'; $('.pBar i').style.width = '65%';

  apply();

  /* ---------- quote form with photos ---------- */
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
  const drawPics = () => { picList.innerHTML = pics.map((p, i) => `<li><img src="${p.url}" alt=""><button type="button" data-rmpic="${i}" aria-label="${t('removePic')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></li>`).join(''); };
  fpics.addEventListener('change', () => { [...fpics.files].filter(f => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name)).forEach(f => { if (pics.length < 5) pics.push({ file: f, url: URL.createObjectURL(f) }); }); fpics.value = ''; drawPics(); });
  picList.addEventListener('click', e => { const b = e.target.closest('[data-rmpic]'); if (!b) return; const [p] = pics.splice(+b.dataset.rmpic, 1); URL.revokeObjectURL(p.url); drawPics(); });

  const f = $('#estf'), status = $('#fstatus'), btn = f.querySelector('[type=submit]');
  f.addEventListener('submit', e => {
    e.preventDefault();
    setTimeout(async () => {                         /* the kit checks required fields first */
      if (f.querySelector('[aria-invalid="true"]')) return;
      const v = Object.fromEntries(new FormData(f)); Object.keys(v).forEach(k => v[k] = String(v[k] || '').trim());
      if (v.website) return; delete v.website;
      const perr = $('#f-phone-err');
      if (!v.phone && !v.email) { perr.hidden = false; $('#f-phone').setAttribute('aria-invalid', 'true'); $('#f-phone').focus(); return; }
      perr.hidden = true; $('#f-phone').removeAttribute('aria-invalid');
      if (btn.disabled) return; btn.disabled = true; btn.textContent = t('sending');
      try {
        if (!window.API || !API.ready) throw new Error('not configured');
        const paths = [];
        if (pics.length) {
          btn.textContent = t('uploading');
          const folder = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
          try { for (let i = 0; i < pics.length; i++) { const blob = await shrink(pics[i].file); if (blob) paths.push(await API.uploadLeadPhoto(blob, folder, i + 1)); } }
          catch (x) { console.error(x); status.textContent = t('errPics'); btn.disabled = false; btn.textContent = t('fSend'); return; }
        }
        await API.submitLead({ ...v, lang: L, pics: paths });
        [...f.querySelectorAll('.field, .btn-row')].forEach(x => x.hidden = true);
        status.textContent = t('okSent'); status.classList.add('ok'); status.setAttribute('tabindex', '-1'); status.focus();
      } catch (x) {
        console.error(x); status.textContent = t(/too many/i.test(x.message || '') ? 'errMany' : 'errSend');
        btn.disabled = false; btn.textContent = t('fSend');
      }
    }, 0);
  });
}
