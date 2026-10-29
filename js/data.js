/* =========================================================
   PROJET TOJI — Données : programme, exercices, boxe, citations
   Tu peux modifier ce fichier pour changer ton programme.
   ========================================================= */

// Muscles : chestU (haut pecs), chest (pecs), deltF (épaule avant), deltS (épaule côté),
// deltR (épaule arrière), bi, tri, fore (avant-bras), abs, obl (obliques), traps,
// lats (dorsaux), upb (haut du dos), low (bas du dos), glu (fessiers), quad, ham (ischios), calf (mollets)

const EX = {
  'incline-smith': { name: 'Incline Smith press', sets: 3, reps: '6-10', rest: 120,
    p: ['chestU'], s: ['deltF', 'tri'],
    cues: ['Banc à 30°, la barre descend vers le haut des pecs.', 'Omoplates serrées et basses, pieds bien ancrés au sol.', 'Descends en 2 secondes, touche légèrement, pousse fort.', 'Coudes à environ 45° du buste, pas ouverts à 90°.'] },
  'chest-press': { name: 'Chest press machine', sets: 3, reps: '8-10', rest: 120,
    p: ['chest'], s: ['chestU', 'deltF', 'tri'],
    cues: ['Règle le siège : poignées au niveau du milieu des pecs.', 'Dos plaqué au dossier, poitrine sortie.', 'Pousse sans verrouiller les coudes, reviens lentement.'] },
  'cable-fly': { name: 'Cable fly / pec deck', sets: 3, reps: '10-12', rest: 60,
    p: ['chest'], s: ['deltF'],
    cues: ['Bras légèrement fléchis, cet angle ne bouge pas.', 'Imagine que tu serres un gros tronc d\'arbre.', 'Contracte 1 seconde quand les mains se rejoignent.', 'Ne pars pas plus loin que la ligne des épaules en arrière.'] },
  'shoulder-press': { name: 'Shoulder press', sets: 3, reps: '6-10', rest: 120,
    p: ['deltF', 'deltS'], s: ['tri', 'traps'],
    cues: ['Gainage serré, ne cambre pas le bas du dos.', 'La charge part au niveau du menton et monte au-dessus de la tête.', 'Avant-bras verticaux pendant tout le mouvement.'] },
  'lateral-raise': { name: 'Lateral raise', sets: 3, reps: '10-15', rest: 60,
    p: ['deltS'], s: ['traps'],
    cues: ['Buste légèrement penché en avant, coudes un peu fléchis.', 'Écarte les bras, ne hausse pas les épaules.', 'Stop à hauteur d\'épaules, descente contrôlée.', 'Charge légère et propre : la sensation compte plus que le poids.'] },
  'triceps-pushdown': { name: 'Triceps pushdown', sets: 3, reps: '8-12', rest: 60,
    p: ['tri'], s: [],
    cues: ['Coudes collés au corps, ils ne bougent pas.', 'Tends complètement en bas et serre 1 seconde.', 'Remonte jusqu\'à ce que les avant-bras dépassent l\'horizontale.'] },

  'lat-pulldown': { name: 'Lat pulldown', sets: 3, reps: '8-12', rest: 120,
    p: ['lats'], s: ['bi', 'upb', 'deltR'],
    cues: ['Prise un peu plus large que les épaules, cuisses bloquées.', 'Tire les coudes vers les hanches, pas avec les mains.', 'Barre vers le haut de la poitrine, poitrine vers la barre.', 'Remonte en étirant bien les dorsaux.'] },
  'tbar-row': { name: 'T-bar row', sets: 3, reps: '8-10', rest: 120,
    p: ['upb', 'lats'], s: ['deltR', 'bi', 'low'],
    cues: ['Buste penché à environ 45°, dos plat, genoux fléchis.', 'Tire vers le nombril et serre les omoplates en haut.', 'Pas d\'élan avec le dos : si tu te relèves, c\'est trop lourd.'] },
  'close-row': { name: 'Close grip cable row', sets: 3, reps: '8-12', rest: 60,
    p: ['lats', 'upb'], s: ['bi'],
    cues: ['Assis droit, genoux légèrement fléchis.', 'Tire la poignée vers le ventre, coudes le long du corps.', 'Pause 1 seconde omoplates serrées, puis étire vers l\'avant.'] },
  'reverse-fly': { name: 'Reverse cable fly', sets: 3, reps: '12-15', rest: 60,
    p: ['deltR'], s: ['upb'],
    cues: ['Câbles croisés à hauteur d\'épaules.', 'Ouvre les bras vers l\'arrière, coudes légèrement fléchis.', 'Pense « écarter », pas « tirer ». Charge légère.'] },
  'preacher-curl': { name: 'Preacher curl', sets: 3, reps: '8-12', rest: 60,
    p: ['bi'], s: ['fore'],
    cues: ['Aisselles collées en haut du pupitre.', 'Descends presque bras tendus, sans rebondir.', 'Monte en serrant, poignets neutres.'] },
  'incline-curl': { name: 'Incline dumbbell curl', sets: 3, reps: '10-12', rest: 60,
    p: ['bi'], s: ['fore'],
    cues: ['Banc à 45-60°, bras pendants derrière le buste.', 'Coudes fixes, ne les avance pas.', 'L\'étirement en bas fait tout le travail : descends lentement.'] },
  'wrist-curl': { name: 'Wrist curl', sets: 3, reps: '12-15', rest: 60,
    p: ['fore'], s: [],
    cues: ['Avant-bras posés sur le banc, poignets dans le vide.', 'Laisse rouler la barre au bout des doigts, puis enroule.', 'Amplitude complète, pas de vitesse.'] },

  'smith-squat': { name: 'Smith squat', sets: 3, reps: '6-10', rest: 120,
    p: ['quad', 'glu'], s: ['low', 'abs'],
    cues: ['Pieds légèrement devant la barre, largeur d\'épaules.', 'Gaine fort et descends au moins cuisses parallèles.', 'Genoux dans l\'axe des pieds.', 'Pousse le sol en remontant, dos neutre.'] },
  'leg-press': { name: 'Leg press', sets: 3, reps: '8-12', rest: 120,
    p: ['quad', 'glu'], s: ['ham'],
    cues: ['Pieds au milieu de la plateforme, largeur d\'épaules.', 'Descends tant que le bas du dos reste collé.', 'Ne verrouille jamais les genoux en haut.'] },
  'rdl': { name: 'RDL', sets: 3, reps: '8-10', rest: 120,
    p: ['ham', 'glu'], s: ['low', 'fore'],
    cues: ['Genoux légèrement fléchis et fixes.', 'Recule les hanches, barre collée aux jambes.', 'Descends jusqu\'à sentir l\'étirement des ischios, dos plat.', 'Remonte en poussant les hanches vers l\'avant.'] },
  'leg-extension': { name: 'Leg extension', sets: 3, reps: '10-15', rest: 60,
    p: ['quad'], s: [],
    cues: ['Axe de la machine aligné avec le genou.', 'Tends complètement et serre 1 seconde en haut.', 'Descente lente, ne laisse pas tomber la charge.'] },
  'ham-curl': { name: 'Hamstring curl', sets: 3, reps: '10-12', rest: 60,
    p: ['ham'], s: ['calf'],
    cues: ['Hanches plaquées sur le banc.', 'Ramène les talons vers les fesses, pause en contraction.', 'Contrôle la descente sur 2 à 3 secondes.'] },
  'calf-raise': { name: 'Calf raise', sets: 4, reps: '10-15', rest: 60,
    p: ['calf'], s: [],
    cues: ['Talons qui descendent bien bas : étire 1 à 2 secondes.', 'Monte sur la pointe le plus haut possible et serre.', 'Pas de rebond, tempo lent.'] },
  'abs': { name: 'Abs', sets: 3, reps: '10-15', rest: 60, bw: true,
    p: ['abs'], s: ['obl'],
    cues: ['Crunch à la poulie ou relevés de jambes suspendu.', 'Enroule le buste, ne tire pas avec les bras.', 'Expire à fond pendant la contraction.'] },

  'flat-smith': { name: 'Flat Smith bench', sets: 3, reps: '6-10', rest: 120,
    p: ['chest'], s: ['chestU', 'deltF', 'tri'],
    cues: ['Barre au-dessus du bas des pecs.', 'Omoplates serrées, légère cambrure naturelle.', 'Descente contrôlée, poussée explosive.'] },
  'wide-pulldown': { name: 'Wide lat pulldown', sets: 3, reps: '8-12', rest: 120,
    p: ['lats'], s: ['upb', 'deltR', 'bi'],
    cues: ['Prise large, buste légèrement incliné en arrière.', 'Coudes vers le bas et l\'arrière.', 'Barre au haut des pecs, remontée contrôlée.'] },
  'low-high-fly': { name: 'Low to high cable fly', sets: 3, reps: '12-15', rest: 60,
    p: ['chestU'], s: ['deltF'],
    cues: ['Poulies en bas, les mains montent vers le menton.', 'Bras légèrement fléchis, angle fixe.', 'Serre le haut des pecs en fin de mouvement.'] },
  'chest-row': { name: 'Chest supported row', sets: 3, reps: '8-12', rest: 60,
    p: ['upb', 'lats'], s: ['deltR', 'bi'],
    cues: ['Poitrine collée au support : impossible de tricher.', 'Tire les coudes en arrière, serre les omoplates.', 'Étire bien les bras en bas.'] },
  'face-pull': { name: 'Face pull', sets: 3, reps: '12-15', rest: 60,
    p: ['deltR', 'upb'], s: ['traps'],
    cues: ['Corde à hauteur des yeux.', 'Tire vers le front en écartant les mains.', 'Finis pouces vers l\'arrière, comme une pose double biceps.'] },
  'shrugs': { name: 'Shrugs', sets: 3, reps: '10-12', rest: 60,
    p: ['traps'], s: ['fore'],
    cues: ['Monte les épaules vers les oreilles, tout droit.', 'Pause 1 seconde en haut, pas de rotation.', 'Straps autorisés ici seulement si c\'est très lourd.'] },

  'hammer-curl': { name: 'Hammer curl', sets: 3, reps: '10-12', rest: 60,
    p: ['bi', 'fore'], s: [],
    cues: ['Prise neutre, pouces vers le haut.', 'Coudes fixes le long du corps.', 'Monte jusqu\'à l\'épaule, descente lente.'] },
  'overhead-ext': { name: 'Overhead triceps extension', sets: 3, reps: '8-12', rest: 60,
    p: ['tri'], s: [],
    cues: ['Corde ou haltère derrière la tête, coudes vers le haut.', 'Descends loin pour étirer la longue portion.', 'Tends sans écarter les coudes.'] },
  'skull-crusher': { name: 'Skull crusher', sets: 3, reps: '8-12', rest: 60,
    p: ['tri'], s: [],
    cues: ['Barre EZ, bras légèrement inclinés vers la tête.', 'Descends la barre vers le front ou juste derrière.', 'Coudes fixes, seuls les triceps poussent.'] },
  'reverse-curl': { name: 'Reverse curl', sets: 3, reps: '10-12', rest: 60,
    p: ['fore'], s: ['bi'],
    cues: ['Prise en pronation, paumes vers le bas.', 'Poignets droits, pas cassés.', 'Monte contrôlé : ça brûle vite, c\'est normal.'] },
  'farmer-walk': { name: 'Farmer walk', sets: 3, reps: '40 s', rest: 60,
    p: ['fore', 'traps'], s: ['abs', 'obl'],
    cues: ['Haltères lourds, épaules basses, buste droit.', 'Petits pas rapides, regard devant toi.', 'Serre les poignées au maximum : c\'est la grip qui travaille.'] },
  'lateral-raise-2': { ref: 'lateral-raise', reps: '12-15' },
  'abs-2': { ref: 'abs' },
  'overhead-ext-2': { ref: 'overhead-ext', name: 'Overhead cable extension',
    cues: ['Corde à la poulie basse, dos à la machine, un pied devant.', 'Coudes vers le haut, près de la tête : ils ne bougent pas.', 'Descends loin derrière la tête pour étirer la longue portion.', 'Tends en haut et écarte légèrement la corde.'] },

  'kelso-shrug': { name: 'Kelso shrug', sets: 3, reps: '10-12', rest: 60,
    p: ['upb', 'traps'], s: ['deltR'],
    cues: ['Banc incliné à 30-45°, poitrine collée au dossier, haltères bras tendus vers le sol.', 'Serre les omoplates vers l\'arrière et vers le bas, sans plier les coudes : ce sont les omoplates qui bougent, pas les bras.', 'Tiens 1 à 2 secondes en contraction.', 'Redescends en laissant les omoplates s\'écarter complètement.'] },
  'cable-crunch': { name: 'Cable crunch', sets: 3, reps: '10-15', rest: 60,
    p: ['abs'], s: ['obl'],
    cues: ['À genoux face à la poulie haute, corde tenue au niveau du front.', 'Enroule le buste en rapprochant les côtes du bassin : les hanches ne bougent pas.', 'Expire à fond en bas et serre 1 seconde.', 'Remonte lentement, sans laisser la charge te tirer.'] },
  'hanging-leg-raise': { name: 'Hanging leg raises', sets: 3, reps: '8-15', rest: 60, bw: true,
    p: ['abs'], s: ['obl', 'fore'],
    cues: ['Suspendu à la barre, épaules actives, sans te balancer.', 'Monte les jambes en enroulant le bassin vers le haut : c\'est l\'enroulement qui fait travailler les abdos.', 'Trop dur ? Genoux pliés. Trop facile ? Jambes tendues, puis lest entre les pieds (note-le dans kg).', 'Redescends lentement en 2 secondes.'] },
  'shoulder-press-2': { ref: 'shoulder-press' },
  'preacher-curl-2': { ref: 'preacher-curl' },
  'reverse-grip-curl': { ref: 'reverse-curl', name: 'Reverse grip curl' },
  'triceps-ext': { ref: 'overhead-ext', name: 'Triceps extension' },

  // Exercices de remplacement (bouton « Changer » quand une machine est prise)
  'weighted-dips': { name: 'Dips lestés', sets: 3, reps: '6-10', rest: 120, bw: true,
    p: ['chest', 'tri'], s: ['deltF'],
    cues: ['Note le lest dans la case kg (0 ou vide si poids du corps).', 'Buste penché en avant = plus de pecs. Buste droit = plus de triceps.', 'Descends jusqu\'à ce que les épaules passent un peu sous les coudes, sans douleur.', 'Remonte sans verrouiller sèchement les coudes.'] },
  'machine-dips': { name: 'Dips machine', sets: 3, reps: '8-12', rest: 60,
    p: ['tri'], s: ['chest', 'deltF'],
    cues: ['Assis, poignées le long du corps, dos contre le dossier.', 'Pousse vers le bas jusqu\'à bras tendus, serre 1 seconde.', 'Remonte lentement jusqu\'à environ 90° aux coudes.'] },
  'weighted-pullup': { name: 'Tractions lestées', sets: 3, reps: '5-8', rest: 120, bw: true,
    p: ['lats'], s: ['bi', 'upb', 'deltR', 'fore'],
    cues: ['Note le lest dans la case kg (0 ou vide si poids du corps).', 'Prise un peu plus large que les épaules, pars bras tendus.', 'Tire les coudes vers les hanches, menton au-dessus de la barre.', 'Descente contrôlée en 2 secondes, pas de balancier.'] },
};

