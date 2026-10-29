/* =========================================================
   PROJET TOJI — Application
   Tout est stocké sur ton téléphone (localStorage + IndexedDB).
   ========================================================= */
'use strict';

const STORE_KEY = 'projetToji.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
class UserError extends Error {}

/* ---------- Dates ---------- */
const pad = (n) => String(n).padStart(2, '0');
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const dow = (k) => (fromKey(k).getDay() + 6) % 7; // 0 = lundi
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);
const today = () => dkey();
const mondayOf = (k) => addDays(k, -dow(k));
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
function dayLabel(k) {
  const t = today();
  if (k === t) return 'Aujourd\'hui';
  if (k === addDays(t, -1)) return 'Hier';
  return fromKey(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
}

/* ---------- État ---------- */
const DEFAULTS = () => ({
  v: 2,
  profile: { name: '', height: 183, start: 68, target: 86, avatar: null, age: 18, act: 1.4 },
  goals: { mode: 'auto', surplus: 400, kcal: 3100, p: 130, c: 440, f: 90 },
  ai: { key: '', model: 'auto', models: null },
  prefs: { sound: true, voice: true },
  food: {}, weights: [], train: {}, loads: {}, celebrated: {}, milestones: {}, extra: {},
  recents: [], boxStart: dkey(), created: dkey(), welcomed: false,
  swaps: {}, grow: { heights: [], parents: { f: null, m: null }, log: {} },
});
function merge(base, extra) {
  for (const k in extra) {
    if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) merge(base[k], extra[k]);
    else base[k] = extra[k];
  }
  return base;
}
// Version 1 : une série = 1 (cochée). Version 2 : une série = { kg, reps }
function migrate(s) {
  if ((s.v || 1) < 2) {
    for (const d in s.train || {}) {
      const tr = s.train[d];
      for (const id in tr.sets || {}) tr.sets[id] = (tr.sets[id] || []).map((x) => (x && typeof x === 'object' ? x : x ? { kg: tr.loads?.[id] ?? null, reps: null } : null));
    }
    s.v = 2;
  }
  return s;
}
function loadState() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return merge(DEFAULTS(), migrate(JSON.parse(raw))); } catch (e) { console.warn(e); }
  return DEFAULTS();
}
let S = loadState();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('Mémoire pleine. Exporte une sauvegarde dans Réglages.'); }
}
// Les miniatures de plus de 14 jours sont supprimées pour garder de la place
(function prune() {
  const lim = addDays(today(), -14);
  for (const d in S.food) if (d < lim) S.food[d].forEach((e) => { delete e.thumb; });
})();

const UI = { tab: 'home', foodDay: today(), trainDay: dow(today()), heroPlayed: false, progTab: 'poids', draft: {} };

/* ---------- Icônes ---------- */
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/>',
  food: '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 21V3c-2.5 1.5-3.5 4-3.5 8h3.5"/>',
  lift: '<path d="M6.5 6v12M3.5 9v6M17.5 6v12M20.5 9v6M6.5 12h11"/>',
  glove: '<path d="M8 13V8a5 5 0 0 1 5-5h1a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H9.5"/><path d="M8 13H6a2 2 0 0 0 0 4h2M8 17v4h8v-4"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 9.5a5 5 0 0 1 8 0M12 9.5l1.5-2"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  barcode: '<path d="M4 5v14M7.5 5v14M10 5v14M13.5 5v14M16 5v14M20 5v14"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  swap: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>', undo: '<path d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2"/>', ruler: '<path d="M7 3v18M7 3h5M7 7h3M7 11h5M7 15h3M7 19h5M17 6l3 3-3 3M17 18l3-3"/>',
  play: '<path d="M7 5v14l12-7z" fill="currentColor"/>', up: '<path d="M12 19V5M5 12l7-7 7 7"/>', chart: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', flame: '<path d="M12 21c4 0 7-2.7 7-6.6 0-3.4-2.4-5.6-4-7.4-.3 2-1.4 3.3-2.6 3.8C12.6 7.4 11 4.6 8.6 3c.4 3-1.5 5-2.9 7A6.8 6.8 0 0 0 5 14.4C5 18.3 8 21 12 21z"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;
const EMBLEM = `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#000"/><circle cx="50" cy="50" r="37" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="196 37" stroke-linecap="round" transform="rotate(-62 50 50)"/><circle cx="50" cy="50" r="37" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="14 219" transform="rotate(-100 50 50)"/><text x="50" y="66" text-anchor="middle" font-family="Dela, sans-serif" font-size="44" fill="#fff">T</text></svg>`;

/* ---------- Calculs ---------- */
function dayTotals(d) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0 };
  (S.food[d] || []).forEach((e) => { for (const k in t) t[k] += num(e[k]); });
  return t;
}
function sortedWeights() { return [...S.weights].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)); }
function currentWeight() { const w = sortedWeights(); return w.length ? w[w.length - 1].kg : S.profile.start; }
function projectPct(w = currentWeight()) {
  const { start, target } = S.profile;
  if (target === start) return 0;
  return clamp(((w - start) / (target - start)) * 100, 0, 100);
}
function dayPlan(i) { return WEEK[i]; }
function trainOf(k) { const tr = S.train[k] || (S.train[k] = { sets: {}, tasks: {} }); tr.sets = tr.sets || {}; tr.tasks = tr.tasks || {}; tr.n = tr.n || {}; return tr; }
// Exercice réellement fait sur un créneau du programme (bouton « Changer »)
function effId(k, slot) {
  const tr = S.train[k];
  if (tr?.swap?.[slot]) return tr.swap[slot];
  if ((tr?.sets?.[slot] || []).some(isSet) || k < today()) return slot;
  return S.swaps?.[slot] || slot;
}
function liftsOf(k, i = dow(k)) { return dayPlan(i).lifts.map((slot) => ({ slot, id: effId(k, slot) })); }
function swapOptions(k, slot) {
  const used = liftsOf(k).map((x) => baseOf(x.id)); const cur = effId(k, slot);
  return [slot, ...(EX_ALT[slot] || [])].filter((id, j, a) => EX[id] && a.indexOf(id) === j && id !== cur && (id === slot || !used.includes(baseOf(id))));
}
// Kuro les jours de repos : il mange un jour, il chill le suivant
function restPose(k) { return fromKey(k).getDate() % 2 ? 'chill' : 'eat'; }
function liftProgress(k, i = dow(k)) {
  const plan = dayPlan(i); const tr = S.train[k] || { sets: {}, tasks: {} };
  let total = 0, done = 0;
  liftsOf(k, i).forEach(({ id }) => { const e = exInfo(id); const n = nRows(tr, id, e); total += n; done += Math.min(n, (tr.sets?.[id] || []).filter(isSet).length); });
  [...plan.before, ...plan.after].forEach((id) => { total += 1; done += tr.tasks?.[id] ? 1 : 0; });
  return { total, done, f: total ? done / total : 0 };
}
function isDone(k) {
  const tr = S.train[k]; if (!tr) return false;
  if (tr.done) return true;
  const plan = dayPlan(dow(k));
  if (plan.rest) { const all = [...plan.before, ...plan.after]; return all.length > 0 && all.filter((id) => !TASKS[id].preset || TASKS[id].preset !== 'light').every((id) => tr.tasks?.[id]); }
  return false;
}
function streak() {
  let k = today(); if (!isDone(k)) k = addDays(k, -1);
  let n = 0;
  for (let i = 0; i < 500 && k >= S.created; i++) {
    const plan = dayPlan(dow(k));
    if (plan.rest) { if (isDone(k)) n++; k = addDays(k, -1); continue; }
    if (isDone(k)) { n++; k = addDays(k, -1); } else break;
  }
  return n;
}
function quoteOfDay() { return QUOTES[(daysBetween('2026-01-01', today()) % QUOTES.length + QUOTES.length) % QUOTES.length]; }
function boxWeek() { return Math.max(1, Math.floor(daysBetween(S.boxStart, today()) / 7) + 1); }

/* ---------- Petits composants ---------- */
function letters(text, base = 0, step = 0.045) {
  let i = 0;
  return text.split(' ').map((w) => `<span style="white-space:nowrap">${[...w].map((c) => `<span class="ch" style="animation-delay:${(base + step * i++).toFixed(3)}s">${esc(c)}</span>`).join('')}</span>`).join(' ');
}
function ring(d, size = 'big') {
  const tot = dayTotals(d); const g = goalsFor(d).kcal || 1; const r = 52; const C = 2 * Math.PI * r;
  const ratio = tot.kcal / g; const left = g - tot.kcal;
  return `<div class="ring ${ratio >= 1 ? 'done' : ''}">
    <svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="${r}"/>
    <circle class="bar" cx="60" cy="60" r="${r}" stroke-dasharray="${C.toFixed(1)}" data-rid="ring-${size}" data-off="${(C * (1 - clamp(ratio, 0, 1))).toFixed(1)}" style="stroke-dashoffset:${C.toFixed(1)}"/></svg>
    <div class="ring-center"><b class="num">${fmt(Math.abs(left))}</b><span>${left >= 0 ? 'kcal restantes' : 'kcal au-dessus'}</span></div></div>`;
}
function macroBars(d) {
  const t = dayTotals(d); const g = goalsFor(d);
  const row = (key, label, unit = 'g') => {
    const f = clamp(t[key] / (g[key] || 1), 0, 1);
    return `<div class="macro ${f >= 1 ? 'done' : ''}"><div class="macro-top"><b>${label}</b><span class="num"><em>${fmt((t[key] / (g[key] || 1)) * 100)} %</em></span></div>
      <div class="bar-track"><div class="bar-fill" data-fid="m-${key}" data-f="${f}"></div></div><div class="macro-sub num">${fmt(t[key])} / ${fmt(g[key])} ${unit}</div></div>`;
  };
  return row('p', 'Protéines') + row('c', 'Glucides') + row('f', 'Lipides');
}
function nutriPanel(d) {
  const t = dayTotals(d); const g = goalsFor(d); const b = dayBurn(d);
  const line = g.auto
    ? `Objectif = <b class="num">${fmt(b.total)}</b> kcal dépensées${b.planned ? ' (estimation avec ta séance prévue)' : ''} + <b class="num">${fmt(S.goals.surplus)}</b> de surplus.`
    : `Tu dépenses environ <b class="num">${fmt(b.total)}</b> kcal ${d === today() ? 'aujourd\'hui' : 'ce jour-là'}.`;
  return `<section class="panel"><div class="panel-title"><h2>Nutrition</h2><span class="muted small num">${fmt(t.kcal)} / ${fmt(g.kcal)} kcal · ${fmt((t.kcal / (g.kcal || 1)) * 100)} %</span></div>
    <div class="nutri">${ring(d)}<div>${macroBars(d)}</div></div>
    <button class="burnline" data-act="tab" data-tab="weight" data-sub="cal"><span>${line}</span>${icon('right')}</button></section>`;
}

/* ---------- Vues ---------- */
function vHome() {
  const t = today(); const w = currentWeight(); const pct = projectPct(w);
  const plan = dayPlan(dow(t)); const prog = liftProgress(t); const tr = S.train[t];
  const anim = !UI.heroPlayed; UI.heroPlayed = true;
  const hero = `<div class="hero">
      <span class="l1">${anim ? letters('0% talent', 0.1) : '0% talent'}</span>
      <span class="l2">${anim ? letters('100% hard work', 0.55) : '100% hard work'}</span>
      <div class="quote">${esc(quoteOfDay())}</div></div>`;

  const blocks = Array.from({ length: 10 }, (_, i) => {
    const f = clamp((pct - i * 10) / 10, 0, 1);
    return `<i class="${f >= 1 ? 'full' : f > 0 ? 'part' : ''}" data-fid="g${i}" data-f="${f}" style="--d:${(i * 0.07).toFixed(2)}s"></i>`;
  }).join('');
  const gauge = `<section class="panel strong toned">
      <div class="gauge-head"><div class="gauge-pct num">${fmt(pct)}<small>%</small></div>
      <div class="gauge-meta"><b class="num">${fmt(w, 1)} kg</b><br>objectif ${fmt(S.profile.target)} kg</div></div>
      <div class="gauge">${blocks}</div>
      <div class="gauge-scale"><span class="num">${fmt(S.profile.start)} kg</span><span>Projet Toji</span><span class="num">${fmt(S.profile.target)} kg</span></div></section>`;

  let session;
  if (plan.rest) {
    const tasks = [...plan.before, ...plan.after];
    session = `<section class="panel strong cut"><span class="muted small">Aujourd'hui, ${plan.day.toLowerCase()}</span>
      <div class="today-title">Rest Day</div><div class="today-sub">Mange, dors, récupère. Au programme : ${tasks.map((id) => esc(TASKS[id].name)).join(', ')}</div>
      <div style="margin-top:14px"><button class="btn btn-ghost btn-block" data-act="tab" data-tab="train">Voir la journée</button></div></section>`;
  } else {
    const done = tr?.done;
    session = `<section class="panel strong cut"><span class="muted small">Aujourd'hui, ${plan.day.toLowerCase()}</span>
      <div class="today-title">${esc(plan.title)}</div>
      <div class="today-sub">${plan.lifts.length} exercices${plan.before.length + plan.after.length ? ' + ' + [...plan.before, ...plan.after].map((id) => esc(TASKS[id].name.toLowerCase())).join(', ') : ''}</div>
      <div class="progress-line" style="margin:14px 0 14px"><i data-fid="home-prog" data-f="${prog.f}"></i></div>
      <button class="btn ${done ? 'btn-ghost' : 'btn-primary'} btn-block" data-act="tab" data-tab="train">${done ? icon('check') + ' Séance terminée' : prog.done ? 'Continuer la séance' : 'Commencer la séance'}</button></section>`;
  }

  const mon = mondayOf(t);
  const week = WEEK.map((p, i) => {
    const k = addDays(mon, i);
    const cls = [isDone(k) ? 'done' : '', p.rest ? 'rest' : '', k === t ? 'today' : '', (!p.rest && k < t && k >= S.created && !isDone(k)) ? 'miss' : ''].join(' ');
    return `<div class="wd ${cls}">${DAYS_SHORT[i]}<i>${isDone(k) ? icon('check').replace('stroke-width="1.9"', 'stroke-width="3" width="16" height="16"') : p.rest ? '' : esc(p.short || p.title.split(' ')[0].slice(0, 4))}</i></div>`;
  }).join('');
  const st = streak();
  const weekPanel = `<section class="panel"><div class="panel-title"><h2>Cette semaine</h2></div><div class="week">${week}</div>
    <div class="streak"><b class="num">${st}</b><span class="muted">${st > 1 ? 'jours d\'affilée sans lâcher' : st === 1 ? 'jour, la série commence' : 'Lance ta série aujourd\'hui'}</span></div></section>`;

  const lastW = sortedWeights().slice(-1)[0];
  const weigh = (!lastW || daysBetween(lastW.d, t) >= 7) ? `<section class="panel"><div class="panel-title"><h2>Pesée de la semaine</h2></div>
    <p class="muted small" style="margin:0 0 12px">Le matin, à jeun, après les toilettes. C'est ce qui fait avancer la jauge.</p>
    <button class="btn btn-ghost btn-block" data-act="tab" data-tab="weight" data-sub="poids">Me peser</button></section>` : '';

  const mDone = tr?.done; const dPlan = plan.rest ? (restPose(t) === 'eat' ? 'Rest day. Mange comme un guerrier : c\'est aujourd\'hui que le muscle pousse.' : 'Rest day. Chill, dors bien, récupère. Demain on repart.') : mDone ? 'Séance terminée. Mange, dors, recommence.' : prog.done ? 'Continue. Une série de plus.' : `${plan.title} aujourd\'hui. Pas d\'excuses.`;
  const mascot = `<section class="panel mascot" data-act="hero-tap"><div class="k-slot">${heroSVG(plan.rest ? restPose(t) : mDone ? 'flex' : 'idle', { crop: 'upper' })}</div>
      <div><div class="nm">Kuro</div><div class="say">${esc(dPlan)}</div><div class="tap-h">Touche-le</div></div></section>`;
  return hero + mascot + gauge + session + nutriPanel(t) + weigh + weekPanel + yearsPanel();
}

