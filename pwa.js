/* pwa-kit client: service worker registration, update toast, install button, iPhone "Add to Home Screen" hint,
   and a push subscription helper. Bilingual (en/es by <html lang>). No dependencies. */
(() => {
  const es = (document.documentElement.lang || navigator.language || 'en').toLowerCase().startsWith('es');
  const T = es ? {
    update: 'Hay una versión nueva', reload: 'Actualizar', install: 'Instalar app', later: 'Ahora no',
    iosTitle: 'Instala esta app en tu iPhone', iosSteps: 'Toca <b>Compartir</b> <span aria-hidden="true">⬆︎</span> y luego <b>Agregar a pantalla de inicio</b>.',
  } : {
    update: 'A new version is available', reload: 'Reload', install: 'Install app', later: 'Not now',
    iosTitle: 'Install this app on your iPhone', iosSteps: 'Tap <b>Share</b> <span aria-hidden="true">⬆︎</span>, then <b>Add to Home Screen</b>.',
  };
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
                  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  const css = `.pwak{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:2147483000;
    background:#111;color:#fff;border-radius:16px;padding:14px 16px;font:15px/1.4 system-ui,-apple-system,sans-serif;
    box-shadow:0 10px 30px rgba(0,0,0,.3);display:flex;gap:12px;align-items:center;max-width:520px;margin:0 auto;
    animation:pwak .25s ease-out}
    .pwak p{margin:0;flex:1}.pwak button{min-height:44px;padding:0 14px;border-radius:12px;border:0;font:600 15px system-ui;cursor:pointer}
    .pwak .pri{background:#fff;color:#111}.pwak .sec{background:transparent;color:#bbb}
    @keyframes pwak{from{transform:translateY(20px);opacity:0}}@media (prefers-reduced-motion:reduce){.pwak{animation:none}}`;
  const style = () => { if (!document.getElementById('pwak-css')) { const s = document.createElement('style'); s.id = 'pwak-css'; s.textContent = css; document.head.appendChild(s); } };
  const toast = (html, actions) => {
    style(); const el = document.createElement('div'); el.className = 'pwak'; el.setAttribute('role', 'dialog');
    el.innerHTML = `<p>${html}</p>`;
    for (const [label, cls, fn] of actions) { const b = document.createElement('button'); b.className = cls; b.textContent = label; b.onclick = () => { el.remove(); fn && fn(); }; el.appendChild(b); }
    document.body.appendChild(el); return el;
  };

  // ---- service worker + update flow
  if ('serviceWorker' in navigator) {
    addEventListener('load', async () => {
      const reg = await navigator.serviceWorker.register('sw.js');
      const ask = (w) => toast(T.update, [[T.reload, 'pri', () => w.postMessage('skipWaiting')], [T.later, 'sec']]);
      if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); });
      });
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
    });
  }

  // ---- install (Android / desktop Chrome, Edge)
  let deferred = null;
  addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); deferred = e;
    document.querySelectorAll('[data-pwa-install]').forEach((b) => { b.hidden = false; });
  });
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-pwa-install]'); if (!b) return;
    if (deferred) { deferred.prompt(); await deferred.userChoice; deferred = null; b.hidden = true; }
    else if (isIOS) showIOSHint(true);
  });
  addEventListener('appinstalled', () => document.querySelectorAll('[data-pwa-install]').forEach((b) => { b.hidden = true; }));

  // ---- iPhone hint (iOS has no install prompt; push only works after Add to Home Screen)
  function showIOSHint(force) {
    if (standalone || !isIOS) return;
    if (!force && store.get('pwak-ios-dismissed')) return;
    toast(`<b>${T.iosTitle}</b><br>${T.iosSteps}`, [['OK', 'pri', () => store.set('pwak-ios-dismissed', '1')]]);
  }
  window.PWAKit = {
    standalone, isIOS, showIOSHint,
    /* Push: call from a button tap. vapidPublicKey = base64url public key; save(sub) stores the JSON (e.g. Supabase insert). */
    async subscribePush(vapidPublicKey, save) {
      if (isIOS && !standalone) { showIOSHint(true); return { ok: false, reason: 'ios-needs-home-screen' }; }
      if (!('PushManager' in window)) return { ok: false, reason: 'unsupported' };
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return { ok: false, reason: perm };
      const reg = await navigator.serviceWorker.ready;
      const key = Uint8Array.from(atob(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((vapidPublicKey.length + 3) % 4)), (c) => c.charCodeAt(0));
      const sub = (await reg.pushManager.getSubscription()) || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }));
      if (save) await save(sub.toJSON());
      return { ok: true, subscription: sub.toJSON() };
    },
  };
  // Auto-show the iPhone hint on the 2nd visit only when the page opts in: <html data-pwa-ios-hint>
  if (document.documentElement.hasAttribute('data-pwa-ios-hint')) {
    const n = +(store.get('pwak-visits') || 0) + 1; store.set('pwak-visits', n);
    if (n >= 2) addEventListener('load', () => setTimeout(() => showIOSHint(false), 2500));
  }
})();