// Remplacements proposés par le bouton « Changer » (les exercices déjà au programme du jour sont masqués)
const DIPS = ['weighted-dips', 'machine-dips'];
const EX_ALT = {
  'incline-smith': [...DIPS, 'flat-smith', 'chest-press'],
  'chest-press': [...DIPS, 'flat-smith', 'incline-smith'],
  'cable-fly': [...DIPS, 'low-high-fly'],
  'flat-smith': [...DIPS, 'chest-press', 'incline-smith'],
  'low-high-fly': [...DIPS, 'cable-fly'],
  'triceps-pushdown': [...DIPS, 'overhead-ext-2', 'skull-crusher'],
  'overhead-ext-2': [...DIPS, 'triceps-pushdown', 'skull-crusher'],
  'overhead-ext': [...DIPS, 'triceps-pushdown'],
  'skull-crusher': [...DIPS, 'triceps-pushdown', 'overhead-ext'],
  'lat-pulldown': ['weighted-pullup', 'wide-pulldown'],
  'wide-pulldown': ['weighted-pullup', 'lat-pulldown'],
  'tbar-row': ['chest-row', 'close-row'],
  'close-row': ['chest-row', 'tbar-row'],
  'chest-row': ['tbar-row', 'close-row'],
  'smith-squat': ['leg-press'],
  'leg-press': ['smith-squat'],
  'preacher-curl': ['incline-curl', 'hammer-curl'],
  'incline-curl': ['preacher-curl', 'hammer-curl'],
  'hammer-curl': ['preacher-curl', 'incline-curl'],
  'kelso-shrug': ['chest-row', 'face-pull', 'shrugs'],
  'machine-dips': ['weighted-dips', 'triceps-pushdown', 'skull-crusher'],
  'triceps-ext': ['weighted-dips', 'triceps-pushdown', 'skull-crusher'],
  'preacher-curl-2': ['incline-curl', 'hammer-curl'],
  'reverse-grip-curl': ['hammer-curl'],
  'cable-crunch': ['abs'],
  'hanging-leg-raise': ['abs'],
};