/* ---------- Tes années : un carré par jour, une ligne par année ---------- */
function dayLevel(k) {
  const tr = S.train[k] || {};
  if (tr.done || isDone(k) || Object.values(tr.sets || {}).some((a) => (a || []).some(isSet))) return 2;
  if (Object.values(tr.tasks || {}).some(Boolean) || (S.extra[k] || []).length || Object.values(S.grow.log[k] || {}).some(Boolean)) return 1;
  return 0;
}
function yearsPanel() {
  const t = today(); const first = [S.created, ...Object.keys(S.train), ...Object.keys(S.extra)].sort()[0] || t;
  const y0 = +first.slice(0, 4), y1 = +t.slice(0, 4); let html = '';
  for (let y = y1; y >= y0; y--) {
    const jan1 = `${y}-01-01`; const start = mondayOf(jan1); let cells = '', n = 0;
    for (let k = start, j = 0; j < 371; j++, k = addDays(k, 1)) {
      if (k.slice(0, 4) !== String(y)) { cells += '<i class="o"></i>'; continue; }
      const l = k > t || k < first ? -1 : dayLevel(k); if (l === 2) n++;
      cells += `<i class="${l === 2 ? 'l2' : l === 1 ? 'l1' : l < 0 ? 'f' : ''}${k === t ? ' t' : ''}"></i>`;
    }
    html += `<div class="yr"><div class="yr-h"><b class="num">${y}</b><span class="muted small">${n} jour${n > 1 ? 's' : ''} d'entraînement</span></div><div class="yr-g">${cells}</div></div>`;
  }
  return `<section class="panel yr-panel" data-act="years-open" role="button" aria-label="Voir tes années en détail"><div class="panel-title"><h2>Tes années</h2><span class="muted small">1 carré = 1 jour</span></div>${html}
    <div class="yr-leg"><span><i class="l2"></i>Séance</span><span><i class="l1"></i>Activité</span><span><i></i>Rien</span><span class="yr-more">Détail ${icon('right')}</span></div></section>`;
}
function yearsFirst() { return [S.created, ...Object.keys(S.train), ...Object.keys(S.extra)].sort()[0] || today(); }
// Vue détaillée : 12 mois, un carré par jour (semaine du lundi au dimanche), plein écran
const MONTHS_FR = ['JANV', 'FÉVR', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];
function yearsView(y) {
  const t = today(); const first = yearsFirst(); const curM = +t.slice(5, 7); const curY = +t.slice(0, 4);
  let total = 0, best = { n: -1, m: 0 };
  const months = MONTHS_FR.map((name, mi) => {
    const m = mi + 1; const mm = String(m).padStart(2, '0'); const days = new Date(y, m, 0).getDate();
    const lead = (new Date(y, mi, 1).getDay() + 6) % 7; let cells = '<i class="o"></i>'.repeat(lead), n = 0;
    for (let d = 1; d <= days; d++) {
      const k = `${y}-${mm}-${String(d).padStart(2, '0')}`; const l = k > t || k < first ? -1 : dayLevel(k); if (l === 2) n++;
      cells += `<i class="${l === 2 ? 'l2' : l === 1 ? 'l1' : l < 0 ? 'f' : ''}${k === t ? ' t' : ''}" data-d="${k}" style="--i:${d}"></i>`;
    }
    total += n; if (n > best.n) best = { n, m: mi };
    const now = y === curY && m === curM; const fut = y > curY || (y === curY && m > curM);
    return `<div class="ym ${now ? 'now' : ''} ${fut ? 'fut' : ''}"><div class="ym-h"><b>${name}</b><span class="num">${n}</span></div><div class="ym-g">${cells}</div></div>`;
  }).join('');
  const y0 = +first.slice(0, 4);
  const sessions = Object.keys(S.train).filter((k) => k.startsWith(String(y)) && dayLevel(k) === 2).length;
  return `<div class="yv-top"><button class="icon-btn" data-yv="close" aria-label="Fermer">${icon('left')}</button><span>Tes années</span><span></span></div>
    <div class="yv-card">
      <div class="yv-head"><div class="yv-year"><button data-yv="prev" ${y <= y0 ? 'disabled' : ''} aria-label="Année précédente">${icon('left')}</button><b class="num">${y}</b><button data-yv="next" ${y >= curY ? 'disabled' : ''} aria-label="Année suivante">${icon('right')}</button></div><b class="yv-total num">${total}</b></div>
      <p class="yv-sub">Un carré par jour, allumé les jours où tu t'es entraîné.</p>
      <div class="ym-grid">${months}</div>
      <div class="yv-stats"><div><b class="num">${streak()}</b><span>jours d'affilée</span></div><div><b class="num">${total ? MONTHS_FR[best.m] : '–'}</b><span>meilleur mois</span></div><div><b class="num">${sessions}</b><span>séances notées</span></div></div>
    </div>
    <div class="yr-leg yv-leg"><span><i class="l2"></i>Séance</span><span><i class="l1"></i>Activité</span><span><i></i>Rien</span></div>
    <p class="yv-tip">Touche un carré pour voir ce que tu as fait ce jour-là.</p>`;
}
function dayWhat(k) {
  const tr = S.train[k] || {}; const plan = dayPlan(dow(k)); const bits = [];
  const sets = Object.values(tr.sets || {}).reduce((a, x) => a + (x || []).filter(isSet).length, 0);
  if (tr.done || sets) bits.push(`${plan.rest ? 'Séance' : plan.title}${sets ? `, ${sets} série${sets > 1 ? 's' : ''}` : ''}`);
  const tasks = Object.keys(tr.tasks || {}).filter((id) => tr.tasks[id] && TASKS[id]).map((id) => TASKS[id].name.toLowerCase());
  if (tasks.length) bits.push(tasks.join(', '));
  (S.extra[k] || []).forEach((x) => bits.push(x.name.toLowerCase()));
  if (Object.keys(S.grow.log[k] || {}).some((id) => id !== 'sprint')) bits.push('routine posture');
  return bits.length ? bits.join(' · ') : 'Rien de noté';
}
function openYears(y = +today().slice(0, 4)) {
  closeSheet(true);
  let el = $('.yv'); if (!el) { el = document.createElement('div'); el.className = 'yv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Tes années'); document.body.appendChild(el); }
  el.dataset.y = y; el.innerHTML = yearsView(y); el.scrollTop = 0;
  requestAnimationFrame(() => el.classList.add('on'));
  document.documentElement.style.overflow = 'hidden'; haptic(10);
  el.onclick = (ev) => {
    const b = ev.target.closest('[data-yv]');
    if (b) {
      if (b.dataset.yv === 'close') { el.classList.remove('on'); document.documentElement.style.overflow = ''; setTimeout(() => el.remove(), 420); return; }
      const ny = +el.dataset.y + (b.dataset.yv === 'prev' ? -1 : 1); el.dataset.y = ny; el.innerHTML = yearsView(ny); haptic(8); return;
    }
    const c = ev.target.closest('.ym-g i[data-d]');
    if (c) { const k = c.dataset.d; if (k > today()) return; $$('.ym-g i.sel', el).forEach((x) => x.classList.remove('sel')); c.classList.add('sel'); toast(`${fromKey(k).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} : ${dayWhat(k)}`); haptic(6); }
  };
}

function vFood() {
  const d = UI.foodDay; const t = today(); const list = [...(S.food[d] || [])].sort((a, b) => b.t - a.t);
  const nav = `<div class="date-nav"><button class="icon-btn" data-act="food-day" data-n="-1" aria-label="Jour précédent">${icon('left')}</button>
    <b>${esc(dayLabel(d))}</b>
    <button class="icon-btn" data-act="food-day" data-n="1" aria-label="Jour suivant" ${d >= t ? 'disabled style="opacity:.3"' : ''}>${icon('right')}</button></div>`;
  const actions = `<div class="actions">
    <button class="action main" data-act="add-photo">${icon('camera')}<div><b>Photographier mon repas</b><br><span>L'IA calcule calories et macros</span></div></button>
    <button class="action" data-act="add-barcode">${icon('barcode')}<b>Code-barres</b><span>Produits emballés</span></button>
    <button class="action" data-act="add-text">${icon('pen')}<b>Décrire</b><span>« 200 g de riz, 1 steak »</span></button>
    <button class="action" data-act="add-manual" style="grid-column:span 2;min-height:0;flex-direction:row;align-items:center">${icon('plus')}<b>Saisie manuelle</b></button></div>`;
  const rec = S.recents.length ? `<div class="block-label">Rajouter vite</div><div class="chips" style="margin-bottom:16px">${S.recents.map((r, i) => `<button class="chip" data-act="recent" data-i="${i}">${esc(r.name)} <span class="muted num">${fmt(r.kcal)}</span></button>`).join('')}</div>` : '';
  const entries = list.length ? list.map((e) => `<button class="entry" style="width:100%;text-align:left" data-act="entry" data-id="${e.id}">
      <div class="thumb">${e.thumb ? `<img src="${e.thumb}" alt="">` : e.img ? `<img src="${esc(e.img)}" alt="" loading="lazy">` : icon(e.src === 'barcode' ? 'barcode' : e.src === 'photo' ? 'camera' : 'food')}</div>
      <div><div class="entry-name">${esc(e.name)}</div><div class="entry-macros num">P ${fmt(e.p)} g, G ${fmt(e.c)} g, L ${fmt(e.f)} g</div></div>
      <div class="entry-kcal num">${fmt(e.kcal)}<span>kcal</span></div></button>`).join('')
    : `<div class="empty">Rien pour l'instant. Photographie ton premier repas.</div>`;
  return nav + nutriPanel(d) + actions + rec + `<section class="panel"><div class="panel-title"><h2>Journal</h2><span class="muted small">${list.length} ${list.length > 1 ? 'entrées' : 'entrée'}</span></div>${entries}</section>`;
}

function vTrain() {
  const i = UI.trainDay; const k = addDays(mondayOf(today()), i); const plan = dayPlan(i); const tr = S.train[k] || { sets: {}, tasks: {}, n: {} };
  const days = WEEK.map((p, j) => `<button class="${j === i ? 'on' : ''} ${j === dow(today()) ? 'today' : ''}" data-act="train-day" data-i="${j}"><b>${DAYS_SHORT[j]}</b>${esc(p.rest ? 'Rest' : p.title.split(' ')[0])}</button>`).join('');
  const prog = liftProgress(k, i);
  const head = `<div class="day-head has-fig"><div class="day-fig" data-act="hero-tap">${heroSVG(plan.rest ? restPose(k) : 'curl', { crop: 'upper', sparks: 5 })}</div><h1 class="${plan.title.length > 12 ? 'long' : ''}">${esc(plan.title)}</h1><p>${esc(plan.day)}${k === today() ? ', aujourd\'hui' : ''}. ${plan.rest ? 'Pas de salle. Mange, dors, récupère : le muscle se construit aujourd\'hui.' : `${plan.lifts.length} exercices, 3 séries, la dernière proche de l'échec.`}</p></div>
    <div class="progress-line"><i data-fid="train-prog" data-f="${prog.f}"></i></div>`;

  const taskCard = (id) => {
    const t = TASKS[id]; const done = tr.tasks?.[id];
    return `<div class="task ${done ? 'done' : ''}"><button class="check" data-act="task" data-id="${id}" data-k="${k}" aria-label="Cocher ${esc(t.name)}">${icon('check')}</button>
      <div style="flex:1"><b>${esc(t.name)}</b><span>${esc(t.detail)}</span>${t.preset ? `<br><button class="go" data-act="box-start" data-preset="${t.preset}">Lancer le minuteur de rounds</button>` : ''}</div></div>`;
  };
  const exCard = ({ id, slot }, idx) => {
    const e = exInfo(id); const rr = repRange(e); const arr = tr.sets?.[id] || []; const n = nRows(tr, id, e);
    const done = arr.filter(isSet).length >= e.sets;
    const prev = prevSession(id, k); const sug = suggestion(id, k); const pr = prIndex(id, k);
    const img = IMG_CACHE[id] || (e.ref && IMG_CACHE[e.ref]);
    const fig = img ? `<img src="${img}" alt="">` : bodySVG(bestView(e.p), e.p, e.s, { crop: bestCrop(e.p) });
    const unit = rr.sec ? 's' : 'reps';
    const rows = Array.from({ length: n }, (_, s) => {
      const rec = isSet(arr[s]) ? arr[s] : null; const ph = prefill(id, k, s); const dr = UI.draft[`${k}|${id}|${s}`] || {};
      const p = prev && isSet(prev.arr[s]) ? prev.arr[s] : null;
      const kgVal = rec ? (rec.kg != null ? fmtKg(rec.kg) : '') : (dr.kg ?? '');
      const rpVal = rec ? (rec.reps ?? '') : (dr.reps ?? '');
      const attrs = `data-id="${id}" data-s="${s}" data-k="${k}"`;
      return `<div class="log-r ${rec ? 'on' : ''} ${s === pr ? 'pr' : ''}" data-row="${s}">
        <span class="log-n">${s + 1}</span>
        <span class="log-prev num">${s === pr ? '<em>Record</em>' : p ? esc(setTxt(p, e)) : '–'}</span>
        <input class="log-in num" data-f="kg" ${attrs} inputmode="decimal" enterkeyhint="next" autocomplete="off" value="${esc(kgVal)}" placeholder="${ph.kg != null ? fmtKg(ph.kg) : e.bw ? 'PDC' : 'kg'}" aria-label="Série ${s + 1} : poids en kg">
        <input class="log-in num" data-f="reps" ${attrs} inputmode="numeric" enterkeyhint="done" autocomplete="off" value="${esc(rpVal)}" placeholder="${ph.reps}" aria-label="Série ${s + 1} : ${rr.sec ? 'secondes' : 'répétitions'}">
        <button class="log-ok" data-act="set" ${attrs} aria-label="Valider la série ${s + 1}">${icon('check')}</button></div>`;
    }).join('');
    const extra = n > e.sets && !isSet(arr[n - 1]);
    return `<article class="ex ${done ? 'done' : ''}" id="ex-${id}">
      <div class="ex-head"><button class="ex-fig" data-act="ex-info" data-id="${id}" aria-label="Technique ${esc(e.name)}">${fig}</button>
      <div><div class="ex-name">${esc(e.name)}<small class="num">${n} × ${esc(e.reps)}</small></div>
      ${id !== slot ? `<div class="ex-swapped">${icon('swap')}<span>À la place de ${esc(exInfo(slot).name)}</span></div>` : ''}
      <div class="ex-meta">${e.p.map((m) => MUSCLE_NAMES[m]).join(', ')}. Repos ${e.rest >= 120 ? '2 min' : '1 min'}.</div>
      ${sug && !done ? `<div class="ex-sug">${icon('up')}<span>Haut des reps atteint la dernière fois : passe à <b class="num">${fmtKg(sug.kg)} kg</b>.</span></div>` : ''}
      ${idx === 0 ? '<div class="ex-warm">Échauffement : 1 à 2 séries légères avant</div>' : ''}</div></div>
      <div class="log"><div class="log-h"><span></span><span>Dernière fois</span><span>kg</span><span>${unit}</span><span></span></div>${rows}</div>
      <div class="ex-foot"><button data-act="ex-info" data-id="${id}">Technique</button><button data-act="ex-hist" data-id="${baseOf(id)}">Historique</button>${swapOptions(k, slot).length ? `<button data-act="ex-swap" data-slot="${slot}" data-k="${k}">Changer</button>` : ''}
      <button data-act="set-add" data-id="${id}" data-k="${k}">Ajouter une série</button>${extra ? `<button data-act="set-del" data-id="${id}" data-k="${k}">Retirer</button>` : ''}</div></article>`;
  };

  let body = '';
  if (plan.before.length) body += `<div class="block-label">Avant la séance</div>` + plan.before.map(taskCard).join('');
  if (plan.lifts.length) body += `<div class="block-label">Musculation</div>` + liftsOf(k, i).map(exCard).join('');
  if (plan.after.length) body += `<div class="block-label">${plan.rest ? 'Au programme' : 'Après la séance'}</div>` + plan.after.map(taskCard).join('');
  if (!plan.rest) {
    const allDone = prog.done >= prog.total;
    body += `<div style="margin:18px 0 6px">${tr.done ? `<button class="btn btn-ghost btn-block" data-act="finish" data-k="${k}">${icon('check')} Séance terminée, la rejouer</button>`
      : `<button class="btn btn-primary btn-block ${allDone ? 'pulse' : ''}" data-act="finish" data-k="${k}" style="min-height:58px;font-size:17px">Terminer la séance</button>`}</div>`;
  }
  const anyLogged = tr.done || Object.values(tr.sets || {}).some((a) => (a || []).some(isSet)) || Object.values(tr.tasks || {}).some(Boolean);
  if (anyLogged) body += `<button class="reset-day" data-act="day-reset" data-k="${k}">${icon('undo')}<span>Validé par erreur ? <b>Annuler la séance de ${esc(plan.day.toLowerCase())}</b></span></button>`;
  body += `<button class="add-act" data-act="add-act" data-k="${k}">${icon('plus')}<span>Autre sport ce jour-là ? <b>Ajouter une activité</b></span></button>`;
  body += `<details class="panel" style="margin-top:16px"><summary>Règles du programme</summary><ul class="rules">${RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></details>`;
  body += `<details class="panel"><summary>Détente et dunk</summary><ul class="rules">${JUMP_RULES.map((r) => `<li>${esc(r)}</li>`).join('')}</ul><p class="muted small" style="margin:10px 0 0">Gratuit : salle, banc ou muret, panier du terrain.</p></details>`;
  return `<div class="days">${days}</div>` + head + body;
}

function vBox() {
  const wk = boxWeek(); const w = Math.min(wk, 12); const info = BOX_WEEKS[w - 1];
  const phase = BOX_PHASES.find((p) => w >= p.weeks[0] && w <= p.weeks[1]);
  const steps = Array.from({ length: 12 }, (_, i) => `<i class="${i + 1 < w ? 'done' : i + 1 === w ? 'now' : ''}"></i>`).join('');
  const head = `<div class="day-head has-fig"><div class="day-fig" data-act="hero-tap">${heroSVG('guard', { crop: 'upper', sparks: 5 })}</div><h1>Box</h1><p>Anglaise, en solo. Semaine ${w} sur 12, phase ${esc(phase.name.toLowerCase())}.</p></div>
    <section class="panel strong toned"><div class="panel-title"><h2>${esc(info.focus)}</h2><span class="muted small">S${w}</span></div>
    <div class="phase-steps">${steps}</div><p class="muted small" style="margin:0 0 14px">${esc(phase.goal)}</p>
    <div>${info.combos.map((c) => `<span class="combo">${esc(c)}</span>`).join('')}</div>
    ${wk > 12 ? '<p class="small" style="margin:10px 0 0">Cycle de 12 semaines terminé. Recommence-le plus vite et plus fort (Réglages), et surtout : passe en club.</p>' : ''}</section>`;
  const sess = [['Mardi', 'short'], ['Jeudi', 'main'], ['Dimanche', 'light']].map(([day, key]) => {
    const p = BOX_PRESETS[key];
    return `<div class="session-card"><h4><span>${day} : ${esc(p.name.toLowerCase())}</span><span class="muted num">${p.mins} min</span></h4>
      <ol>${p.blocks.map((b) => `<li>${esc(b.label)} : ${b.rounds > 1 ? `${b.rounds} × ` : ''}${b.work >= 60 ? fmt(b.work / 60, b.work % 60 ? 1 : 0) + ' min' : b.work + ' s'}${b.rest ? `, repos ${b.rest} s` : ''}</li>`).join('')}</ol>
      <button class="btn ${key === 'main' ? 'btn-primary' : 'btn-ghost'} btn-block" data-act="box-start" data-preset="${key}">${icon('play')} Lancer le minuteur</button></div>`;
  }).join('');
  const tech = Object.entries(BOX_TECH).map(([k, t]) => `<details class="panel"${info.tech.includes(k) ? ' open' : ''}><summary>${esc(t.name)}</summary><ol class="cues">${t.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol></details>`).join('');
  return head + `<div class="block-label">Tes séances</div>` + sess
    + `<section class="panel"><div class="panel-title"><h2>Les numéros</h2></div><div class="legend-nums">
      <div><b>1</b>Jab</div><div><b>2</b>Direct</div><div><b>3</b>Crochet avant</div><div><b>4</b>Crochet arrière</div><div><b>5</b>Uppercut avant</div><div><b>6</b>Uppercut arrière</div></div>
      <p class="muted small" style="margin:12px 0 0">Pendant le shadow, le minuteur t'annonce les combos à voix haute.</p></section>`
    + `<div class="block-label">Technique</div>` + tech
    + `<section class="panel"><div class="panel-title"><h2>À savoir</h2></div><ul class="rules">
      <li>Le shadow apprend la technique, pas le combat. Pour savoir te battre, il faut un club et du sparring encadré.</li>
      <li>Jamais d'haltères dans les mains en shadow : tes épaules te remercieront.</li>
      <li>Sur un sac : bandes de boxe obligatoires pour protéger tes poignets.</li></ul></section>`;
}

function vWeight() {
  const w = currentWeight(); const pct = projectPct(w); const ws = sortedWeights();
  const { start, target, height } = S.profile; const diff = w - start; const left = target - w;
  const hero = `<p class="muted small" style="margin:0 0 12px">Pesée chaque semaine, le matin, à jeun.</p>
    <section class="panel strong toned"><div class="gauge-head"><div class="big-weight num">${fmt(w, 1)}<small> kg</small></div>
    <div class="gauge-meta"><b class="num">${fmt(pct)} %</b><br>du projet</div></div>
    <p class="muted" style="margin:10px 0 0">${diff >= 0 ? '+' : ''}${fmt(diff, 1)} kg depuis le départ. ${left > 0 ? `Encore ${fmt(left, 1)} kg.` : 'Objectif atteint.'}</p></section>`;
  const form = `<section class="panel"><div class="panel-title"><h2>Nouvelle pesée</h2></div>
    <div class="stepper" style="margin-bottom:10px"><button data-act="w-step" data-d="-0.1" aria-label="Moins 0,1">−</button>
    <input class="input num" id="wIn" inputmode="decimal" value="${fmt(w, 1)}" aria-label="Poids en kg"><button data-act="w-step" data-d="0.1" aria-label="Plus 0,1">+</button></div>
    <label class="field"><span>Date</span><input class="input" type="date" id="wDate" value="${today()}" max="${today()}"></label>
    <button class="btn btn-primary btn-block" data-act="w-save">Enregistrer la pesée</button></section>`;

  let chart = '';
  if (ws.length >= 2) chart = `<section class="panel"><div class="panel-title"><h2>Évolution</h2></div>${weightChart(ws)}</section>`;

  // Coach : rythme de prise
  let coach = 'Après deux pesées espacées d\'au moins 10 jours, je calcule ton rythme et j\'ajuste tes calories.';
  let adjust = '';
  const recent = ws.filter((x) => daysBetween(x.d, today()) <= 35);
  if (recent.length >= 2 && daysBetween(recent[0].d, recent[recent.length - 1].d) >= 10) {
    const a = recent[0], b = recent[recent.length - 1];
    const rate = (b.kg - a.kg) / (daysBetween(a.d, b.d) / 7);
    const r = `${rate >= 0 ? '+' : ''}${fmt(rate, 2)} kg par semaine`;
    if (rate < 0.15) { coach = `${r}. Tu stagnes : ajoute environ 200 kcal par jour.`; adjust = `<button class="btn btn-ghost btn-block" style="margin-top:12px" data-act="kcal-adj" data-d="200">${S.goals.mode === 'auto' ? `Passer à +${fmt(S.goals.surplus + 200)} kcal de surplus` : `Passer à ${fmt(S.goals.kcal + 200)} kcal`}</button>`; }
    else if (rate > 0.6) { coach = `${r}. Trop rapide, c'est surtout du gras : retire environ 150 kcal.`; adjust = `<button class="btn btn-ghost btn-block" style="margin-top:12px" data-act="kcal-adj" data-d="-150">${S.goals.mode === 'auto' ? `Passer à +${fmt(Math.max(0, S.goals.surplus - 150))} kcal de surplus` : `Passer à ${fmt(S.goals.kcal - 150)} kcal`}</button>`; }
    else {
      const weeks = left > 0 ? Math.ceil(left / rate) : 0;
      const eta = new Date(); eta.setDate(eta.getDate() + weeks * 7);
      coach = `${r}. Rythme idéal, garde le cap.${weeks ? ` À ce rythme : objectif vers ${eta.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.` : ''}`;
    }
  }
  const equiv = 86 * Math.pow(height / 188, 2);
  const coachPanel = `<section class="panel"><div class="panel-title"><h2>Coach</h2></div><p class="coach" style="margin:0">${esc(coach)}</p>${adjust}
    <p class="muted small" style="margin:14px 0 0">Repère honnête : à ${fmt(height / 100, 2)} m, le même rapport poids/taille que 86 kg à 1,88 m donne environ ${fmt(equiv, 1)} kg. Prendre du muscle sec prend des années, pas des mois : vise 0,25 à 0,5 kg par semaine.</p></section>`;

  const hist = ws.length ? `<section class="panel"><div class="panel-title"><h2>Historique</h2></div>${[...ws].reverse().map((x) => `<div class="hist"><span>${esc(fromKey(x.d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }))}</span><b class="num">${fmt(x.kg, 1)} kg</b><button data-act="w-del" data-d="${x.d}">Supprimer</button></div>`).join('')}</section>` : '';
  return hero + form + chart + coachPanel + hist;
}

function weightChart(ws) {
  const W = 340, H = 190, P = { l: 30, r: 10, t: 12, b: 24 };
  const xs = ws.map((x) => fromKey(x.d).getTime()); const ys = ws.map((x) => x.kg);
  const minY = Math.floor(Math.min(...ys, S.profile.start) - 1), maxY = Math.ceil(Math.max(...ys, Math.min(S.profile.target, Math.max(...ys) + 4)) + 0.5);
  const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
  const X = (t) => P.l + ((t - x0) / Math.max(1, x1 - x0)) * (W - P.l - P.r);
  const Y = (v) => P.t + (1 - (v - minY) / Math.max(1, maxY - minY)) * (H - P.t - P.b);
  const pts = ws.map((x, i) => [X(xs[i]), Y(x.kg)]);
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const area = `${line}L${pts[pts.length - 1][0].toFixed(1)},${H - P.b}L${pts[0][0].toFixed(1)},${H - P.b}Z`;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = minY + (maxY - minY) * f; const y = Y(v); return `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}"/><text x="0" y="${y + 4}">${fmt(v)}</text>`; }).join('');
  const tgt = S.profile.target <= maxY ? `<line class="target" x1="${P.l}" x2="${W - P.r}" y1="${Y(S.profile.target)}" y2="${Y(S.profile.target)}"/>` : '';
  const fmtD = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const tip = (i) => `${fromKey(ws[i].d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${fmt(ws[i].kg, 1)} kg, ${fmt(projectPct(ws[i].kg))} % du projet`;
  const hits = pts.map((p, i) => { const a = i ? (pts[i - 1][0] + p[0]) / 2 : P.l; const b = i < pts.length - 1 ? (p[0] + pts[i + 1][0]) / 2 : W - P.r; return `<rect class="hit" x="${a.toFixed(1)}" y="0" width="${Math.max(1, b - a).toFixed(1)}" height="${H}" data-tip="${esc(tip(i))}" data-i="${i}"/>`; }).join('');
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Évolution du poids">${grid}${tgt}<path class="area" d="${area}"/>
    <path class="line draw" d="${line}" style="--len:${Math.ceil(len) + 2}"/>${pts.map((p, i) => `<circle class="dot ${i === pts.length - 1 ? 'on' : ''}" data-i="${i}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"/>`).join('')}
    <text x="${P.l}" y="${H - 6}">${fmtD(x0)}</text><text x="${W - P.r}" y="${H - 6}" text-anchor="end">${fmtD(x1)}</text>${hits}</svg>
    <p class="chart-tip">${esc(tip(pts.length - 1))}</p></div>`;
}

/* ---------- Progrès : poids, force, calories ---------- */
function vProgress() {
  const t = UI.progTab;
  const seg = `<div class="seg" role="tablist">${[['poids', 'Poids'], ['force', 'Force'], ['cal', 'Calories']].map(([k, l]) => `<button role="tab" aria-selected="${t === k}" class="${t === k ? 'on' : ''}" data-act="prog-tab" data-t="${k}">${l}</button>`).join('')}</div>`;
  return `<div class="day-head"><h1>Progress</h1></div>` + seg + (t === 'force' ? vForce() : t === 'cal' ? vCal() : vWeight());
}

function vForce() {
  const t = today(); const mon = mondayOf(t);
  const wk = rangeStats(mon, addDays(mon, 6)); const lw = rangeStats(addDays(mon, -7), addDays(mon, -1));
  const monthStart = `${t.slice(0, 8)}01`; const prs = prCountSince(monthStart);
  const cmp = (lw.vol && wk.vol) ? `${wk.vol >= lw.vol ? '+' : ''}${fmt(((wk.vol - lw.vol) / lw.vol) * 100)} % de volume par rapport à la semaine dernière.` : (lw.vol ? 'Pas encore de séance cette semaine.' : 'Le volume se compare d\'une semaine à l\'autre dès la semaine prochaine.');
  const head = `<section class="panel strong toned"><div class="panel-title"><h2>Cette semaine</h2></div>
    <div class="trio"><div><b class="num">${wk.sessions}</b><span>séance${wk.sessions > 1 ? 's' : ''}</span></div><div><b class="num">${wk.sets}</b><span>séries</span></div><div><b class="num">${fmt(wk.vol)}</b><span>kg soulevés</span></div></div>
    <p class="muted small" style="margin:12px 0 0">${cmp} ${prs ? `${prs} record${prs > 1 ? 's' : ''} battu${prs > 1 ? 's' : ''} ce mois-ci.` : ''}</p></section>`;
  const bases = [...new Set([...WEEK.flatMap((d) => d.lifts), ...Object.values(EX_ALT).flat(), ...Object.values(S.train).flatMap((tr) => Object.keys(tr.sets || {}))].filter((id) => EX[id]).map(baseOf))];
  const rows = bases.map((b) => ({ b, e: exInfo(b), ses: sessionsOf(b) })).filter((x) => x.ses.length);
  if (!rows.length) return head + `<div class="empty">Valide ta première série dans Training : ta progression s'affichera ici, exercice par exercice.</div>`;
  const list = rows.map(({ b, e, ses }) => {
    const chron = [...ses].reverse().slice(-12); const vals = chron.map((x) => bestScore(e, x.done));
    const last = ses[0]; const best = bestSet(e, last.done); const d = vals.length > 1 && vals[0] ? ((vals[vals.length - 1] - vals[0]) / vals[0]) * 100 : null;
    return `<button class="lift-row" data-act="ex-hist" data-id="${b}"><div><b>${esc(e.name)}</b><span class="num">${esc(dateShort(last.d))} : ${esc(setTxt(best, e))}</span></div>
      ${spark(vals)}<span class="lift-d num">${d == null ? '' : `${d >= 0 ? '+' : ''}${fmt(d)} %`}</span></button>`;
  }).join('');
  return head + `<section class="panel"><div class="panel-title"><h2>Exercices</h2><span class="muted small">depuis le début</span></div>${list}</section>
    <p class="muted tiny" style="margin:-4px 0 14px">La courbe suit ta meilleure série de chaque séance (1RM estimé). Touche un exercice pour tout voir.</p>`;
}
function spark(vals) {
  const W = 84, H = 30, p = 4; if (!vals.length) return '<svg class="spark"></svg>';
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const X = (i) => (vals.length === 1 ? W / 2 : p + (i * (W - 2 * p)) / (vals.length - 1));
  const Y = (v) => H - p - (mx === mn ? 0.5 : (v - mn) / (mx - mn)) * (H - 2 * p);
  const last = vals.length - 1;
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true">${vals.length > 1 ? `<polyline points="${vals.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}"/>` : ''}<circle cx="${X(last).toFixed(1)}" cy="${Y(vals[last]).toFixed(1)}" r="3"/></svg>`;
}

