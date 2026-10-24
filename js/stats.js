/* =========================================================
   PROJET TOJI — Calculs : journal de séries, records, calories dépensées
   ========================================================= */

/* ---------- Dépense calorique ----------
   Valeurs MET du Compendium of Physical Activities 2024 (code entre parenthèses).
   Dépense nette d'une activité = (MET − 1) × poids (kg) × durée (h).
   On retire 1 MET parce que le repos est déjà compté dans le métabolisme de base. */
const MET = {
  heavy: 5.0,   // 02052 musculation lourde (squat, soulevé), repos 2 min
  iso: 3.5,     // 02054 musculation, plusieurs exercices, 8-15 reps
  warm: 3.5,    // 02030 exercices légers à modérés (échauffement)
  plyo: 3.8,    // 02022 exercices au poids du corps, effort modéré (sauts avec longs repos)
  hang: 2.8,    // 02024 effort léger (suspension, gainage)
  dribble: 6.0, // 15050 basket hors match
  dunk: 5.0,    // 15070 basket, tirs au panier
  box: 5.8,     // 15110 boxe, sac de frappe (le shadow n'a pas d'entrée : valeur la plus proche)
  core: 2.8,    // 02024 gainage
  walk: 3.5,    // 17160 marche (repos entre les sprints)
  sprint: 11.0, // estimation : course très rapide (le Compendium n'a pas d'entrée « sprint »)
};
// Tâches du programme : [type MET, minutes]
const TASK_BURN = { 'jump-warmup': ['warm', 10], plyo: ['plyo', 12], deadhang: ['hang', 3], dribble: ['dribble', 25], dunk: ['dunk', 20] };

// Activités en plus (hors programme)
const EXTRA_ACTS = [
  { id: 'walk', name: 'Marche', met: 3.5 },          // 17160
  { id: 'brisk', name: 'Marche rapide', met: 4.8 },  // 17200
  { id: 'jog', name: 'Footing', met: 7.5 },          // 12020
  { id: 'bike', name: 'Vélo', met: 6.8 },            // 01011
  { id: 'bball', name: 'Basket (match)', met: 8.0 }, // 15040
  { id: 'shoot', name: 'Basket (shoot)', met: 5.0 }, // 15070
  { id: 'foot', name: 'Foot', met: 7.0 },            // 15610
  { id: 'swim', name: 'Natation', met: 6.0 },        // 18310
  { id: 'bag', name: 'Sac de frappe', met: 5.8 },    // 15110
  { id: 'spar', name: 'Sparring', met: 7.8 },        // 15120
  { id: 'lift', name: 'Muscu en plus', met: 3.5 },   // 02054
  { id: 'hike', name: 'Randonnée', met: 6.0 },       // 17080
];

// Activité hors sport (multiplie le métabolisme de base)
const ACT_LEVELS = [
  { v: 1.25, name: 'Plutôt assis', sub: 'Cours, écrans, peu de marche' },
  { v: 1.4, name: 'Je bouge un peu', sub: 'Trajets à pied, escaliers, sorties' },
  { v: 1.55, name: 'Debout toute la journée', sub: 'Job ou stage en magasin' },
];

const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);
function netKcal(met, mins) { return Math.max(0, (met - 1) * currentWeight() * mins / 60); }
// Formule de Mifflin-St Jeor (homme)
function bmr() { const p = S.profile; return 10 * currentWeight() + 6.25 * (p.height || 183) - 5 * (p.age || 18) + 5; }
function baseBurn() { return bmr() * (S.profile.act || 1.4); }

function boxKcal(key) {
  if (BOX_PRESETS[key].kind === 'sprint') return sum(BOX_PRESETS[key].blocks, (b) => (b.label === 'Sprint' ? netKcal(MET.sprint, (b.rounds * b.work) / 60) + netKcal(MET.walk, (b.rounds * b.rest) / 60) : netKcal(MET.warm, (b.rounds * b.work) / 60)));
  return sum(BOX_PRESETS[key].blocks, (b) => netKcal(MET[b.label === 'Échauffement' ? 'warm' : b.label === 'Gainage' ? 'core' : 'box'], (b.rounds * b.work) / 60));
}
function taskBurn(id) {
  const t = TASKS[id]; if (!t) return null;
  if (t.preset) { const p = BOX_PRESETS[t.preset]; return { name: `Boxe : ${p.name.toLowerCase()}`, mins: p.mins, kcal: boxKcal(t.preset) }; }
  const b = TASK_BURN[id]; if (!b) return null;
  return { name: t.name, mins: b[1], kcal: netKcal(MET[b[0]], b[1]) };
}
const setMins = (e) => 0.75 + e.rest / 60; // ~45 s d'effort + le repos
const liftMet = (e) => (e.rest >= 120 ? MET.heavy : MET.iso);