// Résout les exercices qui en réutilisent un autre (ex : Lateral raise du samedi)
function exInfo(id) {
  const e = EX[id];
  if (!e) return null;
  if (e.ref) return Object.assign({}, EX[e.ref], e, { id, ref: e.ref });
  return Object.assign({ id }, e);
}

// Tâches hors musculation (cochables)
const TASKS = {
  'jump-warmup': { name: 'Échauffement saut', detail: '10 min : genoux, chevilles, bandes élastiques.', kind: 'jump' },
  'plyo': { name: 'Pliométrie', detail: '5×3 sauts sur box OU 3×5 depth jumps. Repos long entre les séries. Avant les squats.', kind: 'jump' },
  'deadhang': { name: 'Dead hang', detail: '2 × max, suspendu à la barre, épaules actives. Une fois par semaine.', kind: 'grip' },
  'dribble': { name: 'Dribble léger', detail: '20-30 min : crossovers, between-the-legs, deux ballons.', kind: 'ball' },
  'dunk': { name: 'Tentatives de dunk', detail: '20 min après la séance. 10 tentatives max à fond, avec repos.', kind: 'jump' },
  'box-short': { name: 'Boxe : séance courte', detail: '20 min de technique et shadow. Lance le minuteur.', kind: 'box', preset: 'short' },
  'box-main': { name: 'Boxe : séance principale', detail: '35 min : technique, shadow, défense, finisher.', kind: 'box', preset: 'main' },
  'box-light': { name: 'Boxe : shadow léger (option)', detail: '15 min lent et fluide. Saute-la si tu es cramé.', kind: 'box', preset: 'light' },
};