function vCal() {
  const t = today(); const eaten = dayTotals(t).kcal; const b = dayBurn(t); const g = goalsFor(t);
  const act = ACT_LEVELS.find((x) => x.v === S.profile.act) || ACT_LEVELS[1];
  const items = b.items.map((x) => `<div class="brow"><span>${esc(x.name)}${b.planned && !x.extra ? ' <i class="muted">(prévu)</i>' : ''}<small class="muted num">${fmt(x.mins)} min${x.extra ? ` <button data-act="act-del" data-d="${t}" data-id="${x.extra}" aria-label="Supprimer ${esc(x.name)}">Supprimer</button>` : ''}</small></span><b class="num">${fmt(x.kcal)}</b></div>`).join('');
  const todayPanel = `<section class="panel strong toned"><div class="panel-title"><h2>Aujourd'hui</h2><span class="muted small">estimation</span></div>
    <div class="trio"><div><b class="num">${fmt(eaten)}</b><span>mangées</span></div><div><b class="num">${fmt(b.total)}</b><span>dépensées</span></div><div><b class="num">${fmt(Math.abs(g.kcal - eaten))}</b><span>${g.kcal - eaten >= 0 ? 'restantes' : 'au-dessus'}</span></div></div>
    <p class="muted small" style="margin:12px 0 0">${g.auto ? `Objectif : ${fmt(g.kcal)} kcal, soit ta dépense + ${fmt(S.goals.surplus)} de surplus.` : `Objectif fixe : ${fmt(g.kcal)} kcal.`} Le programme vise +300 à +500 kcal par jour.</p></section>
    <section class="panel"><div class="panel-title"><h2>Ta dépense</h2></div>
    <div class="brow"><span>Corps au repos + vie quotidienne<small class="muted">${esc(act.name.toLowerCase())}, ${fmt(S.profile.age)} ans, ${fmt(currentWeight(), 1)} kg</small></span><b class="num">${fmt(b.base)}</b></div>
    ${items}<button class="btn btn-ghost btn-block" style="margin-top:12px" data-act="add-act" data-k="${t}">${icon('plus')} Ajouter une activité</button></section>`;

  // 7 derniers jours complets (avec repas notés)
  const past = Array.from({ length: 7 }, (_, i) => addDays(t, -1 - i)).filter((d) => (S.food[d] || []).length);
  let avg = '';
  if (past.length) {
    const e = sum(past, (d) => dayTotals(d).kcal) / past.length; const bu = sum(past, (d) => dayBurn(d).total) / past.length; const bal = e - bu;
    const verdict = bal < 250 ? 'En dessous du surplus visé : mange un peu plus.' : bal > 550 ? 'Au-dessus du surplus visé : tu risques de prendre surtout du gras.' : 'Dans la zone visée. Continue.';
    avg = `<p class="coach" style="margin:0 0 4px">Moyenne sur ${past.length} jour${past.length > 1 ? 's' : ''} : ${fmt(e)} mangées, ${fmt(bu)} dépensées, ${bal >= 0 ? '+' : '−'}${fmt(Math.abs(bal))} kcal par jour. ${verdict}</p>`;
  }
  const chartPanel = `<section class="panel"><div class="panel-title"><h2>Mangé moins dépensé</h2><span class="muted small">14 jours</span></div>${balanceChart()}${avg}</section>`;
  const note = `<p class="muted tiny" style="margin:-4px 0 14px">La dépense est une estimation (métabolisme de Mifflin-St Jeor, sport d'après les valeurs MET du Compendium des activités physiques). Elle peut se tromper de 10 à 15 %. Ta balance a le dernier mot : si ton poids ne monte pas, le coach de l'onglet Poids corrige le surplus.</p>
    <button class="btn btn-ghost btn-block" data-act="settings" style="margin-bottom:14px">Régler âge, activité et surplus</button>`;
  return todayPanel + chartPanel + note;
}

// Barres de l'écart (mangé − dépensé), zone visée +300 à +500 en trame
function balanceChart() {
  const t = today(); const days = Array.from({ length: 14 }, (_, i) => addDays(t, i - 14));
  const data = days.map((d) => { const has = (S.food[d] || []).length > 0; const e = dayTotals(d).kcal; const b = has ? dayBurn(d).total : 0; return { d, has, e, b, v: has ? e - b : 0 }; });
  const W = 340, H = 180, P = { l: 40, r: 6, t: 10, b: 22 };
  const vs = data.filter((x) => x.has).map((x) => x.v);
  const minY = Math.min(-500, ...vs) - 50, maxY = Math.max(1000, ...vs) + 50;
  const Y = (v) => P.t + (1 - (v - minY) / (maxY - minY)) * (H - P.t - P.b);
  const step = (W - P.l - P.r) / 14; const bw = Math.max(6, step - 6);
  const band = `<rect class="band" x="${P.l}" y="${Y(500).toFixed(1)}" width="${W - P.l - P.r}" height="${(Y(300) - Y(500)).toFixed(1)}"/>`;
  const ticks = [-500, 0, 500, 1000].filter((v) => v > minY && v < maxY).map((v) => `<line class="${v ? 'grid' : 'zero'}" x1="${P.l}" x2="${W - P.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text x="0" y="${(Y(v) + 4).toFixed(1)}">${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt(Math.abs(v))}</text>`).join('');
  const L = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const tipOf = (x) => `${dateShort(x.d)} : ${x.has ? `${fmt(x.e)} mangées, ${fmt(x.b)} dépensées, ${x.v >= 0 ? '+' : '−'}${fmt(Math.abs(x.v))} kcal${x.d === t ? ' (journée en cours)' : ''}` : 'pas de repas noté'}`;
  const bars = data.map((x, i) => {
    const cx = P.l + step * i + step / 2; const y0 = Y(0);
    const bar = x.has ? (() => { const y1 = Y(x.v); const top = Math.min(y0, y1), h = Math.max(1.5, Math.abs(y1 - y0)); return `<rect class="bar ${x.d === t ? 'now' : ''} ${x.v < 0 ? 'neg' : ''}" data-i="${i}" x="${(cx - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" style="--d:${(i * 0.03).toFixed(2)}s"/>`; })() : `<line class="none" x1="${(cx - 3).toFixed(1)}" x2="${(cx + 3).toFixed(1)}" y1="${y0.toFixed(1)}" y2="${y0.toFixed(1)}"/>`;
    return `${bar}<text class="xl" x="${cx.toFixed(1)}" y="${H - 6}" text-anchor="middle">${L[dow(x.d)]}</text><rect class="hit" x="${(P.l + step * i).toFixed(1)}" y="0" width="${step.toFixed(1)}" height="${H}" data-tip="${esc(tipOf(x))}" data-i="${i}"/>`;
  }).join('');
  const lastHas = [...data].reverse().find((x) => x.has);
  return `<div class="chart-wrap"><svg class="chart bal" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Écart calorique des 14 derniers jours (mangé moins dépensé)">${band}${ticks}${bars}</svg>
    <p class="chart-tip">${esc(lastHas ? tipOf(lastHas) : 'Note tes repas : chaque jour aura sa barre.')}</p>
    <div class="legend" style="margin:0 0 10px"><span><i class="s"></i>Zone visée : +300 à +500 kcal</span></div></div>`;
}

