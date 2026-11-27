/* C Plus data layer: every read and write goes through window.API. */
(function () {
  if (window.CPLUS_MOCK) { window.API = window.CPLUS_MOCK; return; }
  const cfg = window.CPLUS_CONFIG || {};
  const ready = !!(cfg.url && cfg.key && window.supabase);
  const sb = ready ? window.supabase.createClient(cfg.url, cfg.key, { auth: { flowType: 'pkce' } }) : null;
  const ok = ({ data, error }) => { if (error) throw new Error(error.message || String(error)); return data; };
  /* ---------- offline: writes wait in the phone (IndexedDB) and upload when the signal returns; the last data opens without signal ---------- */
  const IDB = (() => { let p; return () => p || (p = new Promise((res, rej) => { const r = indexedDB.open('cplus-offline', 1); r.onupgradeneeded = () => { r.result.createObjectStore('q', { keyPath: 'k', autoIncrement: true }); r.result.createObjectStore('kv'); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); })); })();
  const tx = async (store, mode, fn) => { const db = await IDB(); return new Promise((res, rej) => { const t = db.transaction(store, mode); const rq = fn(t.objectStore(store)); t.oncomplete = () => res(rq ? rq.result : undefined); t.onerror = () => rej(t.error); }); };
  const qAll = () => tx('q', 'readonly', s => s.getAll());
  const qAdd = it => tx('q', 'readwrite', s => s.add({ ...it, at: Date.now() }));
  const qPut = it => tx('q', 'readwrite', s => s.put(it));
  const qDel = k => tx('q', 'readwrite', s => s.delete(k));
  const kvGet = k => tx('kv', 'readonly', s => s.get(k)).catch(() => null);
  const kvSet = (k, v) => tx('kv', 'readwrite', s => s.put(v, k)).catch(() => {});
  const isNet = e => !navigator.onLine || /Failed to fetch|NetworkError|Load failed|network|fetch failed|timed? ?out|ERR_INTERNET/i.test(String(e && (e.message || e)));
  const local = {}; let qCount = 0, flushing = false, offline = false;
  const emit = (name = 'cplus-outbox', detail = {}) => window.dispatchEvent(new CustomEvent(name, { detail: { n: qCount, offline: offline || !navigator.onLine, ...detail } }));
  const recount = async () => { try { qCount = (await qAll()).length; } catch (_) {} emit(); return qCount; };
  const tmpId = () => 'tmp-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2));
  const queue = async it => { await qAdd(it); qCount++; emit(); };
  async function queueInsert(table, row) { const id = tmpId(); await queue({ op: 'insert', table, row: { ...row }, tmp: id }); return { created_at: new Date().toISOString(), ...row, id, __pending: true }; }
  async function flush() {
    if (flushing || !sb || !navigator.onLine) return; flushing = true; let done = 0, failed = 0;
    const map = (await kvGet('idmap')) || {}; const fix = v => (typeof v === 'string' && map[v]) || v;
    const fixRow = r => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fix(v)]));
    try {
      for (const it of await qAll()) {
        try {
          if (it.op === 'upload') { const { error } = await sb.storage.from(it.bucket).upload(it.path, it.blob, { contentType: it.blob.type || 'image/jpeg', upsert: true }); if (error) throw error; }
          else if (it.op === 'insert') { const r = ok(await sb.from(it.table).insert(fixRow(it.row)).select().single()); map[it.tmp] = r.id; await kvSet('idmap', map); }
          else if (it.op === 'update') { const id = fix(it.id); if (!String(id).startsWith('tmp-')) ok(await sb.from(it.table).update(fixRow(it.patch)).eq('id', id)); }
          else if (it.op === 'remove') { const id = fix(it.id); if (!String(id).startsWith('tmp-')) ok(await sb.from(it.table).delete().eq('id', id)); }
          await qDel(it.k); qCount = Math.max(0, qCount - 1); done++; emit();
        } catch (e) {
          if (isNet(e)) throw e;               // signal dropped again: stop, keep the rest for later
          console.warn('outbox drop', it.op, it.table, e); await qDel(it.k); qCount = Math.max(0, qCount - 1); failed++;
        }
      }
      if (!qCount) await kvSet('idmap', {});
    } catch (e) { console.warn('outbox paused', e); }
    finally { flushing = false; await recount(); if (done || failed) emit('cplus-synced', { done, failed }); }
  }
  const cached = async (key, fn) => { try { const v = await fn(); kvSet(key, v); offline = false; return v; } catch (e) { if (!isNet(e)) throw e; const v = await kvGet(key); if (v == null) throw e; offline = true; emit(); return v; } };
  addEventListener('online', () => { offline = false; emit(); setTimeout(flush, 800); });
  addEventListener('offline', () => emit());
  setTimeout(() => recount().then(n => n && flush()), 1500);
  setInterval(() => { if (qCount && navigator.onLine) flush(); }, 60000);

  const CHILD = ['items', 'materials', 'steps', 'updates', 'payments', 'invoices', 'milestones', 'change_orders', 'budget', 'expenses', 'comments', 'documents', 'photos', 'checklists', 'checklist_items', 'tasks', 'daily_logs', 'targets', 'time_entries', 'team_msgs'];

  window.API = {
    ready,
    CHILD,
    outbox: { count: () => qCount, flush, recount, isOffline: () => offline || !navigator.onLine },
    async session() { return ok(await sb.auth.getSession()).session; },
    onAuth(cb) { sb.auth.onAuthStateChange((_e, s) => cb(s)); },
    async signIn(email, password) { return ok(await sb.auth.signInWithPassword({ email, password })); },
    async signInGoogle() {
      const to = new URL('admin.html', location.href).href;
      ok(await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: to, queryParams: { prompt: 'select_account' } } }));
    },
    async pushKey() { return ok(await sb.rpc('push_public_key')); },
    async pushTest() { ok(await sb.rpc('push_test')); },
    async savePush(sub, lang) {
      const s = ok(await sb.auth.getSession()).session;
      ok(await sb.from('push_subscriptions').upsert({ user_id: s.user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, lang, user_agent: navigator.userAgent.slice(0, 300) }, { onConflict: 'endpoint' }));
    },
    async pushLang(endpoint, lang) { ok(await sb.from('push_subscriptions').update({ lang }).eq('endpoint', endpoint)); },
    async removePush(endpoint) { ok(await sb.from('push_subscriptions').delete().eq('endpoint', endpoint)); },
    async signOut() { await sb.auth.signOut(); for (const k of ['all', 'me', 'team', 'settings', 'templates']) await kvSet(k, null); },

    async getSettings() {
      return cached('settings', async () => {
        const rows = ok(await sb.from('settings').select('*').limit(1));
        if (rows[0]) return rows[0];
        return ok(await sb.from('settings').insert({}).select().single());
      });
    },
    async saveSettings(patch) { return ok(await sb.from('settings').update(patch).not('owner', 'is', null).select().single()); },

    /* every project with all of its rows, for the dashboard */
    async loadAll() {
      let data;
      try { data = await this.loadAllNet(); kvSet('all', data); offline = false; emit(); }
      catch (e) { if (!isNet(e)) throw e; data = await kvGet('all'); if (!data) throw e; offline = true; emit(); }
      // what is still waiting in the phone shows up too
      const q = await qAll().catch(() => []);
      for (const it of q) {
        if (it.op !== 'insert') continue; const b = data.find(x => x.project.id === it.row.project_id); if (!b || !b[it.table]) continue;
        if (!b[it.table].some(r => r.id === it.tmp)) b[it.table].push({ created_at: new Date(it.at).toISOString(), ...it.row, id: it.tmp, __pending: true });
      }
      for (const it of q) { if (it.op === 'upload' && !local[it.path]) local[it.path] = URL.createObjectURL(it.blob); }
      return data;
    },
    async loadAllNet() {
      const projects = ok(await sb.from('projects').select('*').order('created_at', { ascending: false }));
      const out = {};
      projects.forEach(p => { out[p.id] = { project: p }; CHILD.forEach(t => out[p.id][t] = []); });
      await Promise.all(CHILD.map(async t => {
        const rows = ok(await sb.from(t).select('*'));
        rows.forEach(r => out[r.project_id] && out[r.project_id][t].push(r));
      }));
      return projects.map(p => out[p.id]);
    },
    /* gastos de un año, de proyectos y generales de la empresa, para taxes */
    async expensesYear(y) { return cached('exp' + y, async () => ok(await sb.from('expenses').select('*').gte('spent_on', y + '-01-01').lte('spent_on', y + '-12-31').order('spent_on', { ascending: false }))); },
    async templates() { return cached('templates', async () => ok(await sb.from('templates').select('*').order('created_at'))); },
    async receiptUrls(paths) { if (!paths.length) return {}; const r = ok(await sb.storage.from('receipts').createSignedUrls(paths, 3600)); return Object.fromEntries(r.filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])); },
    async receiptAI(image, media) {
      const { data, error } = await sb.functions.invoke('receipt', { body: { image, media } });
      if (error) { let m = error.message; try { const j = await error.context.json(); m = j.error || m; } catch (_) {} throw new Error(m); }
      return data;
    },
    async esign(action, payload = {}) {
      const { data, error } = await sb.functions.invoke('esign', { body: { action, ...payload } });
      if (error) { let m = error.message, j = {}; try { j = await error.context.json(); m = j.error || m; } catch (_) {} throw Object.assign(new Error(m), j); }
      return data;
    },
    async insert(table, row) {
      if (!navigator.onLine) return queueInsert(table, row);
      try { return ok(await sb.from(table).insert(row).select().single()); }
      catch (e) { if (isNet(e)) return queueInsert(table, row); throw e; }
    },
    async insertMany(table, rows) { return rows.length ? ok(await sb.from(table).insert(rows).select()) : []; },
    async update(table, id, patch) {
      if (String(id).startsWith('tmp-')) {             // still waiting to upload: change the queued row itself
        const q = await qAll(), it = q.find(x => x.op === 'insert' && x.tmp === id);
        if (it) { Object.assign(it.row, patch); await qPut(it); } else await queue({ op: 'update', table, id, patch });
        return { ...patch, __pending: true };
      }
      if (!navigator.onLine) { await queue({ op: 'update', table, id, patch }); return { ...patch, __pending: true }; }
      try { return ok(await sb.from(table).update(patch).eq('id', id).select().single()); }
      catch (e) { if (isNet(e)) { await queue({ op: 'update', table, id, patch }); return { ...patch, __pending: true }; } throw e; }
    },
    async remove(table, id) {
      if (String(id).startsWith('tmp-')) { const q = await qAll(), it = q.find(x => x.op === 'insert' && x.tmp === id); if (it) { await qDel(it.k); await recount(); } return; }
      if (!navigator.onLine) return queue({ op: 'remove', table, id });
      try { ok(await sb.from(table).delete().eq('id', id)); } catch (e) { if (isNet(e)) return queue({ op: 'remove', table, id }); throw e; }
    },
    async setSite(pid, lat, lng) { ok(await sb.rpc('set_site', { pid, lat, lng })); },
    async audit(pid) { let q = sb.from('audit_log').select('*').order('at', { ascending: false }).limit(pid ? 300 : 400); if (pid) q = q.eq('project_id', pid); return ok(await q); },
    async weeklyTest() { const { data, error } = await sb.functions.invoke('weekly', { body: {} }); if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch (_) {} throw new Error(m); } return data; },
    async msgsRead(pid) { ok(await sb.rpc('msgs_read', { pid })); },
    async listMsgs() { if (!navigator.onLine) return null; return ok(await sb.from('team_msgs').select('*').order('created_at')); },
    async markSeen(projectId) { ok(await sb.from('comments').update({ seen: true }).eq('project_id', projectId).eq('author', 'client').eq('seen', false)); },

    async upload(bucket, path, blob) {
      const later = async () => { await queue({ op: 'upload', bucket, path, blob }); local[path] = URL.createObjectURL(blob); return path; };
      if (!navigator.onLine) return later();
      try { ok(await sb.storage.from(bucket).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })); return path; }
      catch (e) { if (isNet(e)) return later(); throw e; }
    },
    async removeFiles(bucket, paths) { if (paths && paths.length) { try { ok(await sb.storage.from(bucket).remove(paths)); } catch (e) { if (!isNet(e)) throw e; } } },
    async listFolder(bucket, folder) { return (ok(await sb.storage.from(bucket).list(folder, { limit: 1000 })) || []).map(f => folder + '/' + f.name); },
    docUrl(path) { return sb.storage.from('docs').getPublicUrl(path).data.publicUrl; },
    photoUrl(path) { if (local[path]) return local[path]; return sb.storage.from('photos').getPublicUrl(path).data.publicUrl; },
    async receiptUrl(path) { if (local[path]) return local[path]; return ok(await sb.storage.from('receipts').createSignedUrl(path, 600)).signedUrl; },

    /* team and roles */
    async me() { const s = ok(await sb.auth.getSession()).session; if (!s) return null; return cached('me', async () => ok(await sb.from('team').select('*').eq('user_id', s.user.id).maybeSingle())); },
    async team() { return cached('team', async () => ok(await sb.from('team').select('*').order('created_at'))); },
    async setRole(uid, role) { return ok(await sb.from('team').update({ role }).eq('user_id', uid).select().single()); },
    async teamFn(action, body = {}) {
      const { data, error } = await sb.functions.invoke('team', { body: { action, ...body } });
      if (error) { let m = error.message; try { m = (await error.context.json()).error || m; } catch (_) {} throw new Error(m); }
      return data;
    },
    async changePassword(password) { ok(await sb.auth.updateUser({ password })); },
    async listLeads() { return ok(await sb.from('leads').select('*').order('created_at', { ascending: false }).limit(200)); },
    async submitLead(f) { ok(await sb.rpc('submit_lead', { who: f.name, tel: f.phone, mail: f.email, town: f.city, svc: f.service, msg: f.message, lng: f.lang, pics: f.pics || [] })); },
    async uploadLeadPhoto(blob, folder, n) { const path = `new/${folder}/${n}.jpg`; ok(await sb.storage.from('lead_photos').upload(path, blob, { contentType: 'image/jpeg', upsert: false })); return path; },
    async leadPhotoUrls(paths) { if (!paths.length) return {}; const r = ok(await sb.storage.from('lead_photos').createSignedUrls(paths, 3600)); return Object.fromEntries(r.filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])); },
    /* client side: no login, only the private token */
    async clientProject(tok) { return ok(await sb.rpc('client_project', { tok })); },
    async clientComment(tok, who, msg) { ok(await sb.rpc('client_comment', { tok, who, msg })); },
    async clientDecide(tok, co, approve, who) { ok(await sb.rpc('client_decide', { tok, co, approve, who })); },
    /* usage insights: which buttons and screens are used (no personal data) and the Suggestions box */
    track(rows) { if (sb && rows && rows.length) sb.from('events').insert(rows).then(() => {}, () => {}); },
    async feedback(row) { ok(await sb.from('feedback').insert(row)); }
  };
})();