// Semaine : index 0 = lundi
const WEEK = [
  { day: 'Lundi', title: 'Push', rest: false, before: [], lifts: ['incline-smith', 'chest-press', 'cable-fly', 'shoulder-press', 'lateral-raise', 'triceps-pushdown', 'overhead-ext-2'], after: [] },
  { day: 'Mardi', title: 'Pull', rest: false, before: [], lifts: ['lat-pulldown', 'tbar-row', 'close-row', 'kelso-shrug', 'reverse-fly', 'preacher-curl', 'incline-curl', 'wrist-curl'], after: ['deadhang', 'box-short'] },
  { day: 'Mercredi', title: 'Legs', rest: false, before: ['jump-warmup', 'plyo'], lifts: ['smith-squat', 'leg-press', 'rdl', 'leg-extension', 'ham-curl', 'calf-raise', 'abs'], after: [] },
  { day: 'Jeudi', title: 'Rest Day', rest: true, before: [], lifts: [], after: ['dribble', 'box-main'] },
  { day: 'Vendredi', title: 'Chest & Back', short: 'C&B', rest: false, before: [], lifts: ['flat-smith', 'wide-pulldown', 'low-high-fly', 'chest-row', 'face-pull', 'shrugs'], after: [] },
  { day: 'Samedi', title: 'Arms & Shoulders', short: 'A&S', rest: false, before: [], lifts: ['shoulder-press-2', 'lateral-raise-2', 'machine-dips', 'reverse-grip-curl', 'triceps-ext', 'preacher-curl-2', 'cable-crunch', 'hanging-leg-raise'], after: ['jump-warmup', 'dunk'] },
  { day: 'Dimanche', title: 'Rest Day', rest: true, before: [], lifts: [], after: ['box-light'] },
];

