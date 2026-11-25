{
const S = CPLUS, t = S.t, esc = S.esc, money = S.money, fdate = S.fdate, $ = q => document.querySelector(q), app = $('#app');
const STATUSES = ['estimate_sent', 'estimate_accepted', 'progress', 'done'];
const stOf = p => STATUSES.includes(p.status) ? p.status : (p.status === 'paused' ? 'progress' : 'estimate_sent');
let pfilter = 'all', creating = false, leads = [], lastEmail = '', view = 'boot', B = [], cur = null, ctab = 'dash', settings = {}, busy = false, err = '', me = null, team = [], afilter = 'all', lastCreated = null, leadUrls = {};
S.setLang(S.L);

/* ---------- roles ---------- */
const role = () => me && me.role, staff = () => role() === 'admin' || role() === 'manager', isAdmin = () => role() === 'admin';
const contractors = () => team.filter(m => m.role === 'contractor' && m.active);
const nameOf = id => (team.find(m => m.user_id === id) || {}).name || '';
const assignOpts = () => [['', t('unassigned')], ...contractors().map(m => [m.user_id, m.name])];
const genPw = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', r = crypto.getRandomValues(new Uint32Array(10)); return [...r].map(x => a[x % a.length]).join(''); };
const loginUrl = () => new URL('admin.html', location.href).href;

/* ---------- small builders ---------- */
const fld = (tb, r, f, type = 'text', cls = '') => `<input class="${cls}" type="${type}" data-t="${tb}" data-id="${r.id ?? ''}" data-f="${f}" value="${esc(r[f] ?? '')}"${type === 'number' ? ' step="any" inputmode="decimal" min="0"' : ''} aria-label="${esc(t('f_' + f))}">`;
const sel = (tb, r, f, opts, cls = '') => `<select class="${cls}" data-t="${tb}" data-id="${r.id}" data-f="${f}" aria-label="${esc(t('f_' + f))}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(r[f]) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const chk = (tb, r, f, label) => `<input type="checkbox" class="chk" data-t="${tb}" data-id="${r.id}" data-f="${f}"${r[f] ? ' checked' : ''} aria-label="${esc(label)}">`;
const del = (tb, id) => `<button class="ico x" data-del="${tb}:${id}" aria-label="${t('delete')}" title="${t('delete')}">✕</button>`;
const budOpts = () => [['', t('noCat')], ...cur.budget.map(b => [b.id, b.category || '·'])];
const catName = id => cur.budget.find(b => b.id === id)?.category || t('noCat');
const showShare = () => isAdmin() && pct() > 0;
const pct = () => { const v = +settings.share_pct; return isFinite(v) && settings.share_pct !== null && settings.share_pct !== undefined && settings.share_pct !== '' ? v : 10; };
const shareOf = c => { const s = c.sub * pct() / 100, r = c.tot > 0 ? Math.min(1, Math.max(0, c.paid / c.tot)) : 0; return { s, earned: s * r, pending: s - s * r, after: (c.profit || 0) - s }; };
const kinds = () => [['mat', t('materials')], ['lab', t('labor')]];
const kpi = (l, v, cls = '', e = '') => `<div class="kpi ${cls}"><small>${l}</small><b>${money(v)}</b>${e ? `<em>${e}</em>` : ''}</div>`;
const showInstall = () => { try { if (localStorage.getItem('cplus-noinstall')) return false; } catch (_) {} return /iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.standalone || matchMedia('(display-mode: standalone)').matches); };
const unseen = b => b.comments.filter(c => c.author === 'client' && !c.seen).length;
const setDot = s => { const d = $('#savedot'); if (d) d.textContent = s; };
const fail = e => { console.error(e); S.toast(/fetch|network/i.test(e.message || '') ? t('saveFail') : t('error') + ': ' + (e.message || e)); };

/* ---------- screens ---------- */
function setup() { return `<div class="lock"><div class="box">${S.MARK('l')}<h1>${t('setupT')}</h1><p>${t('setupS')}</p></div></div>`; }
function login() {
  return `<div class="lock"><form class="box" id="loginf">${S.MARK('l')}<h1>${t('loginT')}</h1><p>${t('loginS')}</p>
  <button type="button" class="gbtn" data-google><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"/><path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg><span>${t('gLogin')}</span></button>
  <div class="orline"><span>${t('orEmail')}</span></div>
  <input id="em" type="email" value="${esc(lastEmail)}" autocomplete="username" placeholder="${t('email')}" aria-label="${t('email')}" style="letter-spacing:0;font-size:17px;text-align:start">
  <input id="pw" type="password" autocomplete="current-password" placeholder="${t('password')}" aria-label="${t('password')}" style="letter-spacing:0;font-size:17px;text-align:start">
  <div class="err" role="alert">${esc(err)}</div><button class="primary" type="submit"${busy ? ' disabled' : ''}>${busy ? t('loading') : t('login')}</button>
  <p style="margin-top:14px"><button type="button" class="btn2" data-first>${t('firstLink')}</button></p>
  <div style="margin-top:16px">${S.langSeg()}</div></form></div>`;
}
function first() {
  return `<div class="lock"><form class="box" id="firstf">${S.MARK('l')}<h1>${t('firstT')}</h1><p>${t('firstS')}</p>
  <input id="fc" autocomplete="off" autocapitalize="characters" placeholder="${t('setupCode')}" aria-label="${t('setupCode')}" style="letter-spacing:.2em;font-size:17px;text-align:center">
  <input id="fn" autocomplete="name" placeholder="${t('memberName')}" aria-label="${t('memberName')}" style="letter-spacing:0;font-size:17px;text-align:start">
  <input id="fe" type="email" autocomplete="username" placeholder="${t('email')}" aria-label="${t('email')}" style="letter-spacing:0;font-size:17px;text-align:start">
  <input id="fp" type="password" autocomplete="new-password" placeholder="${t('newPw')}" aria-label="${t('newPw')}" style="letter-spacing:0;font-size:17px;text-align:start">
  <div class="err" role="alert">${esc(err)}</div><button class="primary" type="submit"${busy ? ' disabled' : ''}>${busy ? t('loading') : t('createAdmin')}</button>
  <p style="margin-top:14px"><button type="button" class="btn2" data-tologin>${t('login')}</button></p></form></div>`;
}
let noEmail = '';
function noAccess() { return `<div class="lock"><div class="box">${S.MARK('l')}<h1>${t('noAccessT')}</h1><p>${t('noAccessS')}</p>${noEmail ? `<p><b>${esc(noEmail)}</b></p>` : ''}<button class="btn2" data-logout>${t('logout')}</button></div></div>`; }
const topbar = () => S.header(`<span id="savedot" class="savedot" aria-live="polite"></span><button class="ghost gear${view === 'home' && hview === 'settings' ? ' on' : ''}" data-hv="settings" aria-label="${t('settingsNav')}" title="${t('settingsNav')}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg><span class="gt">${t('settingsNav')}</span></button>`, `<span class="role">${esc(me ? (me.name || '') + ' · ' + t('role_' + me.role) : t('contractor'))}</span>`, 'nolang-m');

function homeContractor() {
  const today = S.today(), lim = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const up = B.flatMap(b => b.steps.filter(s => !s.done && s.due_date && s.due_date <= lim).map(s => ({ ...s, pt: b.project.title, late: s.due_date < today }))).sort((a, b) => a.due_date.localeCompare(b.due_date));
  return topbar() + `<main><div class="wrap"><div class="secthead"><h1>${t('myProjects')}</h1></div>${pushPrompt()}
  <div class="plist">${B.length ? B.map(b => { const c = S.calc(b), u = unseen(b), nx = b.steps.slice().sort((x, y) => (x.sort || 0) - (y.sort || 0)).find(s => !s.done); return `<button class="pcard" data-open="${b.project.id}">${u ? `<span class="badge">${u}</span>` : ''}
    <span class="who2">${esc(b.project.client_name || '·')}</span><h3>${esc(b.project.title || t('project'))}</h3><span class="pill st-${stOf(b.project)}">${t('st_' + stOf(b.project))}</span>
    <div class="bar"><i style="width:${c.pct}%"></i></div><small class="sub">${c.pct}% ${t('done')}</small>
    <dl>${b.project.address ? `<dt>${t('projAddress')}</dt><dd>${esc(b.project.address)}</dd>` : ''}${nx ? `<dt>${t('nextStep')}</dt><dd>${esc(nx.title)}</dd>` : ''}</dl></button>`; }).join('') : `<div class="card"><p class="sub">${t('noAssigned')}</p></div>`}</div>
  ${(() => { const mt = B.flatMap(b => b.tasks.filter(x => !x.done && x.assigned_to === me.user_id).map(x => ({ ...x, pt: b.project.title, pid: b.project.id }))); return mt.length ? `<div class="card" style="margin-top:18px"><h2>${t('myTasks')}</h2>${mt.map(x => `<button class="alrow" data-open="${x.pid}"><span><b>${esc(x.title)}</b><small>${esc(x.pt)}${x.due_date ? ' · ' + fdate(x.due_date) : ''}</small></span></button>`).join('')}</div>` : ''; })()}
  <div class="cols" style="margin-top:18px"><div class="card week"><h2>${t('thisWeek')}</h2>${up.length ? `<ul>${up.map(s => `<li><time style="${s.late ? 'color:#d0503a' : ''}">${fdate(s.due_date)}</time><div><b>${esc(s.title)}</b><small>${esc(s.pt)}</small></div></li>`).join('')}</ul>` : `<p class="sub">${t('noUpcoming')}</p>`}</div></div>
  <div class="card"><h2>${t('feedT')}</h2>${feedHtml(events(B, 20))}</div>
  </div></main>`;
}
function accountCard() {
  return `<form class="card" id="pwf"><h2>${t('myAccount')}</h2><p class="sub">${esc(me.email || '')} · ${t('role_' + me.role)}</p>
  <label>${t('newPw')}<input id="npw" type="password" autocomplete="new-password" minlength="8" style="display:block;width:100%;margin-top:6px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-height:44px;font-size:16px"></label>
  <button class="btn2" type="submit" style="margin-top:10px">${t('changePw')}</button></form>`;
}
function teamCard() {
  const inp = 'style="display:block;width:100%;margin-top:6px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-height:44px;font-size:16px"';
  const roles = ['contractor', 'manager', 'admin'];
  const lc = lastCreated, msg = lc ? t('credsMsg').replace('{n}', lc.name.split(' ')[0]).replace('{u}', loginUrl()).replace('{e}', lc.email).replace('{p}', lc.password) : '';
  return `<div class="card"><h2>${t('team')}</h2><p class="sub">${t('teamSub')}</p>
  ${team.map(m => `<div class="row trow"><div><b>${esc(m.name)}</b>${m.user_id === me.user_id ? ` <small class="sub">(${t('you')})</small>` : ''}<br><small class="sub">${esc(m.email)}</small></div>
    ${m.user_id === me.user_id ? `<span class="pill">${t('role_' + m.role)}</span>` : `<select data-setrole="${m.user_id}" aria-label="${t('roleL')}">${roles.map(r => `<option value="${r}"${m.role === r ? ' selected' : ''}>${t('role_' + r)}</option>`).join('')}</select>`}
    <button class="btn2" data-resetpw="${m.user_id}">${t('resetPw')}</button>${m.user_id === me.user_id ? '<span></span>' : `<button class="btn2 danger" data-rmm="${m.user_id}">${t('removeM')}</button>`}</div>`).join('')}
  ${lc ? `<div class="card" style="border-color:var(--cu);margin-top:14px"><b>${t('sendCreds')}</b><pre style="white-space:pre-wrap;font:inherit;margin:8px 0">${esc(msg)}</pre><div class="acts"><button class="primary" data-copylink="${esc(msg)}">${t('copy')}</button><a class="btn2" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">WhatsApp</a><button class="btn2" data-hidecreds>${t('done2')}</button></div></div>` : ''}
  <form id="teamf" style="margin-top:16px"><h3 style="margin:0 0 8px">${t('addMember')}</h3><div class="grid2">
  <label>${t('memberName')}<input id="tm-name" maxlength="80" ${inp}></label><label>${t('email')}<input id="tm-email" type="email" autocapitalize="off" maxlength="160" ${inp}></label>
  <label>${t('roleL')}<select id="tm-role" ${inp}>${roles.map(r => `<option value="${r}">${t('role_' + r)}</option>`).join('')}</select></label>
  <label>${t('tempPass')}<input id="tm-pw" value="${genPw()}" minlength="8" ${inp}></label></div>
  <button class="primary" type="submit" style="margin-top:12px">${t('addMember')}</button></form></div>`;
}

/* ---------- push notifications ---------- */
let pushSt = 'unknown', pushKeyV = null;
const isIOSd = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
async function curSub() { try { const r = await navigator.serviceWorker.getRegistration(); return r ? await r.pushManager.getSubscription() : null; } catch (_) { return null; } }
async function pushRefresh() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) pushSt = isIOSd() && !isStandalone() ? 'ios' : 'unsupported';
  else if (Notification.permission === 'denied') pushSt = 'denied';
  else { const sub = await curSub(); pushSt = sub ? 'on' : 'off'; if (sub) API.savePush(sub.toJSON(), S.L).catch(() => {}); }
  if (pushSt === 'off' && !pushKeyV) pushKeyV = await API.pushKey().catch(() => null);
}
const pushLater = () => { try { return !!localStorage.getItem('cplus-pushlater'); } catch (_) { return false; } };
function pushCard() {
  const why = t(staff() ? 'pushWhyStaff' : 'pushWhyCrew');
  const body = pushSt === 'on' ? `<p class="okline">✓ ${t('pushOn')}</p><p class="sub">${why}</p><div class="acts"><button class="btn2" data-pushtest>${t('pushTest')}</button><button class="btn2" data-pushoff>${t('pushOffBtn')}</button></div>`
    : pushSt === 'off' ? `<p class="sub">${why}</p><div class="acts"><button class="primary" data-pushon>${t('pushOnBtn')}</button></div>`
    : pushSt === 'ios' ? `<p class="sub">${t('pushIOS')}</p><div class="acts"><button class="btn2" data-ioshint>${t('pushHowIOS')}</button></div>`
    : pushSt === 'denied' ? `<p class="sub">${t('pushDenied')}</p>` : `<p class="sub">${t('pushNo')}</p>`;
  return `<div class="card"><h2>${t('pushT')}</h2>${body}<div class="acts" style="margin-top:8px"><button class="btn2" data-pwa-install hidden>${t('installApp')}</button></div></div>`;
}
function pushPrompt() {
  if (pushSt !== 'off' || pushLater() || !pushKeyV) return '';
  return `<div class="card pushask"><div><b>${t('pushAskT')}</b><p class="sub">${t(staff() ? 'pushWhyStaff' : 'pushWhyCrew')}</p></div><div class="acts"><button class="primary" data-pushon>${t('pushOnBtn')}</button><button class="btn2" data-pushlater>${t('notNow')}</button></div></div>`;
}
function settingsView() {
  const back = `<button class="btn2" data-hv="projects">${t('back')}</button>`;
  const company = isAdmin() ? `<div class="card ed"><h2>${t('settings')}</h2><div class="grid2" style="margin-top:12px"><label>${t('company')}${fld('settings', settings, 'company')}</label><label>${t('cname')}${fld('settings', settings, 'contact_name')}</label><label>${t('phone')}${fld('settings', settings, 'phone', 'tel')}</label><label>${t('email')}${fld('settings', settings, 'email', 'email')}</label><label>${t('sharePct')}${fld('settings', { ...settings, share_pct: pct() }, 'share_pct', 'number')}</label></div><p class="hint">${t('shareHint')}</p></div>` : '';
  return topbar() + `<main><div class="wrap"><div class="secthead"><h1>${t('settingsNav')}</h1>${back}</div>
  ${pushCard()}${company}${isAdmin() ? teamCard() : ''}${accountCard()}
  <div class="card"><h2>${t('lang')}</h2><div style="margin-top:10px">${S.langSeg()}</div></div>
  <p style="text-align:center;margin:22px 0"><button class="btn2 danger" data-logout>${t('logout')}</button></p></div></main>`;
}
function home() {
  if (hview === 'settings') return settingsView();
  if (!staff()) return homeContractor();
  if (hview === 'review') return topbar() + `<main><div class="wrap">${hnav()}${reviewList()}</div></main>`;
  if (hview === 'dash') return topbar() + `<main><div class="wrap">${hnav()}${dashView()}</div></main>`;
  if (hview === 'feed') return topbar() + `<main><div class="wrap">${hnav()}<div class="secthead"><h1>${t('feedT')}</h1></div><p class="sub">${t('feedS')}</p><div class="card">${feedHtml(events(B))}</div></div></main>`;
  if (hview === 'taxes') return topbar() + `<main><div class="wrap">${hnav()}${taxView()}</div></main>`;
  const shown = B.filter(b => rvOf(b.project) === 'approved' && matchQ(b) && (pfilter === 'all' || stOf(b.project) === pfilter) && (afilter === 'all' || (afilter === 'none' ? !b.project.assigned_to : b.project.assigned_to === afilter)));
  const cs = shown.map(b => S.calc(b)), sum = k => cs.reduce((a, c) => a + (c[k] || 0), 0);
  const AP = B.filter(b => rvOf(b.project) === 'approved'), count = s => AP.filter(b => stOf(b.project) === s).length;
  const today = S.today(), lim = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const up = B.flatMap(b => b.steps.filter(s => !s.done && s.due_date && s.due_date <= lim).map(s => ({ ...s, pt: b.project.title, late: s.due_date < today }))).sort((a, b) => a.due_date.localeCompare(b.due_date));
  return topbar() + `<main><div class="wrap">${hnav()}
  <div class="secthead"><h1>${t('projects')}</h1>${creating ? '' : `<button class="primary" data-newp>${t('newProject')}</button>`}</div>
  ${homeTools()}${recv ? recvForm() : ''}
  ${creating ? newForm() : ''}
  ${B.length ? `<div class="filters" role="group" aria-label="${t('status')}">${['all', ...STATUSES].map(s => `<button data-pf="${s}" class="${pfilter === s ? 'on' : ''}" aria-pressed="${pfilter === s}">${s === 'all' ? t('all') : t('st_' + s)} <span class="cnt">${s === 'all' ? AP.length : count(s)}</span></button>`).join('')}</div>` : ''}
  ${B.length && contractors().length ? `<div class="filters" role="group" aria-label="${t('assignedTo')}">${[['all', t('everyone')], ...contractors().map(m => [m.user_id, m.name]), ['none', t('unassigned')]].map(([v, l]) => `<button data-af="${v}" class="${afilter === v ? 'on' : ''}" aria-pressed="${afilter === v}">${esc(l)} <span class="cnt">${AP.filter(b => v === 'all' || (v === 'none' ? !b.project.assigned_to : b.project.assigned_to === v)).length}</span></button>`).join('')}</div>` : ''}
  ${pushPrompt()}
  ${showInstall() ? `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><img src="icon-180.png" alt="" width="48" height="48" style="border-radius:11px"><div style="flex:1 1 220px"><b>${t('installT')}</b><p class="sub" style="margin:2px 0 0">${t('installS')}</p></div><button class="btn2" data-hideinstall>${t('hide')}</button></div>` : ''}
  ${B.length ? `<div class="kpis">${kpi(t('contracts'), sum('tot'))}${kpi(t('collected'), sum('paid'))}${kpi(t('receivable'), sum('bal'))}${kpi(t('spent'), sum('spent'))}${kpi(t('profit'), sum('profit'), sum('profit') < 0 ? 'neg' : 'pos', t('profitSub'))}</div>
  ${showShare() ? `<div class="kpis">${(() => { const sh = cs.map(shareOf), tot = k => sh.reduce((x, y) => x + y[k], 0); return kpi(`${t('share')} ${pct()}%`, tot('s'), '', t('shareOf')) + kpi(t('shareEarned'), tot('earned'), 'pos', t('shareEarnedSub')) + kpi(t('sharePending'), tot('pending')) + kpi(t('profitAfter'), tot('after'), tot('after') < 0 ? 'neg' : ''); })()}</div>` : ''}` : ''}
  ${(() => { const n = B.filter(b => rvOf(b.project) === 'review').length; return n ? `<button class="card rvbanner" data-hv="review"><b>${t(n === 1 ? 'nReview1' : 'nReview').replace('{n}', n)}</b><span>${t('reviewBtn')} →</span></button>` : ''; })()}
  ${budgetAlerts()}
  ${leadsCard()}
  <div class="plist">${shown.length ? '' : (B.length ? `<p class="sub">${t('noneInStatus')}</p>` : '')}${shown.map((b, i) => { const c = cs[i], u = unseen(b); return `<button class="pcard" data-open="${b.project.id}">${u ? `<span class="badge" title="${t('unread')}">${u}</span>` : ''}
    <span class="who2">${esc(b.project.client_name || '·')}</span><h3>${esc(b.project.title || t('project'))}</h3><span class="pill st-${stOf(b.project)}">${t('st_' + stOf(b.project))}</span> <span class="pill">${esc(nameOf(b.project.assigned_to) || t('unassigned'))}</span>
    <div class="bar"><i style="width:${c.pct}%"></i></div><small class="sub">${c.pct}% ${t('done')}</small>
    <dl><dt>${t('contract')}</dt><dd>${money(c.tot)}</dd><dt>${t('collected')}</dt><dd>${money(c.paid)}</dd><dt>${t('spent')}</dt><dd>${money(c.spent)} ${t('of')} ${money(c.bud)}</dd><dt>${t('profit')}</dt><dd style="color:${c.profit < 0 ? '#b23a26' : 'var(--ok)'}">${money(c.profit)}</dd>${showShare() ? `<dt>${t('share')} ${pct()}%</dt><dd><b>${money(shareOf(c).s)}</b></dd><dt>${t('shareEarned')}</dt><dd>${money(shareOf(c).earned)}</dd>` : ''}</dl></button>`; }).join('')}</div>
  ${B.length ? '' : `<div class="card" style="text-align:center"><p class="sub">${t('none')}</p><button class="btn2" data-sample>${t('sampleProject')}</button></div>`}
  <div class="cols" style="margin-top:18px"><div class="card week"><h2>${t('thisWeek')}</h2>${up.length ? `<ul>${up.map(s => `<li><time style="${s.late ? 'color:#d0503a' : ''}">${fdate(s.due_date)}</time><div><b>${esc(s.title)}</b><small>${esc(s.pt)}</small></div></li>`).join('')}</ul>` : `<p class="sub">${t('noUpcoming')}</p>`}</div>
</div>
  ${B.length ? `<p style="text-align:center"><button class="btn2" data-sample>${t('sampleProject')}</button></p>` : ''}
  </div></main>`;
}

const fe = k => `<small class="ferr" id="err-${k}" role="alert"></small>`;
function newForm() {
  const svc = S.SERVICES.map(s => `<option value="${s}">${t('svc_' + s)}</option>`).join('');
  return `<form class="card npf" id="newpf" novalidate>
  <h2>${t('newProjectT')}</h2>
  <fieldset><legend><b>1</b>${t('npStep1')}</legend>
    <label>${t('fullName')} <i>*</i><input id="np-name" autocomplete="off" maxlength="200" placeholder="Ej. María López">${fe('name')}</label>
    <div class="grid2"><label>${t('phone1')} <i>*</i><input id="np-phone" type="tel" inputmode="tel" maxlength="40" placeholder="(801) 555-0134">${fe('phone')}</label>
    <label>${t('email')} <i>*</i><input id="np-email" type="email" inputmode="email" autocapitalize="off" maxlength="160" placeholder="nombre@gmail.com">${fe('email')}</label></div>
    <label>${t('phone2')}<input id="np-phone2" type="tel" inputmode="tel" maxlength="40"></label>
  </fieldset>
  <fieldset><legend><b>2</b>${t('npStep2')}</legend>
    <div class="grid2"><label>${t('service')}<select id="np-service">${svc}</select></label>
    <label>${t('status')}<select id="np-status">${STATUSES.map(s => `<option value="${s}">${t('st_' + s)}</option>`).join('')}</select></label></div>
    <label>${t('projAddress')}<input id="np-address" maxlength="300" autocomplete="off" placeholder="1234 E Main St, Lehi, UT"></label>
    <label>${t('ptitle')}<input id="np-title" maxlength="200" placeholder="${t('ptitleEx')}"><small class="hint" style="display:block;margin:4px 0 0">${t('titleAuto')}</small></label>
  </fieldset>
  <fieldset><legend><b>3</b>${t('npStep3')}</legend>
    <label>${t('details')}<textarea id="np-details" rows="5" maxlength="4000" placeholder="${t('detailsPh')}"></textarea><small class="hint" style="display:block;margin:4px 0 0">${t('detailsHint')}</small></label>
  </fieldset>
  <div class="npbar"><button class="btn2" type="button" data-cancelnew>${t('cancel')}</button><button class="primary" type="submit">${t('create')}</button></div>
  </form>`;
}
function leadsCard() {
  const open = leads.filter(l => l.status === 'new' || l.status === 'contacted');
  if (!open.length) return '';
  return `<div class="card"><h2>${t('leads')} <span class="badge">${open.filter(l => l.status === 'new').length || ''}</span></h2><p class="sub">${t('leadsSub')}</p>
  ${open.map(l => { const tel = (l.phone || '').replace(/[^\d+]/g, ''), wa = tel.replace(/\D/g, '');
    return `<div class="co"><div class="top2"><b>${esc(l.name)}</b><span class="pill ${l.status === 'new' ? 'pending' : 'paid'}">${t('lead_' + l.status)}</span></div>
    <small class="sub">${fdate(l.created_at)}${l.service ? ' · ' + esc(l.service) : ''}${l.city ? ' · ' + esc(l.city) : ''} · ${l.lang === 'en' ? 'English' : 'Español'}</small>
    ${l.message ? `<p style="margin:6px 0 0;white-space:pre-wrap">${esc(l.message)}</p>` : ''}
    ${(l.photos || []).length ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">${l.photos.map((p, i) => leadUrls[p] ? `<a href="${esc(leadUrls[p])}" target="_blank" rel="noopener"><img src="${esc(leadUrls[p])}" alt="${t('photo')} ${i + 1}" width="88" height="88" style="object-fit:cover;border-radius:10px;display:block"></a>` : '').join('')}</div>` : ''}
    <div class="acts">${l.phone ? `<a class="btn2" href="tel:${esc(tel)}">${esc(l.phone)}</a><a class="btn2" href="https://wa.me/${wa.length === 10 ? '1' + wa : wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${l.email ? `<a class="btn2" href="mailto:${esc(l.email)}">${esc(l.email)}</a>` : ''}
    <button class="primary" data-leadp="${l.id}">${t('leadToProject')}</button>${l.status === 'new' ? `<button class="btn2" data-leadst="${l.id}:contacted">${t('lead_contacted')}</button>` : ''}<button class="btn2" data-leadst="${l.id}:archived">${t('archive')}</button></div></div>`; }).join('')}</div>`;
}
function project() {
  const u = unseen(cur), p = cur.project;
  const tabs = staff() ? Object.assign({ dash: cDash }, isRecv(p) ? { review: cReview } : {}, { project: cProj, estimate: cEst, money: cMoney, pays: cPays, invoices: cInvoices, changes: cChanges, photos: cPhotos, checks: cChecks, logs: cLogs, progress: cProgress, materials: cMats, docs: cDocs, messages: cMsgs })
    : { progress: cProgress, photos: cPhotos, checks: cChecks, logs: cLogs, materials: cMats, messages: cMsgs, info: cInfo };
  const TN = { invoices: 'invoicesTab', photos: 'photosTab', checks: 'checksTab', logs: 'logsTab', review: 'review' };
  if (!tabs[ctab]) ctab = Object.keys(tabs)[0];
  const GR = staff() ? [['g_sum', ['dash', 'review']], ['g_money', ['estimate', 'money', 'pays', 'invoices', 'changes']], ['g_work', ['progress', 'photos', 'checks', 'logs', 'materials']], ['g_client', ['project', 'docs', 'messages']]]
    : [['g_work', ['progress', 'photos', 'checks', 'logs', 'materials']], ['messages', ['messages']], ['info', ['info']]];
  const groups = GR.map(([g, ks]) => [g, ks.filter(k => tabs[k])]).filter(([, ks]) => ks.length);
  const curG = groups.find(([, ks]) => ks.includes(ctab)) || groups[0];
  const bdg = k => (k === 'review' && rvOf(p) === 'review' ? '<span class="badge">!</span>' : '') + (k === 'messages' && u ? `<span class="badge">${u}</span>` : '');
  const tl = k => k === 'project' && staff() ? t('clientTab') : t(TN[k] || k);
  const nav = `<nav class="cbar"><div class="wrap"><button data-home class="bk" aria-label="${t('back')}"><span aria-hidden="true">←</span><span class="bkt">${t('back').replace(/^←\s*/, '')}</span></button>${groups.map(([g, ks]) => `<button data-ctab="${ks[0]}" class="${curG[0] === g ? 'on' : ''}"${curG[0] === g ? ' aria-current="page"' : ''}>${t(g)}${ks.map(bdg).join('')}</button>`).join('')}</div></nav>
  ${curG[1].length > 1 ? `<nav class="subbar" aria-label="${t(curG[0])}"><div class="wrap">${curG[1].map(k => `<button data-ctab="${k}" class="${ctab === k ? 'on' : ''}"${ctab === k ? ' aria-current="true"' : ''}>${tl(k)}${bdg(k)}</button>`).join('')}</div></nav>` : ''}`;
  if (!staff()) return topbar() + nav + `
  <main class="ed"><div class="wrap"><div class="phead"><h1 class="titleinp" style="border:0">${esc(p.title || t('project'))}</h1><span class="pill st-${stOf(p)}">${t('st_' + stOf(p))}</span></div>
  <div class="pclient"><b>${esc(p.client_name || '·')}</b>${p.client_phone ? `<a href="tel:+${S.intl(p.client_phone)}">${esc(p.client_phone)}</a>` : ''}${p.address ? `<span>${esc(p.address)}</span>` : ''}</div>
  ${tabs[ctab]()}</div></main>`;
  return topbar() + nav + `
  <main class="ed"><div class="wrap"><div class="phead"><label class="sr" for="ptitle-top">${t('ptitle')}</label><input id="ptitle-top" class="titleinp" data-t="projects" data-id="${p.id}" data-f="title" value="${esc(p.title)}" placeholder="${t('ptitleEx')}" maxlength="200">
  <label class="stlab"><span class="sr">${t('status')}</span><select class="stsel2 st-${stOf(p)}" data-t="projects" data-id="${p.id}" data-f="status">${STATUSES.map(s => `<option value="${s}"${stOf(p) === s ? ' selected' : ''}>${t('st_' + s)}</option>`).join('')}</select></label></div>
  <div class="pclient"><b>${esc(p.client_name || '·')}</b>${p.client_phone ? `<a href="tel:+${S.intl(p.client_phone)}">${esc(p.client_phone)}</a>` : ''}${p.client_email ? `<a href="mailto:${esc(p.client_email)}">${esc(p.client_email)}</a>` : ''}${p.address ? `<span>${esc(p.address)}</span>` : ''}<button class="btn2 editbtn" data-ctab="project" data-focus="client_name"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/></svg>${t('editClient')}</button></div>
  ${rvOf(p) !== 'approved' && ctab !== 'review' ? `<button class="card rvbanner rv-${rvOf(p)}" data-ctab="review"><b>${t('rv_' + rvOf(p))}${p.source_company ? ' · ' + esc(p.source_company) : ''}</b><span>${t('reviewBtn')} →</span></button>` : ''}
  ${ctab === 'project' ? crewCard(p) : ''}
  ${rvOf(p) === 'approved' && ctab === 'project' ? shareBar(p) : ''}${tabs[ctab]()}</div></main>`;
}
function buyForm() {
  return `<div class="card"><div class="secthead" style="margin:0"><h2 style="margin-inline-end:auto">${t('logBuy')}</h2><button class="primary cam" type="button" data-scan="${cur.project.id}">${camIco}${t('scanReceipt')}</button></div><form class="form" id="buyf" style="margin-top:12px">
  <label class="wide">${t('desc')}<input id="xe-desc" type="text"></label><label>${t('amt')}<input id="xe-amt" type="number" step="any" inputmode="decimal"></label><label>${t('date')}<input id="xe-date" type="date" value="${S.today()}"></label>
  <label>${t('cat')}<select id="xe-cat">${budOpts().map(([v, l], i) => `<option value="${esc(v)}"${i === 1 ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label><label>${t('store')}<input id="xe-store" type="text"></label><label>${t('taxCat')}<select id="xe-tax">${taxOpts().map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></label><label>${t('payMethod')}<select id="xe-pay">${payOpts().map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></label>
  <label class="wide">${t('linkMat')}<select id="xe-mat"><option value="">${t('noMat')}</option>${cur.materials.filter(m => !m.purchased).map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></label>
  <label class="wide">${t('receipt')}<input id="xe-file" type="file" accept="image/*,application/pdf"></label>
  <button class="primary" type="submit">${t('register')}</button></form></div>`;
}
function payForm() {
  return `<div class="card"><h2>${t('logPay')}</h2><form class="form" id="payf" style="margin-top:12px"><label>${t('amt')}<input id="xp-amt" type="number" step="any" inputmode="decimal"></label><label>${t('date')}<input id="xp-date" type="date" value="${S.today()}"></label><label>${t('note')}<input id="xp-note" type="text"></label><button class="primary" type="submit">${t('register')}</button></form></div>`;
}
function catBars(c) {
  return cur.budget.map(b => { const s = c.byCat(b.id), ov = s > b.amount, pc = b.amount ? Math.min(100, s / b.amount * 100) : 0;
    return `<div class="cat"><div class="top2"><b>${esc(b.category)}</b><span>${money(s)} ${t('of')} ${money(b.amount)}</span></div><div class="bar"><i class="${ov ? 'over' : ''}" style="width:${ov ? 100 : pc}%"></i></div>${ov ? `<small style="color:#d0503a;font-weight:600">${t('over')}: ${money(s - b.amount)}</small>` : ''}</div>`; }).join('') || `<p class="sub">${t('none')}</p>`;
}
function cInfo() {
  const p = cur.project, maps = p.address ? 'https://maps.google.com/?q=' + encodeURIComponent(p.address) : '';
  return `<div class="card"><h2>${t('info')}</h2><dl class="info" style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:12px 0 0">
  <dt>${t('fullName')}</dt><dd style="margin:0">${esc(p.client_name || '·')}</dd>
  ${p.client_phone ? `<dt>${t('phone1')}</dt><dd style="margin:0"><a href="tel:+${S.intl(p.client_phone)}">${esc(p.client_phone)}</a></dd>` : ''}
  ${p.address ? `<dt>${t('projAddress')}</dt><dd style="margin:0">${esc(p.address)} · <a href="${maps}" target="_blank" rel="noopener">${t('openMaps')}</a></dd>` : ''}
  ${p.service ? `<dt>${t('service')}</dt><dd style="margin:0">${t('svc_' + p.service)}</dd>` : ''}
  ${p.start_date ? `<dt>${t('start')}</dt><dd style="margin:0">${fdate(p.start_date)}</dd>` : ''}${p.end_date ? `<dt>${t('end')}</dt><dd style="margin:0">${fdate(p.end_date)}</dd>` : ''}</dl>
  ${p.details ? `<h3 style="margin-top:16px">${t('details')}</h3><p style="white-space:pre-wrap">${esc(p.details)}</p>` : ''}</div>`;
}
function cDash() {
  const c = S.calc(cur);
  const banner = stOf(cur.project) === 'estimate_accepted' && !cur.documents.some(x => x.kind === 'contract' && x.status !== 'void') ? `<div class="card" style="border-color:var(--cu);display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b style="flex:1 1 260px">${t('contractBanner')}</b><button class="primary" data-ctab="docs">${t('goDocs')}</button></div>` : '';
  return banner + budgetHealth(c) + `<div class="kpis">${kpi(t('contract'), c.tot)}${kpi(t('collected'), c.paid)}${kpi(t('receivable'), c.bal)}${kpi(t('budget'), c.bud)}${kpi(t('spent'), c.spent, '', (c.bud ? Math.round(c.spent / c.bud * 100) : 0) + '% ' + t('of') + ' ' + t('budget').toLowerCase())}${kpi(t('left'), c.left, c.left < 0 ? 'neg' : '')}${kpi(t('profit'), c.profit, c.profit < 0 ? 'neg' : 'pos', t('profitSub'))}</div>
  ${showShare() ? `<div class="kpis">${(() => { const sh = shareOf(c); return kpi(`${t('share')} ${pct()}%`, sh.s, '', t('shareOf')) + kpi(t('shareEarned'), sh.earned, 'pos', t('shareEarnedSub')) + kpi(t('sharePending'), sh.pending) + kpi(t('profitAfter'), sh.after, sh.after < 0 ? 'neg' : ''); })()}</div>` : ''}
  <div class="qacts"><button class="primary cam" data-scan="${cur.project.id}">${camIco}${t('scanReceipt')}</button><button class="btn2" data-ctab="money">+ ${t('qaExpense')}</button><button class="btn2" data-ctab="pays">+ ${t('qaPay')}</button></div>
  <div class="cols"><div class="card"><h2>${t('byCat')}</h2>${catBars(c)}</div><div class="card"><h2>${t('recent')}</h2>${expSorted().slice(0, 6).map(e => `<div class="mat"><div><b>${esc(e.description)}</b><small>${fdate(e.spent_on)} · ${esc(e.vendor)} · ${esc(catName(e.budget_id))}</small></div><span class="n">${money(e.amount)}</span></div>`).join('') || `<p class="sub">${t('none')}</p>`}</div></div>`;
}
const expSorted = () => cur.expenses.slice().sort((a, b) => String(b.spent_on).localeCompare(String(a.spent_on)));
function cMoney() {
  const c = S.calc(cur);
  return buyForm() + `<div class="card"><h2>${t('budget')}</h2><p class="sub">${money(c.spent)} ${t('of')} ${money(c.bud)} · ${t('left')}: <b>${money(c.left)}</b></p>
  ${sorted('budget').map(b => `<div class="row r-bud">${fld('budget', b, 'category', 'text', 'ct')}${fld('budget', b, 'amount', 'number', 'am')}<span class="spent">${money(c.byCat(b.id))}</span>${del('budget', b.id)}</div>`).join('')}<button class="add" data-add="budget">${t('addCat')}</button></div>
  <div class="card"><h2>${t('expLog')}</h2><p class="sub">${cur.expenses.length} · ${money(c.spent)}</p>
  ${expSorted().map(e => `<div class="row r-exp2">${fld('expenses', e, 'spent_on', 'date', 'dt')}${fld('expenses', e, 'description', 'text', 'ds')}${sel('expenses', e, 'budget_id', budOpts(), 'cs')}${sel('expenses', { ...e, tax_cat: e.tax_cat || 'materials' }, 'tax_cat', taxOpts(), 'tc')}${fld('expenses', e, 'vendor', 'text', 'st')}${fld('expenses', e, 'amount', 'number', 'am')}${e.receipt ? `<button class="btn2 rc" data-rcv="${esc(e.receipt)}">${t('viewReceipt')}</button>` : `<button class="btn2 rc" data-rc="${e.id}">${t('addReceipt')}</button>`}${del('expenses', e.id)}</div>`).join('') || `<p class="sub">${t('none')}</p>`}</div>`;
}
const sorted = tb => cur[tb].slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
function cPays() {
  const c = S.calc(cur);
  return `<div class="kpis">${kpi(t('contract'), c.tot)}${kpi(t('collected'), c.paid, 'pos')}${kpi(t('receivable'), c.bal)}</div>` + payForm() +
  `<div class="card"><h2>${t('schedule')}</h2><p class="sub">${t('msHint')} ${t('scheduleTotal')}: <b>${money(c.msTotal)}</b> · ${t('contract')}: <b>${money(c.tot)}</b></p>
  ${c.ms.map(m => `<div class="row r-ms">${fld('milestones', m, 'label', 'text', 'lb2')}${fld('milestones', m, 'amount', 'number', 'am')}<span class="pill ${m.st}">${t('ms_' + m.st)}</span>${del('milestones', m.id)}</div>`).join('')}<button class="add" data-add="milestones">${t('addMs')}</button></div>
  <div class="card"><h2>${t('history')}</h2>${cur.payments.slice().sort((a, b) => String(a.paid_on).localeCompare(String(b.paid_on))).map(x => `<div class="row r-pay">${fld('payments', x, 'paid_on', 'date', 'dt')}${fld('payments', x, 'note', 'text', 'nt')}${fld('payments', x, 'amount', 'number', 'am')}${del('payments', x.id)}</div>`).join('') || `<p class="sub">${t('none')}</p>`}</div>`;
}
function cChanges() {
  const sts = ['draft', 'pending', 'approved', 'declined'].map(s => [s, t('co_' + s)]);
  return `<div class="card"><h2>${t('changes')}</h2><p class="sub">${t('coHint')}</p>
  ${cur.change_orders.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map(co => `<div class="co"><div class="row r-co" style="border:0;padding:0">${fld('change_orders', co, 'title', 'text', 'tt')}${sel('change_orders', co, 'kind', kinds(), 'tp')}${fld('change_orders', co, 'amount', 'number', 'am')}${sel('change_orders', co, 'status', sts, 'stsel')}${del('change_orders', co.id)}
  <textarea class="det" rows="2" data-t="change_orders" data-id="${co.id}" data-f="details" aria-label="${t('f_details')}" style="display:block;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font-size:16px">${esc(co.details)}</textarea></div>
  <div class="acts">${co.status === 'draft' ? `<button class="primary" data-sendco="${co.id}">${t('sendClient')}</button>` : `<span class="pill ${co.status}">${t('co_' + co.status)}</span>`}${co.decided_by ? `<small class="sub" style="margin:0">${t('by')} ${esc(co.decided_by)} · ${fdate(co.decided_at)}</small>` : ''}</div></div>`).join('') || `<p class="sub">${t('none')}</p>`}
  <button class="add" data-add="change_orders">${t('addCo')}</button></div>`;
}
let pending = [];
function cProgress() {
  const c = S.calc(cur);
  return `<div class="card"><h2>${t('updates')}</h2><label>${t('newUpd')}<textarea id="nu" rows="3"></textarea></label>
  <div class="acts" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px"><label class="btn2 drop" style="margin:0;color:var(--ink)">${t('addPhotos')}<input id="nuf" type="file" accept="image/*" multiple></label><span id="nuc" class="sub" style="margin:0">${pending.length ? pending.length + ' ' + t('photosSel') : ''}</span><button class="primary" data-post>${t('postUpd')}</button></div>
  ${cur.updates.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).map(u => `<div class="upd" style="margin-top:16px"><small>${fdate(u.created_at)}</small><div class="row" style="grid-template-columns:minmax(0,1fr) 44px;border:0;padding:4px 0">${fld('updates', u, 'body')}${del('updates', u.id)}</div>${S.photos(u.photos)}</div>`).join('')}</div>
  <div class="card"><h2>${t('steps')}</h2><p class="sub">${c.sd} / ${cur.steps.length} · ${c.pct}%</p><div class="bar"><i style="width:${c.pct}%"></i></div>
  ${sorted('steps').map(s => `<div class="row r-step">${chk('steps', s, 'done', t('f_done') + ': ' + (s.title || ''))}${fld('steps', s, 'title', 'text', 'tt')}${fld('steps', s, 'due_date', 'date', 'd')}${del('steps', s.id)}</div>`).join('')}<button class="add" data-add="steps">${t('addStep')}</button></div>`;
}
function cMats() {
  const c = S.calc(cur);
  return `<div class="card"><h2>${t('materials')}</h2><p class="sub">${c.mb} / ${cur.materials.length} · ${t('matPriv')}</p>
  ${sorted('materials').map(m => `<div class="row r-mat2">${chk('materials', m, 'purchased', t('purchased') + ': ' + (m.name || ''))}${fld('materials', m, 'name', 'text', 'nm')}${fld('materials', m, 'qty', 'number', 'q')}${fld('materials', m, 'unit', 'text', 'u')}${fld('materials', m, 'purchased_on', 'date', 'dt')}${del('materials', m.id)}</div>`).join('')}
  <button class="add" data-add="materials">${t('addMat')}</button><p class="hint">✓ = ${t('purchased')} · ${t('qty')} · ${t('unit')} · ${t('datePaid')}</p></div>`;
}
function cEst() {
  const c = S.calc(cur), p = cur.project;
  return `<div class="card"><div class="secthead" style="margin:0"><h2 style="margin-inline-end:auto">${t('estimate')}</h2><button class="btn2" data-doc="estimate">${t('dlEstimate')}</button></div>
  <p class="sub">${t('materials')}: <b>${money(c.subM)}</b> · ${t('labor')}: <b>${money(c.subL)}</b> · ${t('taxMat')}: <b>${money(c.tax)}</b> · ${t('total')}: <b>${money(c.tot)}</b></p>
  ${sorted('items').map(x => `<div class="row r-item">${fld('items', x, 'description', 'text', 'dd')}${sel('items', x, 'kind', kinds(), 'tp')}${fld('items', x, 'qty', 'number', 'q')}${fld('items', x, 'price', 'number', 'p')}${del('items', x.id)}</div>`).join('')}
  <button class="add" data-add="items">${t('addItem')}</button><label style="max-width:220px;margin-top:14px">${t('taxp')}${fld('projects', p, 'tax_rate', 'number')}</label></div>`;
}
const ta = (tb, r, f, rows = 3) => `<textarea rows="${rows}" data-t="${tb}" data-id="${r.id ?? ''}" data-f="${f}" aria-label="${esc(t(f === 'warranty' ? 'warranty' : 'extraTerms'))}" style="display:block;width:100%;margin-top:4px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);font-size:16px">${esc(r[f] || '')}</textarea>`;
let docLang = null;
function cDocs() {
  const lang = docLang || S.L, miss = [['legal_name', 'legalName'], ['license_no', 'licenseNo'], ['address', 'bizAddress']].filter(([f]) => !String(settings[f] || '').trim()).map(([, k]) => t(k));
  const hasContract = cur.documents.some(x => x.kind === 'contract' && x.status !== 'void');
  const docs = cur.documents.slice().sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
  return `<div class="card"><h2>${t('docs')}</h2><p class="sub">${t('docsSub')}</p>
  ${miss.length ? `<p class="hint" style="color:#b23a26;font-weight:600">${t('missingFor')}: ${miss.join(', ')}</p>` : ''}
  <div class="linkbox" style="margin-top:10px"><label style="margin:0">${t('docLang')} <select id="doclang" style="min-height:44px;margin-inline-start:6px">${[['es', 'Español'], ['en', 'English']].map(([v, l]) => `<option value="${v}"${lang === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
  <div class="linkbox" style="margin-top:12px"><button class="btn2" data-doc="estimate">${t('dlEstimate')}</button><button class="primary" data-mkdoc="contract">${t('mkContract')}</button><button class="btn2" data-mkdoc="completion">${t('mkCompletion')}</button></div>
  ${hasContract ? '' : `<p class="hint">${t('noContractYet')}</p>`}<p class="hint">${t('docsHint')}</p>
  <div class="linkbox" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><label style="margin:0">${t('upKind')} <select id="upkind" style="min-height:44px;margin-inline-start:6px">${['contract', 'estimate', 'completion'].map(k => `<option value="${k}">${t('doc_' + k)}</option>`).join('')}</select></label><button class="btn2" data-updoc>${t('upDoc')}</button></div><p class="hint">${t('upDocHint')}</p></div>
  <div class="card">${docs.map(x => `<div class="co"><div class="top2"><b>${t('doc_' + x.kind)}${x.snapshot && x.snapshot.items ? ' · ' + (x.lang || 'es').toUpperCase() : ' · ' + t('uploadedDoc')}</b><b class="amt">${money(x.total)}</b></div>
    <small class="sub">${fdate(x.created_at)}</small>
    <div class="acts">${sel('documents', x, 'status', ['draft', 'sent', 'signed', 'void'].map(s => [s, t('ds_' + s)]), 'stsel')}${x.file ? `<button class="primary" data-dlsigned="${x.id}">${t('dlSigned')}</button>` : ''}${x.snapshot && x.snapshot.items ? `<button class="btn2" data-dl="${x.id}">${x.file ? t('dlOriginal') : t('download')}</button>` : ''}<button class="btn2" data-upsigned="${x.id}">${t('upSigned')}</button>${x.status === 'draft' || (x.file && !(x.snapshot && x.snapshot.items)) ? del('documents', x.id) : ''}</div>
    ${x.file ? `<small class="sub" style="color:var(--ok);font-weight:600">✓ ${t('signedFile')}</small>` : ''}
    ${x.status === 'signed' ? `<div class="grid2" style="margin-top:10px"><label>${t('signedBy')}${fld('documents', x, 'signed_by')}</label><label>${t('signedOn')}${fld('documents', x, 'signed_on', 'date')}</label></div>` : ''}</div>`).join('') || `<p class="sub">${t('none')}</p>`}</div>
  <div class="card"><h2>${t('contractData')}</h2><p class="sub">${t('contractDataSub')}</p><div class="grid2" style="margin-top:12px">
  <label>${t('legalName')}${fld('settings', settings, 'legal_name')}</label><label>${t('licenseNo')}${fld('settings', settings, 'license_no')}</label>
  <label>${t('bizAddress')}${fld('settings', settings, 'address')}</label><label>${t('phone')}${fld('settings', settings, 'phone', 'tel')}</label></div>
  <label>${t('warranty')}${ta('settings', settings, 'warranty')}</label><p class="hint">${t('warrantyHint')}</p>
  <label style="margin-top:12px">${t('extraTerms')}${ta('settings', settings, 'extra_terms', 4)}</label>
  <p class="hint" style="margin-top:12px">${t('legalNote')}</p></div>`;
}
function cMsgs() {
  const myName = (me && me.name) || settings.contact_name || t('contractor');
  return `<div class="card"><h2>${t('messages')}</h2><div class="chat" id="chat">${cur.comments.slice().sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).map(m => `<div class="bub ${m.author === 'contractor' ? 'me' : ''}"><small>${esc(m.name || (m.author === 'client' ? t('client') : myName))} · ${fdate(m.created_at)}</small><p>${esc(m.body)}</p></div>`).join('') || `<p class="sub">${t('none')}</p>`}</div>
  <form class="sendrow" id="msgf"><textarea id="rp" rows="2" placeholder="${t('writeMsg')}" aria-label="${t('writeMsg')}"></textarea><button class="primary" type="submit">${t('send')}</button></form></div>`;
}
const clientLink = p => new URL('proyecto.html?p=' + p.client_token, location.href).href;
function shareBar(p) {
  const link = clientLink(p), digits = (p.client_phone || '').replace(/\D/g, ''), phone = digits.length === 10 ? '1' + digits : digits;
  const msg = encodeURIComponent(t('shareMsg').replace('{n}', (p.client_name || '').replace(/\s*\(.*\)\s*$/, '').replace(/^familia\s+/i, '').split(' ')[0] || '').replace(/\s+,/, ',') + link);
  return `<div class="sharebar"><div class="sbtxt"><b>${t('shareT')}</b><small>${t('shareS')}</small></div>
  <div class="sbbtn"><button class="primary" data-copylink="${esc(link)}">${t('copy')}</button>
  <a class="btn2" href="https://wa.me/${phone}?text=${msg}" target="_blank" rel="noopener">WhatsApp</a>
  <a class="btn2" href="sms:${phone ? '+' + phone : ''}?&body=${msg}">${t('sms')}</a>
  <a class="btn2" href="mailto:${esc(p.client_email || '')}?subject=${encodeURIComponent((S.L === 'es' ? 'Tu proyecto con C Plus: ' : 'Your project with C Plus: ') + (p.title || ''))}&body=${msg}">${t('mail')}</a>
  <a class="btn2" href="${esc(link)}" target="_blank" rel="noopener">${t('open')}</a></div>
  ${phone ? '' : `<small class="sbhint">${t('noPhone')}</small>`}</div>`;
}
const tx = (tb, r, f, rows = 4, ph = '') => `<textarea rows="${rows}" data-t="${tb}" data-id="${r.id}" data-f="${f}" aria-label="${esc(t('f_' + f))}" maxlength="4000" placeholder="${esc(ph)}" class="tarea">${esc(r[f] || '')}</textarea>`;
function contactBtns(p) {
  const ph = S.intl(p.client_phone), link = clientLink(p);
  return `<div class="cbtns">${p.client_phone ? `<a class="btn2" href="tel:+${ph}">${t('call')}</a><a class="btn2" href="sms:+${ph}">${t('textMsg')}</a><a class="btn2" href="https://wa.me/${ph}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${p.client_email ? `<a class="btn2" href="mailto:${esc(p.client_email)}">${t('mail')}</a>` : ''}</div>`;
}
function cProj() {
  const p = cur.project, link = clientLink(p);
  return `<div class="card"><h2>${t('clientCard')}</h2><p class="sub">${t('clientCardSub')}</p>
  <label>${t('fullName')}${fld('projects', p, 'client_name')}</label>
  <div class="grid2"><label>${t('phone1')}${fld('projects', p, 'client_phone', 'tel')}</label><label>${t('email')}${fld('projects', p, 'client_email', 'email')}</label>
  <label>${t('phone2')}${fld('projects', p, 'client_phone2', 'tel')}</label></div>
  ${contactBtns(p)}</div>
  <div class="card"><h2>${t('projCard')}</h2><div class="grid2" style="margin-top:12px">
  <label>${t('ptitle')}${fld('projects', p, 'title')}</label><label>${t('status')}${sel('projects', { ...p, status: stOf(p) }, 'status', STATUSES.map(s => [s, t('st_' + s)]))}</label>
  <label>${t('service')}${sel('projects', { ...p, service: p.service || 'other' }, 'service', S.SERVICES.map(s => [s, t('svc_' + s)]))}</label><label>${t('projAddress')}${fld('projects', p, 'address')}</label>
  <label>${t('start')}${fld('projects', p, 'start_date', 'date')}</label><label>${t('end')}${fld('projects', p, 'end_date', 'date')}</label></div>
  <label>${t('details')}${tx('projects', p, 'details', 5, t('detailsPh'))}</label><p class="hint">${t('detailsHint')}</p></div>
  <div class="card"><h2>${t('clientLink')}</h2><p class="sub">${t('linkHint')}</p><div class="linkbox"><code id="clink">${esc(link)}</code></div><p class="hint">${t('rotateHint')}</p><button class="btn2" data-rotate>${t('rotate')}</button></div>
  <div class="card"><div class="linkbox"><button class="btn2" data-dup>${t('duplicate')}</button></div></div>
  <div class="card"><h2>${t('deleteP')}</h2><p class="sub">${t('deleteConfirm')}</p><div class="linkbox"><input id="delc" style="flex:1 1 200px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-height:44px;font-size:16px" aria-label="${t('deleteP')}"><button class="btn2 danger" data-delp>${t('deleteP')}</button></div></div>`;
}

/* ---------- render keeps focus where the user was typing ---------- */
function render() {
  const a = document.activeElement, ds = (a && a.dataset) || {};
  const key = ds.f ? `[data-t="${ds.t}"][data-id="${ds.id}"][data-f="${ds.f}"]` : ds.del ? `[data-del="${ds.del}"]` : (a && a.id ? '#' + a.id : null);
  const y = scrollY;
  app.innerHTML = view === 'setup' ? setup() : view === 'login' ? login() : view === 'first' ? first() : view === 'noaccess' ? noAccess() : view === 'home' ? home() : view === 'project' ? project() : `<div class="center"><p>${t('loading')}</p></div>`;
  document.title = 'C Plus · ' + t('contractor');
  scrollTo(0, y);
  if (key) { const n = document.querySelector(key); if (n) n.focus({ preventScroll: true }); }
  const ch = $('#chat'); if (ch) ch.scrollTop = ch.scrollHeight;
  const on = document.querySelector('.cbar button.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

/* ---------- data ---------- */
async function loadAll() {
  me = await API.me();
  if (!me || !me.active) { try { const ss = await API.session(); noEmail = ss && ss.user ? ss.user.email : ''; } catch (_) {} me = null; B = []; throw Object.assign(new Error('noaccess'), { noaccess: true }); }
  [settings, B, leads, team] = await Promise.all([API.getSettings().catch(() => ({})), API.loadAll(), staff() ? API.listLeads().catch(() => []) : [], API.team().catch(() => [])]);
  if (!staff()) ctab = 'progress';
  leadUrls = staff() ? await API.leadPhotoUrls(leads.flatMap(l => l.photos || [])).catch(() => ({})) : {};
  templates = await API.templates().catch(() => []);
}
function openProject(id) {
  pkind = 'all'; ptag = '';
  cur = B.find(b => b.project.id === id); if (!cur) { view = 'home'; return render(); }
  view = 'project'; ctab = ctab || 'dash'; try { history.replaceState(null, '', '#' + id); } catch (_) {}
  render(); scrollTo(0, 0);
}
const rowOf = (tb, id) => tb === 'projects' ? cur.project : tb === 'settings' ? settings : cur[tb].find(r => r.id === id);
const DEF = {
  items: () => ({ kind: 'mat', description: '', qty: 1, price: 0 }), materials: () => ({ name: '', qty: 1, unit: '' }), steps: () => ({ title: '' }),
  milestones: () => ({ label: '', amount: 0 }), budget: () => ({ category: '', amount: 0 }), change_orders: () => ({ title: '', kind: 'mat', amount: 0, status: 'draft' })
};

async function save(tb, id, f, v) {
  setDot(t('saving'));
  try {
    const row = rowOf(tb, id);
    const patch = { [f]: v };
    if (tb === 'materials' && f === 'purchased' && v && !row.purchased_on) patch.purchased_on = S.today();
    const res = tb === 'settings' ? await API.saveSettings(patch) : await API.update(tb, id, patch);
    Object.assign(row, res || patch); setDot(t('saved') + ' ✓');
    return true;
  } catch (e) { setDot(''); fail(e); return false; }
}

app.addEventListener('change', async e => {
  const n = e.target, d = n.dataset;
  if (n.id === 'doclang') { docLang = n.value; return; }
  if (n.id === 'nuf') { pending = [...n.files]; const c = $('#nuc'); if (c) c.textContent = pending.length ? pending.length + ' ' + t('photosSel') : ''; return; }
  if (d.setrole) { try { const r = await API.setRole(d.setrole, n.value); Object.assign(team.find(m => m.user_id === d.setrole), r); S.toast(t('saved') + ' ✓'); } catch (x) { fail(x); } return render(); }
  if (!d.f) return;
  let v = n.type === 'checkbox' ? n.checked : n.value;
  if (n.type === 'number') v = v === '' ? (d.f === 'est_cost' ? null : 0) : +v;
  if (n.type === 'date' && !v) v = null;
  if ((d.f === 'budget_id' || d.f === 'assigned_to') && !v) v = null;
  if (d.t === 'projects' && (d.f === 'client_phone' || d.f === 'client_phone2') && v) { if (!S.phoneOk(v)) { S.toast(t('errPhone')); n.setAttribute('aria-invalid', 'true'); return n.focus(); } v = S.fmtPhone(v); n.value = v; n.removeAttribute('aria-invalid'); }
  if (d.t === 'projects' && d.f === 'client_email' && v) { if (!S.emailOk(v)) { S.toast(t('errEmail')); n.setAttribute('aria-invalid', 'true'); return n.focus(); } v = v.trim().toLowerCase(); n.value = v; n.removeAttribute('aria-invalid'); }
  if (d.t === 'projects' && d.f === 'client_name' && !String(v).trim()) { n.value = rowOf('projects', d.id).client_name || ''; return S.toast(t('errName')); }
  if (d.f === 'share_pct') { v = Math.min(100, Math.max(0, +v || 0)); n.value = v; }
  if (d.t === 'projects' && d.f === 'title' && !String(v).trim()) { n.value = rowOf('projects', d.id).title || ''; return n.focus(); }
  const okSaved = await save(d.t, d.id, d.f, v);
  if (okSaved && (n.type !== 'text' || d.t === 'projects' || /category|title/.test(d.f) && ctab !== 'progress') && n.tagName !== 'TEXTAREA') render();
});

app.addEventListener('focusout', e => {
  const n = e.target; if (n.id === 'np-phone' || n.id === 'np-phone2') n.value = S.fmtPhone(n.value);
});
app.addEventListener('submit', async e => {
  e.preventDefault(); const id = e.target.id, sb = e.target.querySelector('[type=submit]');
  if (id !== 'loginf') { if (sb && sb.disabled) return; if (sb) sb.disabled = true; }
  try {
    if (id === 'loginf') {
      lastEmail = $('#em').value.trim(); const pw = $('#pw').value; busy = true; err = ''; render();
      try { await API.signIn(lastEmail, pw); await loadAll(); view = 'home'; if (isAdmin() && hview === 'projects') { hview = 'dash'; loadDash(); } pushRefresh().then(() => { if (view === 'home') render(); }); const h = location.hash.slice(1); busy = false; if (h && B.some(b => b.project.id === h)) return openProject(h); }
      catch (x) { if (x.noaccess) view = 'noaccess'; else { err = x.message; view = 'login'; } }
      busy = false; return render();
    }
    if (id === 'firstf') {
      const code = $('#fc').value.trim(), name = $('#fn').value.trim(), email = $('#fe').value.trim().toLowerCase(), pw = $('#fp').value;
      if (pw.length < 8) { err = t('pwShort'); return render(); }
      busy = true; err = ''; render();
      try { await API.teamFn('bootstrap', { code, name, email, password: pw }); await API.signIn(email, pw); await loadAll(); view = 'home'; if (isAdmin() && hview === 'projects') { hview = 'dash'; loadDash(); } }
      catch (x) { err = x.message === 'code' ? t('errCode') : x.message === 'done' ? t('errDone') : x.message === 'exists' ? t('errExists') : x.message; }
      busy = false; return render();
    }
    if (id === 'teamf') {
      const v = k => $('#tm-' + k).value.trim(), body = { name: v('name'), email: v('email').toLowerCase(), role: v('role'), password: v('pw') };
      if (!body.name) return S.toast(t('errName'));
      if (!S.emailOk(body.email)) return S.toast(t('errEmail'));
      if (body.password.length < 8) return S.toast(t('pwShort'));
      try { await API.teamFn('create', body); } catch (x) { return S.toast(x.message === 'exists' ? t('errExists') : t('error') + ': ' + x.message); }
      lastCreated = body; team = await API.team(); return render();
    }
    if (id === 'pwf') {
      const pw = $('#npw').value; if (pw.length < 8) return S.toast(t('pwShort'));
      await API.changePassword(pw); $('#npw').value = ''; return S.toast(t('pwSaved'));
    }
    if (id === 'newpf') {
      const v = k => $('#np-' + k).value.trim(), errs = [];
      document.querySelectorAll('.npf .ferr').forEach(x => x.textContent = ''); document.querySelectorAll('.npf [aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
      if (!v('name') || v('name').split(/\s+/).length < 2 && v('name').length < 3) errs.push(['name', 'errName']);
      if (!S.phoneOk(v('phone'))) errs.push(['phone', 'errPhone']);
      if (!S.emailOk(v('email'))) errs.push(['email', 'errEmail']);
      if (v('phone2') && !S.phoneOk(v('phone2'))) errs.push(['phone2', 'errPhone']);
      if (errs.length) {
        errs.forEach(([k, m]) => { const n = $('#np-' + k); n.setAttribute('aria-invalid', 'true'); const e = $('#err-' + k); if (e) e.textContent = t(m); else S.toast(t(m)); });
        return $('#np-' + errs[0][0]).focus();
      }
      const svc = $('#np-service').value;
      const title = v('title') || `${t('svc_' + svc)} · ${v('name').split(/\s+/).slice(0, 2).join(' ')}`;
      const p = await API.insert('projects', { title, client_name: v('name'), client_phone: S.fmtPhone(v('phone')), client_phone2: v('phone2') ? S.fmtPhone(v('phone2')) : '', client_email: v('email').toLowerCase(), address: v('address'), service: svc, details: v('details'), status: $('#np-status').value });
      creating = false; B.unshift(blank(p)); ctab = 'project'; return openProject(p.id);
    }
    if (id === 'buyf') {
      const desc = $('#xe-desc').value.trim(), amount = +$('#xe-amt').value || 0, mat = $('#xe-mat').value, f = $('#xe-file').files[0];
      if (!desc && !amount) return $('#xe-desc').focus();
      const date = $('#xe-date').value || S.today(), btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = t('saving');
      let receipt = null;
      if (f) { const blob = await S.compress(f); receipt = await API.upload('receipts', `${cur.project.id}/${S.uid()}.${blob.type === 'application/pdf' ? 'pdf' : 'jpg'}`, blob); }
      const m = cur.materials.find(x => x.id === mat);
      let row;
      try { row = await API.insert('expenses', { project_id: cur.project.id, description: desc || (m ? m.name : ''), amount, spent_on: date, budget_id: $('#xe-cat').value || null, vendor: $('#xe-store').value.trim(), tax_cat: $('#xe-tax').value, pay_method: $('#xe-pay').value, receipt }); }
      catch (x) { if (receipt) API.removeFiles('receipts', [receipt]).catch(() => {}); throw x; }
      cur.expenses.push(row);
      if (m) Object.assign(m, await API.update('materials', m.id, { purchased: true, purchased_on: date }));
      render(); S.toast(t('buyOk'), async () => { await API.remove('expenses', row.id); cur.expenses = cur.expenses.filter(x => x.id !== row.id); render(); });
    }
    if (id === 'payf') {
      const amount = +$('#xp-amt').value || 0; if (!amount) return $('#xp-amt').focus();
      const row = await API.insert('payments', { project_id: cur.project.id, amount, paid_on: $('#xp-date').value || S.today(), note: $('#xp-note').value.trim() });
      cur.payments.push(row); render(); S.toast(t('payOk'), async () => { await API.remove('payments', row.id); cur.payments = cur.payments.filter(x => x.id !== row.id); render(); });
    }
    if (id === 'msgf') {
      const body = $('#rp').value.trim(); if (!body) return;
      cur.comments.push(await API.insert('comments', { project_id: cur.project.id, author: 'contractor', name: (me && me.name) || settings.contact_name || '', body, seen: true })); render(); $('#rp')?.focus();
    }
  } catch (x) { fail(x); render(); }
  finally { if (sb && id !== 'loginf') sb.disabled = false; }
});

app.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b || (b.type === 'submit' && b.form) || b.dataset.busy) return; const d = b.dataset;
  const guard = !(d.lang || d.ctab || d.photo || d.rc || d.af || 'home' in d || 'print' in d || 'first' in d || 'tologin' in d || 'google' in d || 'hidecreds' in d);
  if (guard) { b.dataset.busy = '1'; b.disabled = true; }
  try {
    if (d.lang) { S.setLang(d.lang); render(); if (pushSt === 'on') curSub().then(x => x && API.pushLang(x.endpoint, d.lang)).catch(() => {}); }
    else if ('first' in d) { err = ''; view = 'first'; render(); }
    else if ('google' in d) { err = ''; try { await API.signInGoogle(); } catch (x) { err = x.message; render(); } }
    else if ('tologin' in d) { err = ''; view = 'login'; render(); }
    else if (d.af) { afilter = d.af; render(); }
    else if ('hidecreds' in d) { lastCreated = null; render(); }
    else if (d.resetpw) {
      const m = team.find(x => x.user_id === d.resetpw), pw = prompt(t('resetPw') + ': ' + (m ? m.name : ''), genPw());
      if (pw === null) return; if (pw.length < 8) return S.toast(t('pwShort'));
      await API.teamFn('set_password', { user_id: d.resetpw, password: pw });
      if (m) lastCreated = { name: m.name, email: m.email, password: pw }; render();
    }
    else if (d.rmm) {
      const m = team.find(x => x.user_id === d.rmm); if (!m || !confirm(t('removeConfirm').replace('{n}', m.name))) return;
      await API.teamFn('remove', { user_id: d.rmm }); await loadAll(); render();
    }
    else if ('logout' in d) { await API.signOut(); B = []; cur = null; me = null; team = []; taxRows = null; hview = 'projects'; view = 'login'; render(); }
    else if ('hideinstall' in d) { try { localStorage.setItem('cplus-noinstall', '1'); } catch (_) {} render(); }
    else if (d.leadst) { const [id, st] = d.leadst.split(':'); const l = leads.find(x => x.id === id); Object.assign(l, await API.update('leads', id, { status: st })); render(); }
    else if (d.leadp) {
      const l = leads.find(x => x.id === d.leadp);
      const p = await API.insert('projects', { title: l.service || (S.L === 'es' ? 'Nuevo proyecto' : 'New project'), client_name: l.name, client_phone: S.fmtPhone(l.phone), client_email: (l.email || '').toLowerCase(), address: l.city, details: l.message || '', status: 'estimate_sent' });
      Object.assign(l, await API.update('leads', l.id, { status: 'won', project_id: p.id }));
      const nb = blank(p);
      if (l.message) { try { nb.comments.push(await API.insert('comments', { project_id: p.id, author: 'client', name: l.name, body: l.message, seen: true })); } catch (_) {} }
      B.unshift(nb); ctab = 'project'; openProject(p.id);
    }
    else if (d.open) { ctab = d.ctabgo || 'dash'; openProject(d.open); }
    else if ('home' in d) { view = 'home'; cur = null; try { history.replaceState(null, '', location.pathname); } catch (_) {} render(); scrollTo(0, 0); }
    else if (d.ctab) { ctab = d.ctab; if (d.focus) setTimeout(() => { const f = document.querySelector(`[data-t="projects"][data-f="${d.focus}"]`); if (f) { f.scrollIntoView({ block: 'center' }); f.focus(); } }, 30); if (ctab === 'messages' && unseen(cur)) { await API.markSeen(cur.project.id); cur.comments.forEach(c => c.seen = true); } render(); scrollTo(0, 0); }
    else if ('newp' in d) { creating = true; render(); $('#newpf')?.scrollIntoView({ block: 'start' }); $('#np-name')?.focus(); }
    else if ('cancelnew' in d) { creating = false; render(); }
    else if (d.pf) { pfilter = d.pf; render(); }
    else if ('sample' in d) { b.disabled = true; const id = await makeSample(); ctab = 'dash'; openProject(id); }
    else if (d.add) {
      const tb = d.add, row = await API.insert(tb, { project_id: cur.project.id, sort: cur[tb].length, ...DEF[tb]() });
      cur[tb].push(row); render(); document.querySelector(`[data-id="${row.id}"]:not([type=checkbox]):not(select)`)?.focus();
    }
    else if (d.del) {
      const [tb, id] = d.del.split(':'), row = rowOf(tb, id); await API.remove(tb, id);
      cur[tb] = cur[tb].filter(r => r.id !== id); render();
      const files = tb === 'updates' || tb === 'daily_logs' ? ['photos', row.photos || []] : tb === 'photos' ? ['photos', [row.path]] : tb === 'checklist_items' && row.photo ? ['photos', [row.photo]] : tb === 'expenses' && row.receipt ? ['receipts', [row.receipt]] : tb === 'documents' && row.file ? ['docs', [row.file]] : null;
      const tm = files && files[1].length ? setTimeout(() => API.removeFiles(files[0], files[1]).catch(er => console.warn('cleanup', er)), 6000) : null;
      S.toast(t('removed'), async () => { clearTimeout(tm); try { cur[tb].push(await API.insert(tb, row)); render(); } catch (x) { fail(x); } });
    }
    else if ('rotate' in d) {
      const tok = Array.from(crypto.getRandomValues(new Uint8Array(18)), x => x.toString(16).padStart(2, '0')).join('');
      if (await save('projects', cur.project.id, 'client_token', tok)) { render(); S.toast(t('rotated')); }
    }
    else if (d.sendco) { await save('change_orders', d.sendco, 'status', 'pending'); render(); }
    else if ('post' in d) {
      const body = $('#nu').value.trim(); if (!body && !pending.length) return $('#nu').focus();
      b.disabled = true; b.textContent = t('uploading');
      const photos = [];
      try {
        for (const f of pending) { const blob = await S.compress(f); photos.push(await API.upload('photos', `${cur.project.id}/${S.uid()}.jpg`, blob)); }
        cur.updates.push(await API.insert('updates', { project_id: cur.project.id, body, photos }));
      } catch (x) { API.removeFiles('photos', photos).catch(() => {}); b.textContent = t('postUpd'); throw x; }
      pending = []; render();
    }
    else if (d.photo) S.lightbox(d.photo);
    else if (d.rc) { const f = $('#rcfile'); f.dataset.id = d.rc; f.value = ''; f.click(); }
    else if (d.rcv) { const w = window.open('', '_blank'); const u = await API.receiptUrl(d.rcv); if (w) w.location = u; else location.href = u; }
    else if ('print' in d) S.printEstimate(cur, settings);
    else if (d.doc === 'estimate') { await S.docs.download('estimate', S.docs.snapshot(cur, settings, docLang || S.L)); }
    else if (d.mkdoc) {
      const lang = docLang || S.L;
      const contract = cur.documents.filter(x => x.kind === 'contract' && x.status !== 'void' && x.snapshot && x.snapshot.items).sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)))[0];
      const snap = d.mkdoc === 'contract' ? S.docs.snapshot(cur, settings, lang) : S.docs.completionSnapshot(cur, settings, lang, contract);
      const row = await API.insert('documents', { project_id: cur.project.id, kind: d.mkdoc, lang, snapshot: snap, total: snap.totals.tot, status: 'draft' });
      cur.documents.push(row); render(); await S.docs.download(d.mkdoc, snap); S.toast(t('docMade'));
    }
    else if (d.copylink) { try { await navigator.clipboard.writeText(d.copylink); S.toast(t('copied')); } catch (_) { prompt(t('copy'), d.copylink); } }
    else if (d.dlsigned) { const x = cur.documents.find(y => y.id === d.dlsigned); window.open(API.docUrl(x.file), '_blank', 'noopener'); }
    else if (d.upsigned || 'updoc' in d) { const f = $('#docfile'); f.dataset.id = d.upsigned || ''; f.dataset.kind = d.upsigned ? '' : $('#upkind').value; f.value = ''; f.click(); }
    else if (d.dl) { const x = cur.documents.find(y => y.id === d.dl); await S.docs.download(x.kind, x.snapshot); }
    else if ('copy' in d) { try { await navigator.clipboard.writeText($('#clink').textContent); S.toast(t('copied')); } catch (_) { getSelection().selectAllChildren($('#clink')); } }
    else if ('dup' in d) { b.disabled = true; const id = await duplicate(cur); S.toast(t('dupOk')); ctab = 'project'; openProject(id); }
    else if ('delp' in d) {
      if (!/^(ELIMINAR|DELETE)$/i.test($('#delc').value.trim())) return $('#delc').focus();
      const pid = cur.project.id;
      for (const bk of ['photos', 'receipts', 'docs']) { try { await API.removeFiles(bk, await API.listFolder(bk, pid)); } catch (er) { console.warn('cleanup', er); } }
      await API.remove('projects', pid); B = B.filter(x => x !== cur); cur = null; view = 'home'; try { history.replaceState(null, '', location.pathname); } catch (_) {} render();
    }
  } catch (x) { fail(x); render(); }
  finally { if (guard) { delete b.dataset.busy; b.disabled = false; } }
});

$('#docfile').addEventListener('change', async e => {
  const f = e.target.files[0], id = e.target.dataset.id, kind = e.target.dataset.kind; if (!f) return;
  if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name) || f.size > 20 * 1024 * 1024) return S.toast(t('pdfOnly'));
  try {
    setDot(t('uploading'));
    const path = await API.upload('docs', `${cur.project.id}/${S.uid()}.pdf`, new Blob([f], { type: 'application/pdf' }));
    if (id) {
      const x = cur.documents.find(y => y.id === id), old = x.file;
      Object.assign(x, await API.update('documents', id, { file: path, status: 'signed', signed_on: x.signed_on || S.today() }));
      if (old) API.removeFiles('docs', [old]).catch(() => {});
    } else {
      const c = S.calc(cur);
      cur.documents.push(await API.insert('documents', { project_id: cur.project.id, kind, lang: S.L, snapshot: { uploaded: true, name: f.name, created: new Date().toISOString(), totals: { tot: c.tot } }, total: c.tot, status: 'signed', signed_on: S.today(), file: path }));
    }
    setDot(t('saved') + ' ✓'); render(); S.toast(t('savedSigned'));
  } catch (x) { fail(x); }
});
$('#rcfile').addEventListener('change', async e => {
  const f = e.target.files[0], id = e.target.dataset.id; if (!f || !id) return;
  try { setDot(t('uploading')); const blob = await S.compress(f); const path = await API.upload('receipts', `${cur.project.id}/${S.uid()}.${blob.type === 'application/pdf' ? 'pdf' : 'jpg'}`, blob); await save('expenses', id, 'receipt', path); render(); }
  catch (x) { fail(x); }
});