// Liste des activités du jour. mode 'actual' = ce que tu as validé, 'plan' = ce qui est prévu
function sportItems(k, mode = 'actual') {
  const plan = dayPlan(dow(k)); const tr = S.train[k] || { sets: {}, tasks: {} }; const items = [];
  if (mode === 'plan') {
    if (plan.lifts.length) {
      let m = 8, kc = netKcal(MET.warm, 8);
      plan.lifts.forEach((id) => { const e = exInfo(id); m += e.sets * setMins(e); kc += netKcal(liftMet(e), e.sets * setMins(e)); });
      items.push({ name: 'Musculation', mins: m, kcal: kc });
    }
    [...plan.before, ...plan.after].forEach((id) => { if (TASKS[id].preset === 'light') return; const v = taskBurn(id); if (v) items.push(v); });
  } else {
    let m = 0, kc = 0;
    for (const id in tr.sets || {}) {
      const e = exInfo(id); if (!e) continue;
      const n = (tr.sets[id] || []).filter(isSet).length; if (!n) continue;
      m += n * setMins(e); kc += netKcal(liftMet(e), n * setMins(e));
    }
    if (m) items.push({ name: 'Musculation', mins: m + 8, kcal: kc + netKcal(MET.warm, 8) });
    for (const id in tr.tasks || {}) if (tr.tasks[id]) { const v = taskBurn(id); if (v) items.push(v); }
  }
  (S.extra[k] || []).forEach((x) => items.push({ name: x.name, mins: x.mins, kcal: x.kcal, extra: x.id }));
  return items;
}
// Dépense totale estimée d'une journée
function dayBurn(k) {
  const base = baseBurn();
  let items = sportItems(k, 'actual'); let planned = false;
  if (k >= today() && !S.train[k]?.done) {
    const p = sportItems(k, 'plan');
    if (sum(p, (x) => x.kcal) > sum(items, (x) => x.kcal) + 1) { items = p; planned = true; }
  }
  const sport = sum(items, (x) => x.kcal);
  return { base, sport, total: base + sport, items, planned };
}
// Objectifs du jour (auto = dépense estimée + surplus)
function goalsFor(k) {
  const g = S.goals;
  if (g.mode !== 'auto') return { kcal: g.kcal, p: g.p, c: g.c, f: g.f, auto: false };
  const kcal = Math.round((dayBurn(k).total + (g.surplus ?? 400)) / 10) * 10;
  const p = g.p || 130; const f = Math.round((kcal * 0.27) / 9);
  return { kcal, p, c: Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4)), f, auto: true };
}

/* ---------- Journal de séries ---------- */
const isSet = (x) => !!x && typeof x === 'object';
const baseOf = (id) => (EX[id] && EX[id].ref) || id;
const fmtKg = (v) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
function repRange(e) {
  const sec = /s\b/.test(e.reps); const m = String(e.reps).match(/(\d+)(?:\s*-\s*(\d+))?/);
  const lo = m ? +m[1] : 8; const hi = m && m[2] ? +m[2] : lo;
  return { lo, hi, sec };
}
function nRows(tr, id, e) { return Math.max(e.sets, (tr && tr.n && tr.n[id]) || 0); }
// Score d'une série : 1RM estimé (Epley) si chargé, sinon reps
function e1rm(kg, reps) { if (!kg) return 0; const r = clamp(reps || 1, 1, 30); return r === 1 ? kg : kg * (1 + r / 30); }
function score(e, x) {
  if (!isSet(x)) return 0;
  if (repRange(e).sec) return x.kg ? x.kg + (x.reps || 0) / 1000 : x.reps || 0;
  return x.kg ? e1rm(x.kg, x.reps) : x.reps || 0;
}
function setTxt(x, e) {
  const rr = repRange(e);
  return `${x.kg != null ? fmtKg(x.kg) + ' × ' : ''}${x.reps != null ? x.reps : '?'}${rr.sec ? ' s' : ''}`;
}
// Résumé lisible d'une séance : « 50 kg : 12 / 11 / 9 » ou « 50 × 12 / 52,5 × 10 »
function sessionTxt(done, e) {
  const rr = repRange(e); const kgs = [...new Set(done.map((x) => x.kg))];
  if (kgs.length === 1) return `${kgs[0] != null ? fmtKg(kgs[0]) + ' kg : ' : ''}${done.map((x) => (x.reps != null ? x.reps : '?')).join(' / ')}${rr.sec ? ' s' : ' reps'}`;
  return done.map((x) => setTxt(x, e)).join(' / ');
}