const RULES = [
  'Chaque exercice : la dernière série proche de l\'échec.',
  'Quand tu fais le haut des reps partout : +2,5 kg. L\'app le détecte et te propose la nouvelle charge.',
  'Note le poids et les reps de chaque série : la case grise te montre ce que tu as fait la dernière fois.',
  'Repos : 2 min sur les charges lourdes, 1 min le reste. Le minuteur se lance tout seul.',
  'Échauffement : 1 à 2 séries légères sur le premier exercice.',
  'Pas de straps, sauf sur les séries les plus lourdes.',
  'Pèse-toi chaque semaine, le matin, à jeun.',
];

const JUMP_RULES = [
  'Échauffement de 10 min avant chaque séance de saut.',
  '48 h entre deux séances de saut. Pas de pliométrie le vendredi si dunk le samedi.',
  'Approche : 2-3 pas de course, toujours le même rythme.',
  'Dunks en arrière et 360 seulement quand le dunk simple passe 9 fois sur 10.',
  'Pas de tractions sur le cercle trop souvent (poignets).',
];

/* ---------------- BOXE ANGLAISE : 12 semaines ---------------- */
const BOX_PHASES = [
  { name: 'Fondations', weeks: [1, 4], goal: 'Une garde solide, des déplacements propres, un jab et un direct qui partent droit.' },
  { name: 'Arsenal', weeks: [5, 8], goal: 'Ajouter crochets, uppercuts et les premières défenses.' },
  { name: 'Combat', weeks: [9, 12], goal: 'Enchaîner attaque, défense et angles sans perdre la garde.' },
];