function blank(p) { const b = { project: p }; API.CHILD.forEach(t => b[t] = []); return b; }
async function copyRows(tb, from, pid, map) { const rows = from.map(r => { const x = { ...map(r), project_id: pid }; delete x.id; delete x.created_at; return x; }); return API.insertMany(tb, rows); }
async function duplicate(src) {
  const s = src.project, p = await API.insert('projects', { title: `${s.title} ${t('copySuffix')}`, status: 'estimate_sent', tax_rate: s.tax_rate });
  const b = blank(p);
  b.items = await copyRows('items', src.items, p.id, r => r);
  b.materials = await copyRows('materials', src.materials, p.id, r => ({ ...r, purchased: false, purchased_on: null }));
  b.steps = await copyRows('steps', src.steps, p.id, r => ({ ...r, done: false, due_date: null }));
  b.budget = await copyRows('budget', src.budget, p.id, r => r);
  b.milestones = await copyRows('milestones', src.milestones, p.id, r => r);
  B.unshift(b); return p.id;
}
async function makeSample() {
  const d0 = new Date(), dd = n => new Date(d0.getTime() + n * 864e5).toISOString().slice(0, 10);
  const p = await API.insert('projects', { title: 'Remodelación de cocina', client_name: 'Familia Rivera (ejemplo)', address: '1450 N Valley View Dr, Lehi, UT', start_date: dd(-18), end_date: dd(28), status: 'progress', tax_rate: 7.25 });
  const b = blank(p), pid = p.id, many = (tb, rows) => API.insertMany(tb, rows.map((r, i) => ({ ...r, project_id: pid, sort: i })));
  const I = (description, kind, qty, price) => ({ description, kind, qty, price });
  [b.items, b.materials, b.steps, b.budget, b.milestones] = await Promise.all([
    many('items', [I('Demolición y retiro de gabinetes y piso', 'lab', 1, 1850), I('Gabinetes shaker blancos', 'mat', 22, 270), I('Instalación de gabinetes', 'lab', 22, 115), I('Cubierta de cuarzo Calacatta (pie²)', 'mat', 58, 45), I('Fabricación e instalación de cuarzo (pie²)', 'lab', 58, 23), I('Piso LVP roble claro (pie²)', 'mat', 240, 3.5), I('Instalación de piso (pie²)', 'lab', 240, 3), I('Azulejo subway, adhesivo y boquilla', 'mat', 1, 450), I('Instalación de backsplash', 'lab', 1, 1000), I('Luces LED, cable y contactos', 'mat', 1, 600), I('Electricista: 6 luces empotradas', 'lab', 1, 1600), I('Fregadero y llave', 'mat', 1, 560), I('Plomería: fregadero y llave', 'lab', 1, 420), I('Pintura y primer', 'mat', 1, 250), I('Pintura de paredes y techo', 'lab', 1, 850)]),
    many('materials', [{ name: 'Gabinetes shaker blancos', qty: 22, unit: 'pzas', purchased: true, purchased_on: dd(-8) }, { name: 'Losa de cuarzo Calacatta', qty: 2, unit: 'losas', purchased: true, purchased_on: dd(-7) }, { name: 'Piso LVP roble claro', qty: 260, unit: 'pie²', purchased: true, purchased_on: dd(-12) }, { name: 'Azulejo subway 3x6', qty: 45, unit: 'pie²' }, { name: 'Luces empotradas LED 6"', qty: 6, unit: 'pzas', purchased: true, purchased_on: dd(-14) }, { name: 'Fregadero de acero inoxidable', qty: 1, unit: 'pza' }, { name: 'Llave de cocina extraíble', qty: 1, unit: 'pza' }, { name: 'Pintura y primer', qty: 4, unit: 'galones' }]),
    many('steps', [{ title: 'Firma del estimado y anticipo', done: true, due_date: dd(-23) }, { title: 'Demolición y retiro de escombros', done: true, due_date: dd(-16) }, { title: 'Electricidad y plomería en bruto', done: true, due_date: dd(-10) }, { title: 'Instalación de piso LVP', done: true, due_date: dd(-6) }, { title: 'Instalación de gabinetes', due_date: dd(3) }, { title: 'Medición e instalación de cuarzo', due_date: dd(12) }, { title: 'Backsplash, fregadero y llave', due_date: dd(19) }, { title: 'Pintura, detalles y revisión final', due_date: dd(27) }]),
    many('budget', [{ category: 'Materiales', amount: 11500 }, { category: 'Mano de obra', amount: 6500 }, { category: 'Subcontratistas', amount: 2400 }, { category: 'Permisos y basura', amount: 650 }]),
    many('milestones', [{ label: 'Anticipo al firmar (30%)', amount: 6700 }, { label: 'Al terminar piso y gabinetes (30%)', amount: 6700 }, { label: 'Al instalar cuarzo (25%)', amount: 5600 }, { label: 'Al entregar (saldo)', amount: 3369.63 }])
  ]);
  const bid = n => b.budget.find(x => x.category === n)?.id || null;
  const E = (spent_on, description, category, vendor, amount) => ({ project_id: pid, spent_on, description, budget_id: bid(category), vendor, amount });
  [b.expenses, b.payments, b.updates, b.change_orders] = await Promise.all([
    API.insertMany('expenses', [E(dd(-6), 'Ayudantes, semana 2', 'Mano de obra', 'Nómina', 1400), E(dd(-7), 'Losa de cuarzo Calacatta (2)', 'Materiales', 'MSI Stone', 2650), E(dd(-8), 'Gabinetes shaker blancos (22)', 'Materiales', 'Home Depot', 5940), E(dd(-10), 'Electricista: cableado en bruto', 'Subcontratistas', 'Subcontrato', 1200), E(dd(-10), 'Plomero: líneas del fregadero', 'Subcontratistas', 'Subcontrato', 650), E(dd(-12), 'Piso LVP roble claro', 'Materiales', 'Floor & Decor', 780), E(dd(-13), 'Ayudantes, semana 1', 'Mano de obra', 'Nómina', 1400), E(dd(-14), 'Luces empotradas LED (6)', 'Materiales', 'Home Depot', 168), E(dd(-17), 'Contenedor de basura 15 yd', 'Permisos y basura', 'Waste Mgmt', 420)]),
    API.insertMany('payments', [{ project_id: pid, paid_on: dd(-23), note: 'Anticipo 30%', amount: 6700 }, { project_id: pid, paid_on: dd(-6), note: 'Segundo pago: piso terminado', amount: 5000 }]),
    API.insertMany('updates', [{ project_id: pid, body: 'Inspección de electricidad aprobada. Las 6 luces empotradas ya tienen cableado.' }, { project_id: pid, body: 'El piso quedó instalado. Esta semana llegan los gabinetes.' }]),
    API.insertMany('change_orders', [{ project_id: pid, title: 'Isla de cocina con tomacorriente', details: 'Gabinete base de 6 pies, cubierta de cuarzo y un tomacorriente nuevo.', kind: 'mat', amount: 1850, status: 'pending' }])
  ]);
  B.unshift(b); return pid;
}

