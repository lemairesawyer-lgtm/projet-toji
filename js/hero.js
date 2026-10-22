/* =========================================================
   PROJET TOJI — Kuro, le guerrier de l'app (personnage ORIGINAL)
   Illustrations manga noir et blanc détourées (img/kuro/*.webp, fond transparent) animées en CSS :
   respiration, aura qui pulse, yeux qui brillent, étincelles qui montent.
   Poses : idle, flex, win, guard, curl, power
   ========================================================= */

// Position des yeux dans chaque image (en % de la largeur / hauteur)
const KURO = {
  idle: [[46.3, 14.6], [52.1, 14.6]],
  flex: [[46.7, 14.6], [52.5, 14.6]],
  win: [[48.3, 28.2], [52.9, 28.2]],
  guard: [[45.4, 16.6], [51.5, 16.6]],
  curl: [[46.9, 14.9], [51.8, 14.9]],
  power: [[45.5, 48.3], [53.7, 48.3]],
};
// Cadrages : [x, y, largeur, hauteur] de la zone visible, en fraction de l'image
const KURO_CROP = {
  full: [0, 0, 1, 1],
  upper: [0.1, 0.03, 0.8, 0.56],
  bust: [0.2, 0.05, 0.6, 0.42],
};
const kuroSrc = (p) => `img/kuro/${p}.webp`;

// Précharge les poses pour que le changement au toucher soit instantané
(() => { if (typeof Image === 'undefined') return; Object.keys(KURO).forEach((p) => { const i = new Image(); i.src = kuroSrc(p); }); })();

function kuroBody(pose) {
  const eyes = (KURO[pose] || KURO.idle).map(([x, y]) => `<i class="k-eye" style="left:${x}%;top:${y}%"></i>`).join('');
  return `<img class="k-bloom" src="${kuroSrc(pose)}" alt="" aria-hidden="true" draggable="false"><img class="k-img" src="${kuroSrc(pose)}" alt="" draggable="false">${eyes}`;
}

function heroSVG(pose = 'idle', opts = {}) {
  if (!KURO[pose]) pose = 'idle';
  const [cx, cy, cw, ch] = KURO_CROP[opts.crop || 'full'];
  const sparks = Array.from({ length: opts.sparks ?? 9 }, (_, i) => {
    const x = 14 + ((i * 37) % 72), d = ((i * 0.53) % 3).toFixed(2), t = (2.4 + (i % 4) * 0.45).toFixed(2), s = 2 + (i % 3);
    return `<span class="k-sp" style="left:${x}%;width:${s}px;height:${s}px;animation-delay:-${d}s;animation-duration:${t}s"></span>`;
  }).join('');
  return `<div class="kwrap ${opts.cls || ''}" style="aspect-ratio:${(cw * 848).toFixed(0)}/${(ch * 1264).toFixed(0)}" role="img" aria-label="Kuro, le guerrier">
    <div class="kuro" data-pose="${pose}" style="width:${(100 / cw).toFixed(2)}%;transform:translate(${(-cx * 100).toFixed(2)}%,${(-cy * 100).toFixed(2)}%)">
      <div class="k-body">${kuroBody(pose)}</div>
    </div>${sparks}</div>`;
}

// Au toucher : Kuro passe en double biceps (ou lève le poing), flash + secousse, puis revient
function heroTap(el, force) {
  const k = el.querySelector('.kuro'); if (!k) return;
  const base = k.dataset.base || k.dataset.pose; k.dataset.base = base;
  const next = force || (base === 'flex' ? 'win' : 'flex');
  const swap = (p) => { k.dataset.pose = p; k.querySelector('.k-body').innerHTML = kuroBody(p); };
  swap(next);
  el.classList.remove('k-hit'); void el.offsetWidth; el.classList.add('k-hit');
  clearTimeout(k._t); k._t = setTimeout(() => { swap(base); el.classList.remove('k-hit'); }, 2600);
  try { navigator.vibrate && navigator.vibrate([15, 30, 40]); } catch (e) { }
}