const BOX_WEEKS = [
  { focus: 'Garde et déplacements', tech: ['garde', 'moves'], combos: ['1', '1-1', 'pas avant, 1', 'pas arrière'] },
  { focus: 'Jab et direct', tech: ['jab', 'cross'], combos: ['1', '2', '1-2', '1-1'] },
  { focus: 'Le 1-2 en mouvement + parade', tech: ['cross', 'catch'], combos: ['1-2', '1-1-2', 'parade, 2', 'pas avant, 1-2'] },
  { focus: 'Révision et vitesse', tech: ['jab', 'cross', 'moves'], combos: ['1-2', '1-1-2', '1-2-1', '2-1-2'] },
  { focus: 'Crochet avant', tech: ['hook'], combos: ['1-2-3', '1-3', '3-2', '1-1-3'] },
  { focus: 'Uppercuts', tech: ['upper'], combos: ['1-6', '1-2-5', '5-2', '6-3-2'] },
  { focus: 'Esquive et contre', tech: ['slip'], combos: ['esquive, 2', '1-2, esquive, 2', 'esquive, esquive, 3', 'esquive, 2-3'] },
  { focus: 'Rotation sous le crochet', tech: ['roll'], combos: ['rotation, 3-2', '1-2, rotation, 2', '2-3, rotation', '3, rotation, 3'] },
  { focus: 'Angles et pivot', tech: ['pivot'], combos: ['1-2, pivot', '1-2-3, pivot', 'pivot, 2', '1, pivot, 1-2'] },
  { focus: 'Feintes et rythme', tech: ['jab', 'pivot'], combos: ['feinte, 1-2', '1-1-2-3', '2-3-2', 'feinte 2, 3'] },
  { focus: 'Enchaînements longs + défense', tech: ['slip', 'roll'], combos: ['1-2-3-2', '1-2, esquive, 2-3', '1-6-3-2', 'rotation, 3-2-3'] },
  { focus: 'Test : rounds complets', tech: ['garde'], combos: ['1-2-3-2', '1-2, pivot', 'esquive, 2-3', '1-6-3-2', 'feinte, 1-2', 'rotation, 3-2'] },
];

const BOX_TECH = {
  garde: { name: 'Garde', cues: ['Pieds écartés largeur d\'épaules, pied avant vers l\'adversaire, pied arrière à 45°.', 'Talon arrière décollé, genoux souples.', 'Poings aux pommettes, coudes serrés, menton rentré.', 'Regard au-dessus des gants.'] },
  moves: { name: 'Déplacements', cues: ['Le pied du côté où tu vas bouge en premier, l\'autre suit.', 'Ne croise jamais les pieds.', 'Petits pas, toujours en garde.'] },
  jab: { name: '1 · Jab', cues: ['Le poing avant part tout droit et tourne en fin de course.', 'L\'épaule monte et protège le menton.', 'Retour par le même chemin, aussi vite qu\'à l\'aller.'] },
  cross: { name: '2 · Direct', cues: ['Pivote le pied arrière comme pour écraser un mégot.', 'La hanche tourne, le poing part droit.', 'Le poids avance sans pencher, retour immédiat en garde.'] },
  hook: { name: '3 / 4 · Crochets', cues: ['Coude levé à hauteur du poing, bras à 90°.', 'La puissance vient du pivot du pied et des hanches, pas du bras.', 'Pas d\'armé : le coup part de la garde.'] },
  upper: { name: '5 / 6 · Uppercuts', cues: ['Fléchis légèrement les jambes.', 'Le coup monte avec les jambes et la rotation.', 'Pas de grand armé vers le bas, l\'autre main reste au visage.'] },
  catch: { name: 'Parade', cues: ['La main arrière attrape le jab devant le visage.', 'Petit mouvement, ne tends pas le bras.'] },
  slip: { name: 'Esquive', cues: ['Petite rotation du buste + flexion des genoux.', 'La tête sort de la ligne juste assez.', 'Les yeux restent sur l\'adversaire.'] },
  roll: { name: 'Rotation', cues: ['Plie les genoux pour passer sous le crochet en dessinant un U.', 'Ne te penche pas avec le dos.'] },
  pivot: { name: 'Pivot', cues: ['Après un combo, pivote sur le pied avant.', 'Tu changes d\'angle et sors de sa ligne d\'attaque.'] },
};