/* =====================================================================
   v5 · proyectos recibidos, herramientas de obra (como CompanyCam) y gastos para taxes
   ===================================================================== */
S.addText({invOverQ:'Solo quedan {a} por facturar de este contrato. ¿Crear la factura de todos modos?',invoicesTab:"Facturas",invoice:"Factura",invSub:"Facturas a la constructora o al cliente. Al marcar una como pagada, el pago se registra solo.",invNew:"Nueva factura",invAmount:"Monto",invOfContract:"del contrato",invRest:"Lo que falta",invBillTo:"Facturar a",invEmail:"Correo para la factura",invIssued:"Fecha",invTerms:"Plazo",invOnReceipt:"Al recibir",invNote:"Concepto",invNotePh:"Ej. Anticipo 30%, avance de obra, pago final",invCreate:"Crear factura",invDue:"vence",invPaidOn:"pagada",invSend:"Enviar",invResend:"Reenviar",invMarkPaid:"Marcar pagada",invVoid:"Anular",invNone:"Todavía no hay facturas.",invBilled:"Facturado",invToBill:"por facturar",invOpen:"Facturas sin pagar",invOpenS:"enviadas y sin cobrar",inv_draft:"Borrador",inv_sent:"Enviada",inv_paid:"Pagada",inv_void:"Anulada",inv_late:"Vencida {n} días",invMade:"Factura {n} creada",invMailSubj:"Factura",invMailBody:"Hola {to},\n\nLe mandamos la factura {n} por el proyecto {p}.\nMonto: {a}\nVence: {d}\n\nVa adjunta en PDF. Cualquier duda, con gusto.\n\nGracias,\n{me}\nC Plus LLC",invSentToast:"Factura marcada como enviada. Adjunta el PDF descargado al correo.",invPaidToast:"Factura pagada y pago registrado.",invVoidQ:"¿Anular esta factura?",agT:"Facturas por cobrar",agS:"Lo que ya facturaste y no te han pagado, según cuánto lleva vencido.",ag_cur:"Al corriente",agInv1:"factura",agInvN:"facturas",agNone:"No hay facturas pendientes.",dLateInv1:"factura vencida",dLateInvN:"facturas vencidas",dByType:"Ganancia por tipo de trabajo",dByTypeS:"Qué trabajos dejan más margen (proyectos aprobados).",dByCoS2:"Valor y margen de cada constructora.",dBuilder:"Constructora",dMargin:"Margen",hv_dash:"Resumen",dashT:"Resumen del negocio",dashS:"Lo que entró, lo que salió y cómo van los proyectos. Entradas = pagos registrados; salidas = gastos registrados.",dPeriod:"Periodo",dpMonth:"Este mes",dpQ:"3 meses",dpYtd:"Este año",dp12:"12 meses",dCollected:"Cobrado",dCollectedS:"pagos recibidos",dSpent:"Gastado",dExpN:"gastos",dNet:"Neto",dNetS:"cobrado menos gastado",dOwed:"Por cobrar",dOwedS:"de proyectos aprobados",dWon:"Trabajo aprobado",dProj1:"proyecto",dProjN:"proyectos",dActive:"Proyectos activos",dActiveS:"aprobados y sin terminar",dAttention:"Necesita atención",dRev1:"proyecto por revisar",dRevN:"proyectos por revisar",dInContracts:"en contratos",dLate:"pasos atrasados",dNoRc:"gastos sin recibo",dNoRcS:"en este periodo; súbelos antes de los impuestos",dCashT:"Cobrado vs gastado por mes",dCashS:"Últimos 12 meses. Toca un mes para ver los números.",dTable:"Ver como tabla",dByCat:"¿En qué se va el dinero?",dByCatS:"Gastos del periodo por categoría",dByCo:"Trabajo por constructora",dByCoS:"Valor de los proyectos aprobados",dProjT:"Cómo va cada proyecto",dProjS:"Ganancia estimada = contrato menos el costo estimado (o lo gastado, si ya es mayor).",dProfitEst:"Ganancia est.",dOfBudget:"del presupuesto gastado",dOwedShort:"por cobrar",directClient:"Cliente directo",totalMonth:'Gastos del mes',month:'Mes',allYear:'Todo el año',showing:'Mostrando',dlNote:'las descargas usan este periodo',byMonth:'Gastos por mes',byMonthHint:'Toca un mes para ver y descargar solo ese mes.',rvaT:"Análisis del presupuesto",rvaS:"Revisa números y alcance antes de aprobar. No adivina precios del mercado: compara lo que te pagan contra lo que tú calculas que te va a costar.",rvaEst:"Tu costo estimado",rvaProfit:"Ganancia estimada",rvaMargin:"margen",rvaLine:"Línea",rvaRecv:"Te pagan",rvaOur:"Tu costo",rvaOurPh:"¿Cuánto te cuesta?",rvaLeft:"Te queda",rvaNoLines:"El proyecto no tiene líneas de presupuesto.",rvaSum:"Las líneas suman {a} y el contrato es {b}. Diferencia: {c}.",rvaLoss:"{l}: te cuesta {m} más de lo que te pagan.",rvaThin:"{l}: solo te queda {p}% en esta línea.",rvaNoEst:"Falta tu costo en {n} línea(s). Mientras tanto se cuenta lo que te pagan, así que la ganancia puede ser menor.",rvaZero:"{l}: la línea está en $0.",rvaDup:"{l} aparece dos veces.",rvaMissing:"No veo línea para: {l}. Puede estar dentro de otra línea; confírmalo.",rvaHist:"{l}: en {n} proyectos terminados gastaste en promedio {p}% más de lo que te pagaron.",rvaHistOn:"También compara con lo que de verdad gastaste en proyectos terminados.",rvaHistOff:"Cuando termines más proyectos, aquí también verás cuánto gastaste de verdad en cada tipo de línea.",rvaClean:"No encontré problemas en los números.",rvqT:"Preguntas para la empresa",rvqIntro:"Hola, antes de aprobar el proyecto tenemos estas preguntas:",rvqSum:"Las líneas del presupuesto no suman el total del contrato (diferencia de {c}). ¿Qué cubre esa diferencia?",rvqMissing:"¿Dónde está incluido {l}?",rvaConfirm:"El margen es de {p}% y hay {n} alerta(s) en rojo. ¿Aprobar de todos modos?",rvaFlag1:"alerta",rvaFlags:"alertas",sc_demo:"Demolición",sc_disposal:"Basura o dumpster",sc_permits:"Permisos",sc_plumbing:"Plomería",sc_electrical:"Electricidad",sc_framing:"Framing",sc_drywall:"Drywall",sc_paint:"Pintura",sc_flooring:"Pisos",sc_tile:"Azulejo",sc_insulation:"Aislante",sc_hvac:"Calefacción y aire (HVAC)",sc_concrete:"Concreto o zapatas",sc_cabinets:"Gabinetes",sc_counters:"Cubiertas",sc_contingency:"Contingencia",sc_cleanup:"Limpieza",installS:'En Safari toca Compartir y luego "Agregar a pantalla de inicio". Se abre como app y te pueden llegar notificaciones.',pushT:'Notificaciones',pushOn:'Notificaciones activadas en este dispositivo.',pushOnBtn:'Activar notificaciones',pushOffBtn:'Desactivar en este dispositivo',pushTest:'Enviar una prueba',pushSent:'Prueba enviada. Debe llegar en unos segundos.',pushWhyStaff:'Te avisamos cuando llegue un proyecto para revisar, un gasto pase el 90% del presupuesto, un cliente mande mensaje, entre una solicitud de cotización o la cuadrilla llene la bitácora.',pushWhyCrew:'Te avisamos cuando te asignen un proyecto o una tarea.',pushIOS:'En iPhone primero instala la app: en Safari toca Compartir y luego "Agregar a pantalla de inicio". Ábrela desde el ícono y vuelve aquí para activar las notificaciones.',pushHowIOS:'Cómo instalarla',pushDenied:'Las notificaciones están bloqueadas para este sitio. Actívalas en los ajustes del navegador o del teléfono.',pushNo:'Este navegador no permite notificaciones.',pushAskT:'¿Te aviso en el celular?',notNow:'Ahora no',installApp:'Instalar app',gLogin:'Entrar con Google',orEmail:'o con tu correo',settingsNav:'Ajustes',lang:'Idioma',g_sum:'Resumen',g_money:'Dinero',g_work:'Obra',g_client:'Cliente',qaExpense:'Gasto',qaPay:'Pago del cliente',

  hv_projects: 'Proyectos', hv_review: 'Por revisar', hv_feed: 'Actividad', hv_taxes: 'Gastos y taxes',
  search: 'Buscar proyecto, cliente, dirección o empresa', recvProject: 'Recibir proyecto', scanReceipt: 'Escanear factura',
  recvT: 'Recibir un proyecto de otra empresa', recvS: 'Para trabajos que llegan con su budget ya hecho. El project manager lo revisa y lo aprueba antes de empezar.',
  srcCompany: 'Empresa que manda el proyecto', srcRef: 'Número de orden o referencia', receivedOn: 'Fecha en que llegó', ownerName: 'Propietario o cliente final (opcional)',
  contractAmt: 'Monto total del budget', budgetLines: 'Budget por categoría', budgetLinesHint: 'Una categoría por línea, con su monto. Ej. "Materiales 12,500" o "Mano de obra: 6,000". Puedes dejarlo vacío y llenarlo al revisar.',
  budgetFile: 'Budget de la empresa (PDF o foto, opcional)', sendReview: 'Mandar a revisión', parsedLines: 'categorías leídas', unassignedAmt: 'Sin asignar a categoría',
  rv_review: 'Por revisar', rv_approved: 'Aprobado', rv_rejected: 'Rechazado', review: 'Revisión', reviewNote: 'Nota de la revisión',
  approve: 'Aprobar proyecto', reject: 'Rechazar', reopen: 'Volver a revisión', approvedBy: 'Aprobado por', rejectedBy: 'Rechazado por',
  reviewIntro: 'Revisa el budget que mandó la empresa. Al aprobarlo, el proyecto pasa a trabajo y el equipo asignado lo puede ver.',
  rvCheck1: 'El alcance del trabajo está claro', rvCheck2: 'El monto cubre materiales y mano de obra', rvCheck3: 'Las fechas se pueden cumplir', rvCheck4: 'Permisos, seguro y acceso están resueltos',
  catsTotal: 'Total en categorías', diffWarn: 'Las categorías no suman el monto del budget.', viewFile: 'Ver budget recibido', upFile: 'Subir budget recibido',
  pendingReview: 'Proyectos por revisar', noReview: 'No hay proyectos esperando revisión.', reviewBtn: 'Revisar',
  budgetAlerts: 'Alertas de budget', budgetOk: 'Ningún proyecto va pasado de su budget.', usedOf: 'usado de', overBy: 'pasado por', nearLimit: 'cerca del límite',
  budgetHealth: 'Gasto contra budget', remaining2: 'Queda',
  photosTab: 'Fotos', checksTab: 'Checklists', logsTab: 'Bitácora',
  takePhotos: 'Tomar o subir fotos', pk_before: 'Antes', pk_progress: 'Durante', pk_after: 'Después', pk_issue: 'Problema', allKinds: 'Todas',
  tagsL: 'Etiquetas', tagsPh: 'Ej. cocina, eléctrico (separadas por coma)', captionL: 'Descripción', shareClient: 'El cliente la ve', saveLoc: 'Guardar ubicación',
  uploadingN: 'Subiendo {n}…', photosUp: 'fotos subidas', noPhotos: 'Aún no hay fotos. Toma la primera desde la obra.', by2: 'por',
  annotate: 'Marcar en la foto', saveCopy: 'Guardar copia marcada', pen: 'Lápiz', arrow: 'Flecha', box: 'Cuadro', undo2: 'Deshacer', annotated: 'Foto marcada guardada',
  openMap: 'Ver en el mapa', downloadPh: 'Descargar', photoReport: 'Reporte con fotos (PDF)', reportMaking: 'Armando el reporte…', reportDone: 'Reporte descargado',
  fromUpdates: 'De avances y bitácora', beforeAfter: 'Antes y después',
  tasks: 'Tareas', addTask: 'Agregar tarea', taskPh: 'Qué hay que hacer', noTasks: 'Sin tareas.', myTasks: 'Mis tareas',
  checklists: 'Checklists', newChecklist: 'Nuevo checklist', fromTemplate: 'Desde plantilla', blankList: 'En blanco', addItem2: 'Agregar punto',
  needsPhoto: 'Pide foto', photoNeeded: 'Toma una foto para completar este punto.', saveTemplate: 'Guardar como plantilla', templates: 'Plantillas',
  templateSaved: 'Plantilla guardada', noChecklists: 'Agrega un checklist para que el equipo siga los mismos pasos en cada obra.', listTitle: 'Nombre del checklist',
  logs: 'Bitácora diaria', newLog: 'Registro del día', weather: 'Clima', crewL: 'Equipo en la obra', hours: 'Horas', workDone: 'Trabajo de hoy', nextSteps: 'Mañana sigue', issues: 'Problemas o retrasos',
  saveLog: 'Guardar registro', noLogs: 'Aún no hay registros.', logSaved: 'Registro guardado',
  crew: 'Equipo extra', crewHint: 'Personas que también ven y trabajan en este proyecto.',
  feedT: 'Actividad reciente', feedS: 'Lo último que pasó en todos los proyectos.', noFeed: 'Todavía no hay actividad.',
  ev_photos: 'subió {n} fotos', ev_photo1: 'subió 1 foto', ev_update: 'publicó un avance', ev_log: 'registró la bitácora', ev_check: 'completó', ev_task: 'terminó la tarea', ev_expense: 'Gasto', ev_payment: 'Pago recibido', ev_comment: 'Mensaje del cliente', ev_received: 'Proyecto recibido de', ev_approved: 'Proyecto aprobado por',
  taxesT: 'Gastos y taxes', taxesS: 'Todos los gastos del año, de proyectos y de la empresa, con su recibo. Para entregar al contador.', year: 'Año',
  totalExp: 'Gastos del año', salesTaxPaid: 'Impuesto de venta pagado', withReceipt: 'Con recibo', missingRc: 'sin recibo',
  byTaxCat: 'Por categoría para taxes', byProject: 'Por proyecto', general: 'Gasto general de la empresa', generalShort: 'General',
  t1099: 'Subcontratistas para 1099-NEC', t1099S: 'A quien le pagaste $600 o más en el año por trabajo (no materiales) normalmente le mandas una forma 1099-NEC. Pídeles su W-9.',
  none1099: 'Ningún subcontratista llega a $600 este año.', allExp: 'Todos los gastos', addGeneral: 'Agregar gasto general', csv: 'Descargar Excel (CSV)', zip: 'Descargar recibos (ZIP)', taxPdf: 'Resumen (PDF)',
  zipMaking: 'Juntando recibos…', taxNote: 'Las líneas son de la Schedule C del IRS, como guía. Si la LLC declara de otra forma (1065 o 1120-S), tu contador usa las mismas categorías. Confírmalo con tu contador.',
  taxCat: 'Categoría para taxes', payMethod: 'Forma de pago', salesTax: 'Impuesto de venta', notes2: 'Notas', project2: 'Proyecto',
  pm_card: 'Tarjeta', pm_cash: 'Efectivo', pm_check: 'Cheque', pm_transfer: 'Transferencia', pm_: 'Sin indicar',
  tc_materials: 'Materiales para obras', tc_subcontract: 'Subcontratistas', tc_wages: 'Sueldos de empleados', tc_equipment: 'Renta de equipo', tc_tools: 'Herramientas y suministros',
  tc_vehicle: 'Vehículo y gasolina', tc_permits: 'Permisos y licencias', tc_disposal: 'Basura y contenedores', tc_insurance: 'Seguros', tc_meals: 'Comidas de negocio',
  tc_office: 'Oficina y software', tc_advertising: 'Publicidad', tc_other: 'Otros gastos',
  scanT: 'Escanear factura', scanS: 'Toma una foto clara de la factura completa, sobre una mesa y con buena luz.', scanPick: 'Tomar foto de la factura', scanPick2: 'Elegir foto o PDF',
  st_ai: 'Leyendo la factura con IA…', st_load: 'Preparando el lector (solo la primera vez)…', st_read: 'Leyendo la factura…',
  scanReview: 'Revisa los datos antes de guardar', scanLow: 'No se leyó todo con seguridad: revisa el total y la fecha.', scanItems: 'Artículos leídos', saveExpense: 'Guardar gasto',
  scanSaved: 'Gasto guardado con su factura', scanAgain: 'Escanear otra', readFail: 'No se pudo leer la factura. Llena los datos a mano.',
  nReview1: '1 proyecto por revisar', nReview: '{n} proyectos por revisar', budgetCat: 'Categoría del budget', vendor: 'Tienda o proveedor', descr: 'Qué se compró'
}, {invOverQ:'Only {a} is left to invoice on this contract. Create the invoice anyway?',invoicesTab:"Invoices",invoice:"Invoice",invSub:"Invoices to the builder or client. When you mark one paid, the payment is recorded automatically.",invNew:"New invoice",invAmount:"Amount",invOfContract:"of contract",invRest:"What is left",invBillTo:"Bill to",invEmail:"Invoice email",invIssued:"Date",invTerms:"Terms",invOnReceipt:"On receipt",invNote:"Description",invNotePh:"E.g. 30% deposit, progress draw, final payment",invCreate:"Create invoice",invDue:"due",invPaidOn:"paid",invSend:"Send",invResend:"Resend",invMarkPaid:"Mark paid",invVoid:"Void",invNone:"No invoices yet.",invBilled:"Invoiced",invToBill:"left to invoice",invOpen:"Unpaid invoices",invOpenS:"sent and not collected",inv_draft:"Draft",inv_sent:"Sent",inv_paid:"Paid",inv_void:"Void",inv_late:"{n} days late",invMade:"Invoice {n} created",invMailSubj:"Invoice",invMailBody:"Hi {to},\n\nPlease find invoice {n} for the project {p}.\nAmount: {a}\nDue: {d}\n\nThe PDF is attached. Let us know if you have any questions.\n\nThank you,\n{me}\nC Plus LLC",invSentToast:"Invoice marked as sent. Attach the downloaded PDF to the email.",invPaidToast:"Invoice paid and payment recorded.",invVoidQ:"Void this invoice?",agT:"Invoices to collect",agS:"What you invoiced and have not been paid, by how late it is.",ag_cur:"Not due",agInv1:"invoice",agInvN:"invoices",agNone:"No open invoices.",dLateInv1:"late invoice",dLateInvN:"late invoices",dByType:"Profit by type of work",dByTypeS:"Which jobs leave the best margin (approved projects).",dByCoS2:"Value and margin for each builder.",dBuilder:"Builder",dMargin:"Margin",hv_dash:"Overview",dashT:"Business overview",dashS:"What came in, what went out and how projects are doing. In = recorded payments; out = recorded expenses.",dPeriod:"Period",dpMonth:"This month",dpQ:"3 months",dpYtd:"This year",dp12:"12 months",dCollected:"Collected",dCollectedS:"payments received",dSpent:"Spent",dExpN:"expenses",dNet:"Net",dNetS:"collected minus spent",dOwed:"To collect",dOwedS:"from approved projects",dWon:"Work approved",dProj1:"project",dProjN:"projects",dActive:"Active projects",dActiveS:"approved and not finished",dAttention:"Needs attention",dRev1:"project to review",dRevN:"projects to review",dInContracts:"in contracts",dLate:"late steps",dNoRc:"expenses without a receipt",dNoRcS:"in this period; upload them before taxes",dCashT:"Collected vs spent by month",dCashS:"Last 12 months. Tap a month to see the numbers.",dTable:"View as table",dByCat:"Where does the money go?",dByCatS:"Expenses in the period by category",dByCo:"Work by builder",dByCoS:"Value of approved projects",dProjT:"How each project is doing",dProjS:"Estimated profit = contract minus estimated cost (or what was spent, if higher).",dProfitEst:"Est. profit",dOfBudget:"of budget spent",dOwedShort:"to collect",directClient:"Direct client",totalMonth:'Expenses this month',month:'Month',allYear:'Whole year',showing:'Showing',dlNote:'downloads use this period',byMonth:'Expenses by month',byMonthHint:'Tap a month to see and download only that month.',rvaT:"Budget check",rvaS:"Checks the numbers and scope before you approve. It does not guess market prices: it compares what you are paid with what you expect it to cost you.",rvaEst:"Your estimated cost",rvaProfit:"Estimated profit",rvaMargin:"margin",rvaLine:"Line",rvaRecv:"They pay",rvaOur:"Your cost",rvaOurPh:"What does it cost you?",rvaLeft:"You keep",rvaNoLines:"The project has no budget lines.",rvaSum:"The lines add up to {a} and the contract is {b}. Difference: {c}.",rvaLoss:"{l}: costs you {m} more than you are paid.",rvaThin:"{l}: you only keep {p}% on this line.",rvaNoEst:"Your cost is missing on {n} line(s). Until you add it, the amount paid is used, so profit may be lower.",rvaZero:"{l}: the line is $0.",rvaDup:"{l} appears twice.",rvaMissing:"No line for: {l}. It may be inside another line; confirm it.",rvaHist:"{l}: on {n} finished projects you spent {p}% more than you were paid, on average.",rvaHistOn:"It also compares with what you really spent on finished projects.",rvaHistOff:"As you finish more projects, this will also show what you really spent on each kind of line.",rvaClean:"No problems found in the numbers.",rvqT:"Questions for the company",rvqIntro:"Hi, before we approve the project we have these questions:",rvqSum:"The budget lines do not add up to the contract total (difference of {c}). What does that difference cover?",rvqMissing:"Where is {l} included?",rvaConfirm:"The margin is {p}% and there are {n} red alert(s). Approve anyway?",rvaFlag1:"alert",rvaFlags:"alerts",sc_demo:"Demolition",sc_disposal:"Dumpster or haul-off",sc_permits:"Permits",sc_plumbing:"Plumbing",sc_electrical:"Electrical",sc_framing:"Framing",sc_drywall:"Drywall",sc_paint:"Paint",sc_flooring:"Flooring",sc_tile:"Tile",sc_insulation:"Insulation",sc_hvac:"HVAC",sc_concrete:"Concrete or footings",sc_cabinets:"Cabinets",sc_counters:"Countertops",sc_contingency:"Contingency",sc_cleanup:"Cleanup",installS:'In Safari tap Share, then "Add to Home Screen". It opens like an app and can get notifications.',pushT:'Notifications',pushOn:'Notifications are on for this device.',pushOnBtn:'Turn on notifications',pushOffBtn:'Turn off on this device',pushTest:'Send a test',pushSent:'Test sent. It should arrive in a few seconds.',pushWhyStaff:'We let you know when a project arrives for review, an expense passes 90% of a budget, a client sends a message, a quote request comes in or the crew fills in the daily log.',pushWhyCrew:'We let you know when you are assigned a project or a task.',pushIOS:'On iPhone, install the app first: in Safari tap Share, then "Add to Home Screen". Open it from the icon and come back here to turn on notifications.',pushHowIOS:'How to install',pushDenied:'Notifications are blocked for this site. Turn them on in your browser or phone settings.',pushNo:'This browser does not support notifications.',pushAskT:'Want alerts on your phone?',notNow:'Not now',installApp:'Install app',gLogin:'Sign in with Google',orEmail:'or with your email',settingsNav:'Settings',lang:'Language',g_sum:'Overview',g_money:'Money',g_work:'Job',g_client:'Client',qaExpense:'Expense',qaPay:'Client payment',
  hv_projects: 'Projects', hv_review: 'To review', hv_feed: 'Activity', hv_taxes: 'Expenses and taxes',
  search: 'Search project, client, address or company', recvProject: 'Receive project', scanReceipt: 'Scan receipt',
  recvT: 'Receive a project from another company', recvS: 'For jobs that arrive with their budget already set. The project manager reviews and approves it before work starts.',
  srcCompany: 'Company sending the project', srcRef: 'Order or reference number', receivedOn: 'Date received', ownerName: 'Owner or end client (optional)',
  contractAmt: 'Total budget amount', budgetLines: 'Budget by category', budgetLinesHint: 'One category per line, with its amount. E.g. "Materials 12,500" or "Labor: 6,000". You can leave it empty and fill it in during review.',
  budgetFile: "Company's budget (PDF or photo, optional)", sendReview: 'Send to review', parsedLines: 'categories read', unassignedAmt: 'Not assigned to a category',
  rv_review: 'To review', rv_approved: 'Approved', rv_rejected: 'Rejected', review: 'Review', reviewNote: 'Review note',
  approve: 'Approve project', reject: 'Reject', reopen: 'Back to review', approvedBy: 'Approved by', rejectedBy: 'Rejected by',
  reviewIntro: 'Review the budget the company sent. Once approved, the project moves to work and the assigned crew can see it.',
  rvCheck1: 'The scope of work is clear', rvCheck2: 'The amount covers materials and labor', rvCheck3: 'The dates are doable', rvCheck4: 'Permits, insurance and access are sorted out',
  catsTotal: 'Total in categories', diffWarn: "The categories don't add up to the budget amount.", viewFile: 'View received budget', upFile: 'Upload received budget',
  pendingReview: 'Projects to review', noReview: 'No projects waiting for review.', reviewBtn: 'Review',
  budgetAlerts: 'Budget alerts', budgetOk: 'No project is over its budget.', usedOf: 'used of', overBy: 'over by', nearLimit: 'near the limit',
  budgetHealth: 'Spending against budget', remaining2: 'Left',
  photosTab: 'Photos', checksTab: 'Checklists', logsTab: 'Daily log',
  takePhotos: 'Take or upload photos', pk_before: 'Before', pk_progress: 'During', pk_after: 'After', pk_issue: 'Issue', allKinds: 'All',
  tagsL: 'Tags', tagsPh: 'E.g. kitchen, electrical (comma separated)', captionL: 'Caption', shareClient: 'Client can see it', saveLoc: 'Save location',
  uploadingN: 'Uploading {n}…', photosUp: 'photos uploaded', noPhotos: 'No photos yet. Take the first one at the job site.', by2: 'by',
  annotate: 'Mark up photo', saveCopy: 'Save marked copy', pen: 'Pen', arrow: 'Arrow', box: 'Box', undo2: 'Undo', annotated: 'Marked photo saved',
  openMap: 'View on map', downloadPh: 'Download', photoReport: 'Photo report (PDF)', reportMaking: 'Building the report…', reportDone: 'Report downloaded',
  fromUpdates: 'From updates and daily log', beforeAfter: 'Before and after',
  tasks: 'Tasks', addTask: 'Add task', taskPh: 'What needs to be done', noTasks: 'No tasks.', myTasks: 'My tasks',
  checklists: 'Checklists', newChecklist: 'New checklist', fromTemplate: 'From template', blankList: 'Blank', addItem2: 'Add item',
  needsPhoto: 'Needs photo', photoNeeded: 'Take a photo to complete this item.', saveTemplate: 'Save as template', templates: 'Templates',
  templateSaved: 'Template saved', noChecklists: 'Add a checklist so the crew follows the same steps on every job.', listTitle: 'Checklist name',
  logs: 'Daily log', newLog: "Today's entry", weather: 'Weather', crewL: 'Crew on site', hours: 'Hours', workDone: 'Work done today', nextSteps: 'Next up', issues: 'Problems or delays',
  saveLog: 'Save entry', noLogs: 'No entries yet.', logSaved: 'Entry saved',
  crew: 'Extra crew', crewHint: 'People who also see and work on this project.',
  feedT: 'Recent activity', feedS: 'The latest across all projects.', noFeed: 'No activity yet.',
  ev_photos: 'uploaded {n} photos', ev_photo1: 'uploaded 1 photo', ev_update: 'posted an update', ev_log: 'filled in the daily log', ev_check: 'completed', ev_task: 'finished the task', ev_expense: 'Expense', ev_payment: 'Payment received', ev_comment: 'Client message', ev_received: 'Project received from', ev_approved: 'Project approved by',
  taxesT: 'Expenses and taxes', taxesS: 'Every expense of the year, from projects and the company, with its receipt. Ready for your accountant.', year: 'Year',
  totalExp: 'Expenses this year', salesTaxPaid: 'Sales tax paid', withReceipt: 'With receipt', missingRc: 'missing receipt',
  byTaxCat: 'By tax category', byProject: 'By project', general: 'General company expense', generalShort: 'General',
  t1099: 'Subcontractors for 1099-NEC', t1099S: 'Anyone you paid $600 or more in the year for work (not materials) usually gets a 1099-NEC form. Ask them for a W-9.',
  none1099: 'No subcontractor reaches $600 this year.', allExp: 'All expenses', addGeneral: 'Add general expense', csv: 'Download Excel (CSV)', zip: 'Download receipts (ZIP)', taxPdf: 'Summary (PDF)',
  zipMaking: 'Gathering receipts…', taxNote: "The lines are from the IRS Schedule C, as a guide. If the LLC files another way (1065 or 1120-S), your accountant uses the same categories. Confirm with your accountant.",
  taxCat: 'Tax category', payMethod: 'Payment method', salesTax: 'Sales tax', notes2: 'Notes', project2: 'Project',
  pm_card: 'Card', pm_cash: 'Cash', pm_check: 'Check', pm_transfer: 'Transfer', pm_: 'Not set',
  tc_materials: 'Job materials', tc_subcontract: 'Subcontractors', tc_wages: 'Employee wages', tc_equipment: 'Equipment rental', tc_tools: 'Tools and supplies',
  tc_vehicle: 'Vehicle and fuel', tc_permits: 'Permits and licenses', tc_disposal: 'Dumpsters and disposal', tc_insurance: 'Insurance', tc_meals: 'Business meals',
  tc_office: 'Office and software', tc_advertising: 'Advertising', tc_other: 'Other expenses',
  scanT: 'Scan receipt', scanS: 'Take a clear photo of the whole receipt, flat on a table with good light.', scanPick: 'Take a photo of the receipt', scanPick2: 'Choose a photo or PDF',
  st_ai: 'Reading the receipt with AI…', st_load: 'Getting the reader ready (first time only)…', st_read: 'Reading the receipt…',
  scanReview: 'Check the details before saving', scanLow: 'Not everything was read with confidence: check the total and the date.', scanItems: 'Items read', saveExpense: 'Save expense',
  scanSaved: 'Expense saved with its receipt', scanAgain: 'Scan another', readFail: "Couldn't read the receipt. Fill in the details by hand.",
  nReview1: '1 project to review', nReview: '{n} projects to review', budgetCat: 'Budget category', vendor: 'Store or vendor', descr: 'What was bought'
});