function openActivity(k) {
  let pick = EXTRA_ACTS[0]; let mins = 30;
  openSheet(`<h3>Ajouter une activité</h3><p class="sub">Ce qui n'est pas dans ton programme : marche, foot, vélo, basket… ${k === today() ? '' : `Pour le ${esc(dateShort(k))}.`}</p>
    <div class="chips wrap" id="actPick">${EXTRA_ACTS.map((a, i) => `<button class="chip ${i ? '' : 'on'}" data-a="${a.id}">${esc(a.name)}</button>`).join('')}</div>
    <div class="field" style="margin-top:14px"><span>Durée (minutes)</span><div class="stepper"><button data-m="-5" aria-label="Moins 5 minutes">−</button><input class="input num" id="actMin" inputmode="numeric" value="30" aria-label="Durée en minutes"><button data-m="5" aria-label="Plus 5 minutes">+</button></div></div>
    <div class="tot" style="grid-template-columns:1fr"><div><b class="num" id="actK"></b><span>kcal dépensées en plus (estimation)</span></div></div>
    <button class="btn btn-primary btn-block" id="actAdd">Ajouter</button>`, (sh) => {
    const upd = () => { mins = clamp(Math.round(num($('#actMin', sh).value)), 0, 600); $('#actK', sh).textContent = fmt(netKcal(pick.met, mins)); };
    $$('#actPick .chip', sh).forEach((b) => b.onclick = () => { pick = EXTRA_ACTS.find((a) => a.id === b.dataset.a); $$('#actPick .chip', sh).forEach((x) => x.classList.toggle('on', x === b)); upd(); haptic(5); });
    $$('[data-m]', sh).forEach((b) => b.onclick = () => { $('#actMin', sh).value = clamp(num($('#actMin', sh).value) + +b.dataset.m, 0, 600); upd(); });
    $('#actMin', sh).oninput = upd; upd();
    $('#actAdd', sh).onclick = () => {
      if (!mins) { toast('Entre une durée'); return; }
      (S.extra[k] = S.extra[k] || []).push({ id: uid(), name: pick.name, mins, kcal: Math.round(netKcal(pick.met, mins)) });
      save(); closeSheet(); render(); haptic(15); toast(`${pick.name} : ${fmt(netKcal(pick.met, mins))} kcal ajoutées à ta dépense`);
    };
  });
}

/* ---------- Rendu ---------- */
const VIEWS = { home: vHome, food: vFood, train: vTrain, box: vBox, grow: vGrow, weight: vProgress };
const TABS = ['home', 'food', 'train', 'box', 'grow', 'weight'];
function render(animate = false) {
  const root = $('#view');
  const prev = {};
  $$('[data-fid]', root).forEach((el) => { prev[el.dataset.fid] = getComputedStyle(el).getPropertyValue('--f'); });
  $$('[data-rid]', root).forEach((el) => { prev[el.dataset.rid] = el.style.strokeDashoffset; });
  root.innerHTML = VIEWS[UI.tab]();
  if (animate) { root.classList.remove('view'); void root.offsetWidth; root.classList.add('view'); window.scrollTo(0, 0); }
  $$('[data-fid]', root).forEach((el) => { const p = prev[el.dataset.fid]; el.style.setProperty('--f', p !== undefined && p !== '' ? p : 0); });
  $$('[data-rid]', root).forEach((el) => { if (prev[el.dataset.rid]) el.style.strokeDashoffset = prev[el.dataset.rid]; });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $$('[data-fid]', root).forEach((el) => el.style.setProperty('--f', el.dataset.f));
    $$('[data-rid]', root).forEach((el) => { el.style.strokeDashoffset = el.dataset.off; });
  }));
  // Navigation
  const i = TABS.indexOf(UI.tab);
  $('.nav-ind').style.transform = `translateX(calc(${i} * (100% + 12px)))`;
  $$('.nav button').forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-current', j === i ? 'page' : 'false'); });
  renderTop();
}
function renderTop() {
  $('#avatar').innerHTML = S.profile.avatar ? `<img src="${S.profile.avatar}" alt="Photo de profil">` : EMBLEM;
  $('#brandSub').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function goTab(t) { if (UI.tab === t) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; } UI.tab = t; if (t === 'train') UI.trainDay = dow(today()); if (t === 'food') UI.foodDay = today(); render(true); haptic(8); }

/* ---------- Son, vibration, voix ---------- */
let AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
function tone(freq, dur = 0.15, type = 'sine', vol = 0.25, when = 0) {
  if (!S.prefs.sound) return; const ac = audio(); if (!ac) return;
  const t = ac.currentTime + when; const o = ac.createOscillator(); const g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}
function bell(n = 1) { for (let i = 0; i < n; i++) { tone(1320, 0.9, 'triangle', 0.3, i * 0.32); tone(2640, 0.5, 'sine', 0.08, i * 0.32); } }
function impactSound() {
  if (!S.prefs.sound || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; const ac = audio(); if (!ac) return;
  const t = ac.currentTime; const len = 0.5; const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const src = ac.createBufferSource(); src.buffer = buf; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(120, t + len);
  const g = ac.createGain(); g.gain.value = 0.5; src.connect(f).connect(g).connect(ac.destination); src.start(t);
  tone(55, 0.6, 'sine', 0.6); tone(110, 0.3, 'square', 0.06);
}
function haptic(p) { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
function say(text) {
  if (!S.prefs.voice || !('speechSynthesis' in window)) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/-/g, ', ')); u.lang = 'fr-FR'; u.rate = 1.15; speechSynthesis.speak(u); } catch (e) { }
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button>${esc(action.label)}</button>` : ''}`;
  if (action) $('button', el).onclick = () => { action.fn(); el.classList.remove('on'); };
  el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), action ? 4500 : 2800);
}

/* ---------- Cinématique ---------- */
const impactQueue = [];
let impactOpen = false;
function impact(o) { impactQueue.push(o); if (!impactOpen) nextImpact(); }
function nextImpact() {
  const o = impactQueue.shift(); if (!o) { impactOpen = false; return; }
  impactOpen = true;
  const el = document.createElement('div'); el.className = 'impact'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', o.title);
  const stats = o.stats ? `<div class="stats">${o.stats.map((s) => `<div><b class="num">${esc(s.v)}</b><span>${esc(s.l)}</span></div>`).join('')}</div>` : '';
  el.innerHTML = `<div class="flash"></div><div class="lines"></div><div class="bars"></div>
    <div class="stage">${o.hero === false ? '' : `<div class="ihero ${o.hero === 'power' ? 'wide' : ''}">${heroSVG(o.hero || 'win', { sparks: 14 })}</div>`}<div class="kicker">${esc(o.kicker || '')}</div><div class="title">${letters(o.title, 0.38, 0.05)}</div><div class="subt">${esc(o.sub || '')}</div>${stats}</div>
    <div class="tap">Touche l'écran pour continuer</div>`;
  document.body.appendChild(el);
  impactSound(); haptic([30, 40, 90]);
  const opened = Date.now();
  const close = () => { if (Date.now() - opened < 900 || el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => { el.remove(); nextImpact(); }, 430); };
  el.addEventListener('click', close);
  if (o.auto) setTimeout(close, o.auto);
}

/* ---------- Feuilles (bottom sheets) ---------- */
let sheetClose = null;
function openSheet(html, onMount, onClose) {
  closeSheet(true);
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const sh = document.createElement('div'); sh.className = 'sheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = `<div class="grab"></div><button class="icon-btn sheet-close" data-close aria-label="Fermer">${icon('close')}</button>${html}`;
  document.body.append(scrim, sh);
  requestAnimationFrame(() => { scrim.classList.add('on'); sh.classList.add('on'); });
  const close = () => {
    sh.classList.remove('on'); scrim.classList.remove('on');
    setTimeout(() => { sh.remove(); scrim.remove(); }, 450);
    sheetClose = null; onClose && onClose();
  };
  sheetClose = close;
  scrim.onclick = close; $('[data-close]', sh).onclick = close;
  // Glisser vers le bas pour fermer
  let y0 = null, dy = 0;
  sh.addEventListener('touchstart', (e) => { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; } }, { passive: true });
  sh.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; else { y0 = null; sh.style.transform = ''; } }, { passive: true });
  sh.addEventListener('touchend', () => { if (y0 == null) return; sh.style.transition = ''; if (dy > 110) close(); else sh.style.transform = ''; y0 = null; });
  onMount && onMount(sh);
  return sh;
}
function closeSheet(instant) { if (sheetClose) { const c = sheetClose; c(); } }

/* ---------- Images ---------- */
function pickFile(capture) {
  return new Promise((resolve) => {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    if (capture) inp.setAttribute('capture', 'environment');
    inp.style.display = 'none'; document.body.appendChild(inp);
    inp.onchange = () => { resolve(inp.files[0] || null); inp.remove(); };
    inp.click();
    setTimeout(() => inp.remove(), 120000);
  });
}
function loadImg(src) { return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => rej(new UserError('Image illisible. Essaie une autre photo.')); img.src = src; }); }
async function compress(file, max = 1024, q = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url); const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', q);
  } finally { URL.revokeObjectURL(url); }
}
async function squareThumb(src, size = 120) {
  const img = await loadImg(src); const s = Math.min(img.naturalWidth, img.naturalHeight);
  const c = document.createElement('canvas'); c.width = c.height = size;
  c.getContext('2d').drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.6);
}

/* ---------- Stockage des images d'exercices (IndexedDB) ---------- */
const IMG_CACHE = {};
const IDB = {
  db: null,
  open() {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((res, rej) => { const r = indexedDB.open('projetToji', 1); r.onupgradeneeded = () => r.result.createObjectStore('img'); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); });
  },
  async tx(mode, fn) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction('img', mode); const out = fn(t.objectStore('img')); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); },
  put(k, v) { return this.tx('readwrite', (s) => s.put(v, k)); },
  del(k) { return this.tx('readwrite', (s) => s.delete(k)); },
  async all() {
    const db = await this.open();
    return new Promise((res) => { const out = {}; const r = db.transaction('img').objectStore('img').openCursor(); r.onsuccess = () => { const c = r.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); }; r.onerror = () => res(out); });
  },
};

/* ---------- IA (Google Gemini, offre gratuite) ---------- */
const AI_JSON = '{"nom":"nom court du repas en français","aliments":[{"nom":"...","grammes":0,"kcal":0,"proteines":0,"glucides":0,"lipides":0}],"total":{"kcal":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0,"sucres":0},"confiance":"haute|moyenne|basse","remarque":"phrase courte si quelque chose est incertain (huile, sauce, portion cachée), sinon vide"}';
const PROMPT_PHOTO = `Tu es nutritionniste. Analyse cette photo de repas pour un suivi de calories.
1. Identifie chaque aliment visible.
2. Estime la portion de chaque aliment en grammes, en t'aidant des objets autour (assiette, couverts, main).
3. Calcule calories et macronutriments avec des valeurs de référence réalistes (tables CIQUAL ou USDA). Compte l'huile de cuisson probable.
Réponds uniquement avec ce JSON :
${AI_JSON}
Si l'image ne montre pas de nourriture, renvoie "aliments":[] et explique dans "remarque".`;
const PROMPT_TEXT = (t) => `Tu es nutritionniste. Voici la description d'un repas : « ${t} ».
Estime les portions en grammes si elles ne sont pas données (portions françaises normales), puis calcule calories et macronutriments avec des valeurs de référence réalistes (tables CIQUAL ou USDA).
Réponds uniquement avec ce JSON :
${AI_JSON}`;
const PROMPT_LABEL = `Cette photo montre un emballage alimentaire ou un tableau nutritionnel. Lis les valeurs pour 100 g (ou 100 ml).
Réponds uniquement avec ce JSON :
{"nom":"nom du produit","marque":"","pour100":{"kcal":0,"proteines":0,"glucides":0,"lipides":0,"fibres":0,"sucres":0},"portion_g":0}
Mets null pour toute valeur illisible.`;

/* Rapidité : réponse en 30 s maximum.
   1. Photo réduite (768 px) avant l'envoi.
   2. Réflexion de l'IA réglée au minimum (thinkingLevel « low », ou thinkingBudget 0 pour Gemini 2.5).
   3. Si le modèle principal ne répond pas en 8 s (ou plante), un modèle « Flash-Lite » plus rapide part en parallèle :
      la première bonne réponse gagne, l'autre est annulée.
   4. Au bout de 30 s, on arrête et on affiche un message clair. */