// Toutes les séances d'un exercice (les variantes du samedi comptent avec celles du lundi)
function sessionsOf(base) {
  const out = [];
  for (const d of Object.keys(S.train).sort().reverse()) {
    const tr = S.train[d]; if (!tr.sets) continue;
    for (const id in tr.sets) {
      if (baseOf(id) !== base) continue;
      const arr = tr.sets[id] || []; const done = arr.filter(isSet);
      if (done.length) out.push({ d, id, arr, done });
    }
  }
  return out;
}
function prevSession(id, k) { return sessionsOf(baseOf(id)).find((s) => s.d < k) || null; }
function bestScore(e, done) { return Math.max(0, ...done.map((x) => score(e, x))); }
function bestSet(e, done) { let b = null; done.forEach((x) => { if (!b || score(e, x) > score(e, b)) b = x; }); return b; }
function volume(e, done) { return repRange(e).sec ? 0 : sum(done, (x) => (x.kg && x.reps ? x.kg * x.reps : 0)); }

// Règle du programme : haut des reps sur toutes les séries la dernière fois → +2,5 kg
function suggestion(id, k) {
  const e = exInfo(id); const rr = repRange(e); const prev = prevSession(id, k); if (!prev) return null;
  const planned = prev.arr.slice(0, e.sets);
  if (planned.length < e.sets || !planned.every((x) => isSet(x) && x.kg != null && (x.reps || 0) >= rr.hi)) return null;
  return { kg: Math.max(...planned.map((x) => x.kg)) + 2.5, from: Math.max(...planned.map((x) => x.kg)) };
}
function topReached(id, k) {
  const e = exInfo(id); const rr = repRange(e); const arr = (S.train[k]?.sets?.[id] || []).slice(0, e.sets);
  return arr.length >= e.sets && arr.every((x) => isSet(x) && x.kg != null && (x.reps || 0) >= rr.hi);
}
// Valeurs proposées pour une série (le placeholder gris)
function prefill(id, k, s) {
  const e = exInfo(id); const rr = repRange(e); const cur = S.train[k]?.sets?.[id] || [];
  const prev = prevSession(id, k); const sug = suggestion(id, k);
  let kg = null;
  for (let j = s - 1; j >= 0; j--) if (isSet(cur[j]) && cur[j].kg != null) { kg = cur[j].kg; break; }
  if (kg == null) {
    if (sug) kg = sug.kg;
    else if (prev && isSet(prev.arr[s]) && prev.arr[s].kg != null) kg = prev.arr[s].kg;
    else if (prev) { const last = [...prev.done].reverse().find((x) => x.kg != null); kg = last ? last.kg : null; }
    else kg = S.loads[id] ?? S.loads[baseOf(id)] ?? null;
  }
  let reps = rr.lo;
  if (!sug && prev && isSet(prev.arr[s]) && prev.arr[s].kg === kg && prev.arr[s].reps) reps = prev.arr[s].reps;
  return { kg, reps };
}
// Record du jour : index de la meilleure série si elle bat toutes les séances précédentes
function prIndex(id, k) {
  const e = exInfo(id); const arr = S.train[k]?.sets?.[id] || []; const done = arr.filter(isSet); if (!done.length) return -1;
  const before = sessionsOf(baseOf(id)).filter((s) => s.d < k); if (!before.length) return -1;
  const prevBest = Math.max(...before.map((s) => bestScore(e, s.done)));
  let bi = -1, bs = 0; arr.forEach((x, i) => { const sc = score(e, x); if (isSet(x) && sc > bs) { bs = sc; bi = i; } });
  return bs > prevBest + 1e-6 ? bi : -1;
}
// Bilan d'une séance : séries, volume, records
function sessionStats(k) {
  const tr = S.train[k] || {}; let sets = 0, vol = 0; const prs = [];
  for (const id in tr.sets || {}) {
    const e = exInfo(id); if (!e) continue; const done = (tr.sets[id] || []).filter(isSet);
    sets += done.length; vol += volume(e, done);
    if (prIndex(id, k) >= 0) prs.push(e.name);
  }
  return { sets, vol, prs };
}
function rangeStats(a, b) {
  let sets = 0, vol = 0, sessions = 0;
  for (const d in S.train) {
    if (d < a || d > b) continue; let any = false;
    for (const id in S.train[d].sets || {}) {
      const e = exInfo(id); if (!e) continue; const done = (S.train[d].sets[id] || []).filter(isSet);
      if (done.length) any = true; sets += done.length; vol += volume(e, done);
    }
    if (any) sessions++;
  }
  return { sets, vol, sessions };
}
// Nombre de records battus depuis une date
function prCountSince(since) {
  let n = 0;
  const bases = [...new Set(Object.values(S.train).flatMap((tr) => Object.keys(tr.sets || {}).map(baseOf)))];
  bases.forEach((b) => {
    const e = exInfo(b); if (!e) return; let best = null;
    sessionsOf(b).reverse().forEach((s) => { const sc = bestScore(e, s.done); if (best != null && sc > best + 1e-6 && s.d >= since) n++; best = Math.max(best ?? 0, sc); });
  });
  return n;
}