/* líneas de la Schedule C (IRS) para cada categoría */
const TAXCATS = [['materials', 'Part III, 38'], ['subcontract', '11'], ['wages', '26'], ['equipment', '20a'], ['tools', '22'], ['vehicle', '9'], ['permits', '23'], ['disposal', '27a'], ['insurance', '15'], ['meals', '24b'], ['office', '18'], ['advertising', '8'], ['other', '27a']];
const taxOpts = () => TAXCATS.map(([k, l]) => [k, `${t('tc_' + k)} · ${l}`]);
const payOpts = () => ['', 'card', 'cash', 'check', 'transfer'].map(k => [k, t('pm_' + k)]);
const PKINDS = ['before', 'progress', 'after', 'issue'];
let hview = 'projects', recv = false, q = '', templates = [], pkind = 'all', ptag = '', taxYear = new Date().getFullYear(), taxMonth = 0, taxRows = null, taxUrls = {};
const isRecv = p => !!(p.source_company || (p.review_status && p.review_status !== 'approved'));
const rvOf = p => p.review_status || 'approved';
const myName = () => (me && me.name) || settings.contact_name || '';
const toLocal = d => { const x = new Date(d); return new Date(x - x.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const inp = 'style="display:block;width:100%;margin-top:6px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);min-height:44px;font-size:16px"';

/* "Materiales 12,500" → [{category, amount}] */
function parseLines(txt) {
  return String(txt || '').split(/\n/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^(.*?)[\s:=\-–$]*\$?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*$/);
    return m && m[1].trim() ? { category: m[1].replace(/[:\-–=$\s]+$/, '').trim().slice(0, 80), amount: +m[2].replace(/,/g, '') } : null;
  }).filter(Boolean);
}