// Séances du minuteur (secondes)
const BOX_PRESETS = {
  short: { name: 'Séance courte', mins: 20, blocks: [
    { label: 'Échauffement', work: 180, rest: 0, rounds: 1, calls: false, note: 'Rotations articulaires, shadow lent, déplacements.' },
    { label: 'Technique', work: 120, rest: 45, rounds: 3, calls: true, note: 'Focus de la semaine, devant un miroir si possible.' },
    { label: 'Shadow', work: 180, rest: 60, rounds: 2, calls: true, note: 'Bouge, respire, enchaîne.' },
  ] },
  main: { name: 'Séance principale', mins: 35, blocks: [
    { label: 'Échauffement', work: 300, rest: 0, rounds: 1, calls: false, note: 'Mobilité, déplacements, shadow lent.' },
    { label: 'Technique', work: 120, rest: 45, rounds: 4, calls: true, note: 'Focus de la semaine, lent puis rapide.' },
    { label: 'Shadow', work: 180, rest: 60, rounds: 3, calls: true, note: 'Round 1 technique, round 2 vitesse, round 3 intensité.' },
    { label: 'Défense', work: 120, rest: 45, rounds: 2, calls: true, defense: true, note: 'Esquives et rotations sous une corde tendue.' },
    { label: 'Punchs rapides', work: 30, rest: 30, rounds: 3, calls: false, note: 'Directs rapides, sans poids dans les mains.' },
    { label: 'Gainage', work: 40, rest: 20, rounds: 2, calls: false, note: 'Planche. Puis cou léger : 2 × 15.' },
  ] },
  light: { name: 'Shadow léger', mins: 15, blocks: [
    { label: 'Shadow lent', work: 180, rest: 60, rounds: 3, calls: true, note: 'Lent, fluide, respiration. Zéro force.' },
  ] },
  // Pas de la boxe : séance de sprints de l'onglet Grow (utilise le même minuteur)
  sprint: { name: 'Sprints', kind: 'sprint', mins: 20, blocks: [
    { label: 'Échauffement', work: 480, rest: 30, rounds: 1, calls: false, note: 'Footing léger, montées de genoux, talons-fesses, 3 accélérations progressives.' },
    { label: 'Sprint', work: 20, rest: 60, rounds: 6, calls: false, note: 'À fond, 100 %. Pendant le repos : marche, ne t\'assois pas.' },
    { label: 'Retour au calme', work: 180, rest: 0, rounds: 1, calls: false, note: 'Marche et respire. Puis yaourt + banane + miel, ou un grand verre de lait.' },
  ] },
};

/* ---------------- GROW : atteindre ta taille max ---------------- */
// Routine posture (méthode « relâcher, allonger, verrouiller » + 3 exos anti-dos rond). sec = minuteur de maintien
const GROW_ROUTINE = [
  { id: 'roll', step: 'Relâcher', name: 'Balle ou rouleau', detail: '5 min : plante des pieds, mollets, ischios, haut du dos, épaules. Lentement, insiste sur les zones tendues.', sec: 300 },
  { id: 'hipflex', step: 'Allonger', name: 'Étirement des fléchisseurs de hanche', detail: 'Un genou au sol, serre la fesse de ce côté, rentre le bassin, avance doucement les hanches. Tu dois le sentir devant la hanche, pas dans le bas du dos. 2 × 45 s par côté.', sec: 45 },
  { id: 'couch', step: 'Allonger', name: 'Étirement des quadriceps au mur', detail: 'Genou au sol collé au mur (ou au canapé), pied arrière contre le mur, buste droit, bassin rentré. 2 × 45 s par côté.', sec: 45 },
  { id: 'child', step: 'Allonger', name: 'Posture de l\'enfant', detail: 'Fesses vers les talons, bras tendus loin devant. 45 s, respire dans le dos.', sec: 45 },
  { id: 'chin', step: 'Verrouiller', name: 'Rentrer le menton', detail: 'Dos au mur, recule la tête sans la baisser (fais un double menton). 2 × 10, tiens 3 s. Contre la tête en avant du téléphone.', sec: 0 },
  { id: 'wall', step: 'Verrouiller', name: 'Wall angels', detail: 'Dos, tête et bras collés au mur, monte et descends les bras lentement. 2 × 10. Contre les épaules enroulées.', sec: 0 },
  { id: 'bridge', step: 'Verrouiller', name: 'Pont fessier', detail: '3 × 12, tiens 2 s en haut en serrant les fesses. Remet le bassin droit.', sec: 0 },
  { id: 'deadbug', step: 'Verrouiller', name: 'Dead bug', detail: '3 × 10 par côté, bas du dos collé au sol.', sec: 0 },
  { id: 'hang', step: 'Décompresser', name: 'Suspension à la barre', detail: '2 × 30 à 45 s, épaules relâchées. Décomprime le dos (effet temporaire) et muscle la grip.', sec: 40 },
];