const AI_DEADLINE = 30000, AI_HEDGE = 8000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function thinkCfg(model) {
  if (/gemini-(1\.|2\.0)/.test(model) || /gemini-2\.5-flash-lite/.test(model)) return null;
  if (/gemini-2\.5/.test(model)) return { thinkingBudget: 0 };
  return { thinkingLevel: 'low' };
}
function aiBody(parts, model, think = true) {
  const gc = { responseMimeType: 'application/json', temperature: 0.2 };
  const t = think && thinkCfg(model); if (t) gc.thinkingConfig = t;
  return { contents: [{ role: 'user', parts }], generationConfig: gc };
}
// Choisit les modèles une fois par semaine : le meilleur Flash (principal) et le meilleur Flash-Lite (rapide)
async function aiModels(key) {
  const tag = key.slice(-6); const c = S.ai.models;
  const manual = S.ai.model && S.ai.model !== 'auto' && S.ai.model !== 'gemini-flash-latest' ? S.ai.model : null;
  if (c && c.tag === tag && Date.now() - c.t < 7 * 864e5) return { main: manual || c.main, fast: c.fast };
  let main = 'gemini-flash-latest', fast = 'gemini-flash-lite-latest';
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key }, signal: ctrl.signal });
    clearTimeout(to);
    if (r.ok) {
      const j = await r.json();
      const names = (j.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''))
        .filter((n) => /^gemini-.*flash/.test(n) && !/(image|tts|live|audio|embedding|thinking|8b|robotics|computer|native)/.test(n));
      const score = (n) => (parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1]) || 0) * 10 - (/(preview|exp)/.test(n) ? 4 : 0) - (/-\d{3,}$/.test(n) ? 1 : 0);
      const best = (arr) => [...arr].sort((x, y) => score(y) - score(x))[0];
      main = best(names.filter((n) => !/lite/.test(n))) || main;
      fast = best(names.filter((n) => /lite/.test(n))) || fast;
      S.ai.models = { tag, t: Date.now(), main, fast }; save();
    }
  } catch (e) { }
  return { main: manual || main, fast };
}
class AIError extends Error { constructor(res) { super('ai'); this.res = res; } }
async function gemini(parts) {
  const key = (S.ai.key || '').trim();
  if (!key) throw new UserError('Ajoute d\'abord ta clé Gemini gratuite dans Réglages.');
  if (!navigator.onLine) throw new UserError('Pas de connexion internet.');
  const t0 = Date.now(); const { main, fast } = await aiModels(key);
  const ctrls = []; let done = false; let kick; const kicked = new Promise((r) => { kick = r; });
  const attempt = async (model) => {
    if (done) throw new Error('skip');
    const ctrl = new AbortController(); ctrls.push(ctrl);
    let res = await callModel(model, aiBody(parts, model), key, ctrl.signal);
    if (!res.ok && res.status === 400 && /thinking/i.test(res.text)) res = await callModel(model, aiBody(parts, model, false), key, ctrl.signal);
    if (!res.ok) { if (res.status === 404) S.ai.models = null; throw new AIError(res); }
    let data; try { data = JSON.parse(res.text); } catch (e) { throw new UserError('Réponse illisible de l\'IA. Réessaie.'); }
    const text = (data.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('');
    if (!text) throw new UserError('L\'IA n\'a rien répondu. Réessaie avec une autre photo.');
    return parseLoose(text);
  };
  const first = attempt(main).catch((e) => { kick(); throw e; });
  const second = (async () => { await Promise.race([sleep(AI_HEDGE), kicked]); return attempt(fast); })();
  let timer; const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new UserError('L\'IA a mis plus de 30 secondes : les serveurs gratuits de Google sont chargés. Réessaie, ou décris ton repas en texte.')), Math.max(5000, AI_DEADLINE - (Date.now() - t0))); });
  try {
    return await Promise.race([Promise.any([first, second]), timeout]);
  } catch (e) {
    const errs = (e && e.errors) || [e];
    const real = errs.find((x) => x instanceof UserError) || errs.find((x) => x instanceof AIError) || errs[0];
    if (real instanceof AIError) throw new UserError(explainError(real.res));
    if (real instanceof UserError) throw real;
    throw new UserError('Pas de connexion internet.');
  } finally { done = true; clearTimeout(timer); ctrls.forEach((c) => { try { c.abort(); } catch (x) { } }); }
}
async function callModel(model, body, key, signal) {
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(body), signal,
    });
    return { ok: r.ok, status: r.status, text: await r.text() };
  } catch (e) { if (e.name === 'AbortError') throw new Error('skip'); throw new UserError('Pas de connexion internet.'); }
}
function explainError(res) {
  let msg = ''; try { msg = JSON.parse(res.text).error?.message || ''; } catch (e) { }
  if (res.status === 400 && /api key/i.test(msg)) return 'Clé API invalide. Vérifie-la dans Réglages.';
  if (res.status === 403) return 'Clé refusée. Recrée une clé sur Google AI Studio.';
  if (res.status === 429) return 'Limite gratuite atteinte. Attends une minute, ou demain si c\'est la limite du jour.';
  if (res.status >= 500) return 'Le service IA est surchargé. Réessaie dans un instant.';
  return `Erreur IA (${res.status}). ${msg.slice(0, 140)}`;
}
function parseLoose(text) {
  const t = text.replace(/```json|```/g, '').trim();
  try { return JSON.parse(t); } catch (e) { }
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { } }
  throw new UserError('Réponse illisible de l\'IA. Réessaie.');
}
function normMeal(j) {
  const items = (j.aliments || []).map((a) => ({ name: a.nom || 'Aliment', g: num(a.grammes), kcal: num(a.kcal), p: num(a.proteines), c: num(a.glucides), f: num(a.lipides) }));
  const t = j.total || {};
  let total = { kcal: num(t.kcal), p: num(t.proteines), c: num(t.glucides), f: num(t.lipides), fiber: num(t.fibres), sugar: num(t.sucres) };
  if (!total.kcal && items.length) total = items.reduce((s, x) => ({ ...s, kcal: s.kcal + x.kcal, p: s.p + x.p, c: s.c + x.c, f: s.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0, fiber: total.fiber, sugar: total.sugar });
  return { name: j.nom || 'Repas', items, total, confidence: j.confiance || '', note: j.remarque || '' };
}

/* ---------- Ajout d'aliments ---------- */
function addFood(e, day = UI.tab === 'food' ? UI.foodDay : today()) {
  const entry = { id: uid(), t: Date.now(), name: e.name || 'Aliment', kcal: Math.round(num(e.kcal)), p: +num(e.p).toFixed(1), c: +num(e.c).toFixed(1), f: +num(e.f).toFixed(1), fiber: +num(e.fiber).toFixed(1), sugar: +num(e.sugar).toFixed(1), src: e.src || 'manual' };
  if (e.thumb) entry.thumb = e.thumb; if (e.img) entry.img = e.img;
  (S.food[day] = S.food[day] || []).push(entry);
  const r = { name: entry.name, kcal: entry.kcal, p: entry.p, c: entry.c, f: entry.f, fiber: entry.fiber, sugar: entry.sugar, src: entry.src, img: entry.img, thumb: entry.thumb };
  S.recents = [r, ...S.recents.filter((x) => x.name !== r.name)].slice(0, 12);
  save(); closeSheet(); render();
  haptic(15);
  const dt = dayTotals(day), dg = goalsFor(day);
  toast(`Ajouté. Journée : ${fmt((dt.kcal / (dg.kcal || 1)) * 100)} % des kcal, ${fmt((dt.p / (dg.p || 1)) * 100)} % des protéines`, { label: 'Annuler', fn: () => { S.food[day] = S.food[day].filter((x) => x.id !== entry.id); save(); render(); } });
  if (day === today()) checkGoals(day);
}
function checkGoals(d) {
  const t = dayTotals(d); const g = goalsFor(d); const c = (S.celebrated[d] = S.celebrated[d] || {});
  const kcal = t.kcal >= g.kcal && !c.kcal; const prot = t.p >= g.p && !c.p;
  if (kcal) c.kcal = 1; if (prot) c.p = 1; save();
  if (kcal && prot) impact({ kicker: 'Objectifs du jour atteints', title: 'Journée parfaite', hero: 'flex', sub: 'Calories et protéines validées. Maintenant : dormir 8 heures.', stats: [{ v: fmt(t.kcal), l: 'kcal' }, { v: fmt(t.p) + ' g', l: 'protéines' }], auto: 5200 });
  else if (kcal) impact({ kicker: 'Objectif du jour atteint', title: 'Calories', hero: 'flex', sub: 'Le surplus est fait. La croissance suit.', stats: [{ v: fmt(t.kcal), l: 'kcal' }], auto: 4200 });
  else if (prot) impact({ kicker: 'Objectif du jour atteint', title: 'Protéines', hero: 'flex', sub: 'Tes muscles ont de quoi construire.', stats: [{ v: fmt(t.p) + ' g', l: 'protéines' }], auto: 4200 });
}

function keyMissingHTML() {
  return `<div class="warn">Pour l'analyse par IA, il te faut une clé Google Gemini gratuite (2 minutes à créer).<br><br>
    <button class="btn btn-primary btn-block" data-act="settings">Ajouter ma clé gratuite</button></div>`;
}

function openPhoto() {
  openSheet(`<h3>Photo du repas</h3><p class="sub">Prends ton assiette d'au-dessus, bien éclairée. L'IA estime, toi tu vérifies.</p>
    ${S.ai.key ? '' : keyMissingHTML()}
    <div class="row" style="margin-bottom:12px"><button class="btn btn-primary" id="phCam">${icon('camera')} Caméra</button><button class="btn btn-ghost" id="phGal">${icon('image')} Galerie</button></div>
    <div id="zone"></div>`, (sh) => {
    const go = async (cap) => {
      const file = await pickFile(cap); if (!file) return;
      const zone = $('#zone', sh);
      let data;
      try { data = await compress(file, 768, 0.72); } catch (e) { zone.innerHTML = `<div class="warn">${esc(e.message)}</div>`; return; }
      analyze(data);
    };
    const analyze = async (data) => {
      const zone = $('#zone', sh); const t0 = Date.now();
      zone.innerHTML = `<div class="scan" style="aspect-ratio:4/3"><img src="${data}" alt="Ton repas"><div class="analyzing"><b>Analyse</b><span id="anT">Identification des aliments… 0 s</span></div></div>`;
      const tick = setInterval(() => { const el = $('#anT', sh); if (el) el.textContent = `Identification des aliments… ${Math.round((Date.now() - t0) / 1000)} s`; }, 500);
      try {
        const thumb = await squareThumb(data);
        const j = await gemini([{ inline_data: { mime_type: 'image/jpeg', data: data.split(',')[1] } }, { text: PROMPT_PHOTO }]);
        const meal = normMeal(j);
        zone.innerHTML = `<div class="scan" style="aspect-ratio:4/3;max-height:200px"><img src="${data}" alt="Ton repas"></div>`;
        resultEditor(zone, meal, { thumb, src: 'photo' }, true);
      } catch (e) {
        zone.innerHTML = `<div class="warn">${esc(e instanceof UserError ? e.message : 'Erreur : ' + e.message)}</div>
          <div class="row" style="margin-top:10px"><button class="btn btn-primary" id="anRetry">Réessayer</button><button class="btn btn-ghost" id="anText">Décrire en texte</button></div>`;
        $('#anRetry', sh).onclick = () => analyze(data);
        $('#anText', sh).onclick = () => openText();
      } finally { clearInterval(tick); }
    };
    $('#phCam', sh).onclick = () => go(true);
    $('#phGal', sh).onclick = () => go(false);
  });
}

function openText() {
  openSheet(`<h3>Décris ton repas</h3><p class="sub">Plus tu donnes les quantités, plus c'est précis.</p>
    ${S.ai.key ? '' : keyMissingHTML()}
    <label class="field"><textarea class="input" id="txt" placeholder="Ex : 200 g de riz, 150 g de blanc de poulet, une banane, un verre de lait entier"></textarea></label>
    <button class="btn btn-primary btn-block" id="txtGo">Calculer</button><div id="zone" style="margin-top:14px"></div>`, (sh) => {
    $('#txtGo', sh).onclick = async () => {
      const t = $('#txt', sh).value.trim(); if (!t) return;
      const zone = $('#zone', sh);
      zone.innerHTML = `<div class="scan" style="aspect-ratio:auto;height:120px"><div class="analyzing"><b>Calcul</b><span>Estimation des portions…</span></div></div>`;
      try { resultEditor(zone, normMeal(await gemini([{ text: PROMPT_TEXT(t) }])), { src: 'text' }, true); }
      catch (e) { zone.innerHTML = `<div class="warn">${esc(e.message)}</div>`; }
    };
  });
}

// Ce que représente un repas dans ta journée : % de chaque objectif + total de la journée après le repas
function dayImpact(m, d, counted = false) {
  const t = dayTotals(d); const g = goalsFor(d);
  const rows = [['kcal', 'Calories', 'kcal'], ['p', 'Protéines', 'g'], ['c', 'Glucides', 'g'], ['f', 'Lipides', 'g']].map(([k, label, u]) => {
    const add = Math.max(0, num(m[k])); const before = Math.max(0, t[k] - (counted ? add : 0)); const after = before + add; const goal = g[k] || 1;
    const pm = (add / goal) * 100, pa = (after / goal) * 100;
    const wB = clamp((before / goal) * 100, 0, 100), wA = clamp(pa, 0, 100) - wB;
    const status = pa >= 100 ? (k === 'kcal' && pa > 110 ? `${fmt(after - goal)} ${u} au-dessus` : 'objectif atteint') : `reste ${fmt(goal - after)} ${u}`;
    return `<div class="imp ${pa >= 100 ? 'full' : ''}"><div class="imp-top"><b>${label}</b><span class="num"><b>${fmt(add)} ${u}</b> = ${fmt(pm)} % de l'objectif</span></div>
      <div class="imp-bar"><i class="was" style="width:${wB.toFixed(1)}%"></i><i class="add" style="width:${Math.max(0, wA).toFixed(1)}%"></i></div>
      <div class="imp-after num">Journée ${counted ? '' : 'après ce repas '}: ${fmt(after)} / ${fmt(goal)} ${u} (${fmt(pa)} %), ${status}</div></div>`;
  }).join('');
  return `<div class="imp-h"><b>Ce repas dans ta journée</b><span class="muted small">${d === today() ? 'aujourd\'hui' : esc(dayLabel(d).toLowerCase())}</span></div>${rows}
    <div class="imp-leg"><span><i class="was"></i>Déjà mangé</span><span><i class="add"></i>Ce repas</span></div>`;
}
function resultEditor(zone, meal, extra, fromAI) {
  const day = UI.tab === 'food' ? UI.foodDay : today();
  const base = { ...meal.total };
  const items = meal.items.length ? `<ul class="result-items">${meal.items.map((x) => `<li><b>${esc(x.name)}</b><span class="num">${x.g ? fmt(x.g) + ' g, ' : ''}${fmt(x.kcal)} kcal</span></li>`).join('')}</ul>` : '';
  zone.insertAdjacentHTML('beforeend', `
    ${meal.note ? `<div class="warn">${esc(meal.note)}</div>` : ''}
    <label class="field"><span>Nom</span><input class="input" id="rName" value="${esc(meal.name)}"></label>
    ${items}
    <div class="field"><span>Portion</span><div class="chips" id="rMul">${[0.5, 0.75, 1, 1.25, 1.5, 2].map((m) => `<button class="chip ${m === 1 ? 'on' : ''}" data-m="${m}">×${fmt(m, m % 1 ? 2 : 0)}</button>`).join('')}</div></div>
    <div class="grid2"><label class="field"><span>Calories (kcal)</span><input class="input num" inputmode="decimal" id="rK"></label><label class="field"><span>Protéines (g)</span><input class="input num" inputmode="decimal" id="rP"></label>
    <label class="field"><span>Glucides (g)</span><input class="input num" inputmode="decimal" id="rC"></label><label class="field"><span>Lipides (g)</span><input class="input num" inputmode="decimal" id="rF"></label></div>
    <div class="impact-day" id="rImp"></div>
    ${fromAI ? `<p class="muted tiny" style="margin:0 0 12px">Estimation IA${meal.confidence ? `, confiance ${esc(meal.confidence)}` : ''}. Une photo peut se tromper de 20 % ou plus : corrige si tu connais les quantités.</p>` : ''}
    <button class="btn btn-primary btn-block" id="rAdd">Ajouter au journal</button>`);
  const imp = () => { const box = $('#rImp', zone); box.innerHTML = dayImpact({ kcal: num($('#rK', zone).value), p: num($('#rP', zone).value), c: num($('#rC', zone).value), f: num($('#rF', zone).value) }, day); setTimeout(() => box.classList.add('ready'), 700); };
  const set = (m) => { $('#rK', zone).value = Math.round(base.kcal * m); $('#rP', zone).value = fmt(base.p * m, 1).replace(/\s/g, ''); $('#rC', zone).value = fmt(base.c * m, 1).replace(/\s/g, ''); $('#rF', zone).value = fmt(base.f * m, 1).replace(/\s/g, ''); zone.dataset.m = m; imp(); };
  set(1);
  ['#rK', '#rP', '#rC', '#rF'].forEach((q) => { $(q, zone).addEventListener('input', imp); });
  $$('#rMul .chip', zone).forEach((b) => b.onclick = () => { $$('#rMul .chip', zone).forEach((x) => x.classList.toggle('on', x === b)); set(+b.dataset.m); });
  $('#rAdd', zone).onclick = () => {
    const m = +zone.dataset.m || 1;
    addFood({ name: $('#rName', zone).value.trim() || meal.name, kcal: num($('#rK', zone).value), p: num($('#rP', zone).value), c: num($('#rC', zone).value), f: num($('#rF', zone).value), fiber: base.fiber * m, sugar: base.sugar * m, ...extra });
  };
}

function openManual() {
  openSheet(`<h3>Saisie manuelle</h3><p class="sub">Recopie l'étiquette ou ce que tu connais.</p><div id="zone"></div>`, (sh) => {
    resultEditor($('#zone', sh), { name: '', items: [], total: { kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0 }, note: '' }, { src: 'manual' }, false);
    $('#rK', sh).value = ''; $('#rP', sh).value = ''; $('#rC', sh).value = ''; $('#rF', sh).value = '';
    $('#rMul', sh).closest('.field').remove();
    $('#rName', sh).placeholder = 'Ex : Skyr nature 150 g';
  });
}

/* ---------- Code-barres ---------- */
let SCAN = null;
function loadScript(src) { return new Promise((res, rej) => { if ($(`script[src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new UserError('Lecteur de code-barres indisponible hors connexion.')); document.head.appendChild(s); }); }
async function getDetector() {
  const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
  if ('BarcodeDetector' in window) {
    try { const sup = await window.BarcodeDetector.getSupportedFormats(); const f = formats.filter((x) => sup.includes(x)); if (f.length) return new window.BarcodeDetector({ formats: f }); } catch (e) { }
  }
  await loadScript('vendor/barcode-detector.js');
  const api = window.BarcodeDetectionAPI;
  api.setZXingModuleOverrides({ locateFile: (p, prefix) => (p.endsWith('.wasm') ? new URL('vendor/zxing_reader.wasm', location.href).href : prefix + p) });
  return new api.BarcodeDetector({ formats });
}
function stopScan() { if (!SCAN) return; SCAN.stop = true; clearTimeout(SCAN.timer); SCAN.stream && SCAN.stream.getTracks().forEach((t) => t.stop()); SCAN = null; }
function openBarcode() {
  openSheet(`<h3>Code-barres</h3><p class="sub">Place le code-barres dans le cadre, il est lu tout seul.</p>
    <div class="scan" id="scanBox"><video playsinline muted autoplay></video><div class="scan-frame"></div></div>
    <div class="row" style="margin-bottom:12px"><button class="btn btn-ghost" id="bcPhoto">${icon('image')} Photo du code</button><button class="btn btn-ghost" id="bcType">${icon('pen')} Taper le numéro</button></div>
    <div id="zone"></div>`, async (sh) => {
    const zone = $('#zone', sh); const box = $('#scanBox', sh); const video = $('video', sh);
    $('#bcType', sh).onclick = () => {
      zone.innerHTML = `<div class="row"><input class="input num" id="bcNum" inputmode="numeric" placeholder="3017620422003"><button class="btn btn-primary" id="bcGo" style="flex:0 0 auto">Chercher</button></div>`;
      $('#bcNum', zone).focus();
      $('#bcGo', zone).onclick = () => { const v = $('#bcNum', zone).value.replace(/\D/g, ''); if (v.length >= 8) onCode(v); };
    };
    $('#bcPhoto', sh).onclick = async () => {
      const file = await pickFile(true); if (!file) return;
      zone.innerHTML = '<p class="muted">Lecture du code…</p>';
      try {
        const det = await getDetector(); const bmp = await createImageBitmap(file);
        const codes = await det.detect(bmp);
        if (codes.length) onCode(codes[0].rawValue);
        else zone.innerHTML = '<div class="warn">Aucun code-barres lu. Rapproche-toi, évite les reflets, ou tape le numéro.</div>';
      } catch (e) { zone.innerHTML = `<div class="warn">${esc(e.message)}</div>`; }
    };
    const onCode = async (code) => {
      stopScan(); haptic([20, 30, 20]); tone(1500, 0.12, 'square', 0.08);
      box.style.display = 'none';
      zone.innerHTML = `<p class="muted">Recherche du produit ${esc(code)}…</p>`;
      try {
        const prod = await fetchOFF(code);
        if (prod) quantityEditor(zone, prod);
        else zone.innerHTML = `<div class="warn">Produit ${esc(code)} introuvable dans Open Food Facts.</div>
          <div class="row"><button class="btn btn-primary" id="lbl">${icon('camera')} Photo de l'étiquette</button><button class="btn btn-ghost" id="man">Saisie manuelle</button></div>`;
        if (!prod) { $('#man', zone).onclick = openManual; $('#lbl', zone).onclick = () => labelAI(zone, code); }
      } catch (e) { zone.innerHTML = `<div class="warn">${esc(e.message)}</div>`; }
    };
    // Caméra en direct
    if (!navigator.mediaDevices?.getUserMedia) { box.style.display = 'none'; return; }
    try {
      SCAN = { stop: false };
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      if (!SCAN) { stream.getTracks().forEach((t) => t.stop()); return; }
      SCAN.stream = stream; video.srcObject = stream; await video.play().catch(() => { });
      const det = await getDetector();
      const loop = async () => {
        if (!SCAN || SCAN.stop) return;
        try { if (video.readyState >= 2) { const c = await det.detect(video); if (c.length && SCAN) return onCode(c[0].rawValue); } } catch (e) { }
        if (SCAN) SCAN.timer = setTimeout(loop, 220);
      };
      loop();
    } catch (e) {
      box.style.display = 'none';
      zone.innerHTML = `<div class="warn">${e.name === 'NotAllowedError' ? 'Accès à la caméra refusé. Autorise-le dans les réglages du téléphone, ou utilise « Photo du code ».' : 'Caméra indisponible. Utilise « Photo du code » ou tape le numéro.'}</div>`;
    }
  }, stopScan);
}
async function fetchOFF(code) {
  let r;
  try { r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_fr,generic_name_fr,brands,image_front_small_url,nutriments,serving_quantity,quantity`); }
  catch (e) { throw new UserError('Pas de connexion internet.'); }
  if (r.status === 404) return null;
  if (!r.ok) throw new UserError('Open Food Facts ne répond pas. Réessaie.');
  const j = await r.json(); if (j.status !== 1 || !j.product) return null;
  const p = j.product, n = p.nutriments || {};
  const kcal = n['energy-kcal_100g'] ?? (n.energy_100g != null ? n.energy_100g / 4.184 : null);
  return { name: p.product_name_fr || p.product_name || p.generic_name_fr || `Produit ${code}`, brand: (p.brands || '').split(',')[0].trim(), img: p.image_front_small_url || '',
    per100: { kcal, p: n.proteins_100g, c: n.carbohydrates_100g, f: n.fat_100g, fiber: n.fiber_100g, sugar: n.sugars_100g, sat: n['saturated-fat_100g'] }, serving: num(p.serving_quantity) || null, code };
}
async function labelAI(zone, code) {
  if (!S.ai.key) { zone.innerHTML = keyMissingHTML(); return; }
  const file = await pickFile(true); if (!file) return;
  zone.innerHTML = '<p class="muted">Lecture de l\'étiquette…</p>';
  try {
    const data = await compress(file, 1400, 0.85);
    const j = await gemini([{ inline_data: { mime_type: 'image/jpeg', data: data.split(',')[1] } }, { text: PROMPT_LABEL }]);
    const p = j.pour100 || {};
    quantityEditor(zone, { name: j.nom || `Produit ${code}`, brand: j.marque || '', img: '', thumb: await squareThumb(data), per100: { kcal: p.kcal, p: p.proteines, c: p.glucides, f: p.lipides, fiber: p.fibres, sugar: p.sucres }, serving: num(j.portion_g) || null, code });
  } catch (e) { zone.innerHTML = `<div class="warn">${esc(e.message)}</div>`; }
}
function quantityEditor(zone, prod) {
  const v = (x) => (x == null || x === '' ? null : num(x));
  const P = { kcal: v(prod.per100.kcal), p: v(prod.per100.p), c: v(prod.per100.c), f: v(prod.per100.f), fiber: v(prod.per100.fiber), sugar: v(prod.per100.sugar), sat: v(prod.per100.sat) };
  const incomplete = P.kcal == null;
  const def = prod.serving || 100;
  const qs = [...new Set([prod.serving, 30, 50, 100, 150, 200, 250].filter(Boolean).map(Math.round))];
  zone.innerHTML = `<div class="product">${prod.img ? `<img src="${esc(prod.img)}" alt="">` : prod.thumb ? `<img src="${prod.thumb}" alt="">` : ''}<div><b>${esc(prod.name)}</b><div class="muted small">${esc(prod.brand || '')}</div></div></div>
    ${incomplete ? '<div class="warn">Valeurs incomplètes pour ce produit. Corrige à la main avant d\'ajouter.</div>' : ''}
    <p class="muted small" style="margin:0 0 8px">Pour 100 g : ${fmt(P.kcal)} kcal, P ${fmt(P.p, 1)} g, G ${fmt(P.c, 1)} g (dont sucres ${fmt(P.sugar, 1)} g), L ${fmt(P.f, 1)} g${P.sat != null ? ` (dont saturés ${fmt(P.sat, 1)} g)` : ''}.</p>
    <div class="field"><span>Quantité mangée (g)</span><div class="stepper"><button data-q="-10">−</button><input class="input num" id="qIn" inputmode="decimal" value="${def}"><button data-q="10">+</button></div></div>
    <div class="chips" style="margin-bottom:12px">${qs.map((q) => `<button class="chip" data-qs="${q}">${q === Math.round(prod.serving || 0) ? 'Portion ' : ''}${q} g</button>`).join('')}</div>
    <div class="tot" id="qTot"></div>
    <div class="impact-day" id="qImp"></div>
    <button class="btn btn-primary btn-block" id="qAdd">Ajouter au journal</button>`;
  const calc = () => { const q = num($('#qIn', zone).value); const k = q / 100; return { q, kcal: (P.kcal || 0) * k, p: (P.p || 0) * k, c: (P.c || 0) * k, f: (P.f || 0) * k, fiber: (P.fiber || 0) * k, sugar: (P.sugar || 0) * k }; };
  const upd = () => { const t = calc(); $('#qTot', zone).innerHTML = `<div><b class="num">${fmt(t.kcal)}</b><span>kcal</span></div><div><b class="num">${fmt(t.p)}</b><span>prot. (g)</span></div><div><b class="num">${fmt(t.c)}</b><span>gluc. (g)</span></div><div><b class="num">${fmt(t.f)}</b><span>lip. (g)</span></div>`; $('#qImp', zone).innerHTML = dayImpact(t, UI.tab === 'food' ? UI.foodDay : today()); setTimeout(() => $('#qImp', zone)?.classList.add('ready'), 700); };
  upd();
  $('#qIn', zone).oninput = upd;
  $$('[data-q]', zone).forEach((b) => b.onclick = () => { $('#qIn', zone).value = Math.max(0, num($('#qIn', zone).value) + +b.dataset.q); upd(); });
  $$('[data-qs]', zone).forEach((b) => b.onclick = () => { $('#qIn', zone).value = b.dataset.qs; upd(); });
  $('#qAdd', zone).onclick = () => { const t = calc(); if (incomplete) { openManualPrefill(prod.name, t); return; } addFood({ name: `${prod.name} (${fmt(t.q)} g)`, ...t, src: 'barcode', img: prod.img || undefined, thumb: prod.thumb }); };
}
function openManualPrefill(name, t) {
  openManual();
  setTimeout(() => { const sh = $('.sheet'); if (!sh) return; $('#rName', sh).value = name; $('#rK', sh).value = Math.round(t.kcal) || ''; $('#rP', sh).value = t.p ? t.p.toFixed(1) : ''; $('#rC', sh).value = t.c ? t.c.toFixed(1) : ''; $('#rF', sh).value = t.f ? t.f.toFixed(1) : ''; }, 50);
}

function openEntry(id) {
  const d = UI.foodDay; const e = (S.food[d] || []).find((x) => x.id === id); if (!e) return;
  const src = { photo: 'Photo + IA', barcode: 'Code-barres', text: 'Description + IA', manual: 'Saisie manuelle' }[e.src] || '';
  openSheet(`${e.thumb ? `<div class="scan" style="aspect-ratio:auto;height:160px"><img src="${e.thumb}" alt=""></div>` : ''}
    <h3>${esc(e.name)}</h3><p class="sub">${typeof e.t === 'number' ? new Date(e.t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + ', ' : ''}${esc(src.toLowerCase())}</p>
    <div class="tot"><div><b class="num">${fmt(e.kcal)}</b><span>kcal</span></div><div><b class="num">${fmt(e.p, 1)}</b><span>prot. (g)</span></div><div><b class="num">${fmt(e.c, 1)}</b><span>gluc. (g)</span></div><div><b class="num">${fmt(e.f, 1)}</b><span>lip. (g)</span></div></div>
    <div class="impact-day">${dayImpact(e, d, true)}</div>
    <p class="muted small">Fibres ${fmt(e.fiber, 1)} g, sucres ${fmt(e.sugar, 1)} g.</p>
    <div class="row"><button class="btn btn-ghost" id="eDup">Rajouter une portion</button><button class="btn btn-ghost" id="eDel">Supprimer</button></div>`, (sh) => {
    $('#eDel', sh).onclick = () => { S.food[d] = S.food[d].filter((x) => x.id !== id); save(); closeSheet(); render(); toast('Supprimé'); };
    $('#eDup', sh).onclick = () => { const { id: _, t, ...rest } = e; addFood(rest, d); };
  });
}

/* ---------- Musculation ---------- */
const REST = { end: 0, total: 0, timer: null, label: 'Repos', endLabel: 'Série suivante' };
function startRest(sec, label = 'Repos', endLabel = 'Série suivante') {
  REST.total = sec; REST.label = label; REST.endLabel = endLabel; REST.end = Date.now() + sec * 1000; clearInterval(REST.timer);
  const pill = $('#rest'); pill.classList.remove('end'); pill.classList.add('on');
  tickRest(); REST.timer = setInterval(tickRest, 250);
}
function tickRest() {
  const left = Math.max(0, REST.end - Date.now()); const s = Math.ceil(left / 1000);
  const C = 2 * Math.PI * 19;
  $('#restT').textContent = left > 0 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : 'Go';
  $('#restL').textContent = left > 0 ? REST.label : REST.endLabel;
  $('#restRing').style.strokeDashoffset = (C * (1 - left / (REST.total * 1000))).toFixed(1);
  if (left <= 0) { clearInterval(REST.timer); $('#rest').classList.add('end'); bell(2); haptic([200, 100, 200]); setTimeout(() => $('#rest').classList.remove('on'), 4000); }
}
function stopRest() { clearInterval(REST.timer); $('#rest').classList.remove('on'); }

function badInput(row, f, msg) {
  const inp = row && $(`[data-f="${f}"]`, row);
  if (inp) { inp.classList.remove('err'); void inp.offsetWidth; inp.classList.add('err'); inp.focus(); }
  haptic([40, 40, 40]); toast(msg);
}
function toggleSet(id, s, k) {
  const e = exInfo(id); const rr = repRange(e); const tr = trainOf(k); const key = `${k}|${id}|${s}`;
  const arr = tr.sets[id] = tr.sets[id] || [];
  // Décocher : la série repasse en brouillon, les chiffres restent dans les cases
  if (isSet(arr[s])) {
    UI.draft[key] = { kg: arr[s].kg != null ? fmtKg(arr[s].kg) : '', reps: arr[s].reps != null ? String(arr[s].reps) : '' };
    arr[s] = null; while (arr.length && !isSet(arr[arr.length - 1])) arr.pop();
    save(); render(); haptic(8); return;
  }
  const card = $(`#ex-${CSS.escape(id)}`); const row = card && $(`.log-r[data-row="${s}"]`, card);
  const kgIn = row ? $('[data-f=kg]', row).value.trim() : ''; const rpIn = row ? $('[data-f=reps]', row).value.trim() : '';
  const ph = prefill(id, k, s);
  const kg = kgIn !== '' ? num(kgIn) : ph.kg; const reps = rpIn !== '' ? Math.round(num(rpIn)) : ph.reps;
  if (kg == null && !e.bw) return badInput(row, 'kg', 'Entre le poids soulevé');
  if (kg != null && (kg < 0 || kg > 400)) return badInput(row, 'kg', 'Poids invalide');
  if (!reps || reps < 1 || reps > 600) return badInput(row, 'reps', rr.sec ? 'Entre la durée en secondes' : 'Entre le nombre de reps');
  // Record ? (comparé à toutes tes séances d'avant et à tes séries du jour)
  const before = sessionsOf(baseOf(id)).filter((x) => x.d < k);
  const prevBest = before.length ? Math.max(...before.map((x) => bestScore(e, x.done))) : 0;
  const set = { kg: kg ?? null, reps };
  const isPR = before.length > 0 && score(e, set) > Math.max(prevBest, bestScore(e, arr.filter(isSet))) + 1e-6;
  arr[s] = set; delete UI.draft[key];
  if (!tr.startedAt) tr.startedAt = Date.now();
  haptic(18); tone(880, 0.08, 'square', 0.05);
  const prog = liftProgress(k);
  if (prog.done < prog.total) startRest(e.rest);
  save(); render();
  const df = $('.day-fig'); if (df) { df.classList.remove('k-rep'); void df.offsetWidth; df.classList.add('k-rep'); }
  const card2 = $(`#ex-${CSS.escape(id)}`);
  const r2 = card2 && $(`.log-r[data-row="${s}"]`, card2); r2 && r2.classList.add('pop');
  const exDone = arr.filter(isSet).length >= e.sets;
  if (exDone && card2) card2.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'cubic-bezier(.2,1.4,.3,1)' });
  if (isPR) prCelebrate(e, set, id);
  else if (exDone && topReached(id, k)) toast(`Haut des reps partout : ${fmtKg(Math.max(...arr.slice(0, e.sets).map((x) => x.kg)) + 2.5)} kg la prochaine fois`);
  else if (prog.done === prog.total && !tr.done) toast('Tout est validé. Termine la séance.', { label: 'Terminer', fn: () => finishWorkout(k) });
}
function prCelebrate(e, set, id) {
  haptic([20, 40, 20, 40, 90]);
  tone(880, 0.12, 'triangle', 0.2); tone(1320, 0.12, 'triangle', 0.2, 0.1); tone(1760, 0.35, 'triangle', 0.22, 0.2);
  const row = $(`#ex-${CSS.escape(id)} .log-r.pr`); if (row) row.classList.add('new');
  toast(`Record battu : ${e.name}, ${setTxt(set, e)}`);
}
function finishWorkout(k) {
  const tr = trainOf(k); const plan = dayPlan(dow(k)); const prog = liftProgress(k);
  const st = sessionStats(k); const burn = sum(sportItems(k, 'actual'), (x) => x.kcal);
  tr.done = true; tr.finishedAt = Date.now(); save(); stopRest(); render();
  const sub = st.prs.length ? `${st.prs.length > 1 ? `${st.prs.length} records battus` : 'Record battu'} : ${st.prs.join(', ')}.` : QUOTES[Math.floor(Math.random() * QUOTES.length)];
  impact({ kicker: `${plan.day}, ${plan.title}`, title: 'Séance terminée', sub,
    stats: [{ v: st.sets, l: 'séries' }, { v: fmt(st.vol), l: 'kg soulevés' }, { v: fmt(burn), l: 'kcal brûlées' }] });
  if (prog.done < prog.total) setTimeout(() => toast(`${prog.total - prog.done} élément(s) non validés aujourd'hui.`), 600);
}

function openExInfo(id) {
  const e = exInfo(id); const imgKey = IMG_CACHE[id] ? id : (e.ref && IMG_CACHE[e.ref] ? e.ref : id);
  const img = IMG_CACHE[imgKey];
  const ses = sessionsOf(baseOf(id)).slice(0, 3);
  const q = encodeURIComponent(`${e.name} technique`);
  openSheet(`<h3>${esc(e.name)}</h3><p class="sub">${e.sets} séries de ${esc(e.reps)}, repos ${e.rest >= 120 ? '2 min' : '1 min'}.</p>
    <div class="figs">${bodySVG('front', e.p, e.s, { label: 'Face' })}${bodySVG('back', e.p, e.s, { label: 'Dos' })}</div>
    <div class="legend"><span><i class="p"></i>${e.p.map((m) => MUSCLE_NAMES[m]).join(', ')}</span>${e.s.length ? `<span><i class="s"></i>${e.s.map((m) => MUSCLE_NAMES[m]).join(', ')}</span>` : ''}</div>
    <ol class="cues">${e.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
    ${img ? `<img class="user-img" src="${img}" alt="Ton image de référence">` : ''}
    <div class="row" style="margin-bottom:10px"><a class="btn btn-ghost" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">${icon('video')} Voir en vidéo</a>
    <button class="btn btn-ghost" id="exImg">${icon('image')} ${img ? 'Changer l\'image' : 'Ajouter une image'}</button></div>
    ${img ? '<button class="btn btn-ghost btn-block" id="exImgDel" style="margin-bottom:10px">Retirer mon image</button>' : ''}
    <p class="muted tiny" style="margin:0 0 14px">Tu peux attacher une capture d'écran d'un tuto : elle remplacera la planche dans la liste.</p>
    ${ses.length ? `<div class="panel"><div class="panel-title"><h2>Tes dernières séances</h2></div>${ses.map((x) => `<div class="hist"><span>${esc(dateShort(x.d))}</span><b class="num">${esc(sessionTxt(x.done, e))}</b></div>`).join('')}
      <button class="btn btn-ghost btn-block" style="margin-top:12px" data-act="ex-hist" data-id="${baseOf(id)}">${icon('chart')} Voir toute la progression</button></div>` : ''}`, (sh) => {
    $('#exImg', sh).onclick = async () => {
      const f = await pickFile(false); if (!f) return;
      const data = await compress(f, 900, 0.8); await IDB.put(imgKey, data); IMG_CACHE[imgKey] = data; closeSheet(); render(); toast('Image ajoutée');
    };
    const del = $('#exImgDel', sh); if (del) del.onclick = async () => { await IDB.del(imgKey); delete IMG_CACHE[imgKey]; closeSheet(); render(); };
  });
}
const dateShort = (d) => fromKey(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

// Historique complet d'un exercice : courbe de force, records, toutes les séances
function openExHist(base) {
  const e = exInfo(base); const rr = repRange(e); const ses = sessionsOf(base);
  if (!ses.length) { openSheet(`<h3>${esc(e.name)}</h3><div class="empty">Pas encore de séance. Valide ta première série dans Training.</div>`); return; }
  const weighted = ses.some((x) => x.done.some((y) => y.kg));
  const metric = rr.sec ? 'Charge par main (kg)' : weighted ? 'Force estimée : 1RM (kg)' : 'Reps max';
  const val = (b) => (rr.sec ? b.kg || 0 : weighted ? e1rm(b.kg, b.reps) : b.reps || 0);
  const pts = [...ses].reverse().map((x) => { const b = bestSet(e, x.done); return { t: fromKey(x.d).getTime(), v: val(b), tip: `${dateShort(x.d)} : ${setTxt(b, e)}${!rr.sec && weighted && b.kg ? `, 1RM estimé ${fmt(e1rm(b.kg, b.reps), 1)} kg` : ''}` }; });
  const all = ses.flatMap((x) => x.done);
  const heavy = all.filter((x) => x.kg != null).sort((a, b) => b.kg - a.kg || (b.reps || 0) - (a.reps || 0))[0];
  const bestE = Math.max(...pts.map((p) => p.v));
  const bestVol = Math.max(...ses.map((x) => volume(e, x.done)));
  const first = pts[0].v, last = pts[pts.length - 1].v; const delta = first ? ((last - first) / first) * 100 : 0;
  openSheet(`<h3>${esc(e.name)}</h3><p class="sub">${ses.length} séance${ses.length > 1 ? 's' : ''}${pts.length > 1 ? `, ${delta >= 0 ? '+' : ''}${fmt(delta)} % depuis la première` : ''}.</p>
    <div class="tot rec"><div><b class="num">${fmt(bestE, weighted && !rr.sec ? 1 : 0)}</b><span>${rr.sec ? 'kg max' : weighted ? '1RM estimé' : 'reps max'}</span></div>
      <div><b class="num">${heavy ? fmtKg(heavy.kg) : '–'}</b><span>${heavy ? `kg max (× ${heavy.reps ?? '?'})` : 'kg max'}</span></div>
      <div><b class="num">${bestVol ? fmt(bestVol) : '–'}</b><span>volume max (kg)</span></div></div>
    <section class="panel"><div class="panel-title"><h2>${metric}</h2></div>${lineChart(pts, { dec: weighted && !rr.sec ? 1 : 0 })}</section>
    <p class="muted tiny" style="margin:-4px 0 14px">${weighted && !rr.sec ? 'Le 1RM estimé (formule d\'Epley) combine poids et reps : il monte quand tu prends du poids ou quand tu fais plus de reps à la même charge.' : 'Touche un point de la courbe pour voir la séance.'}</p>
    <section class="panel"><div class="panel-title"><h2>Toutes les séances</h2></div>
    ${ses.slice(0, 40).map((x) => `<div class="hist hist-ses"><span>${esc(dateShort(x.d))}</span><b class="num">${esc(sessionTxt(x.done, e))}</b>${volume(e, x.done) ? `<span class="muted num">${fmt(volume(e, x.done))} kg</span>` : '<span></span>'}</div>`).join('')}</section>`);
}

// Courbe générique (une seule série). Touche un point pour lire sa valeur.
function lineChart(pts, { dec = 0 } = {}) {
  const W = 340, H = 170, P = { l: 36, r: 12, t: 12, b: 22 };
  const ys = pts.map((p) => p.v); let minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = Math.max(1, (maxY - minY) * 0.2); minY = Math.max(0, minY - pad); maxY += pad;
  const x0 = pts[0].t, x1 = pts[pts.length - 1].t;
  const X = (t) => (pts.length === 1 ? (P.l + W - P.r) / 2 : P.l + ((t - x0) / Math.max(1, x1 - x0)) * (W - P.l - P.r));
  const Y = (v) => P.t + (1 - (v - minY) / Math.max(1e-6, maxY - minY)) * (H - P.t - P.b);
  const c = pts.map((p) => [X(p.t), Y(p.v)]);
  let len = 0; for (let i = 1; i < c.length; i++) len += Math.hypot(c[i][0] - c[i - 1][0], c[i][1] - c[i - 1][1]);
  const line = c.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const area = c.length > 1 ? `<path class="area" d="${line}L${c[c.length - 1][0].toFixed(1)},${H - P.b}L${c[0][0].toFixed(1)},${H - P.b}Z"/>` : '';
  const grid = [0, 0.5, 1].map((f) => { const v = minY + (maxY - minY) * f; const y = Y(v); return `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="0" y="${(y + 4).toFixed(1)}">${fmt(v, dec && maxY - minY < 10 ? 1 : 0)}</text>`; }).join('');
  const hits = c.map((p, i) => { const a = i ? (c[i - 1][0] + p[0]) / 2 : P.l; const b = i < c.length - 1 ? (p[0] + c[i + 1][0]) / 2 : W - P.r; return `<rect class="hit" x="${a.toFixed(1)}" y="0" width="${Math.max(1, b - a).toFixed(1)}" height="${H}" data-tip="${esc(pts[i].tip)}" data-i="${i}"/>`; }).join('');
  const dots = c.map((p, i) => `<circle class="dot ${i === c.length - 1 ? 'on' : ''}" data-i="${i}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4"/>`).join('');
  const fmtD = (t) => new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `<div class="chart-wrap"><svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Évolution">${grid}${area}
    ${c.length > 1 ? `<path class="line draw" d="${line}" style="--len:${Math.ceil(len) + 2}"/>` : ''}${dots}
    <text x="${P.l}" y="${H - 5}">${fmtD(x0)}</text>${c.length > 1 ? `<text x="${W - P.r}" y="${H - 5}" text-anchor="end">${fmtD(x1)}</text>` : ''}${hits}</svg>
    <p class="chart-tip">${esc(pts[pts.length - 1].tip)}</p></div>`;
}

/* ---------- Minuteur de rounds (boxe) ---------- */
let RT = null;
function startRounds(key) {
  const preset = BOX_PRESETS[key]; const w = Math.min(boxWeek(), 12);
  const pool = [...new Set(BOX_WEEKS.slice(Math.max(0, w - 3), w).flatMap((x) => x.combos))];
  const steps = [{ type: 'prep', label: 'Prépare-toi', dur: 8 }];
  preset.blocks.forEach((b, bi) => {
    for (let r = 1; r <= b.rounds; r++) {
      steps.push({ type: 'work', label: b.label, round: r, of: b.rounds, dur: b.work, calls: b.calls, defense: b.defense, note: b.note });
      const lastOfAll = bi === preset.blocks.length - 1 && r === b.rounds;
      if (!lastOfAll) steps.push({ type: 'rest', label: 'Repos', dur: b.rest || 10, next: r < b.rounds ? b.label : preset.blocks[bi + 1].label });
    }
  });
  const totalDur = steps.reduce((s, x) => s + x.dur, 0);
  const el = document.createElement('div'); el.className = 'rt'; el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="rt-bar"><i></i></div><div class="rt-top"><span class="rt-seg"></span><button class="icon-btn" data-x aria-label="Quitter">${icon('close')}</button></div>
    <div class="rt-mid"><div class="rt-phase"></div><div class="rt-time num"></div><div class="rt-round"></div><div class="rt-call"></div><div class="rt-note"></div></div>
    <div class="row"><button class="btn btn-ghost" data-p>Pause</button><button class="btn btn-primary" data-n>Passer</button></div>`;
  document.body.appendChild(el);
  RT = { steps, i: 0, end: 0, paused: 0, el, key, totalDur, pool, nextCall: 0, timer: null, wake: null };
  try { navigator.wakeLock?.request('screen').then((l) => { if (RT) RT.wake = l; }).catch(() => { }); } catch (e) { }
  audio();
  const begin = (i) => {
    RT.i = i; const st = steps[i]; if (!st) return endRounds(true);
    RT.end = Date.now() + st.dur * 1000; RT.warned = false; RT.nextCall = Date.now() + 2500;
    el.classList.toggle('rest', st.type === 'rest');
    $('.rt-seg', el).textContent = `${preset.name}`;
    $('.rt-phase', el).textContent = st.type === 'work' ? st.label : st.type === 'rest' ? 'Repos' : 'Prêt';
    $('.rt-round', el).textContent = st.type === 'work' ? (st.of > 1 ? `${preset.kind === 'sprint' ? 'Sprint' : 'Round'} ${st.round} sur ${st.of}` : '') : st.type === 'rest' ? `Ensuite : ${st.next}` : preset.kind === 'sprint' ? '6 sprints de 20 s à fond' : `Semaine ${w} : ${BOX_WEEKS[w - 1].focus}`;
    $('.rt-note', el).textContent = st.note || '';
    $('.rt-call', el).textContent = '';
    if (st.type === 'work') { bell(3); haptic([80, 60, 80]); } else if (st.type === 'rest') { bell(1); haptic(120); }
  };
  const tick = () => {
    if (!RT || RT.paused) return;
    const st = steps[RT.i]; const left = Math.max(0, RT.end - Date.now()); const s = Math.ceil(left / 1000);
    $('.rt-time', el).textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
    const elapsed = steps.slice(0, RT.i).reduce((a, x) => a + x.dur, 0) + (st.dur - left / 1000);
    $('.rt-bar i', el).style.setProperty('--f', clamp(elapsed / totalDur, 0, 1));
    if (st.type === 'work' && s === 10 && !RT.warned && st.dur > 20) { RT.warned = true; tone(1800, 0.05, 'square', 0.1); tone(1800, 0.05, 'square', 0.1, 0.15); }
    if (st.type === 'work' && st.calls && Date.now() >= RT.nextCall && left > 2500) {
      const list = st.defense ? DEFENSE_CALLS : pool; const c = list[Math.floor(Math.random() * list.length)];
      const call = $('.rt-call', el); call.textContent = c; call.classList.remove('flash'); void call.offsetWidth; call.classList.add('flash'); say(c);
      RT.nextCall = Date.now() + 3800 + Math.random() * 3200;
    }
    if (st.type === 'prep' && s <= 3 && s > 0 && RT.lastBeep !== s) { RT.lastBeep = s; tone(990, 0.1, 'sine', 0.2); }
    if (left <= 0) begin(RT.i + 1);
  };
  $('[data-x]', el).onclick = () => endRounds(false);
  $('[data-n]', el).onclick = () => begin(RT.i + 1);
  $('[data-p]', el).onclick = (ev) => {
    if (RT.paused) { RT.end = Date.now() + RT.paused; RT.paused = 0; ev.target.textContent = 'Pause'; }
    else { RT.paused = Math.max(0, RT.end - Date.now()); ev.target.textContent = 'Reprendre'; try { speechSynthesis.cancel(); } catch (e) { } }
  };
  begin(0); RT.timer = setInterval(tick, 200); tick();
}
function endRounds(completed) {
  if (!RT) return; const { el, key, totalDur } = RT;
  clearInterval(RT.timer); try { RT.wake && RT.wake.release(); } catch (e) { } try { speechSynthesis.cancel(); } catch (e) { }
  RT = null; el.remove();
  if (!completed) return;
  if (BOX_PRESETS[key].kind === 'sprint') { finishSprints(totalDur); return; }
  const k = today(); const plan = dayPlan(dow(k)); const task = [...plan.before, ...plan.after].find((id) => TASKS[id].preset === key);
  const kcal = Math.round(boxKcal(key));
  if (task) trainOf(k).tasks[task] = true;
  else (S.extra[k] = S.extra[k] || []).push({ id: uid(), name: `Boxe : ${BOX_PRESETS[key].name.toLowerCase()}`, mins: BOX_PRESETS[key].mins, kcal });
  save(); render();
  impact({ kicker: 'Boxe', title: 'Rounds terminés', sub: 'La technique se grave à force de répétitions. Encore.', stats: [{ v: Math.round(totalDur / 60), l: 'minutes' }, { v: fmt(kcal), l: 'kcal brûlées' }, { v: `S${Math.min(boxWeek(), 12)}`, l: 'semaine' }] });
}

/* ---------- Poids ---------- */
function saveWeight() {
  const kg = num($('#wIn').value); const d = $('#wDate').value || today();
  if (kg < 30 || kg > 250) { toast('Poids invalide'); return; }
  const before = projectPct();
  S.weights = S.weights.filter((x) => x.d !== d); S.weights.push({ d, kg: +kg.toFixed(1) }); save();
  const after = projectPct(); render(); haptic(20);
  toast(`Pesée enregistrée : ${fmt(kg, 1)} kg`);
  for (let m = 1; m <= 10; m++) {
    if (after >= m * 10 && before < m * 10 && !S.milestones[m]) {
      S.milestones[m] = today(); save();
      impact({ kicker: 'Projet Toji', hero: 'power', title: `${m * 10} %`, sub: m === 10 ? 'Objectif atteint. Tu l\'as construit, rep après rep.' : 'Un palier de plus. Rien n\'a été donné, tout a été pris.', stats: [{ v: fmt(kg, 1), l: 'kg' }] });
    }
  }
}

/* ---------- Réglages ---------- */
function openSettings() {
  const p = S.profile, g = S.goals;
  openSheet(`<h3>Réglages</h3><p class="sub">Tout reste sur ton téléphone.</p>
    <section class="panel"><div class="panel-title"><h2>Profil</h2></div>
      <div style="display:flex;gap:14px;align-items:center;margin-bottom:14px"><div class="avatar" style="width:64px;height:64px">${p.avatar ? `<img src="${p.avatar}" alt="">` : EMBLEM}</div>
      <div style="display:grid;gap:8px;flex:1"><button class="btn btn-ghost" id="avPick" style="min-height:42px">Changer la photo</button>${p.avatar ? '<button class="btn btn-ghost" id="avDel" style="min-height:42px">Remettre l\'emblème</button>' : ''}</div></div>
      <div class="grid3"><label class="field"><span>Taille (cm)</span><input class="input num" inputmode="decimal" id="sH" value="${p.height}"></label>
      <label class="field"><span>Départ (kg)</span><input class="input num" inputmode="decimal" id="sS" value="${p.start}"></label>
      <label class="field"><span>Objectif (kg)</span><input class="input num" inputmode="decimal" id="sT" value="${p.target}"></label></div>
      <label class="field"><span>Âge</span><input class="input num" inputmode="numeric" id="sA" value="${p.age}"></label>
      <div class="field"><span>Hors sport, ta journée</span><div class="opts" id="sAct">${ACT_LEVELS.map((a) => `<button class="opt ${a.v === p.act ? 'on' : ''}" data-v="${a.v}"><b>${esc(a.name)}</b><span>${esc(a.sub)}</span></button>`).join('')}</div></div></section>
    <section class="panel"><div class="panel-title"><h2>Objectifs par jour</h2></div>
      <div class="seg" id="gMode" style="margin-bottom:12px"><button class="${g.mode === 'auto' ? 'on' : ''}" data-m="auto">Auto</button><button class="${g.mode !== 'auto' ? 'on' : ''}" data-m="fixed">Fixe</button></div>
      <div id="gAutoBox" class="${g.mode === 'auto' ? '' : 'hidden'}">
        <div class="grid2"><label class="field"><span>Surplus (kcal)</span><input class="input num" inputmode="numeric" id="gSur" value="${g.surplus}"></label>
        <label class="field"><span>Protéines (g)</span><input class="input num" inputmode="decimal" id="gP2" value="${g.p}"></label></div>
        <p class="muted tiny" style="margin:0">Chaque jour : objectif = calories dépensées estimées + surplus. Plus haut les jours d'entraînement, plus bas les jours de repos. Lipides 27 % des calories, glucides pour le reste. Aujourd'hui : <b class="num" id="gPrev">${fmt(goalsFor(today()).kcal)}</b> kcal.</p></div>
      <div id="gFixBox" class="${g.mode === 'auto' ? 'hidden' : ''}">
      <div class="grid2"><label class="field"><span>Calories (kcal)</span><input class="input num" inputmode="decimal" id="gK" value="${g.kcal}"></label>
      <label class="field"><span>Protéines (g)</span><input class="input num" inputmode="decimal" id="gP" value="${g.p}"></label>
      <label class="field"><span>Glucides (g)</span><input class="input num" inputmode="decimal" id="gC" value="${g.c}"></label>
      <label class="field"><span>Lipides (g)</span><input class="input num" inputmode="decimal" id="gF" value="${g.f}"></label></div>
      <button class="btn btn-ghost btn-block" id="gAuto">Répartir glucides et lipides automatiquement</button>
      <p class="muted tiny" style="margin:10px 0 0">Le même objectif tous les jours. Le coach de l'onglet Poids ajuste selon ta vraie prise.</p></div></section>
    <section class="panel"><div class="panel-title"><h2>IA photo (gratuit)</h2></div>
      <ol class="rules small" style="margin-bottom:12px"><li>Ouvre <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> et connecte-toi avec Google.</li><li>Clique « Create API key », copie la clé.</li><li>Colle-la ici, puis « Tester ».</li></ol>
      <label class="field"><span>Clé API Gemini</span><input class="input" id="aK" type="password" autocomplete="off" value="${esc(S.ai.key)}" placeholder="AIza…"></label>
      <label class="field"><span>Modèle (laisse « auto » : l'app choisit le plus rapide)</span><input class="input" id="aM" value="${esc(S.ai.model === 'gemini-flash-latest' ? 'auto' : S.ai.model)}" placeholder="auto"></label>
      <button class="btn btn-ghost btn-block" id="aTest">Tester la clé</button><p class="small" id="aRes" style="margin:8px 0 0"></p></section>
    <section class="panel"><div class="panel-title"><h2>Sons et voix</h2></div>
      <div class="row"><button class="chip ${S.prefs.sound ? 'on' : ''}" id="pS">Sons ${S.prefs.sound ? 'activés' : 'coupés'}</button><button class="chip ${S.prefs.voice ? 'on' : ''}" id="pV">Coach vocal ${S.prefs.voice ? 'activé' : 'coupé'}</button></div></section>
    <section class="panel"><div class="panel-title"><h2>Boxe</h2></div>
      <label class="field"><span>Début du cycle de 12 semaines</span><input class="input" type="date" id="bS" value="${S.boxStart}"></label></section>
    <section class="panel"><div class="panel-title"><h2>Données</h2></div>
      <div class="row" style="margin-bottom:10px"><button class="btn btn-ghost" id="dExp">Exporter</button><button class="btn btn-ghost" id="dImp">Importer</button></div>
      <button class="btn btn-ghost btn-block" id="dDel">Tout effacer</button>
      <p class="muted tiny" style="margin:10px 0 0">Exporte une sauvegarde de temps en temps : si tu supprimes l'app, les données partent avec.</p></section>
    <button class="btn btn-primary btn-block" id="sSave" style="min-height:56px">Enregistrer</button>`, (sh) => {
    const v = (id) => num($('#' + id, sh).value);
    let mode = g.mode === 'auto' ? 'auto' : 'fixed'; let act = p.act;
    $$('#gMode button', sh).forEach((b) => b.onclick = () => { mode = b.dataset.m; $$('#gMode button', sh).forEach((x) => x.classList.toggle('on', x === b)); $('#gAutoBox', sh).classList.toggle('hidden', mode !== 'auto'); $('#gFixBox', sh).classList.toggle('hidden', mode === 'auto'); haptic(5); });
    $$('#sAct .opt', sh).forEach((b) => b.onclick = () => { act = +b.dataset.v; $$('#sAct .opt', sh).forEach((x) => x.classList.toggle('on', x === b)); haptic(5); });
    $('#avPick', sh).onclick = async () => { const f = await pickFile(false); if (!f) return; const data = await compress(f, 600, 0.85); S.profile.avatar = await squareThumb(data, 256); save(); renderTop(); closeSheet(); openSettings(); };
    const avDel = $('#avDel', sh); if (avDel) avDel.onclick = () => { S.profile.avatar = null; save(); renderTop(); closeSheet(); openSettings(); };
    $('#gAuto', sh).onclick = () => { const k = v('gK'), pr = v('gP'); const f = Math.round(k * 0.27 / 9); $('#gF', sh).value = f; $('#gC', sh).value = Math.max(0, Math.round((k - pr * 4 - f * 9) / 4)); };
    $('#pS', sh).onclick = (e) => { S.prefs.sound = !S.prefs.sound; e.target.classList.toggle('on', S.prefs.sound); e.target.textContent = `Sons ${S.prefs.sound ? 'activés' : 'coupés'}`; save(); };
    $('#pV', sh).onclick = (e) => { S.prefs.voice = !S.prefs.voice; e.target.classList.toggle('on', S.prefs.voice); e.target.textContent = `Coach vocal ${S.prefs.voice ? 'activé' : 'coupé'}`; save(); if (S.prefs.voice) say('1-2'); };
    $('#aTest', sh).onclick = async () => {
      const out = $('#aRes', sh); out.textContent = 'Test en cours…';
      const old = { ...S.ai }; S.ai.key = $('#aK', sh).value.trim(); S.ai.model = $('#aM', sh).value.trim() || 'auto'; S.ai.models = null;
      const t0 = Date.now();
      try { const j = await gemini([{ text: 'Réponds uniquement {"ok":true}' }]); const m = S.ai.models; out.textContent = `Clé valide, réponse en ${fmt((Date.now() - t0) / 1000, 1)} s.${m ? ` Modèles : ${m.main} et ${m.fast}.` : ''}`; save(); }
      catch (e) { out.textContent = e.message; S.ai.model = old.model; }
    };
    $('#dExp', sh).onclick = exportData;
    $('#dImp', sh).onclick = importData;
    $('#dDel', sh).onclick = () => { if (confirm('Tout effacer ? Repas, pesées, séances. Impossible à annuler.')) { localStorage.removeItem(STORE_KEY); location.reload(); } };
    $('#sSave', sh).onclick = () => {
      S.profile.height = v('sH') || 183; S.profile.start = v('sS') || 68; S.profile.target = v('sT') || 86;
      S.profile.age = clamp(Math.round(v('sA')) || 18, 12, 99); S.profile.act = act;
      const prot = mode === 'auto' ? v('gP2') : v('gP');
      S.goals = { mode, surplus: $('#gSur', sh).value.trim() === '' ? 400 : clamp(Math.round(v('gSur')), 0, 1200), kcal: v('gK') || 3100, p: prot || 130, c: v('gC'), f: v('gF') };
      S.ai.key = $('#aK', sh).value.trim(); S.ai.model = $('#aM', sh).value.trim() || 'auto';
      S.boxStart = $('#bS', sh).value || S.boxStart;
      save(); closeSheet(); render(); toast('Réglages enregistrés');
    };
  });
}
async function exportData() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const name = `projet-toji-${today()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: 'Sauvegarde Projet Toji' }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function importData() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try { const j = JSON.parse(await inp.files[0].text()); if (!j || !j.profile) throw new Error(); S = merge(DEFAULTS(), j); save(); closeSheet(); render(true); toast('Sauvegarde importée'); }
    catch (e) { toast('Fichier invalide'); }
  };
  inp.click();
}

/* ---------- Actions (clics) ---------- */
const ACT = {
  'hero-tap': (el) => heroTap(el),
  tab: (el) => { if (sheetClose) closeSheet(); if (el.dataset.sub) { UI.progTab = el.dataset.sub; if (UI.tab === el.dataset.tab) { render(true); return; } } goTab(el.dataset.tab); },
  settings: () => openSettings(),
  'food-day': (el) => { const n = +el.dataset.n; const d = addDays(UI.foodDay, n); if (d > today()) return; UI.foodDay = d; render(); },
  'add-photo': () => openPhoto(), 'add-barcode': () => openBarcode(), 'add-text': () => openText(), 'add-manual': () => openManual(),
  recent: (el) => { const r = S.recents[+el.dataset.i]; if (r) { const { ...x } = r; addFood(x, UI.foodDay); } },
  entry: (el) => openEntry(el.dataset.id),
  'train-day': (el) => { UI.trainDay = +el.dataset.i; render(); },
  set: (el) => toggleSet(el.dataset.id, +el.dataset.s, el.dataset.k),
  'ex-swap': (el) => openSwap(el.dataset.slot, el.dataset.k),
  'day-reset': (el) => openReset(el.dataset.k),
  'years-open': () => openYears(),
  'grow-check': (el) => toggleGrow(el.dataset.id),
  'grow-timer': (el) => { startRest(+el.dataset.sec, 'Tiens', 'Côté suivant'); haptic(10); },
  'grow-sprint': () => startRounds('sprint'),
  'h-save': () => saveHeight(),
  'parents-save': () => saveParents(),
  'set-add': (el) => { const { id, k } = el.dataset; const tr = trainOf(k); const e = exInfo(id); tr.n[id] = nRows(tr, id, e) + 1; save(); render(); haptic(8); },
  'set-del': (el) => { const { id, k } = el.dataset; const tr = trainOf(k); const e = exInfo(id); const n = nRows(tr, id, e); if (n > e.sets && !isSet((tr.sets[id] || [])[n - 1])) { tr.n[id] = n - 1; delete UI.draft[`${k}|${id}|${n - 1}`]; save(); render(); } },
  'ex-hist': (el) => openExHist(el.dataset.id),
  'prog-tab': (el) => { UI.progTab = el.dataset.t; render(); haptic(6); },
  'add-act': (el) => openActivity(el.dataset.k || today()),
  'act-del': (el) => { const { d, id } = el.dataset; S.extra[d] = (S.extra[d] || []).filter((x) => x.id !== id); if (!S.extra[d].length) delete S.extra[d]; save(); render(); toast('Activité supprimée'); },
  'ex-info': (el) => openExInfo(el.dataset.id),
  task: (el) => {
    const k = el.dataset.k, id = el.dataset.id; const tr = trainOf(k); tr.tasks[id] = !tr.tasks[id]; save(); render(); haptic(15);
    if (tr.tasks[id]) tone(880, 0.08, 'square', 0.05);
    const plan = dayPlan(dow(k));
    if (plan.rest && tr.tasks[id] && isDone(k) && !tr.restCeleb) { tr.restCeleb = true; save(); impact({ kicker: `${plan.day}, repos actif`, title: 'Journée validée', sub: 'Même les jours de repos, tu avances.', auto: 4500 }); }
  },
  finish: (el) => finishWorkout(el.dataset.k),
  'box-start': (el) => startRounds(el.dataset.preset),
  'w-step': (el) => { const i = $('#wIn'); i.value = fmt(Math.max(30, num(i.value) + +el.dataset.d), 1).replace(/\s/g, ''); haptic(5); },
  'w-save': () => saveWeight(),
  'w-del': (el) => { S.weights = S.weights.filter((x) => x.d !== el.dataset.d); save(); render(); },
  'kcal-adj': (el) => {
    const d = +el.dataset.d;
    if (S.goals.mode === 'auto') { S.goals.surplus = clamp((S.goals.surplus ?? 400) + d, 0, 1200); save(); render(); toast(`Surplus : +${fmt(S.goals.surplus)} kcal par jour`); return; }
    S.goals.kcal += d; S.goals.c = Math.max(0, S.goals.c + Math.round(d / 4)); save(); render(); toast(`Objectif : ${fmt(S.goals.kcal)} kcal par jour`);
  },
};
document.addEventListener('click', (ev) => {
  const tip = ev.target.closest('[data-tip]');
  if (tip) {
    const wrap = tip.closest('.chart-wrap'); const out = wrap && $('.chart-tip', wrap);
    if (out) { out.textContent = tip.dataset.tip; $$('[data-i].dot, [data-i].bar', wrap).forEach((d) => d.classList.toggle('on', d.dataset.i === tip.dataset.i)); haptic(5); }
    return;
  }
  const el = ev.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (fn) { ev.preventDefault(); fn(el, ev); }
});
document.addEventListener('input', (ev) => {
  const t = ev.target; if (!t.matches('.log-in')) return;
  const { k, id, f } = t.dataset; const s = +t.dataset.s; const v = t.value.trim();
  const rec = S.train[k]?.sets?.[id]?.[s];
  if (isSet(rec)) { // série déjà validée : on corrige directement
    if (f === 'kg') rec.kg = v === '' ? null : num(v); else if (v !== '') rec.reps = Math.round(num(v));
    save();
  } else (UI.draft[`${k}|${id}|${s}`] = UI.draft[`${k}|${id}|${s}`] || {})[f] = t.value;
});
document.addEventListener('keydown', (ev) => {
  const t = ev.target; if (ev.key !== 'Enter' || !t.matches('.log-in')) return;
  ev.preventDefault(); const row = t.closest('.log-r');
  if (t.dataset.f === 'kg') $('[data-f=reps]', row).focus();
  else { t.blur(); if (!row.classList.contains('on')) $('.log-ok', row).click(); }
});
document.addEventListener('pointerdown', () => audio(), { once: true });
$('#restSkip').onclick = stopRest;
$('#restAdd').onclick = () => { REST.end += 30000; REST.total += 30; $('#rest').classList.remove('end'); clearInterval(REST.timer); REST.timer = setInterval(tickRest, 250); tickRest(); };

/* ---------- Changer d'exercice / annuler une séance ---------- */
function openSwap(slot, k) {
  const cur = effId(k, slot); const ce = exInfo(cur); const opts = swapOptions(k, slot);
  const has = (S.train[k]?.sets?.[cur] || []).some(isSet);
  const item = (id) => {
    const e = exInfo(id); const last = sessionsOf(baseOf(id))[0];
    return `<button class="opt" data-alt="${id}"><b>${esc(e.name)}${id === slot ? ' (programme)' : ''}</b><span>${e.p.map((m) => MUSCLE_NAMES[m]).join(', ')}, ${e.sets} × ${esc(e.reps)}${last ? `. Dernière fois : ${esc(sessionTxt(last.done, e))}` : ''}</span></button>`;
  };
  openSheet(`<h3>Changer d'exercice</h3><p class="sub">Machine prise ? Remplace ${esc(ce.name)}.</p>
    <div class="opts">${opts.map(item).join('')}</div>
    <label class="keep"><input type="checkbox" id="swKeep" ${S.swaps[slot] ? 'checked' : ''}><span>Garder ce choix pour les prochaines séances</span></label>
    ${has ? `<p class="muted tiny" style="margin:8px 0 0">Tes séries déjà notées sur ${esc(ce.name)} restent dans ton historique.</p>` : ''}`, (sh) => {
    $$('[data-alt]', sh).forEach((b) => { b.onclick = () => {
      const alt = b.dataset.alt; const tr = trainOf(k); tr.swap = tr.swap || {}; tr.swap[slot] = alt;
      if ($('#swKeep', sh).checked && alt !== slot) S.swaps[slot] = alt; else delete S.swaps[slot];
      save(); closeSheet(); render(); haptic(12); toast(alt === slot ? `Retour à ${exInfo(slot).name}` : `${exInfo(alt).name} à la place de ${exInfo(slot).name}`);
    }; });
  });
}
function openReset(k) {
  const plan = dayPlan(dow(k));
  openSheet(`<h3>Annuler cette séance ?</h3><p class="sub">${esc(plan.day)} ${esc(dateShort(k))} : les séries notées, les cases cochées et la validation de ce jour seront effacées.</p>
    <div class="row"><button class="btn btn-ghost" id="rsNo">Garder</button><button class="btn btn-primary" id="rsYes">Effacer</button></div>`, (sh) => {
    $('#rsNo', sh).onclick = () => closeSheet();
    $('#rsYes', sh).onclick = () => {
      const backup = S.train[k]; delete S.train[k]; save(); closeSheet(); stopRest(); render(); haptic([20, 40, 20]);
      toast(`Séance de ${plan.day.toLowerCase()} effacée`, { label: 'Annuler', fn: () => { S.train[k] = backup; save(); render(); } });
    };
  });
}

/* ---------- GROW ---------- */
function vGrow() {
  const t = today(); const g = S.grow; const log = g.log[t] || {};
  const hs = [...g.heights].sort((a, b) => (a.d < b.d ? -1 : 1)); const last = hs[hs.length - 1];
  const cur = last ? last.cm : S.profile.height;
  const head = `<div class="day-head has-fig"><div class="day-fig" data-act="hero-tap">${heroSVG('idle', { crop: 'upper', sparks: 5 })}</div><h1>Grow</h1><p>Atteindre ta taille max : sommeil, nutrition, posture. Sans promesse magique.</p></div>`;

  const delta = hs.length > 1 ? cur - hs[0].cm : 0;
  const chart = hs.length > 1 ? lineChart(hs.map((x) => ({ t: fromKey(x.d).getTime(), v: x.cm, tip: `${dateShort(x.d)} : ${fmt(x.cm, 1)} cm` })), { dec: 1 }) : '';
  const due = !last || daysBetween(last.d, t) >= 28;
  const size = `<section class="panel strong toned"><div class="gw-top"><div class="gw-big num">${fmt(cur, 1)}<small>cm</small></div>
    <div class="gw-meta">${last ? `Mesuré ${esc(dayLabel(last.d).toLowerCase())}` : 'Pas encore mesuré dans l\'app'}${hs.length > 1 ? `<br><b class="num">${delta >= 0 ? '+' : ''}${fmt(delta, 1)} cm</b> depuis le ${esc(dateShort(hs[0].d))}` : ''}</div></div>
    ${chart}
    <div class="gw-in"><input id="hIn" class="input num" inputmode="decimal" placeholder="${fmt(cur, 1)}" aria-label="Ta taille en cm"><span>cm</span><button class="btn btn-primary" data-act="h-save">Enregistrer</button></div>
    <p class="muted tiny" style="margin:10px 0 0">${due ? '<b>À faire ce mois-ci.</b> ' : ''}Le matin au réveil, pieds nus, talons, fesses et tête contre le mur, un livre à plat sur la tête. Une fois par mois suffit.</p></section>`;

  const { f, m } = g.parents; const tgt = f && m ? (f + m + 13) / 2 : null;
  const target = `<section class="panel"><div class="panel-title"><h2>Ta taille cible</h2><span class="muted small">génétique</span></div>
    <div class="gw-par"><label><span>Père</span><input id="pF" class="input num" inputmode="decimal" value="${f ?? ''}" placeholder="cm"></label><label><span>Mère</span><input id="pM" class="input num" inputmode="decimal" value="${m ?? ''}" placeholder="cm"></label><button class="btn btn-ghost" data-act="parents-save">Calculer</button></div>
    ${tgt ? `<div class="gw-tgt"><b class="num">${fmt(tgt, 1)} cm</b><span>fourchette probable : ${fmt(tgt - 8.5, 1)} à ${fmt(tgt + 8.5, 1)} cm</span></div>
      <p class="muted small" style="margin:8px 0 0">${cur >= tgt ? 'Tu as déjà atteint la valeur moyenne de ta taille cible. Le reste se joue sur la posture.' : `Il te reste ${fmt(tgt - cur, 1)} cm jusqu'à la valeur moyenne. C'est une estimation, pas une promesse.`}</p>`
      : '<p class="muted small" style="margin:8px 0 0">Formule des pédiatres : (taille du père + taille de la mère + 13) ÷ 2, à plus ou moins 8,5 cm.</p>'}</section>`;

  const mon = mondayOf(t); let sessions = 0, sprints = 0;
  for (let j = 0; j < 7; j++) { const L = g.log[addDays(mon, j)] || {}; if (GROW_ROUTINE.filter((x) => L[x.id]).length >= 5) sessions++; if (L.sprint) sprints++; }
  const nDone = GROW_ROUTINE.filter((x) => log[x.id]).length;
  let lastStep = '';
  const items = GROW_ROUTINE.map((x) => {
    const lab = x.step !== lastStep ? `<div class="gw-step">${esc(x.step)}</div>` : ''; lastStep = x.step;
    return lab + `<div class="task ${log[x.id] ? 'done' : ''}"><button class="check" data-act="grow-check" data-id="${x.id}" aria-label="Cocher ${esc(x.name)}">${icon('check')}</button>
      <div style="flex:1"><b>${esc(x.name)}</b><span>${esc(x.detail)}</span>${x.sec ? `<br><button class="go" data-act="grow-timer" data-sec="${x.sec}">Minuteur ${x.sec >= 60 ? `${x.sec / 60} min` : `${x.sec} s`}</button>` : ''}</div></div>`;
  }).join('');
  const routine = `<div class="block-label">Routine posture</div>
    <section class="panel"><div class="gw-week"><b class="num">${sessions}<small>/3</small></b><p class="muted small">Séances posture cette semaine. Fais-la 2 à 3 fois par semaine, 20 min. Une séance compte à partir de 5 exercices cochés. Aujourd'hui : ${nDone}/${GROW_ROUTINE.length}.</p></div></section>${items}`;

  const sprint = `<div class="block-label">Sprints</div><section class="panel strong">
    <div class="panel-title"><h2>6 × 20 s à fond</h2><span class="muted small num">${sprints} cette semaine</span></div>
    <p class="small" style="margin:0 0 10px">Échauffement 8 min, puis 6 sprints de 20 s à 100 % avec 1 min de marche entre chaque. 1 à 2 fois par semaine, idéalement le lundi ou le vendredi : 48 h loin de la pliométrie et du dunk.</p>
    <p class="muted small" style="margin:0 0 14px">Le vrai : un sprint fait monter l'hormone de croissance un moment, mais aucune étude ne montre que ça fait grandir. Par contre, ça travaille ta vitesse et ta détente pour le dunk. Pas à jeun.</p>
    <div class="row"><button class="btn btn-primary" data-act="grow-sprint">${icon('play')} Lancer</button><button class="btn btn-ghost" data-act="grow-check" data-id="sprint">${log.sprint ? icon('check') + ' Faits' : 'Cocher faits'}</button></div></section>`;

  const list = (arr) => `<ul class="rules">${arr.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;
  const tips = `<div class="block-label">Conseils</div>
    <details class="panel" open><summary>Sommeil : c'est là que tu grandis</summary>${list(GROW_TIPS.sleep)}</details>
    <details class="panel"><summary>Manger pour grandir</summary>${list(GROW_TIPS.food)}</details>
    <details class="panel"><summary>La vérité sur la taille</summary>${list(GROW_TIPS.truth)}</details>
    <details class="panel"><summary>Sources</summary><ul class="rules">${GROW_SOURCES.map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(n)}</a></li>`).join('')}</ul></details>`;
  return head + size + target + routine + sprint + tips;
}
function toggleGrow(id) {
  const t = today(); const L = (S.grow.log[t] = S.grow.log[t] || {});
  if (L[id]) delete L[id]; else L[id] = true;
  const n = GROW_ROUTINE.filter((x) => L[x.id]).length;
  save(); render(); haptic(L[id] ? 14 : 6);
  if (!L[id] || id === 'sprint') return;
  if (n === GROW_ROUTINE.length) impact({ kicker: 'Grow', title: 'Posture faite', hero: 'power', sub: 'Dos droit, épaules ouvertes. Tiens-toi comme ça toute la journée.', auto: 4200 });
  else if (n === 5) toast('Séance posture validée pour la semaine');
}
function saveHeight() {
  const cm = num($('#hIn').value); if (!(cm >= 120 && cm <= 230)) { toast('Entre ta taille en cm, par exemple 183,5'); return; }
  const t = today(); S.grow.heights = S.grow.heights.filter((x) => x.d !== t); S.grow.heights.push({ d: t, cm: +cm.toFixed(1) });
  S.profile.height = Math.round(cm); save(); render(); haptic(20); toast(`Taille enregistrée : ${fmt(cm, 1)} cm`);
}
function saveParents() {
  const f = num($('#pF').value), m = num($('#pM').value);
  if (!(f >= 140 && f <= 220) || !(m >= 130 && m <= 210)) { toast('Entre les deux tailles en cm'); return; }
  S.grow.parents = { f, m }; save(); render();
}
function finishSprints(totalDur) {
  const t = today(); const kcal = Math.round(boxKcal('sprint'));
  (S.grow.log[t] = S.grow.log[t] || {}).sprint = true;
  (S.extra[t] = S.extra[t] || []).push({ id: uid(), name: 'Sprints', mins: Math.round(totalDur / 60), kcal });
  save(); render();
  impact({ kicker: 'Grow', title: 'Sprints terminés', hero: 'win', sub: 'Vitesse et détente. Maintenant mange : yaourt, banane, miel.', stats: [{ v: 6, l: 'sprints' }, { v: fmt(kcal), l: 'kcal brûlées' }] });
}

/* ---------- Démarrage ---------- */
async function init() {
  try { Object.assign(IMG_CACHE, await IDB.all()); } catch (e) { }
  render(true);
  if (!S.welcomed) {
    S.welcomed = true; save();
    setTimeout(() => impact({ kicker: 'Bienvenue', hero: 'power', title: 'Projet Toji', sub: `De ${S.profile.start} à ${S.profile.target} kg. Chaque repas, chaque série compte.`, stats: [{ v: '0 %', l: 'talent' }, { v: '100 %', l: 'travail' }] }), 900);
  }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
  // Rafraîchit quand on revient sur l'app un autre jour
  let lastDay = today();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && today() !== lastDay) { lastDay = today(); UI.foodDay = today(); UI.trainDay = dow(today()); render(); } });
}
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => { });
init();