/* ---------- inicio: barra de vistas ---------- */
/* ---------- invoices to the builder / client ---------- */
let invForm = false;
const invOf = b => (b.invoices || []);
const invDays = i => Math.floor((Date.parse(S.today()) - Date.parse(i.due_on)) / 864e5);
const invState = i => i.status === 'sent' && invDays(i) > 0 ? 'late' : i.status;
const invPill = i => { const st = invState(i); return `<span class="pill inv-${st}">${st === 'late' ? t('inv_late').replace('{n}', invDays(i)) : t('inv_' + i.status)}</span>`; };
function invTotals(b) {
  const c = S.calc(b), live = invOf(b).filter(i => i.status !== 'void');
  const billed = live.reduce((a, i) => a + (+i.amount || 0), 0), paid = live.filter(i => i.status === 'paid').reduce((a, i) => a + (+i.amount || 0), 0);
  return { c, billed, paid, open: billed - paid, left: Math.max(0, c.tot - billed) };
}
function cInvoices() {
  const p = cur.project, T2 = invTotals(cur), list = invOf(cur).slice().sort((a, b) => String(b.issued_on).localeCompare(String(a.issued_on)) || String(b.number).localeCompare(String(a.number)));
  const quick = [[30, '30%'], [50, '50%']].map(([pc, l]) => [Math.round(T2.c.tot * pc / 100 * 100) / 100, `${l} ${t('invOfContract')}`]).concat(T2.left > 0 ? [[T2.left, t('invRest')]] : []);
  return `<div class="kpis">${kpi(t('contract'), T2.c.tot)}${kpi(t('invBilled'), T2.billed, '', `${money(T2.left)} ${t('invToBill')}`)}${kpi(t('invOpen'), T2.open, T2.open > 0 ? '' : 'pos', t('invOpenS'))}</div>
  <div class="card"><div class="secthead" style="margin:0"><h2 style="margin-inline-end:auto">${t('invoicesTab')}</h2>${invForm ? '' : `<button class="primary" data-invnew>${t('invNew')}</button>`}</div><p class="sub">${t('invSub')}</p>
  ${invForm ? `<form class="form npf" id="invf" style="margin-top:12px">
    <label class="wide">${t('invAmount')} <i>*</i><input id="iv-amt" type="number" step="any" min="0" inputmode="decimal" value="${quick.length ? quick[quick.length - 1][0] : ''}"></label>
    <div class="chips wide">${quick.map(([v, l]) => `<button type="button" class="btn2" data-invq="${v}">${esc(l)} · ${money(v)}</button>`).join('')}</div>
    <label>${t('invBillTo')}<input id="iv-to" maxlength="160" value="${esc(p.source_company || p.client_name || '')}"></label>
    <label>${t('invEmail')}<input id="iv-email" type="email" maxlength="160" value="${esc(p.source_company ? '' : (p.client_email || ''))}"></label>
    <label>${t('invIssued')}<input id="iv-date" type="date" value="${S.today()}"></label>
    <label>${t('invTerms')}<select id="iv-terms">${[[15, 'Net 15'], [30, 'Net 30'], [45, 'Net 45'], [0, t('invOnReceipt')]].map(([v, l]) => `<option value="${v}"${v === 30 ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="wide">${t('invNote')}<input id="iv-note" maxlength="300" placeholder="${t('invNotePh')}"></label>
    <div class="npbar wide"><button class="btn2" type="button" data-invcancel>${t('cancel')}</button><button class="primary" type="submit">${t('invCreate')}</button></div></form>` : ''}
  ${list.map(i => `<div class="co inv"><div class="top2"><b>${esc(i.number)} · ${esc(i.bill_to || '·')}</b><b class="amt">${money(i.amount)}</b></div>
    <small class="sub">${t('invIssued')} ${fdate(i.issued_on)} · ${t('invDue')} ${fdate(i.due_on)}${i.paid_on ? ` · ${t('invPaidOn')} ${fdate(i.paid_on)}` : ''}${i.note ? ' · ' + esc(i.note) : ''}</small>
    <div class="acts">${invPill(i)}<button class="btn2" data-invpdf="${i.id}">PDF</button>
    ${i.status === 'draft' || i.status === 'sent' ? `<button class="btn2" data-invsend="${i.id}">${i.status === 'sent' ? t('invResend') : t('invSend')}</button><button class="primary" data-invpaid="${i.id}">${t('invMarkPaid')}</button>` : ''}
    ${i.status === 'draft' ? `<button class="ico x" data-invdel="${i.id}" aria-label="${t('delete')}">✕</button>` : i.status !== 'void' && i.status !== 'paid' ? `<button class="btn2 danger" data-invvoid="${i.id}">${t('invVoid')}</button>` : ''}</div></div>`).join('') || (invForm ? '' : `<p class="sub">${t('invNone')}</p>`)}</div>`;
}
async function invoicePdf(i, save = true) {
  const jsPDF = window.jspdf && window.jspdf.jsPDF; if (!jsPDF) return;
  const b = B.find(x => x.project.id === i.project_id), p = b.project, T2 = invTotals(b), es = S.L !== 'en';
  const L = es ? { inv: 'FACTURA', no: 'Número', iss: 'Fecha', due: 'Vence', to: 'Facturar a', from: 'De', proj: 'Proyecto', ref: 'Orden / referencia', desc: 'Concepto', amt: 'Monto', contract: 'Total del contrato', prev: 'Facturado antes', this: 'Esta factura', left: 'Queda por facturar', pay: 'Pagar a nombre de', thanks: 'Gracias por su preferencia.', total: 'TOTAL A PAGAR', terms: 'Términos' }
    : { inv: 'INVOICE', no: 'Number', iss: 'Date', due: 'Due', to: 'Bill to', from: 'From', proj: 'Project', ref: 'PO / reference', desc: 'Description', amt: 'Amount', contract: 'Contract total', prev: 'Previously invoiced', this: 'This invoice', left: 'Left to invoice', pay: 'Make payment to', thanks: 'Thank you for your business.', total: 'TOTAL DUE', terms: 'Terms' };
  const cl = v => String(v ?? '').normalize('NFC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/²/g, '2');
  const d = new jsPDF({ unit: 'pt', format: 'letter' }), PW = 612, MX = 48; let y;
  const m = v => money(v);
  d.setFillColor(17, 15, 13); d.rect(0, 0, PW, 96, 'F');
  d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(20); d.text(cl(settings.legal_name || settings.company || 'C Plus LLC'), MX, 48);
  d.setFont('helvetica', 'normal'); d.setFontSize(9); d.text(cl([settings.address, settings.phone, settings.email].filter(Boolean).join('  ·  ')), MX, 66);
  if (settings.license_no) d.text(cl('DOPL ' + settings.license_no), MX, 79);
  d.setTextColor(236, 156, 59); d.setFont('helvetica', 'bold'); d.setFontSize(22); d.text(L.inv, PW - MX, 50, { align: 'right' });
  d.setTextColor(255, 255, 255); d.setFontSize(11); d.text(cl(i.number), PW - MX, 70, { align: 'right' });
  y = 132; d.setTextColor(23, 23, 26);
  const pair = (x, k, v) => { d.setFont('helvetica', 'bold'); d.setFontSize(8); d.setTextColor(110, 106, 100); d.text(k.toUpperCase(), x, y); d.setFont('helvetica', 'normal'); d.setFontSize(11); d.setTextColor(23, 23, 26); d.text(d.splitTextToSize(cl(v || '-'), 240), x, y + 15); };
  pair(MX, L.to, [i.bill_to, i.bill_email].filter(Boolean).join('\n')); pair(330, L.iss, fdate(i.issued_on)); pair(450, L.due, fdate(i.due_on));
  y += 52; pair(MX, L.proj, [p.title, p.address].filter(Boolean).join('\n')); pair(330, L.ref, p.source_ref || '-');
  y += 62; d.setDrawColor(226, 222, 216); d.setFillColor(243, 241, 238); d.rect(MX, y, PW - 2 * MX, 24, 'F');
  d.setFont('helvetica', 'bold'); d.setFontSize(9); d.setTextColor(80, 76, 70); d.text(L.desc.toUpperCase(), MX + 10, y + 16); d.text(L.amt.toUpperCase(), PW - MX - 10, y + 16, { align: 'right' });
  y += 44; d.setFont('helvetica', 'normal'); d.setFontSize(11); d.setTextColor(23, 23, 26);
  const desc = d.splitTextToSize(cl(i.note || p.title), 360); d.text(desc, MX + 10, y); d.text(m(i.amount), PW - MX - 10, y, { align: 'right' });
  y += 16 * desc.length + 14; d.line(MX, y, PW - MX, y); y += 26;
  const prev = invOf(b).filter(x => x.status !== 'void' && x.id !== i.id && String(x.issued_on) <= String(i.issued_on)).reduce((a, x) => a + (+x.amount || 0), 0);
  const rows = [[L.contract, m(T2.c.tot)], [L.prev, m(prev)], [L.this, m(i.amount)], [L.left, m(Math.max(0, T2.c.tot - prev - +i.amount))]];
  d.setFontSize(10); rows.forEach(([k, v]) => { d.setTextColor(110, 106, 100); d.text(k, PW - MX - 220, y); d.setTextColor(23, 23, 26); d.text(v, PW - MX - 10, y, { align: 'right' }); y += 17; });
  y += 8; d.setFillColor(17, 15, 13); d.rect(PW - MX - 230, y - 4, 230, 34, 'F'); d.setTextColor(255, 255, 255); d.setFont('helvetica', 'bold'); d.setFontSize(12);
  d.text(L.total, PW - MX - 220, y + 17); d.text(m(i.amount), PW - MX - 10, y + 17, { align: 'right' });
  y += 70; d.setTextColor(23, 23, 26); d.setFont('helvetica', 'normal'); d.setFontSize(10);
  const days = Math.round((Date.parse(i.due_on) - Date.parse(i.issued_on)) / 864e5);
  d.text(cl(`${L.terms}: ${days > 0 ? 'Net ' + days : (es ? 'Al recibir' : 'Due on receipt')}. ${L.pay} ${settings.legal_name || settings.company || 'C Plus LLC'}.`), MX, y); y += 16;
  d.setTextColor(110, 106, 100); d.text(L.thanks, MX, y);
  const file = `${i.number}-${(p.title || 'proyecto').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  if (save) d.save(file);
  return { doc: d, file };
}
function agingCard() {
  const open = B.flatMap(b => invOf(b).filter(i => i.status === 'sent').map(i => ({ i, b })));
  const bk = [['cur', t('ag_cur')], ['30', '1-30'], ['60', '31-60'], ['90', '61-90'], ['90p', '90+']].map(([k, l]) => ({ k, l, v: 0, n: 0 }));
  open.forEach(({ i }) => { const dd = invDays(i), k = dd <= 0 ? 0 : dd <= 30 ? 1 : dd <= 60 ? 2 : dd <= 90 ? 3 : 4; bk[k].v += +i.amount || 0; bk[k].n++; });
  const tot = bk.reduce((a, x) => a + x.v, 0), max = Math.max(1, ...bk.map(x => x.v));
  const late = open.filter(x => invDays(x.i) > 0).sort((a, b) => invDays(b.i) - invDays(a.i));
  return `<div class="card"><h2>${t('agT')}</h2><p class="sub">${t('agS')}</p><p class="agtot">${money(tot)} <small>${open.length} ${t(open.length === 1 ? 'agInv1' : 'agInvN')}</small></p>
  <div class="aging">${bk.map(x => `<div class="agb ag-${x.k}"><span class="agv">${x.v ? kfmt(x.v) : '·'}</span><span class="agbar"><i style="height:${x.v ? Math.max(6, x.v / max * 100) : 0}%"></i></span><span class="agl">${x.l}</span></div>`).join('')}</div>
  ${late.slice(0, 4).map(({ i, b }) => `<button class="alrow" data-open="${b.project.id}" data-ctabgo="invoices"><span><b>${esc(i.number)} · ${esc(i.bill_to)}</b><small class="neg">${money(i.amount)} · ${t('inv_late').replace('{n}', invDays(i))}</small></span><span aria-hidden="true">→</span></button>`).join('')}
  ${open.length ? '' : `<p class="sub">${t('agNone')}</p>`}</div>`;
}

/* ---------- owner dashboard (admin) ---------- */
let dashRows = null, dper = 'ytd';
async function loadDash() {
  dashRows = null; render();
  const y = new Date().getFullYear();
  try { const [a, b] = await Promise.all([API.expensesYear(y), API.expensesYear(y - 1)]); dashRows = [...a, ...b]; }
  catch (x) { dashRows = []; fail(x); }
  render();
}
const ymd = d => d.toISOString().slice(0, 10);
function dRange(p) {
  const n = new Date(), y = n.getFullYear(), m = n.getMonth();
  if (p === 'month') return [ymd(new Date(Date.UTC(y, m, 1))), ymd(n)];
  if (p === 'q') return [ymd(new Date(Date.UTC(y, m - 2, 1))), ymd(n)];
  if (p === '12m') return [ymd(new Date(Date.UTC(y, m - 11, 1))), ymd(n)];
  return [`${y}-01-01`, ymd(n)];
}
const inR = (d, [a, b]) => d && String(d).slice(0, 10) >= a && String(d).slice(0, 10) <= b;
const kfmt = v => { const a = Math.abs(v); return (v < 0 ? '-$' : '$') + (a >= 1e6 ? (a / 1e6).toFixed(1) + 'M' : a >= 1e3 ? (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k' : Math.round(a)); };
const mshort = m => new Date(2000, m, 1).toLocaleDateString(S.L === 'en' ? 'en-US' : 'es-MX', { month: 'short' }).replace('.', '').replace(/^./, c => c.toUpperCase());

function dashData() {
  const R = dRange(dper), pays = B.flatMap(b => b.payments.map(p => ({ ...p, pt: b.project.title })));
  const exps = dashRows || [];
  const rev = pays.filter(p => inR(p.paid_on, R)).reduce((a, p) => a + (+p.amount || 0), 0);
  const ePer = exps.filter(e => inR(e.spent_on, R)), spent = ePer.reduce((a, e) => a + (+e.amount || 0), 0);
  const AP = B.filter(b => rvOf(b.project) === 'approved');
  const active = AP.filter(b => stOf(b.project) !== 'done');
  const owed = AP.reduce((a, b) => a + Math.max(0, S.calc(b).bal), 0);
  const won = AP.filter(b => inR(b.project.reviewed_at || b.project.created_at, R));
  const review = B.filter(b => rvOf(b.project) === 'review');
  // last 12 months, cash in vs cash out
  const n = new Date(), months = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(n.getFullYear(), n.getMonth() - i, 1)); months.push({ k: ymd(d).slice(0, 7), m: d.getUTCMonth(), y: d.getUTCFullYear(), rev: 0, exp: 0 }); }
  const mk = Object.fromEntries(months.map(x => [x.k, x]));
  pays.forEach(p => { const x = mk[String(p.paid_on || '').slice(0, 7)]; if (x) x.rev += +p.amount || 0; });
  exps.forEach(e => { const x = mk[String(e.spent_on || '').slice(0, 7)]; if (x) x.exp += +e.amount || 0; });
  const byCat = TAXCATS.map(([k]) => ({ k, l: t('tc_' + k), v: ePer.filter(e => (e.tax_cat || 'materials') === k).reduce((a, e) => a + (+e.amount || 0), 0) })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  const projs = AP.map(b => { const c = S.calc(b), est = b.budget.reduce((a, x) => a + (x.est_cost != null && x.est_cost !== '' ? +x.est_cost : +x.amount || 0), 0), cost = Math.max(c.spent, est), profit = c.tot - cost;
    return { b, c, cost, profit, pct: c.tot ? profit / c.tot * 100 : 0, used: c.bud ? c.spent / c.bud * 100 : 0, done: stOf(b.project) === 'done' }; }).sort((a, b) => a.done - b.done || b.c.tot - a.c.tot);
  const group = keyOf => { const g = {}; projs.forEach(x => { const k = keyOf(x.b.project); const r = g[k] = g[k] || { k, n: 0, tot: 0, profit: 0, owed: 0, paid: 0 }; r.n++; r.tot += x.c.tot; r.profit += x.profit; r.owed += Math.max(0, x.c.bal); r.paid += x.c.paid; });
    return Object.values(g).map(r => ({ ...r, pct: r.tot ? r.profit / r.tot * 100 : 0 })).sort((a, b) => b.tot - a.tot); };
  const byType = group(p => p.service || 'other'), byCo = group(p => p.source_company || t('directClient'));
  const noRc = ePer.filter(e => !e.receipt).length;
  const overCats = AP.flatMap(b => { const c = S.calc(b); return b.budget.filter(x => +x.amount > 0 && c.byCat(x.id) > +x.amount).map(x => ({ b, x, over: c.byCat(x.id) - +x.amount })); });
  const late = active.flatMap(b => b.steps.filter(s => !s.done && s.due_date && s.due_date < S.today()).map(s => ({ b, s })));
  return { R, rev, spent, net: rev - spent, owed, active, won, review, months, byCat, projs, byType, byCo, noRc, overCats, late, nExp: ePer.length };
}

function cashChart(ms) {
  const sm = matchMedia('(max-width: 600px)').matches, W = sm ? 380 : 680, H = sm ? 250 : 250, L = sm ? 42 : 52, Rt = 4, T = 14, Bm = 30, iw = W - L - Rt, ih = H - T - Bm;
  const max = Math.max(1, ...ms.flatMap(x => [x.rev, x.exp])), step = Math.pow(10, Math.floor(Math.log10(max))), top = Math.ceil(max / step / (max / step > 5 ? 2 : 1)) * step * (max / step > 5 ? 2 : 1);
  const gw = iw / ms.length, bw = Math.max(4, (gw - (sm ? 6 : 10)) / 2 - 1), y = v => T + ih - v / top * ih;
  const bar = (x, v, cls) => { const h = Math.max(0, ih - (y(v) - T)), r = Math.min(4, h, bw / 2); if (h <= 0) return ''; const y0 = T + ih;
    return `<path class="${cls}" d="M${x},${y0} V${y0 - h + r} Q${x},${y0 - h} ${x + r},${y0 - h} H${x + bw - r} Q${x + bw},${y0 - h} ${x + bw},${y0 - h + r} V${y0} Z"/>`; };
  let g = '';
  for (let i = 0; i <= 4; i++) { const v = top * i / 4, yy = y(v); g += `<line class="gl" x1="${L}" x2="${W - Rt}" y1="${yy}" y2="${yy}"/><text class="ax" x="${L - 8}" y="${yy + 4}" text-anchor="end">${kfmt(v)}</text>`; }
  ms.forEach((m, i) => { const x0 = L + i * gw + (sm ? 3 : 5);
    g += bar(x0, m.rev, 'b1') + bar(x0 + bw + 2, m.exp, 'b2');
    g += `<text class="ax" x="${x0 + bw + 1}" y="${H - 9}" text-anchor="middle">${sm ? mshort(m.m).slice(0, 1) : mshort(m.m)}</text>`;
    g += `<rect class="hit" x="${L + i * gw}" y="${T}" width="${gw}" height="${ih + 8}" data-tip="${esc(`<b>${mshort(m.m)} ${m.y}</b><span><i class="sw b1"></i>${t('dCollected')}: ${money(m.rev)}</span><span><i class="sw b2"></i>${t('dSpent')}: ${money(m.exp)}</span><span>${t('dNet')}: <b>${money(m.rev - m.exp)}</b></span>`)}"/>`; });
  g += `<line class="base" x1="${L}" x2="${W - Rt}" y1="${T + ih}" y2="${T + ih}"/>`;
  return `<svg class="cash" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('dCashT')}">${g}</svg>`;
}
const hbars = (rows, fmt = money) => { const max = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="hbars">${rows.map(([l, v, sub]) => `<div class="hb"><div class="hbl"><span>${esc(l)}</span><b>${fmt(v)}</b></div><div class="hbt"><i style="width:${Math.max(1.5, v / max * 100)}%"></i></div>${sub ? `<small>${sub}</small>` : ''}</div>`).join('')}</div>`; };

const mtable = (rows, lab, head) => rows.length ? `<table class="mtab"><thead><tr><th>${head}</th><th>${t('contract')}</th><th>${t('dMargin')}</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(lab(r))}</b><small>${r.n} ${t(r.n === 1 ? 'dProj1' : 'dProjN')}${r.owed > 0 ? ' · ' + t('dOwedShort') + ' ' + money(r.owed) : ''}</small></td><td>${money(r.tot)}</td><td><b class="${r.pct < 10 ? 'neg' : r.pct < 20 ? 'warnt' : 'pos'}">${Math.round(r.pct)}%</b><small>${money(r.profit)}</small><span class="mbar"><i style="width:${Math.max(2, Math.min(100, r.pct / 40 * 100))}%" class="${r.pct < 10 ? 'neg' : r.pct < 20 ? 'warnt' : 'pos'}"></i></span></td></tr>`).join('')}</tbody></table>` : `<p class="sub">${t('none')}</p>`;
function dashView() {
  if (!dashRows) return `<div class="card"><p>${t('loading')}</p></div>`;
  const d = dashData();
  const per = [['month', t('dpMonth')], ['q', t('dpQ')], ['ytd', t('dpYtd')], ['12m', t('dp12')]];
  const tile = (l, v, cls = '', e = '') => `<div class="kpi dk ${cls}"><small>${l}</small><b>${typeof v === 'number' ? money(v) : v}</b>${e ? `<em>${e}</em>` : ''}</div>`;
  const att = [];
  if (d.review.length) att.push(`<button class="alrow" data-hv="review"><span><b>${d.review.length} ${t(d.review.length === 1 ? 'dRev1' : 'dRevN')}</b><small>${money(d.review.reduce((a, b) => a + (+b.project.contract_amount || 0), 0))} ${t('dInContracts')}</small></span><span aria-hidden="true">→</span></button>`);
  d.overCats.slice(0, 4).forEach(o => att.push(`<button class="alrow" data-open="${o.b.project.id}"><span><b>${esc(o.b.project.title)} · ${esc(o.x.category)}</b><small class="neg">${t('overBy')} ${money(o.over)}</small></span><span aria-hidden="true">→</span></button>`));
  if (d.late.length) att.push(`<div class="alrow"><span><b>${d.late.length} ${t('dLate')}</b><small>${d.late.slice(0, 3).map(x => esc(x.s.title) + ' · ' + esc(x.b.project.title)).join(' / ')}</small></span></div>`);
  { const li = B.flatMap(b => invOf(b).filter(i => invState(i) === 'late')); if (li.length) att.push(`<div class="alrow"><span><b>${li.length} ${t(li.length === 1 ? 'dLateInv1' : 'dLateInvN')}</b><small class="neg">${money(li.reduce((a, i) => a + (+i.amount || 0), 0))}</small></span></div>`); }
  if (d.noRc) att.push(`<button class="alrow" data-hv="taxes"><span><b>${d.noRc} ${t('dNoRc')}</b><small>${t('dNoRcS')}</small></span><span aria-hidden="true">→</span></button>`);
  const tbl = `<details class="dtable"><summary>${t('dTable')}</summary><table><thead><tr><th>${t('month')}</th><th>${t('dCollected')}</th><th>${t('dSpent')}</th><th>${t('dNet')}</th></tr></thead><tbody>${d.months.map(m => `<tr><td>${mshort(m.m)} ${m.y}</td><td>${money(m.rev)}</td><td>${money(m.exp)}</td><td class="${m.rev - m.exp < 0 ? 'neg' : ''}">${money(m.rev - m.exp)}</td></tr>`).join('')}</tbody></table></details>`;
  return `<div class="secthead"><h1>${t('dashT')}</h1></div><p class="sub">${t('dashS')}</p>
  <div class="filters dper" role="group" aria-label="${t('dPeriod')}">${per.map(([k, l]) => `<button data-dper="${k}" class="${dper === k ? 'on' : ''}" aria-pressed="${dper === k}">${l}</button>`).join('')}</div>
  <div class="kpis dkpis">${tile(t('dCollected'), d.rev, '', t('dCollectedS'))}${tile(t('dSpent'), d.spent, '', `${d.nExp} ${t('dExpN')}`)}${tile(t('dNet'), d.net, d.net < 0 ? 'neg' : 'pos', t('dNetS'))}${tile(t('dOwed'), d.owed, '', t('dOwedS'))}${tile(t('dWon'), d.won.reduce((a, b) => a + S.calc(b).tot, 0), '', `${d.won.length} ${t(d.won.length === 1 ? 'dProj1' : 'dProjN')}`)}${tile(t('dActive'), String(d.active.length), '', t('dActiveS'))}</div>
  ${att.length ? `<div class="card alerts"><h2>${t('dAttention')}</h2>${att.join('')}</div>` : ''}
  <div class="card"><div class="top2"><h2>${t('dCashT')}</h2><span class="legend"><span><i class="sw b1"></i>${t('dCollected')}</span><span><i class="sw b2"></i>${t('dSpent')}</span></span></div><p class="sub">${t('dCashS')}</p>
  <div class="chartwrap">${cashChart(d.months)}<div class="ctip" hidden></div></div>${tbl}</div>
  <div class="cols"><div class="card"><h2>${t('dByCat')}</h2><p class="sub">${t('dByCatS')}</p>${d.byCat.length ? hbars(d.byCat.slice(0, 7).map(x => [x.l, x.v])) : `<p class="sub">${t('none')}</p>`}</div>
  ${agingCard()}</div>
  <div class="cols"><div class="card"><h2>${t('dByType')}</h2><p class="sub">${t('dByTypeS')}</p>${mtable(d.byType, r => t('svc_' + r.k), t('service'))}</div>
  <div class="card"><h2>${t('dByCo')}</h2><p class="sub">${t('dByCoS2')}</p>${mtable(d.byCo, r => r.k, t('dBuilder'))}</div></div>
  <div class="card"><h2>${t('dProjT')}</h2><p class="sub">${t('dProjS')}</p>
  ${d.projs.map(x => `<button class="dproj" data-open="${x.b.project.id}"><div class="dp1"><b>${esc(x.b.project.title)}</b><span class="pill ${x.done ? '' : 'st-' + stOf(x.b.project)}">${t('st_' + stOf(x.b.project))}</span></div>
    <div class="dp2"><span>${t('contract')} <b>${money(x.c.tot)}</b></span><span>${t('dSpent')} <b>${money(x.c.spent)}</b></span><span>${t('dProfitEst')} <b class="${x.profit < 0 ? 'neg' : 'pos'}">${money(x.profit)} · ${Math.round(x.pct)}%</b></span></div>
    <div class="meter ${x.used > 100 ? 'over' : x.used >= 90 ? 'warn' : ''}"><i style="width:${Math.min(100, x.used)}%"></i></div><small class="sub">${Math.round(x.used)}% ${t('dOfBudget')}${x.c.bal > 0 ? ` · ${t('dOwedShort')} ${money(x.c.bal)}` : ''}</small></button>`).join('') || `<p class="sub">${t('none')}</p>`}</div>`;
}

function hnav() {
  const nr = B.filter(b => rvOf(b.project) === 'review').length;
  return `<div class="hnav" role="tablist">${[...(isAdmin() ? [['dash', t('hv_dash')]] : []), ['projects', t('hv_projects')], ['review', t('hv_review'), nr], ['feed', t('hv_feed')], ['taxes', t('hv_taxes')]].map(([k, l, n]) => `<button role="tab" data-hv="${k}" aria-selected="${hview === k}" class="${hview === k ? 'on' : ''}">${l}${n ? ` <span class="badge">${n}</span>` : ''}</button>`).join('')}</div>`;
}
function homeTools() {
  return `<div class="htools"><label class="search"><span class="sr">${t('search')}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="hq" type="search" value="${esc(q)}" placeholder="${t('search')}" autocomplete="off"></label>
  <button class="btn2" data-recv>${t('recvProject')}</button><button class="btn2 cam" data-scan="">${camIco}${t('scanReceipt')}</button></div>`;
}
const camIco = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const matchQ = b => { if (!q) return true; const p = b.project, s = [p.title, p.client_name, p.address, p.source_company, p.source_ref].join(' ').toLowerCase(); return q.toLowerCase().split(/\s+/).every(w => s.includes(w)); };

function recvForm() {
  const svc = S.SERVICES.map(s => `<option value="${s}">${t('svc_' + s)}</option>`).join('');
  return `<form class="card npf" id="recvf" novalidate><h2>${t('recvT')}</h2><p class="sub">${t('recvS')}</p>
  <fieldset><legend><b>1</b>${t('srcCompany')}</legend><div class="grid2">
    <label>${t('srcCompany')} <i>*</i><input id="rv-company" maxlength="120" autocomplete="organization"></label>
    <label>${t('srcRef')}<input id="rv-ref" maxlength="80"></label>
    <label>${t('receivedOn')}<input id="rv-date" type="date" value="${S.today()}"></label>
    <label>${t('service')}<select id="rv-service">${svc}</select></label></div></fieldset>
  <fieldset><legend><b>2</b>${t('npStep2')}</legend>
    <label>${t('ptitle')}<input id="rv-title" maxlength="200" placeholder="${t('ptitleEx')}"></label>
    <div class="grid2"><label>${t('ownerName')}<input id="rv-owner" maxlength="200"></label><label>${t('projAddress')}<input id="rv-address" maxlength="300"></label></div>
    <label>${t('details')}<textarea id="rv-details" rows="3" maxlength="4000"></textarea></label></fieldset>
  <fieldset><legend><b>3</b>${t('budget')}</legend>
    <label>${t('contractAmt')} <i>*</i><input id="rv-amount" type="number" step="any" min="0" inputmode="decimal"></label>
    <label>${t('budgetLines')}<textarea id="rv-lines" rows="5" placeholder="Materiales 12,500&#10;Mano de obra 6,000&#10;Subcontratistas 2,400"></textarea><small class="hint" id="rv-parsed" style="display:block;margin:4px 0 0">${t('budgetLinesHint')}</small></label>
    <label>${t('budgetFile')}<input id="rv-file" type="file" accept="application/pdf,image/*"></label></fieldset>
  <div class="npbar"><button class="btn2" type="button" data-cancelrecv>${t('cancel')}</button><button class="primary" type="submit">${t('sendReview')}</button></div></form>`;
}

function reviewList() {
  const list = B.filter(b => rvOf(b.project) === 'review' && matchQ(b));
  const rej = B.filter(b => rvOf(b.project) === 'rejected' && matchQ(b));
  const row = b => { const p = b.project, bud = b.budget.reduce((a, x) => a + (+x.amount || 0), 0);
    return `<button class="pcard" data-openrv="${p.id}"><span class="who2">${esc(p.source_company || p.client_name || '·')}${p.source_ref ? ' · #' + esc(p.source_ref) : ''}</span><h3>${esc(p.title || t('project'))}</h3>
    <span class="pill rv-${rvOf(p)}">${t('rv_' + rvOf(p))}</span>${(() => { const a = rvAnalysis(b, p), n = a.flags.filter(x => x.lvl !== 'info').length; return ` <span class="pill lvl-${a.lvl}">${Math.round(a.pct)}% ${t('rvaMargin')}</span>${n ? ` <span class="pill">${n} ${t(n === 1 ? 'rvaFlag1' : 'rvaFlags')}</span>` : ''}`; })()}<dl><dt>${t('contractAmt')}</dt><dd><b>${money(p.contract_amount)}</b></dd><dt>${t('catsTotal')}</dt><dd>${money(bud)}</dd>${p.received_on ? `<dt>${t('receivedOn')}</dt><dd>${fdate(p.received_on)}</dd>` : ''}${p.address ? `<dt>${t('projAddress')}</dt><dd>${esc(p.address)}</dd>` : ''}</dl></button>`; };
  return `<div class="secthead"><h1>${t('pendingReview')}</h1><button class="primary" data-recv>${t('recvProject')}</button></div>${recv ? recvForm() : ''}
  <div class="plist">${list.map(row).join('') || `<div class="card"><p class="sub">${t('noReview')}</p></div>`}</div>
  ${rej.length ? `<h2 style="margin-top:22px">${t('rv_rejected')}</h2><div class="plist">${rej.map(row).join('')}</div>` : ''}`;
}

function budgetAlerts() {
  const al = [];
  B.filter(b => rvOf(b.project) === 'approved' && stOf(b.project) !== 'done').forEach(b => {
    const c = S.calc(b);
    if (c.bud > 0 && c.spent / c.bud >= .8) al.push({ b, name: b.project.title, used: c.spent, of: c.bud });
    b.budget.forEach(x => { const s = c.byCat(x.id); if (x.amount > 0 && s / x.amount >= .9) al.push({ b, name: `${b.project.title} · ${x.category}`, used: s, of: +x.amount }); });
  });
  if (!al.length) return '';
  return `<div class="card alerts"><h2>${t('budgetAlerts')}</h2>${al.slice(0, 8).map(a => { const pc = Math.round(a.used / a.of * 100), over = a.used > a.of;
    return `<button class="alrow" data-open="${a.b.project.id}"><span><b>${esc(a.name)}</b><small>${money(a.used)} ${t('usedOf')} ${money(a.of)}${over ? ` · <em>${t('overBy')} ${money(a.used - a.of)}</em>` : ` · ${t('nearLimit')}`}</small></span><span class="meter ${over ? 'over' : 'warn'}"><i style="width:${Math.min(100, pc)}%"></i></span><b class="pc ${over ? 'neg' : ''}">${pc}%</b></button>`; }).join('')}</div>`;
}

/* ---------- actividad ---------- */
function events(bs, max = 60) {
  const ev = [];
  bs.forEach(b => {
    const p = b.project, pid = p.id;
    const groups = {}; b.photos.forEach(x => { const k = (x.by_name || '') + '|' + toLocal(x.created_at); (groups[k] = groups[k] || []).push(x); });
    Object.values(groups).forEach(g => ev.push({ at: g[0].created_at, pid, who: g[0].by_name, txt: g.length === 1 ? t('ev_photo1') : t('ev_photos').replace('{n}', g.length), pics: g.slice(0, 4).map(x => x.path) }));
    b.updates.forEach(u => ev.push({ at: u.created_at, pid, txt: t('ev_update'), body: u.body, pics: (u.photos || []).slice(0, 4) }));
    b.daily_logs.forEach(l => ev.push({ at: l.created_at, pid, who: l.by_name, txt: t('ev_log'), body: l.work_done }));
    b.checklist_items.filter(i => i.done && i.done_at).forEach(i => ev.push({ at: i.done_at, pid, who: i.done_by, txt: t('ev_check') + ': ' + i.body, pics: i.photo ? [i.photo] : [] }));
    b.tasks.filter(x => x.done && x.done_at).forEach(x => ev.push({ at: x.done_at, pid, who: nameOf(x.assigned_to), txt: t('ev_task') + ': ' + x.title }));
    if (staff()) {
      b.expenses.forEach(e => ev.push({ at: e.created_at || e.spent_on, pid, txt: `${t('ev_expense')}: ${e.description || e.vendor} · ${money(e.amount)}` }));
      b.payments.forEach(x => ev.push({ at: x.paid_on, pid, txt: `${t('ev_payment')} · ${money(x.amount)}` }));
      if (p.source_company && p.created_at) ev.push({ at: p.created_at, pid, txt: `${t('ev_received')} ${p.source_company}` });
      if (p.reviewed_at && rvOf(p) === 'approved') ev.push({ at: p.reviewed_at, pid, txt: `${t('ev_approved')} ${p.reviewed_by || ''}` });
    }
    b.comments.filter(c => c.author === 'client').forEach(c => ev.push({ at: c.created_at, pid, who: c.name, txt: t('ev_comment'), body: c.body }));
  });
  return ev.filter(e => e.at).sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, max);
}
function feedHtml(evs, showProj = true) {
  if (!evs.length) return `<p class="sub">${t('noFeed')}</p>`;
  return `<ol class="feed">${evs.map(e => { const pr = B.find(b => b.project.id === e.pid)?.project;
    return `<li><time>${fdate(e.at)}</time><div><p>${e.who ? `<b>${esc(e.who)}</b> ` : ''}${esc(e.txt)}</p>${showProj && pr ? `<button class="plink" data-open="${pr.id}">${esc(pr.title || t('project'))}</button>` : ''}${e.body ? `<p class="fbody">${esc(String(e.body).slice(0, 220))}</p>` : ''}${e.pics && e.pics.length ? `<div class="fpics">${e.pics.map(x => `<button class="ph" data-photo="${esc(API.photoUrl(x))}"><img src="${esc(API.photoUrl(x))}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}</div></li>`; }).join('')}</ol>`;
}

/* ---------- revisión del proyecto recibido ---------- */

/* ---------- budget review: checks we can stand behind (no invented market prices) ---------- */
const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const SCOPE = {
  demo: ['demol', 'retiro', 'tear out', 'teardown'], disposal: ['dumpster', 'basura', 'escombro', 'disposal', 'haul', 'waste', 'desecho'],
  permits: ['permiso', 'permit', 'inspecc', 'inspection'], plumbing: ['plomer', 'plumb'], electrical: ['electric'],
  framing: ['framing', 'estructura', 'frame'], drywall: ['drywall', 'tablaroca', 'sheetrock'], paint: ['pintura', 'paint'],
  flooring: ['piso', 'floor', 'lvp', 'alfombra', 'carpet'], tile: ['azulejo', 'tile', 'loseta'], insulation: ['aislante', 'insulat'],
  hvac: ['hvac', 'calefac', 'ducto', 'duct', 'furnace'], concrete: ['concreto', 'concrete', 'footing', 'zapata', 'cimiento'],
  cabinets: ['gabinete', 'cabinet'], counters: ['cubierta', 'countertop', 'cuarzo', 'granito', 'quartz', 'granite'],
  contingency: ['contingen', 'imprevist'], cleanup: ['limpieza', 'clean']
};
const EXPECT = {
  basement: ['framing', 'electrical', 'plumbing', 'insulation', 'drywall', 'paint', 'flooring', 'hvac', 'permits', 'disposal', 'contingency'],
  remodel: ['demo', 'disposal', 'plumbing', 'electrical', 'tile', 'paint', 'permits', 'contingency'],
  kitchen: ['demo', 'disposal', 'cabinets', 'counters', 'plumbing', 'electrical', 'paint', 'permits', 'contingency'],
  deck: ['concrete', 'permits', 'contingency'], pergola: ['concrete', 'permits', 'contingency'],
  tile: ['demo', 'tile', 'disposal'], flooring: ['demo', 'flooring', 'disposal'], repair: ['contingency'], other: ['permits', 'contingency']
};
const groupOf = cat => { const c = norm(cat); return Object.keys(SCOPE).find(k => SCOPE[k].some(w => c.includes(w))) || null; };
function rvAnalysis(bdl, p) {
  const lines = bdl.budget, contract = +p.contract_amount || 0;
  const recv = lines.reduce((a, x) => a + (+x.amount || 0), 0);
  const withEst = lines.filter(x => x.est_cost !== null && x.est_cost !== undefined && x.est_cost !== '');
  const est = withEst.reduce((a, x) => a + (+x.est_cost || 0), 0) + lines.filter(x => !withEst.includes(x)).reduce((a, x) => a + (+x.amount || 0), 0);
  const profit = contract - est, pct = contract ? profit / contract * 100 : 0;
  const flags = [], qs = [];
  const f = (lvl, txt) => flags.push({ lvl, txt });
  if (!lines.length) f('red', t('rvaNoLines'));
  if (lines.length && Math.abs(contract - recv) > .5) { f('amber', t('rvaSum').replace('{a}', money(recv)).replace('{b}', money(contract)).replace('{c}', money(contract - recv))); qs.push(t('rvqSum').replace('{c}', money(Math.abs(contract - recv)))); }
  withEst.forEach(x => { const m = +x.amount - +x.est_cost;
    if (m < 0) f('red', t('rvaLoss').replace('{l}', x.category || '·').replace('{m}', money(-m)));
    else if (+x.amount > 0 && m / +x.amount < .1) f('amber', t('rvaThin').replace('{l}', x.category || '·').replace('{p}', Math.round(m / +x.amount * 100))); });
  const noEst = lines.length - withEst.length;
  if (noEst) f('info', t('rvaNoEst').replace('{n}', noEst));
  lines.filter(x => !(+x.amount > 0)).forEach(x => f('amber', t('rvaZero').replace('{l}', x.category || '·')));
  const seen = {}; lines.forEach(x => { const k = norm(x.category).trim(); if (k && seen[k]) f('amber', t('rvaDup').replace('{l}', x.category)); seen[k] = 1; });
  const have = new Set(lines.map(x => groupOf(x.category)).filter(Boolean));
  const miss = (EXPECT[p.service] || EXPECT.other).filter(g => !have.has(g));
  if (miss.length) { f('info', t('rvaMissing').replace('{l}', miss.map(g => t('sc_' + g)).join(', '))); miss.forEach(g => qs.push(t('rvqMissing').replace('{l}', t('sc_' + g).toLowerCase()))); }
  // C Plus history: finished projects, real spending vs what the builder paid per line
  const hist = {};
  B.filter(o => o.project.id !== p.id && rvOf(o.project) === 'approved' && stOf(o.project) === 'done').forEach(o => { const c = S.calc(o);
    o.budget.forEach(x => { const g = groupOf(x.category); if (!g || !(+x.amount > 0)) return; (hist[g] = hist[g] || []).push(c.byCat(x.id) / +x.amount); }); });
  const histNotes = [];
  lines.forEach(x => { const g = groupOf(x.category), h = g && hist[g]; if (!h || h.length < 2) return;
    const avg = h.reduce((a, y) => a + y, 0) / h.length;
    if (avg > 1.05) { f('amber', t('rvaHist').replace('{l}', x.category).replace('{n}', h.length).replace('{p}', Math.round((avg - 1) * 100))); }
    histNotes.push(x.category); });
  const lvl = profit < 0 || pct < 10 ? 'red' : pct < 20 ? 'amber' : 'green';
  return { contract, recv, est, profit, pct, lvl, flags, qs, noEst, histN: Object.values(hist).reduce((a, h) => Math.max(a, h.length), 0) };
}
function rvAnalysisCard(a) {
  const ico = { red: '●', amber: '●', info: '○' };
  const order = { red: 0, amber: 1, info: 2 };
  const qtxt = a.qs.length ? t('rvqIntro') + '\n' + a.qs.map((q, i) => `${i + 1}. ${q}`).join('\n') : '';
  return `<div class="card rva"><h2>${t('rvaT')}</h2><p class="sub">${t('rvaS')}</p>
  <div class="rvamt lvl-${a.lvl}"><div><small>${t('contractAmt')}</small><b>${money(a.contract)}</b></div><div><small>${t('rvaEst')}</small><b>${money(a.est)}</b></div><div><small>${t('rvaProfit')}</small><b>${money(a.profit)}</b><em>${Math.round(a.pct)}% ${t('rvaMargin')}</em></div></div>
  ${a.flags.length ? `<ul class="rvflags">${a.flags.sort((x, y) => order[x.lvl] - order[y.lvl]).map(x => `<li class="f-${x.lvl}"><span aria-hidden="true">${ico[x.lvl]}</span>${esc(x.txt)}</li>`).join('')}</ul>` : `<p class="okline">✓ ${t('rvaClean')}</p>`}
  <p class="hint">${a.histN >= 2 ? t('rvaHistOn') : t('rvaHistOff')}</p>
  ${qtxt ? `<details class="rvq"><summary>${t('rvqT')} (${a.qs.length})</summary><pre>${esc(qtxt)}</pre><button class="btn2" data-copylink="${esc(qtxt)}">${t('copy')}</button></details>` : ''}</div>`;
}

function cReview() {
  const p = cur.project, st = rvOf(p), c = S.calc(cur), bud = cur.budget.reduce((a, x) => a + (+x.amount || 0), 0), diff = (+p.contract_amount || 0) - bud;
  return `<div class="card rvcard rv-${st}"><div class="top2"><h2>${t('review')}</h2><span class="pill rv-${st}">${t('rv_' + st)}</span></div>
  <p class="sub">${st === 'review' ? t('reviewIntro') : `${t(st === 'approved' ? 'approvedBy' : 'rejectedBy')} ${esc(p.reviewed_by || '')} · ${fdate(p.reviewed_at)}`}</p>
  <div class="grid2" style="margin-top:12px"><label>${t('srcCompany')}${fld('projects', p, 'source_company')}</label><label>${t('srcRef')}${fld('projects', p, 'source_ref')}</label>
  <label>${t('receivedOn')}${fld('projects', p, 'received_on', 'date')}</label><label>${t('contractAmt')}${fld('projects', p, 'contract_amount', 'number')}</label>
  <label>${t('service')}${sel('projects', { ...p, service: p.service || 'other' }, 'service', S.SERVICES.map(s => [s, t('svc_' + s)]))}</label></div>
  <div class="linkbox" style="margin-top:10px">${p.budget_file ? `<button class="btn2" data-rcv="${esc(p.budget_file)}">${t('viewFile')}</button>` : ''}<button class="btn2" data-upbud>${t('upFile')}</button></div></div>
  <div class="card"><h2>${t('budgetLines')}</h2><p class="sub">${t('catsTotal')}: <b>${money(bud)}</b> · ${t('contractAmt')}: <b>${money(p.contract_amount)}</b>${Math.abs(diff) > .5 ? ` · <span style="color:#b23a26;font-weight:600">${t('unassignedAmt')}: ${money(diff)}</span>` : ''}</p>
  <div class="rvhead" aria-hidden="true"><span>${t('rvaLine')}</span><span>${t('rvaRecv')}</span><span>${t('rvaOur')}</span><span>${t('rvaLeft')}</span><span></span></div>
  ${sorted('budget').map(b => { const has = b.est_cost !== null && b.est_cost !== undefined && b.est_cost !== '', m = has ? +b.amount - +b.est_cost : null;
    return `<div class="row r-rv">${fld('budget', b, 'category', 'text', 'ct')}<label class="cell"><small>${t('rvaRecv')}</small>${fld('budget', b, 'amount', 'number', 'am')}</label><label class="cell"><small>${t('rvaOur')}</small><input class="ec" type="number" step="any" inputmode="decimal" min="0" data-t="budget" data-id="${b.id}" data-f="est_cost" value="${esc(b.est_cost ?? '')}" placeholder="${t('rvaOurPh')}" aria-label="${t('rvaOur')}"></label><span class="mg ${m === null ? '' : m < 0 ? 'neg' : (+b.amount && m / +b.amount < .1) ? 'warn' : 'pos'}"><small>${t('rvaLeft')}</small>${m === null ? '·' : money(m)}</span>${del('budget', b.id)}</div>`; }).join('')}<button class="add" data-add="budget">${t('addCat')}</button></div>
  ${rvAnalysisCard(rvAnalysis(cur, p))}
  <div class="card"><h2>${t('reviewNote')}</h2><ul class="rvchecks">${['rvCheck1', 'rvCheck2', 'rvCheck3', 'rvCheck4'].map(k => `<li>${t(k)}</li>`).join('')}</ul>
  ${tx('projects', p, 'review_note', 3)}
  <div class="acts" style="margin-top:12px">${st !== 'approved' ? `<button class="primary" data-rvset="approved">${t('approve')}</button>` : ''}${st !== 'rejected' ? `<button class="btn2 danger" data-rvset="rejected">${t('reject')}</button>` : ''}${st !== 'review' ? `<button class="btn2" data-rvset="review">${t('reopen')}</button>` : ''}</div></div>`;
}

function budgetHealth(c) {
  if (!c.bud) return '';
  const pc = Math.round(c.spent / c.bud * 100), over = c.spent > c.bud;
  return `<div class="card bh"><div class="top2"><b>${t('budgetHealth')}</b><span>${money(c.spent)} ${t('of')} ${money(c.bud)} · ${t('remaining2')}: <b class="${over ? 'neg' : ''}">${money(c.bud - c.spent)}</b></span></div>
  <div class="meter big ${over ? 'over' : pc >= 80 ? 'warn' : ''}"><i style="width:${Math.min(100, pc)}%"></i></div></div>`;
}

/* ---------- fotos ---------- */
function allPhotos(b) {
  const own = b.photos.map(x => ({ ...x, src: 'photos' }));
  const extra = [];
  b.updates.forEach(u => (u.photos || []).forEach(path => extra.push({ id: 'u:' + u.id + path, path, caption: u.body, kind: 'progress', taken_at: u.created_at, src: 'updates' })));
  b.daily_logs.forEach(l => (l.photos || []).forEach(path => extra.push({ id: 'l:' + l.id + path, path, caption: l.work_done, kind: 'progress', taken_at: l.created_at, by_name: l.by_name, src: 'logs' })));
  b.checklist_items.filter(i => i.photo).forEach(i => extra.push({ id: 'c:' + i.id, path: i.photo, caption: i.body, kind: 'progress', taken_at: i.done_at, by_name: i.done_by, src: 'checks' }));
  return own.concat(extra).sort((a, b) => String(b.taken_at).localeCompare(String(a.taken_at)));
}
function cPhotos() {
  const all = allPhotos(cur), tags = [...new Set(cur.photos.flatMap(x => x.tags || []))].sort();
  const shown = all.filter(x => (pkind === 'all' || x.kind === pkind) && (!ptag || (x.tags || []).includes(ptag)));
  const days = {}; shown.forEach(x => { const d = toLocal(x.taken_at || x.created_at); (days[d] = days[d] || []).push(x); });
  return `<div class="card"><div class="secthead" style="margin:0"><h2 style="margin-inline-end:auto">${t('photosTab')}</h2><button class="btn2" data-report>${t('photoReport')}</button></div>
  <form id="phf" class="phup"><label class="primary bigcam">${camIco}<span>${t('takePhotos')}</span><input id="phfile" type="file" accept="image/*" multiple></label>
  <div class="grid2" style="margin-top:12px"><label>${t('kind')}<select id="ph-kind" ${inp}>${PKINDS.map(k => `<option value="${k}"${k === 'progress' ? ' selected' : ''}>${t('pk_' + k)}</option>`).join('')}</select></label>
  <label>${t('tagsL')}<input id="ph-tags" list="taglist" placeholder="${t('tagsPh')}" ${inp}><datalist id="taglist">${tags.map(x => `<option value="${esc(x)}">`).join('')}</datalist></label></div>
  <label>${t('captionL')}<input id="ph-cap" maxlength="1000" ${inp}></label>
  <div class="checks"><label><input type="checkbox" id="ph-share" checked> ${t('shareClient')}</label><label><input type="checkbox" id="ph-geo"> ${t('saveLoc')}</label></div>
  <p id="phmsg" class="sub" aria-live="polite"></p></form></div>
  <div class="card"><div class="filters">${['all', ...PKINDS].map(k => `<button data-pk="${k}" class="${pkind === k ? 'on' : ''}" aria-pressed="${pkind === k}">${k === 'all' ? t('allKinds') : t('pk_' + k)} <span class="cnt">${k === 'all' ? all.length : all.filter(x => x.kind === k).length}</span></button>`).join('')}</div>
  ${tags.length ? `<div class="filters">${tags.map(x => `<button data-ptag="${esc(x)}" class="${ptag === x ? 'on' : ''}">#${esc(x)}</button>`).join('')}</div>` : ''}
  ${Object.keys(days).length ? Object.entries(days).map(([d, xs]) => `<h3 class="dayh">${fdate(d)} <small>${xs.length}</small></h3><div class="pgrid">${xs.map(x => `<button class="pcell" data-pv="${esc(x.id)}"><img src="${esc(API.photoUrl(x.path))}" alt="${esc(x.caption || '')}" loading="lazy"><span class="pk pk-${x.kind}">${t('pk_' + x.kind)}</span>${x.src === 'photos' && !x.shared ? '<span class="lock2" title="privada">🔒</span>' : ''}${x.caption ? `<small>${esc(x.caption)}</small>` : ''}</button>`).join('')}</div>`).join('') : `<p class="sub">${t('noPhotos')}</p>`}</div>`;
}

async function geo() {
  if (!navigator.geolocation) return {};
  return new Promise(ok => navigator.geolocation.getCurrentPosition(p => ok({ lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) }), () => ok({}), { timeout: 8000, maximumAge: 60000 }));
}
async function uploadPhotos(files, meta = {}) {
  const at = meta.geo ? await geo() : {};
  const rows = [];
  for (let i = 0; i < files.length; i++) {
    const m = $('#phmsg'); if (m) m.textContent = t('uploadingN').replace('{n}', `${i + 1} / ${files.length}`);
    const blob = await S.compress(files[i]);
    const path = await API.upload('photos', `${cur.project.id}/${S.uid()}.jpg`, blob);
    try { rows.push(await API.insert('photos', { project_id: cur.project.id, path, kind: meta.kind || 'progress', tags: meta.tags || [], caption: meta.caption || '', shared: meta.shared !== false, by_name: myName(), ...at })); }
    catch (x) { API.removeFiles('photos', [path]).catch(() => {}); throw x; }
  }
  cur.photos.push(...rows); return rows;
}

/* visor de foto con datos, mapa, descarga y marcado */
function photoViewer(id) {
  const x = allPhotos(cur).find(y => y.id === id); if (!x) return;
  const own = x.src === 'photos', url = API.photoUrl(x.path);
  const d = document.createElement('div'); d.className = 'pvw'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  d.innerHTML = `<div class="pvbox"><div class="pvimg"><img src="${esc(url)}" alt="${esc(x.caption || '')}"></div><div class="pvside">
    <button class="ghost pvx" aria-label="${t('close')}">✕</button>
    <small class="sub">${fdate(x.taken_at)}${x.by_name ? ' · ' + t('by2') + ' ' + esc(x.by_name) : ''}</small>
    ${own ? `<label>${t('kind')}<select data-pvf="kind" ${inp}>${PKINDS.map(k => `<option value="${k}"${x.kind === k ? ' selected' : ''}>${t('pk_' + k)}</option>`).join('')}</select></label>
    <label>${t('captionL')}<textarea data-pvf="caption" rows="3" ${inp}>${esc(x.caption || '')}</textarea></label>
    <label>${t('tagsL')}<input data-pvf="tags" value="${esc((x.tags || []).join(', '))}" ${inp}></label>
    <label class="checks"><input type="checkbox" data-pvf="shared"${x.shared ? ' checked' : ''}> ${t('shareClient')}</label>` : `<p>${esc(x.caption || '')}</p><p class="hint">${t('fromUpdates')}</p>`}
    <div class="acts"><button class="primary" data-pvann>${t('annotate')}</button><a class="btn2" href="${esc(url)}" download target="_blank" rel="noopener">${t('downloadPh')}</a>${x.lat ? `<a class="btn2" target="_blank" rel="noopener" href="https://maps.google.com/?q=${x.lat},${x.lng}">${t('openMap')}</a>` : ''}${own ? `<button class="btn2 danger" data-pvdel>${t('delete')}</button>` : ''}</div></div></div>`;
  const close = () => { d.remove(); removeEventListener('keydown', key); render(); };
  const key = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', key);
  d.addEventListener('click', async e => {
    if (e.target === d || e.target.closest('.pvx')) return close();
    if (e.target.closest('[data-pvann]')) { d.remove(); removeEventListener('keydown', key); return annotate(x); }
    if (e.target.closest('[data-pvdel]')) { try { await API.remove('photos', x.id); cur.photos = cur.photos.filter(y => y.id !== x.id); setTimeout(() => API.removeFiles('photos', [x.path]).catch(() => {}), 4000); close(); S.toast(t('removed')); } catch (er) { fail(er); } }
  });
  d.addEventListener('change', async e => {
    const f = e.target.dataset.pvf; if (!f) return;
    let v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (f === 'tags') v = String(v).split(',').map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 20);
    try { const r = await API.update('photos', x.id, { [f]: v }); Object.assign(cur.photos.find(y => y.id === x.id), r); setDot(t('saved') + ' ✓'); } catch (er) { fail(er); }
  });
  document.body.appendChild(d); d.querySelector('.pvx').focus();
}

/* marcado: lápiz, flecha y cuadro; guarda una copia nueva */
function annotate(x) {
  const d = document.createElement('div'); d.className = 'pvw ann'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  const COLORS = ['#e5372b', '#ffd400', '#ffffff', '#111111'];
  d.innerHTML = `<div class="annbar"><div class="seg2">${['pen', 'arrow', 'box'].map((k, i) => `<button data-tool="${k}" aria-pressed="${i === 0}">${t(k)}</button>`).join('')}</div>
    <div class="cols2">${COLORS.map((c, i) => `<button class="sw" data-col="${c}" aria-pressed="${i === 0}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
    <button class="btn2" data-undo>${t('undo2')}</button><button class="btn2" data-cancel>${t('cancel')}</button><button class="primary" data-save>${t('saveCopy')}</button></div>
    <div class="annwrap"><canvas></canvas></div>`;
  document.body.appendChild(d);
  const cv = d.querySelector('canvas'), ctx = cv.getContext('2d'), img = new Image();
  let tool = 'pen', col = COLORS[0], strokes = [], curS = null;
  img.crossOrigin = 'anonymous';
  img.onload = () => { const k = Math.min(1, 1600 / Math.max(img.width, img.height)); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); draw(); };
  img.src = API.photoUrl(x.path) + (API.photoUrl(x.path).includes('?') ? '&' : '?') + 'a=1';
  const lw = () => Math.max(4, cv.width / 220);
  function draw() {
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    for (const s of strokes.concat(curS ? [curS] : [])) {
      ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = lw(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const p = s.p; if (!p.length) continue;
      if (s.t === 'pen') { ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); p.forEach(q2 => ctx.lineTo(q2[0], q2[1])); ctx.stroke(); }
      else { const [a, b] = [p[0], p[p.length - 1]];
        if (s.t === 'box') ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        else { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), h = lw() * 4;
          ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - h * Math.cos(ang - .45), b[1] - h * Math.sin(ang - .45)); ctx.lineTo(b[0] - h * Math.cos(ang + .45), b[1] - h * Math.sin(ang + .45)); ctx.closePath(); ctx.fill(); } }
    }
  }
  const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); curS = { t: tool, c: col, p: [pt(e)] }; draw(); });
  cv.addEventListener('pointermove', e => { if (!curS) return; if (curS.t === 'pen') curS.p.push(pt(e)); else curS.p[1] = pt(e); draw(); });
  const end = () => { if (curS && curS.p.length > 1) strokes.push(curS); curS = null; draw(); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  const close = () => { d.remove(); render(); };
  d.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.tool) { tool = b.dataset.tool; d.querySelectorAll('[data-tool]').forEach(y => y.setAttribute('aria-pressed', y === b)); }
    if (b.dataset.col) { col = b.dataset.col; d.querySelectorAll('[data-col]').forEach(y => y.setAttribute('aria-pressed', y === b)); }
    if ('undo' in b.dataset) { strokes.pop(); draw(); }
    if ('cancel' in b.dataset) close();
    if ('save' in b.dataset) {
      b.disabled = true; b.textContent = t('saving');
      try {
        const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', .88));
        const path = await API.upload('photos', `${cur.project.id}/${S.uid()}.jpg`, blob);
        cur.photos.push(await API.insert('photos', { project_id: cur.project.id, path, kind: x.kind || 'progress', tags: [...new Set([...(x.tags || []), 'marcada'])], caption: x.caption || '', shared: x.shared !== false, by_name: myName() }));
        S.toast(t('annotated')); close();
      } catch (er) { fail(er); b.disabled = false; b.textContent = t('saveCopy'); }
    }
  });
}

/* reporte PDF con fotos, checklists y bitácora */
async function photoReport() {
  const jsPDF = window.jspdf && window.jspdf.jsPDF; if (!jsPDF) return;
  S.toast(t('reportMaking'));
  const p = cur.project, doc = new jsPDF({ unit: 'pt', format: 'letter' }), W = 612, M = 40;
  let y = M;
  const toData = path => new Promise(ok => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => { const k = Math.min(1, 900 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok({ d: c.toDataURL('image/jpeg', .8), w: c.width, h: c.height }); }; im.onerror = () => ok(null); im.src = API.photoUrl(path); });
  const line = (txt, size = 10, bold = false, col = [30, 30, 30]) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...col); doc.splitTextToSize(String(txt), W - 2 * M).forEach(l => { if (y > 750) { doc.addPage(); y = M; } doc.text(l, M, y); y += size * 1.35; }); };
  doc.setFillColor(17, 15, 13); doc.rect(0, 0, W, 70, 'F'); doc.setTextColor(236, 156, 59); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(settings.company || 'C Plus LLC', M, 42);
  doc.setFontSize(10); doc.setTextColor(230, 230, 230); doc.text(`${t('photoReport').replace(' (PDF)', '')} · ${fdate(S.today())}`, W - M, 42, { align: 'right' }); y = 100;
  line(p.title || t('project'), 16, true); line([p.client_name, p.address, p.source_company ? `${t('srcCompany')}: ${p.source_company}${p.source_ref ? ' #' + p.source_ref : ''}` : ''].filter(Boolean).join(' · '), 10, false, [90, 90, 90]); y += 8;
  if (cur.checklists.length) {
    line(t('checklists'), 13, true);
    sorted('checklists').forEach(cl => { const its = cur.checklist_items.filter(i => i.checklist_id === cl.id).sort((a, b) => (a.sort || 0) - (b.sort || 0)); line(`${cl.title} (${its.filter(i => i.done).length}/${its.length})`, 11, true); its.forEach(i => line(`${i.done ? '[x]' : '[ ]'} ${i.body}${i.done_by ? ' · ' + i.done_by : ''}`, 10)); y += 4; });
    y += 6;
  }
  const logs = cur.daily_logs.slice().sort((a, b) => String(b.log_date).localeCompare(String(a.log_date))).slice(0, 10);
  if (logs.length) { line(t('logs'), 13, true); logs.forEach(l => { line(`${fdate(l.log_date)}${l.weather ? ' · ' + l.weather : ''}${l.crew ? ' · ' + l.crew : ''}`, 10, true); [l.work_done, l.issues && t('issues') + ': ' + l.issues, l.next_steps && t('nextSteps') + ': ' + l.next_steps].filter(Boolean).forEach(s => line(s, 10)); y += 4; }); y += 6; }
  const ph = allPhotos(cur).filter(x => pkind === 'all' || x.kind === pkind).slice(0, 60).reverse();
  if (ph.length) {
    if (y > 600) { doc.addPage(); y = M; }
    line(t('photosTab'), 13, true); y += 4;
    const cw = (W - 2 * M - 16) / 2, ch = cw * .75;
    for (let i = 0; i < ph.length; i++) {
      const col = i % 2; if (col === 0 && y + ch + 40 > 770) { doc.addPage(); y = M; }
      const im = await toData(ph[i].path), x0 = M + col * (cw + 16);
      if (im) { const k = Math.min(cw / im.w, ch / im.h); doc.addImage(im.d, 'JPEG', x0 + (cw - im.w * k) / 2, y, im.w * k, im.h * k); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(124, 70, 4); doc.text(`${t('pk_' + ph[i].kind)} · ${fdate(ph[i].taken_at)}`, x0, y + ch + 12);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40); doc.text(doc.splitTextToSize(String(ph[i].caption || ''), cw).slice(0, 2), x0, y + ch + 24);
      if (col === 1 || i === ph.length - 1) y += ch + 44;
    }
  }
  doc.save(`${(p.title || 'proyecto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-')}-reporte.pdf`); S.toast(t('reportDone'));
}

/* ---------- checklists y tareas ---------- */
function cChecks() {
  const ts = cur.tasks.slice().sort((a, b) => (a.done - b.done) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')));
  const people = [['', t('unassigned')], ...team.filter(m => m.active).map(m => [m.user_id, m.name])];
  return `<div class="card"><h2>${t('tasks')}</h2>
  ${ts.map(x => `<div class="row r-task${x.done ? ' done' : ''}">${chk('tasks', x, 'done', x.title)}${fld('tasks', x, 'title', 'text', 'tt')}${sel('tasks', { ...x, assigned_to: x.assigned_to || '' }, 'assigned_to', people, 'as')}${fld('tasks', x, 'due_date', 'date', 'd')}${del('tasks', x.id)}</div>`).join('') || `<p class="sub">${t('noTasks')}</p>`}
  <form id="taskf" class="addrow"><input id="tk-title" placeholder="${t('taskPh')}" maxlength="200" aria-label="${t('taskPh')}"><button class="btn2" type="submit">${t('addTask')}</button></form></div>
  ${sorted('checklists').map(cl => { const its = cur.checklist_items.filter(i => i.checklist_id === cl.id).sort((a, b) => (a.sort || 0) - (b.sort || 0)), dn = its.filter(i => i.done).length;
    return `<div class="card cl"><div class="top2">${staff() ? fld('checklists', cl, 'title', 'text', 'cltitle') : `<h2>${esc(cl.title)}</h2>`}<b class="clc">${dn}/${its.length}</b></div><div class="meter"><i style="width:${its.length ? dn / its.length * 100 : 0}%"></i></div>
    ${its.map(i => `<div class="clitem${i.done ? ' done' : ''}"><button class="clbox" data-clk="${i.id}" aria-pressed="${i.done}" aria-label="${esc(i.body)}">${i.done ? '✓' : ''}</button>
      <div class="cltext">${staff() ? fld('checklist_items', i, 'body', 'text') : `<span>${esc(i.body)}</span>`}<small>${i.needs_photo ? `${camIco} ${t('needsPhoto')}` : ''}${i.done_by ? ` · ${esc(i.done_by)} · ${fdate(i.done_at)}` : ''}</small></div>
      ${i.photo ? `<button class="ph clph" data-photo="${esc(API.photoUrl(i.photo))}"><img src="${esc(API.photoUrl(i.photo))}" alt="" loading="lazy"></button>` : ''}
      ${staff() ? `<button class="ico camt${i.needs_photo ? ' on' : ''}" data-clphoto="${i.id}" title="${t('needsPhoto')}" aria-pressed="${!!i.needs_photo}">${camIco}</button>${del('checklist_items', i.id)}` : ''}</div>`).join('')}
    ${staff() ? `<div class="acts"><button class="add" data-clitem="${cl.id}">${t('addItem2')}</button><button class="btn2" data-cltpl="${cl.id}">${t('saveTemplate')}</button>${del('checklists', cl.id)}</div>` : ''}</div>`; }).join('')}
  ${cur.checklists.length ? '' : `<div class="card"><p class="sub">${t('noChecklists')}</p></div>`}
  ${staff() ? `<div class="card"><h2>${t('newChecklist')}</h2><div class="linkbox"><select id="cl-tpl" style="min-height:44px;flex:1 1 220px"><option value="">${t('blankList')}</option>${templates.map(x => `<option value="${x.id}">${esc(x.name)} (${(x.items || []).length})</option>`).join('')}</select><button class="primary" data-newcl>${t('newChecklist')}</button></div>
  ${templates.length ? `<p class="hint" style="margin-top:12px">${t('templates')}: ${templates.map(x => `<span class="chip">${esc(x.name)} <button class="ico x" data-deltpl="${x.id}" aria-label="${t('delete')}">✕</button></span>`).join(' ')}</p>` : ''}</div>` : ''}`;
}
let clPending = null;

/* ---------- bitácora diaria ---------- */
function cLogs() {
  const logs = cur.daily_logs.slice().sort((a, b) => String(b.log_date).localeCompare(String(a.log_date)) || String(b.created_at).localeCompare(String(a.created_at)));
  return `<form class="card" id="logf"><h2>${t('newLog')}</h2><div class="grid2" style="margin-top:12px">
  <label>${t('date')}<input id="lg-date" type="date" value="${S.today()}" ${inp}></label><label>${t('weather')}<input id="lg-weather" maxlength="80" placeholder="Soleado, 45°F" ${inp}></label>
  <label>${t('crewL')}<input id="lg-crew" maxlength="200" value="${esc(myName())}" ${inp}></label><label>${t('hours')}<input id="lg-hours" type="number" step="0.5" min="0" inputmode="decimal" ${inp}></label></div>
  <label>${t('workDone')}<textarea id="lg-work" rows="3" maxlength="4000" ${inp}></textarea></label>
  <label>${t('issues')}<textarea id="lg-issues" rows="2" maxlength="4000" ${inp}></textarea></label>
  <label>${t('nextSteps')}<textarea id="lg-next" rows="2" maxlength="4000" ${inp}></textarea></label>
  <div class="acts"><label class="btn2 drop" style="margin:0">${camIco}${t('addPhotos')}<input id="lg-files" type="file" accept="image/*" multiple></label><span id="lgc" class="sub" style="margin:0"></span><button class="primary" type="submit">${t('saveLog')}</button></div></form>
  <div class="card"><h2>${t('logs')}</h2>${logs.map(l => `<div class="log"><div class="top2"><b>${fdate(l.log_date)}</b><span class="sub" style="margin:0">${[l.weather, l.crew, l.hours ? l.hours + ' h' : ''].filter(Boolean).map(esc).join(' · ')}</span></div>
    ${l.work_done ? `<p>${esc(l.work_done)}</p>` : ''}${l.issues ? `<p class="iss"><b>${t('issues')}:</b> ${esc(l.issues)}</p>` : ''}${l.next_steps ? `<p><b>${t('nextSteps')}:</b> ${esc(l.next_steps)}</p>` : ''}${S.photos(l.photos)}
    <div class="acts" style="margin-top:4px"><small class="sub" style="margin:0">${esc(l.by_name || '')}</small>${staff() || l.by_name === myName() ? del('daily_logs', l.id) : ''}</div></div>`).join('') || `<p class="sub">${t('noLogs')}</p>`}</div>`;
}

/* ---------- equipo del proyecto ---------- */
function crewCard(p) {
  const people = team.filter(m => m.active && m.user_id !== p.assigned_to && m.role === 'contractor'), crew = p.crew || [];
  return `<div class="card crewc"><div class="crow"><b>${t('assignedTo')}</b><span class="csel">${sel('projects', { ...p, assigned_to: p.assigned_to || '' }, 'assigned_to', assignOpts())}</span></div>
  ${people.length ? `<div class="crow"><b>${t('crew')}</b><span class="chips">${people.map(m => `<label class="chip2"><input type="checkbox" data-crew="${m.user_id}"${crew.includes(m.user_id) ? ' checked' : ''}> ${esc(m.name)}</label>`).join('')}</span></div><small class="sub">${t('crewHint')}</small>` : ''}</div>`;
}

/* ---------- gastos y taxes ---------- */
const monthName = m => new Date(2000, m - 1, 1).toLocaleDateString(S.L === 'en' ? 'en-US' : 'es-MX', { month: 'long' }).replace(/^./, c => c.toUpperCase());
const TR = () => taxMonth ? (taxRows || []).filter(e => +String(e.spent_on || '').slice(5, 7) === taxMonth) : (taxRows || []);
const taxTag = () => taxYear + (taxMonth ? '-' + String(taxMonth).padStart(2, '0') : '');
function taxView() {
  if (!taxRows) return `<div class="card"><p>${t('loading')}</p></div>`;
  const R = TR(), sum = xs => xs.reduce((a, x) => a + (+x.amount || 0), 0), tot = sum(R), stx = R.reduce((a, x) => a + (+x.sales_tax || 0), 0), withR = R.filter(x => x.receipt).length;
  const pname = id => id ? (B.find(b => b.project.id === id)?.project.title || '·') : t('generalShort');
  const byCat = TAXCATS.map(([k, l]) => ({ k, l, v: sum(R.filter(x => (x.tax_cat || 'materials') === k)) })).filter(x => x.v);
  const byProj = {}; R.forEach(x => { const k = x.project_id || ''; byProj[k] = (byProj[k] || 0) + (+x.amount || 0); });
  const subs = {}; taxRows.filter(x => x.tax_cat === 'subcontract').forEach(x => { const v = (x.vendor || '·').trim(); subs[v] = (subs[v] || 0) + (+x.amount || 0); });
  const n1099 = Object.entries(subs).filter(([, v]) => v >= 600).sort((a, b) => b[1] - a[1]);
  const years = []; for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
  const projOpts = [['', t('general')], ...B.map(b => [b.project.id, b.project.title || t('project')])];
  return `<div class="secthead"><h1>${t('taxesT')}</h1><div class="yrsels"><label class="yrsel">${t('year')} <select id="taxyear">${years.map(y => `<option${y === taxYear ? ' selected' : ''}>${y}</option>`).join('')}</select></label><label class="yrsel">${t('month')} <select id="taxmonth"><option value="0">${t('allYear')}</option>${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => `<option value="${m}"${m === taxMonth ? ' selected' : ''}>${monthName(m)}</option>`).join('')}</select></label></div></div>
  <p class="periodline">${t('showing')}: <b>${taxMonth ? monthName(taxMonth) + ' ' + taxYear : t('allYear') + ' ' + taxYear}</b> · ${t('dlNote')}</p><p class="sub">${t('taxesS')}</p>
  <div class="acts taxacts" style="margin:12px 0 18px"><button class="primary cam" data-scan="general">${camIco}${t('scanReceipt')}</button><button class="btn2" data-addgen>${t('addGeneral')}</button><button class="btn2" data-csv>${t('csv')}</button><button class="btn2" data-zip>${t('zip')}</button><button class="btn2" data-taxpdf>${t('taxPdf')}</button></div>
  <div class="kpis">${kpi(taxMonth ? t('totalMonth') : t('totalExp'), tot)}${kpi(t('salesTaxPaid'), stx)}<div class="kpi"><small>${t('withReceipt')}</small><b>${R.length ? Math.round(withR / R.length * 100) : 0}%</b><em>${R.length - withR} ${t('missingRc')}</em></div></div>
  <div class="cols"><div class="card"><h2>${t('byTaxCat')}</h2>${byCat.map(x => `<div class="mat"><div><b>${t('tc_' + x.k)}</b><small>Schedule C · ${x.l}</small></div><span class="n">${money(x.v)}</span></div>`).join('') || `<p class="sub">${t('none')}</p>`}<p class="hint">${t('taxNote')}</p></div>
  <div class="card"><h2>${t('byProject')}</h2>${Object.entries(byProj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="mat"><div><b>${esc(pname(k))}</b></div><span class="n">${money(v)}</span></div>`).join('') || `<p class="sub">${t('none')}</p>`}
  <h2 style="margin-top:18px">${t('t1099')}</h2><p class="sub">${t('t1099S')}</p>${n1099.map(([v, a]) => `<div class="mat"><div><b>${esc(v)}</b></div><span class="n">${money(a)}</span></div>`).join('') || `<p class="sub">${t('none1099')}</p>`}</div></div>
  ${taxMonth ? '' : `<div class="card"><h2>${t('byMonth')}</h2><div class="months">${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => { const v = sum(taxRows.filter(e => +String(e.spent_on || '').slice(5, 7) === m)); return `<button class="mbtn${v ? '' : ' empty'}" data-taxm="${m}"><span>${monthName(m).slice(0, 3)}</span><b>${v ? money(v).replace(/\.\d\d$/, '') : '·'}</b></button>`; }).join('')}</div><p class="hint">${t('byMonthHint')}</p></div>`}
  <div class="card"><h2>${t('allExp')} <small class="sub">${R.length}</small></h2>
  ${R.map(e => `<div class="xrow"><div class="x1"><input type="date" data-tx="${e.id}" data-tf="spent_on" value="${esc(e.spent_on || '')}" aria-label="${t('date')}"><input data-tx="${e.id}" data-tf="description" value="${esc(e.description || '')}" aria-label="${t('descr')}"><input type="number" step="any" data-tx="${e.id}" data-tf="amount" value="${esc(e.amount)}" aria-label="${t('amt')}" class="am"></div>
    <div class="x2"><input data-tx="${e.id}" data-tf="vendor" value="${esc(e.vendor || '')}" placeholder="${t('vendor')}" aria-label="${t('vendor')}">
    <select data-tx="${e.id}" data-tf="tax_cat" aria-label="${t('taxCat')}">${taxOpts().map(([v, l]) => `<option value="${v}"${(e.tax_cat || 'materials') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
    <select data-tx="${e.id}" data-tf="project_id" aria-label="${t('project2')}">${projOpts.map(([v, l]) => `<option value="${esc(v)}"${(e.project_id || '') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
    <select data-tx="${e.id}" data-tf="pay_method" aria-label="${t('payMethod')}">${payOpts().map(([v, l]) => `<option value="${v}"${(e.pay_method || '') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
    ${e.receipt ? `<button class="btn2 rc" data-rcv="${esc(e.receipt)}">${t('viewReceipt')}</button>` : `<button class="btn2 rc warn" data-rctx="${e.id}">${t('addReceipt')}</button>`}<button class="ico x" data-deltx="${e.id}" aria-label="${t('delete')}">✕</button></div></div>`).join('') || `<p class="sub">${t('none')}</p>`}</div>`;
}
async function loadTax() { taxRows = null; render(); try { taxRows = await API.expensesYear(taxYear); } catch (x) { taxRows = []; fail(x); } render(); }
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
function taxCsv() {
  const pname = id => id ? (B.find(b => b.project.id === id)?.project.title || '') : t('generalShort');
  const head = ['Date', 'Vendor', 'Description', 'Amount', 'Sales tax', 'Tax category', 'Schedule C line', 'Project', 'Payment method', 'Receipt file', 'Notes'];
  const rows = TR().map(e => { const tc = e.tax_cat || 'materials'; return [e.spent_on, e.vendor, e.description, (+e.amount || 0).toFixed(2), (+e.sales_tax || 0).toFixed(2), t('tc_' + tc), (TAXCATS.find(x => x[0] === tc) || [])[1], pname(e.project_id), t('pm_' + (e.pay_method || '')), e.receipt ? e.receipt.split('/').pop() : '', e.notes]; });
  const blob = new Blob(['﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  saveBlob(blob, `cplus-gastos-${taxTag()}.csv`);
}
function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
async function taxZip() {
  if (!window.JSZip) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/jszip.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
  S.toast(t('zipMaking'));
  const withR = TR().filter(e => e.receipt), urls = await API.receiptUrls(withR.map(e => e.receipt)), zip = new JSZip();
  for (const e of withR) {
    const u = urls[e.receipt]; if (!u) continue;
    try { const b = await (await fetch(u)).blob(); const ext = e.receipt.split('.').pop(); zip.file(`${e.spent_on || 'sin-fecha'}_${(e.vendor || 'gasto').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\- ]/g, '').trim().replace(/\s+/g, '-').slice(0, 30)}_${(+e.amount || 0).toFixed(2)}.${ext}`, b); } catch (_) {}
  }
  saveBlob(await zip.generateAsync({ type: 'blob' }), `cplus-recibos-${taxTag()}.zip`);
}
function taxPdf() {
  const jsPDF = window.jspdf && window.jspdf.jsPDF; if (!jsPDF || !taxRows) return; const RF = TR();
  const doc = new jsPDF({ unit: 'pt', format: 'letter' }), M = 40; let y = 50;
  const ln = (a, b = '', bold = false) => { if (y > 750) { doc.addPage(); y = 50; } doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.text(String(a), M, y); if (b !== '') doc.text(String(b), 572, y, { align: 'right' }); y += 16; };
  doc.setFontSize(16); ln(`${settings.company || 'C Plus LLC'} · ${t('taxesT')} ${taxMonth ? monthName(taxMonth) + ' ' : ''}${taxYear}`, '', true); doc.setFontSize(10); y += 6;
  const sum = xs => xs.reduce((a, x) => a + (+x.amount || 0), 0);
  ln(t('totalExp'), money(sum(RF)), true); ln(t('salesTaxPaid'), money(RF.reduce((a, x) => a + (+x.sales_tax || 0), 0))); y += 8;
  ln(t('byTaxCat'), '', true); TAXCATS.forEach(([k, l]) => { const v = sum(RF.filter(x => (x.tax_cat || 'materials') === k)); if (v) ln(`${t('tc_' + k)} (Schedule C ${l})`, money(v)); }); y += 8;
  ln(t('allExp'), '', true); RF.slice().sort((a, b) => String(a.spent_on).localeCompare(String(b.spent_on))).forEach(e => ln(`${e.spent_on || ''}  ${(e.vendor || '').slice(0, 28)}  ${(e.description || '').slice(0, 40)}`, money(e.amount)));
  y += 10; doc.setFontSize(8); doc.text(doc.splitTextToSize(t('taxNote'), 532), M, y);
  doc.save(`cplus-taxes-${taxTag()}.pdf`);
}

/* ---------- escanear factura ---------- */
function scanner(pid) {
  const d = document.createElement('div'); d.className = 'pvw scan'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true');
  let data = null, file = null, preview = '';
  const projOpts = () => [['', t('general')], ...B.filter(b => rvOf(b.project) !== 'rejected').map(b => [b.project.id, b.project.title || t('project')])];
  const budOf = id => (B.find(b => b.project.id === id)?.budget || []);
  const view = (step, msg = '') => {
    if (step === 'pick') d.innerHTML = `<div class="scbox"><button class="ghost pvx" aria-label="${t('close')}">✕</button><h2>${t('scanT')}</h2><p class="sub">${t('scanS')}</p>
      <label class="primary bigcam">${camIco}<span>${t('scanPick')}</span><input type="file" accept="image/*" capture="environment" data-scf></label>
      <label class="btn2" style="justify-content:center;display:flex;margin-top:10px">${t('scanPick2')}<input type="file" accept="image/*,application/pdf" data-scf hidden></label></div>`;
    if (step === 'busy') d.innerHTML = `<div class="scbox"><h2>${t('scanT')}</h2>${preview ? `<img class="scprev" src="${preview}" alt="">` : ''}<p class="scbusy"><span class="spin"></span>${esc(msg)}</p></div>`;
    if (step === 'form') {
      const x = data || {}, sp = pid ?? '', bud = budOf(sp);
      d.innerHTML = `<form class="scbox scform" data-scsave><button type="button" class="ghost pvx" aria-label="${t('close')}">✕</button><h2>${t('scanReview')}</h2>
      ${x.source && x.confidence !== 'high' ? `<p class="hint warnbox">${t('scanLow')}</p>` : ''}${msg ? `<p class="hint warnbox">${esc(msg)}</p>` : ''}
      <div class="scgrid">${preview ? `<a class="scthumb" href="${preview}" target="_blank" rel="noopener"><img src="${preview}" alt=""></a>` : ''}<div>
      <label>${t('amt')} <i>*</i><input name="amount" type="number" step="any" inputmode="decimal" required value="${esc(x.total || '')}" ${inp}></label>
      <div class="grid2"><label>${t('date')}<input name="spent_on" type="date" value="${esc(x.date || S.today())}" ${inp}></label><label>${t('salesTax')}<input name="sales_tax" type="number" step="any" inputmode="decimal" value="${esc(x.sales_tax ?? '')}" ${inp}></label></div></div></div>
      <label>${t('vendor')}<input name="vendor" maxlength="120" value="${esc(x.vendor || '')}" ${inp}></label>
      <label>${t('descr')}<input name="description" maxlength="300" value="${esc(x.summary || '')}" ${inp}></label>
      <div class="grid2"><label>${t('project2')}<select name="project_id" ${inp}>${projOpts().map(([v, l]) => `<option value="${esc(v)}"${String(sp) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label>${t('budgetCat')}<select name="budget_id" ${inp}><option value="">${t('noCat')}</option>${bud.map(b => `<option value="${b.id}">${esc(b.category)}</option>`).join('')}</select></label>
      <label>${t('taxCat')}<select name="tax_cat" ${inp}>${taxOpts().map(([v, l]) => `<option value="${v}"${(x.tax_cat || 'materials') === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
      <label>${t('payMethod')}<select name="pay_method" ${inp}>${payOpts().map(([v, l]) => `<option value="${v}"${(x.pay_method || '') === v ? ' selected' : ''}>${esc(l)}${v === 'card' && x.card_last4 ? ' ••' + esc(x.card_last4) : ''}</option>`).join('')}</select></label></div>
      <label>${t('notes2')}<input name="notes" maxlength="1000" value="${esc(x.card_last4 ? '•••• ' + x.card_last4 : '')}" ${inp}></label>
      ${x.items && x.items.length ? `<details><summary>${t('scanItems')} (${x.items.length})</summary><ul class="scitems">${x.items.map(i => `<li><span>${esc(i.desc)}</span><b>${money(i.amount)}</b></li>`).join('')}</ul></details>` : ''}
      <div class="acts" style="margin-top:14px"><button class="primary" type="submit">${t('saveExpense')}</button><button class="btn2" type="button" data-scretry>${t('scanAgain')}</button></div></form>`;
      const ps = d.querySelector('[name=project_id]'), bs = d.querySelector('[name=budget_id]');
      ps.onchange = () => { bs.innerHTML = `<option value="">${t('noCat')}</option>` + budOf(ps.value).map(b => `<option value="${b.id}">${esc(b.category)}</option>`).join(''); guessBud(); };
      const guessBud = () => { const opts = budOf(ps.value), tc = d.querySelector('[name=tax_cat]').value, re = { materials: /materi/i, subcontract: /subcontr/i, wages: /mano|labor/i, permits: /permis|basura/i, disposal: /basura|dispos/i, equipment: /equip/i }[tc]; const m = re && opts.find(o => re.test(o.category)); if (m) bs.value = m.id; };
      d.querySelector('[name=tax_cat]').onchange = guessBud; guessBud();
      d.querySelector('[name=amount]').focus();
    }
  };
  const close = () => { d.remove(); removeEventListener('keydown', key); if (preview) URL.revokeObjectURL(preview); render(); };
  const key = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', key);
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('.pvx')) close(); if (e.target.closest('[data-scretry]')) { data = null; file = null; view('pick'); } });
  d.addEventListener('change', async e => {
    if (!e.target.matches('[data-scf]')) return;
    file = e.target.files[0]; if (!file) return;
    const isPdf = /pdf/i.test(file.type);
    preview = isPdf ? '' : URL.createObjectURL(file);
    if (isPdf) { data = {}; return view('form'); }
    view('busy', t('st_read'));
    try { data = await S.receipt.read(file, s => view('busy', t('st_' + s))); view('form'); }
    catch (er) { console.warn(er); data = {}; view('form', t('readFail')); }
  });
  d.addEventListener('submit', async e => {
    e.preventDefault(); const f = new FormData(e.target), btn = e.target.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = t('saving');
    const projectId = f.get('project_id') || null;
    let receipt = null;
    try {
      const blob = data && data.blob ? data.blob : /pdf/i.test(file.type) ? file : await S.compress(file);
      receipt = await API.upload('receipts', `${projectId || 'general'}/${S.uid()}.${/pdf/i.test(blob.type) ? 'pdf' : 'jpg'}`, blob);
      const scanned = data && data.source ? { source: data.source, vendor: data.vendor, total: data.total, date: data.date, items: (data.items || []).slice(0, 15) } : null;
      const row = await API.insert('expenses', { project_id: projectId, amount: +f.get('amount') || 0, spent_on: f.get('spent_on') || S.today(), sales_tax: +f.get('sales_tax') || 0, vendor: String(f.get('vendor') || '').trim(), description: String(f.get('description') || '').trim(), budget_id: projectId ? (f.get('budget_id') || null) : null, tax_cat: f.get('tax_cat'), pay_method: f.get('pay_method'), notes: String(f.get('notes') || '').trim(), receipt, scanned });
      const b = projectId && B.find(x => x.project.id === projectId); if (b) b.expenses.push(row);
      if (taxRows && String(row.spent_on).startsWith(String(taxYear))) taxRows.unshift(row);
      S.toast(t('scanSaved')); close();
    } catch (er) { if (receipt) API.removeFiles('receipts', [receipt]).catch(() => {}); fail(er); btn.disabled = false; btn.textContent = t('saveExpense'); }
  });
  view('pick'); document.body.appendChild(d); d.querySelector('.bigcam')?.focus();
}

/* ---------- eventos nuevos ---------- */
app.addEventListener('input', e => {
  if (e.target.id === 'hq') { q = e.target.value; clearTimeout(window._hq); window._hq = setTimeout(() => { const pos = e.target.selectionStart; render(); const n = $('#hq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 180); }
  if (e.target.id === 'rv-lines') { const ls = parseLines(e.target.value), s = ls.reduce((a, x) => a + x.amount, 0), h = $('#rv-parsed'); if (h) h.textContent = ls.length ? `${ls.length} ${t('parsedLines')} · ${money(s)}` : t('budgetLinesHint'); }
});
app.addEventListener('change', async e => {
  const n = e.target, d = n.dataset;
  if (n.id === 'taxyear') { taxYear = +n.value; return loadTax(); }
  if (n.id === 'taxmonth') { taxMonth = +n.value; return render(); }
  if (n.id === 'phfile') {
    const files = [...n.files]; if (!files.length) return;
    const tags = ($('#ph-tags').value || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    try { await uploadPhotos(files, { kind: $('#ph-kind').value, tags, caption: $('#ph-cap').value.trim(), shared: $('#ph-share').checked, geo: $('#ph-geo').checked }); S.toast(`${files.length} ${t('photosUp')}`); render(); } catch (x) { fail(x); render(); }
    return;
  }
  if (n.id === 'lg-files') { const c = $('#lgc'); if (c) c.textContent = n.files.length ? n.files.length + ' ' + t('photosSel') : ''; return; }
  if (d.crew) {
    const crew = new Set(cur.project.crew || []); n.checked ? crew.add(d.crew) : crew.delete(d.crew);
    if (await save('projects', cur.project.id, 'crew', [...crew])) render(); return;
  }
  if (d.tx) {
    const r = taxRows.find(x => x.id === d.tx); let v = n.value;
    const f = d.tf; if (f === 'amount') v = +v || 0; if (f === 'project_id' && !v) v = null; if (f === 'spent_on' && !v) return;
    const patch = { [f]: v }; if (f === 'project_id') patch.budget_id = null;
    try { Object.assign(r, await API.update('expenses', r.id, patch)); B.forEach(b => { b.expenses = b.expenses.filter(x => x.id !== r.id); }); const b = r.project_id && B.find(x => x.project.id === r.project_id); if (b) b.expenses.push(r); setDot(t('saved') + ' ✓'); if (f !== 'description' && f !== 'vendor') render(); } catch (x) { fail(x); }
  }
});
app.addEventListener('submit', async e => {
  const id = e.target.id; if (!['recvf', 'taskf', 'logf', 'invf'].includes(id)) return;
  const sb = e.target.querySelector('[type=submit]'); if (sb && sb.disabled) return; if (sb) sb.disabled = true;
  try {
    if (id === 'recvf') {
      const v = k => $('#rv-' + k).value.trim(), amount = +$('#rv-amount').value || 0;
      if (!v('company')) { $('#rv-company').setAttribute('aria-invalid', 'true'); return $('#rv-company').focus(); }
      if (!amount) { $('#rv-amount').setAttribute('aria-invalid', 'true'); return $('#rv-amount').focus(); }
      const svc = $('#rv-service').value, f = $('#rv-file').files[0];
      const p = await API.insert('projects', { title: v('title') || `${t('svc_' + svc)} · ${v('company')}`, client_name: v('owner') || v('company'), address: v('address'), service: svc, details: v('details'), source_company: v('company'), source_ref: v('ref'), received_on: v('date') || S.today(), contract_amount: amount, review_status: 'review', status: 'estimate_sent' });
      const nb = blank(p);
      nb.budget = await API.insertMany('budget', parseLines($('#rv-lines').value).map((x, i) => ({ ...x, project_id: p.id, sort: i })));
      if (f) { try { const blob = /pdf/i.test(f.type) ? f : await S.compress(f); const path = await API.upload('receipts', `${p.id}/budget-${S.uid()}.${/pdf/i.test(f.type) ? 'pdf' : 'jpg'}`, blob); Object.assign(p, await API.update('projects', p.id, { budget_file: path })); } catch (x) { fail(x); } }
      recv = false; B.unshift(nb); ctab = 'review'; return openProject(p.id);
    }
    if (id === 'invf') {
      const amount = +$('#iv-amt').value || 0; if (!amount) { $('#iv-amt').setAttribute('aria-invalid', 'true'); return $('#iv-amt').focus(); }
      { const L2 = invTotals(cur).left; if (amount > L2 + 0.5 && !confirm(t('invOverQ').replace('{a}', money(L2)))) return; }
      const issued = $('#iv-date').value || S.today(), due = new Date(Date.parse(issued) + (+$('#iv-terms').value) * 864e5).toISOString().slice(0, 10);
      const row = await API.insert('invoices', { project_id: cur.project.id, amount, bill_to: $('#iv-to').value.trim(), bill_email: $('#iv-email').value.trim(), issued_on: issued, due_on: due, note: $('#iv-note').value.trim() });
      (cur.invoices = cur.invoices || []).push(row); invForm = false; render(); S.toast(t('invMade').replace('{n}', row.number)); return;
    }
    if (id === 'taskf') {
      const title = $('#tk-title').value.trim(); if (!title) return $('#tk-title').focus();
      cur.tasks.push(await API.insert('tasks', { project_id: cur.project.id, title, assigned_to: staff() ? (cur.project.assigned_to || null) : me.user_id })); render(); $('#tk-title')?.focus();
    }
    if (id === 'logf') {
      const v = k => $('#lg-' + k).value.trim(), files = [...$('#lg-files').files];
      if (!v('work') && !v('issues') && !files.length) return $('#lg-work').focus();
      const photos = [];
      try { for (const f of files) photos.push(await API.upload('photos', `${cur.project.id}/${S.uid()}.jpg`, await S.compress(f)));
        cur.daily_logs.push(await API.insert('daily_logs', { project_id: cur.project.id, log_date: v('date') || S.today(), weather: v('weather'), crew: v('crew'), hours: +v('hours') || 0, work_done: v('work'), issues: v('issues'), next_steps: v('next'), photos, by_name: myName() }));
      } catch (x) { API.removeFiles('photos', photos).catch(() => {}); throw x; }
      render(); S.toast(t('logSaved'));
    }
  } catch (x) { fail(x); render(); }
  finally { if (sb) sb.disabled = false; }
});
app.addEventListener('click', async e => {
  const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
  try {
    if (d.taxm) { taxMonth = +d.taxm; render(); scrollTo(0, 0); return; }
    if ('pushon' in d) {
      if (!pushKeyV) pushKeyV = await API.pushKey().catch(() => null);
      if (!pushKeyV || !window.PWAKit) { S.toast(t('pushNo')); return; }
      const r = await PWAKit.subscribePush(pushKeyV, sub => API.savePush(sub, S.L));
      if (!r.ok && r.reason === 'denied') S.toast(t('pushDenied'));
      await pushRefresh(); render(); if (pushSt === 'on') S.toast(t('pushOn'));
      return;
    }
    if ('pushoff' in d) { const sub = await curSub(); if (sub) { await API.removePush(sub.endpoint).catch(() => {}); await sub.unsubscribe(); } await pushRefresh(); render(); return; }
    if ('pushtest' in d) { await API.pushTest(); S.toast(t('pushSent')); return; }
    if ('pushlater' in d) { try { localStorage.setItem('cplus-pushlater', '1'); } catch (_) {} render(); return; }
    if ('ioshint' in d) { window.PWAKit && PWAKit.showIOSHint(true); return; }
    if (d.dper) { dper = d.dper; render(); return; }
    if ('invnew' in d) { invForm = true; render(); $('#iv-amt')?.focus(); return; }
    if ('invcancel' in d) { invForm = false; render(); return; }
    if (d.invq) { const n = $('#iv-amt'); if (n) n.value = d.invq; return; }
    if (d.invpdf) { await invoicePdf(cur.invoices.find(x => x.id === d.invpdf)); return; }
    if (d.invsend) {
      const i = cur.invoices.find(x => x.id === d.invsend), r = await invoicePdf(i), p = cur.project;
      const subj = `${t('invMailSubj')} ${i.number} · ${p.title}`, body = t('invMailBody').replace('{to}', i.bill_to || '').replace('{n}', i.number).replace('{p}', p.title + (p.source_ref ? ' (' + p.source_ref + ')' : '')).replace('{a}', money(i.amount)).replace('{d}', fdate(i.due_on)).replace('{me}', (me && me.name) || settings.contact_name || 'C Plus');
      if (i.bill_email) location.href = `mailto:${encodeURIComponent(i.bill_email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      Object.assign(i, await API.update('invoices', i.id, { status: 'sent', sent_at: new Date().toISOString() })); render(); S.toast(t('invSentToast')); return;
    }
    if (d.invpaid) {
      const i = cur.invoices.find(x => x.id === d.invpaid);
      const pay = await API.insert('payments', { project_id: cur.project.id, paid_on: S.today(), amount: +i.amount, note: `${t('invoice')} ${i.number}${i.note ? ' · ' + i.note : ''}` });
      cur.payments.push(pay); Object.assign(i, await API.update('invoices', i.id, { status: 'paid', paid_on: S.today(), payment_id: pay.id })); render(); S.toast(t('invPaidToast')); return;
    }
    if (d.invvoid) { if (!confirm(t('invVoidQ'))) return; const i = cur.invoices.find(x => x.id === d.invvoid); Object.assign(i, await API.update('invoices', i.id, { status: 'void' })); render(); return; }
    if (d.invdel) { await API.remove('invoices', d.invdel); cur.invoices = cur.invoices.filter(x => x.id !== d.invdel); render(); return; }
    if (d.hv) { if (view !== 'home') { view = 'home'; cur = null; try { history.replaceState(null, '', location.pathname); } catch (_) {} } hview = d.hv; recv = false; if (hview === 'taxes' && !taxRows) return loadTax(); if (hview === 'dash' && !dashRows) return loadDash(); render(); scrollTo(0, 0); }
    else if ('recv' in d) { if (hview !== 'review' && hview !== 'projects') hview = 'review'; recv = true; render(); $('#recvf')?.scrollIntoView({ block: 'start' }); $('#rv-company')?.focus(); }
    else if ('cancelrecv' in d) { recv = false; render(); }
    else if (d.openrv) { ctab = 'review'; openProject(d.openrv); }
    else if ('scan' in d) scanner(d.scan === 'general' ? '' : (d.scan || (cur && view === 'project' ? cur.project.id : '')));
    else if (d.rvset) {
      if (d.rvset === 'approved') { const a = rvAnalysis(cur, cur.project), reds = a.flags.filter(x => x.lvl === 'red').length;
        if ((reds || a.lvl === 'red') && !confirm(t('rvaConfirm').replace('{p}', Math.round(a.pct)).replace('{n}', reds))) return; }
      const patch = { review_status: d.rvset, reviewed_by: myName(), reviewed_at: new Date().toISOString() };
      if (d.rvset === 'approved' && stOf(cur.project) === 'estimate_sent') patch.status = 'estimate_accepted';
      Object.assign(cur.project, await API.update('projects', cur.project.id, patch)); render(); S.toast(t('rv_' + d.rvset));
    }
    else if ('upbud' in d) { const f = $('#rcfile'); f.dataset.id = ''; f.dataset.bud = cur.project.id; f.value = ''; f.click(); }
    else if (d.pk) { pkind = d.pk; render(); }
    else if (d.ptag !== undefined) { ptag = ptag === d.ptag ? '' : d.ptag; render(); }
    else if (d.pv) photoViewer(d.pv);
    else if ('report' in d) { b.disabled = true; try { await photoReport(); } finally { b.disabled = false; } }
    else if (d.clk) {
      const it = cur.checklist_items.find(x => x.id === d.clk);
      if (!it.done && it.needs_photo && !it.photo) { clPending = it.id; const f = $('#clfile'); f.value = ''; f.click(); return S.toast(t('photoNeeded')); }
      const patch = it.done ? { done: false, done_by: null, done_at: null } : { done: true, done_by: myName(), done_at: new Date().toISOString() };
      Object.assign(it, await API.update('checklist_items', it.id, patch)); render();
    }
    else if (d.clphoto) { const it = cur.checklist_items.find(x => x.id === d.clphoto); Object.assign(it, await API.update('checklist_items', it.id, { needs_photo: !it.needs_photo })); render(); }
    else if (d.clitem) { const n = cur.checklist_items.filter(x => x.checklist_id === d.clitem).length; const row = await API.insert('checklist_items', { project_id: cur.project.id, checklist_id: d.clitem, body: '', sort: n }); cur.checklist_items.push(row); render(); document.querySelector(`[data-t="checklist_items"][data-id="${row.id}"]`)?.focus(); }
    else if ('newcl' in d) {
      const tp = templates.find(x => x.id === $('#cl-tpl').value);
      const cl = await API.insert('checklists', { project_id: cur.project.id, title: tp ? tp.name : t('newChecklist'), sort: cur.checklists.length });
      cur.checklists.push(cl);
      if (tp) cur.checklist_items.push(...await API.insertMany('checklist_items', (tp.items || []).map((x, i) => ({ project_id: cur.project.id, checklist_id: cl.id, body: x.body, needs_photo: !!x.needs_photo, sort: i }))));
      render(); if (!tp) document.querySelector(`[data-t="checklists"][data-id="${cl.id}"]`)?.focus();
    }
    else if (d.cltpl) {
      const cl = cur.checklists.find(x => x.id === d.cltpl), items = cur.checklist_items.filter(x => x.checklist_id === cl.id).sort((a, b) => (a.sort || 0) - (b.sort || 0)).map(x => ({ body: x.body, needs_photo: !!x.needs_photo }));
      const name = prompt(t('templates'), cl.title); if (!name) return;
      templates.push(await API.insert('templates', { name: name.slice(0, 80), items })); render(); S.toast(t('templateSaved'));
    }
    else if (d.deltpl) { await API.remove('templates', d.deltpl); templates = templates.filter(x => x.id !== d.deltpl); render(); }
    else if ('addgen' in d) { const r = await API.insert('expenses', { project_id: null, description: '', amount: 0, spent_on: S.today(), tax_cat: 'other' }); taxRows.unshift(r); render(); document.querySelector(`[data-tx="${r.id}"][data-tf="description"]`)?.focus(); }
    else if (d.deltx) { const r = taxRows.find(x => x.id === d.deltx); await API.remove('expenses', r.id); taxRows = taxRows.filter(x => x !== r); B.forEach(x => { x.expenses = x.expenses.filter(y => y.id !== r.id); }); render(); if (r.receipt) setTimeout(() => API.removeFiles('receipts', [r.receipt]).catch(() => {}), 4000); S.toast(t('removed')); }
    else if (d.rctx) { const f = $('#rcfile'); f.dataset.id = ''; f.dataset.tx = d.rctx; f.value = ''; f.click(); }
    else if ('csv' in d) taxCsv();
    else if ('zip' in d) { b.disabled = true; try { await taxZip(); } finally { b.disabled = false; } }
    else if ('taxpdf' in d) taxPdf();
  } catch (x) { fail(x); render(); }
});
/* foto que completa un punto del checklist */
const clfile = document.createElement('input'); clfile.type = 'file'; clfile.accept = 'image/*'; clfile.setAttribute('capture', 'environment'); clfile.id = 'clfile'; clfile.hidden = true; document.body.appendChild(clfile);
clfile.addEventListener('change', async () => {
  const f = clfile.files[0], it = cur && cur.checklist_items.find(x => x.id === clPending); if (!f || !it) return;
  try { setDot(t('uploading')); const path = await API.upload('photos', `${cur.project.id}/${S.uid()}.jpg`, await S.compress(f));
    Object.assign(it, await API.update('checklist_items', it.id, { photo: path, done: true, done_by: myName(), done_at: new Date().toISOString() })); setDot(t('saved') + ' ✓'); render(); }
  catch (x) { fail(x); }
});
/* recibo para un gasto de la lista de taxes, o el budget recibido de un proyecto */
$('#rcfile').addEventListener('change', async e => {
  const f = e.target.files[0], tx = e.target.dataset.tx, bud = e.target.dataset.bud; e.target.dataset.tx = ''; e.target.dataset.bud = '';
  if (!f || (!tx && !bud)) return;
  try {
    setDot(t('uploading')); const blob = /pdf/i.test(f.type) ? f : await S.compress(f), ext = /pdf/i.test(blob.type) ? 'pdf' : 'jpg';
    if (tx) { const r = taxRows.find(x => x.id === tx); const path = await API.upload('receipts', `${r.project_id || 'general'}/${S.uid()}.${ext}`, blob); Object.assign(r, await API.update('expenses', r.id, { receipt: path })); }
    if (bud) { const path = await API.upload('receipts', `${bud}/budget-${S.uid()}.${ext}`, blob); const old = cur.project.budget_file; Object.assign(cur.project, await API.update('projects', bud, { budget_file: path })); if (old) API.removeFiles('receipts', [old]).catch(() => {}); }
    setDot(t('saved') + ' ✓'); render();
  } catch (x) { fail(x); }
}, true);

/* chart tooltip */
const tipAt = e => { const h = e.target.closest && e.target.closest('[data-tip]'), wrap = e.target.closest && e.target.closest('.chartwrap'); if (!wrap) return; const tip = wrap.querySelector('.ctip');
  wrap.querySelectorAll('.hit.on').forEach(x => x !== h && x.classList.remove('on'));
  if (!h) { tip.hidden = true; return; } h.classList.add('on'); tip.innerHTML = h.dataset.tip; tip.hidden = false;
  const r = wrap.getBoundingClientRect(), hr = h.getBoundingClientRect(), tw = tip.offsetWidth;
  tip.style.left = Math.max(4, Math.min(r.width - tw - 4, hr.left - r.left + hr.width / 2 - tw / 2)) + 'px'; tip.style.top = '4px'; };
document.addEventListener('pointermove', tipAt); document.addEventListener('pointerdown', tipAt);
document.addEventListener('pointerleave', e => { if (e.target.classList && e.target.classList.contains('chartwrap')) { const t2 = e.target.querySelector('.ctip'); if (t2) t2.hidden = true; } }, true);

/* ---------- start ---------- */
(async function boot() {
  if (!API.ready) { view = 'setup'; return render(); }
  API.onAuth && API.onAuth(s => { if (!s && view !== 'login' && view !== 'boot') { view = 'login'; render(); } });
  try {
    const s = await API.session();
    if (!s) { view = 'login'; return render(); }
    await loadAll(); view = 'home'; if (isAdmin() && hview === 'projects') { hview = 'dash'; loadDash(); }
    pushRefresh().then(() => { if (view === 'home') render(); });
    const h = location.hash.slice(1); if (h && B.some(b => b.project.id === h)) return openProject(h);
    render();
  } catch (x) { if (x.noaccess) view = 'noaccess'; else { err = x.message; view = 'login'; } render(); }
})();
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState !== 'visible' || view !== 'home') return;
  try { await loadAll(); render(); } catch (_) {}
});
}
