/* =========================================================
   PROJET TOJI — Planche anatomique (dessin original en SVG)
   Mannequin face + dos, muscles ciblés surlignés.
   ========================================================= */

// Moitié gauche du corps (elle est copiée en miroir pour la droite)
const BODY_FRONT = [
  { m: 'traps', d: 'M91,58 Q84,64 70,66 Q80,71 92,68 Z' },
  { m: 'deltS', d: 'M70,67 Q57,68 52,80 Q49,92 53,103 L63,101 Q59,88 62,77 Q65,71 71,72 Z' },
  { m: 'deltF', d: 'M72,73 Q66,72 63.5,78 Q61,89 64.5,100 L70,97 Q69.5,86 72.5,79 Z' },
  { m: 'chestU', d: 'M98.5,70.5 L93,69 Q81,71 74,77 L72.5,86 Q86,88.5 98.5,90 Z' },
  { m: 'chest', d: 'M98.5,91.5 Q86,90 72.5,88 Q70.5,100 76,108 Q88,116 98.5,112.5 Z' },
  { m: 'bi', d: 'M53.5,105 Q47.5,119 50,136 L61.5,138 Q67.5,122 65.5,103 Z' },
  { m: 'fore', d: 'M49.5,140 Q43.5,158 41.5,183 L51.5,185 Q59.5,164 61.5,142 Z' },
  { base: 1, d: 'M40,188 Q46,186 52,189 L53,200 Q48,206 42,203 Z' },
  { m: 'obl', d: 'M85,115 Q76.5,113 74.5,122 L76,157 Q80,170 85.5,175 Z' },
  { m: 'abs', d: 'M87.5,115.5 H98.5 V127.5 H87.5 Z' },
  { m: 'abs', d: 'M87.5,130 H98.5 V142.5 H87.5 Z' },
  { m: 'abs', d: 'M87.5,145 H98.5 V158 H87.5 Z' },
  { m: 'abs', d: 'M87.5,160.5 H98.5 V188 Q92,182 87.5,173 Z' },
  { m: 'quad', d: 'M74,180 Q64,206 65.5,240 Q69,262 80,268 L94,268 Q98.5,238 98.5,197 Q90,192 85,184 Z' },
  { base: 1, d: 'M77,271 Q86,268 94,271 L93,282 Q86,286 78,282 Z' },
  { m: 'calf', d: 'M76.5,286 Q71,316 77.5,350 L88.5,352 Q96,318 93.5,286 Q86,289 76.5,286 Z' },
  { base: 1, d: 'M78,355 L90,355 Q95,365 93,372 L71,372 Q71,363 78,355 Z' },
];

const BODY_BACK = [
  { m: 'traps', d: 'M99,50 L91,58 Q82,64 70,67 Q81,73 89,83 L99,118 Z' },
  { m: 'deltR', d: 'M69,68 Q56,69 51.5,81 Q49,93 53,104 L63,101 Q64,88 73,79 Q72,72 69,68 Z' },
  { m: 'upb', d: 'M88,85 Q80,75 74.5,80 Q67,88 72,97 Q85,100 96.5,107 Z' },
  { m: 'lats', d: 'M71.5,99 Q66,121 75,150 Q87,163 96,167 L96.5,133 Q90,112 71.5,99 Z' },
  { m: 'low', d: 'M92,130 Q94,123 98.5,119 L98.5,181 Q92,178 90,172 Q88.5,150 92,130 Z' },
  { m: 'tri', d: 'M53.5,106 Q47.5,121 50,138 L61.5,140 Q67.5,122 64,102 Z' },
  { m: 'fore', d: 'M49.5,142 Q43.5,159 41.5,183 L51.5,185 Q59.5,164 61.5,144 Z' },
  { base: 1, d: 'M40,188 Q46,186 52,189 L53,200 Q48,206 42,203 Z' },
  { m: 'glu', d: 'M75,178 Q65,194 71.5,213 Q86,224 98.5,216 L98.5,184 Q88,176 75,178 Z' },
  { m: 'ham', d: 'M70,218 Q64,242 70,265 L94.5,267 Q98.5,244 98.5,221 Q86,227 70,218 Z' },
  { base: 1, d: 'M71,270 Q84,268 95,271 L94,280 Q84,284 72,280 Z' },
  { m: 'calf', d: 'M73,284 Q66,304 72,326 Q80,337 90,329 Q96,306 92,284 Q83,288 73,284 Z' },
  { base: 1, d: 'M76,331 L89,331 L88,354 L79,354 Z' },
  { base: 1, d: 'M77,356 L90,356 Q94,364 93,370 L72,370 Q72,362 77,356 Z' },
];

const MUSCLE_NAMES = {
  chestU: 'Haut des pecs', chest: 'Pectoraux', deltF: 'Épaules (avant)', deltS: 'Épaules (côté)',
  deltR: 'Épaules (arrière)', bi: 'Biceps', tri: 'Triceps', fore: 'Avant-bras', abs: 'Abdos',
  obl: 'Obliques', traps: 'Trapèzes', lats: 'Dorsaux', upb: 'Haut du dos', low: 'Bas du dos',
  glu: 'Fessiers', quad: 'Quadriceps', ham: 'Ischios', calf: 'Mollets',
};

function bodySVG(view, primary = [], secondary = [], opts = {}) {
  const shapes = view === 'back' ? BODY_BACK : BODY_FRONT;
  const cls = (s) => {
    if (s.base) return 'b-base';
    if (primary.includes(s.m)) return 'b-on';
    if (secondary.includes(s.m)) return 'b-sec';
    return 'b-off';
  };
  const half = shapes.map((s) => `<path class="${cls(s)}" d="${s.d}"/>`).join('');
  const head = view === 'back'
    ? '<ellipse class="b-base" cx="100" cy="30" rx="15" ry="19"/><path class="b-base" d="M92,46 H108 L109,58 H91 Z"/>'
    : '<ellipse class="b-base" cx="100" cy="30" rx="15" ry="19"/><path class="b-base" d="M93,46 H107 L109,58 H91 Z"/>';
  const label = opts.label ? `<text x="100" y="394" class="b-label">${opts.label}</text>` : '';
  const vb = opts.crop === 'upper' ? '36 44 128 156' : opts.crop === 'lower' ? '52 168 96 200' : '30 0 140 400';
  return `<svg class="body ${opts.cls || ''}" viewBox="${vb}" role="img" aria-label="Muscles ciblés, vue ${view === 'back' ? 'de dos' : 'de face'}">
    ${head}<g>${half}</g><g transform="translate(200 0) scale(-1 1)">${half}</g>${label}</svg>`;
}

// Zoom de la vignette : haut du corps ou jambes
function bestCrop(primary) {
  const legs = ['quad', 'ham', 'glu', 'calf'];
  return primary.every((m) => legs.includes(m)) ? 'lower' : primary.some((m) => legs.includes(m)) ? 'full' : 'upper';
}

// Choisit la vue la plus parlante pour la vignette
function bestView(primary) {
  const backM = ['lats', 'upb', 'low', 'deltR', 'tri', 'ham', 'glu'];
  const n = primary.filter((m) => backM.includes(m)).length;
  return n > primary.length / 2 ? 'back' : 'front';
}