const GROW_TIPS = {
  sleep: [
    'Vise 8 à 9 h par nuit, couché avant 23 h, à la même heure même le week-end.',
    'La plus grosse décharge d\'hormone de croissance arrive dans le premier sommeil profond, en début de nuit.',
    'Écran coupé 30 min avant de dormir, chambre noire et fraîche.',
    'Après une journée physique (job, salle), c\'est aussi le sommeil qui soulage le dos.',
  ],
  food: [
    'Mange assez : ton surplus de calories et tes protéines servent aussi à ça.',
    'Produits laitiers 2 à 3 fois par jour (lait, yaourt, fromage) pour le calcium. Lait pasteurisé, pas cru.',
    'Vitamine D : 15 à 20 min de soleil les beaux jours, poissons gras, œufs. En hiver, demande à ton médecin.',
    'Viande, œufs, légumineuses pour le zinc et le fer.',
    'Aucun complément « taille » n\'a fait ses preuves : garde ton argent.',
  ],
  truth: [
    'Chez les garçons, les cartilages de croissance se ferment le plus souvent entre 15 et 17 ans, parfois un peu plus tard. À 18 ans, il te reste peut-être un peu de marge, peut-être pas.',
    'Seule une radio (main et poignet, ou genou) peut dire s\'ils sont encore ouverts. Demande à ton médecin si tu veux savoir.',
    'La musculation ne bloque pas la croissance : continue la salle.',
    'Tu es environ 1,5 cm plus grand le matin que le soir. Mesure-toi toujours le matin.',
    'Une meilleure posture te fait paraître plus grand, sans chiffre garanti : méfie-toi des vidéos qui promettent 5 à 7 cm.',
  ],
};

const GROW_SOURCES = [
  ['KidsHealth : âge de fermeture des cartilages de croissance', 'https://kidshealth.org/en/parents/growth-plates.html'],
  ['MSD Manuals : calcul de la taille cible (taille des parents)', 'https://www.msdmanuals.com/iframe/manual/medical-calculators/heightpotential.htm'],
  ['Van Cauter et al. 1997 : sommeil profond et hormone de croissance', 'https://www.jci.org/articles/view/119587'],
  ['Stokes et al. : hormone de croissance après un sprint', 'https://pubmed.ncbi.nlm.nih.gov/12137178/'],
  ['Leatt, Reilly, Troup : perte de taille au cours de la journée', 'https://bjsm.bmj.com/content/20/3/119'],
  ['AAP (HealthyChildren) : la musculation chez les jeunes', 'https://www.healthychildren.org/English/news/Pages/Guidance-on-Resistance-Training-for-Children.aspx'],
];

const DEFENSE_CALLS = ['esquive', 'rotation', 'parade', 'pas arrière', 'esquive, esquive', 'rotation, contre'];

const QUOTES = [
  'Personne ne viendra te chercher. Lève-toi.',
  'La discipline bat la motivation.',
  'Chaque rep compte, surtout celle que personne ne voit.',
  'Pas de raccourci. Juste la répétition.',
  'Tu ne t\'entraînes pas pour aujourd\'hui.',
  'Le corps suit ce que la tête refuse de lâcher.',
  'Mange. Dors. Soulève. Recommence.',
  'Le talent, c\'est ce que les autres appellent ton travail.',
];
