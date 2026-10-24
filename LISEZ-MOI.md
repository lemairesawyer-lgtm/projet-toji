# Projet Toji — installation (gratuit, 15 min)

L'app est un site web qui s'installe sur ton téléphone comme une vraie app
(icône sur l'écran d'accueil, plein écran, marche hors connexion).
Il faut juste la mettre en ligne une fois, gratuitement, sur GitHub Pages.

## 1. Mettre l'app en ligne (sur ton MacBook)

1. Crée un compte sur https://github.com (gratuit).
2. En haut à droite : « + » puis « New repository ».
   - Nom : `projet-toji`
   - Coche **Public** (obligatoire pour l'offre gratuite ; ton code ne contient aucune donnée perso)
   - Coche « Add a README file », puis « Create repository ».
3. Dans le repository : « Add file » puis « Upload files ».
4. Ouvre le dossier `projet-toji` dézippé dans le Finder, sélectionne **tout son contenu**
   (les dossiers `css`, `js`, `img`, `fonts`, `icons`, `vendor` et les fichiers `index.html`,
   `manifest.webmanifest`, `sw.js`) et glisse-le dans la page GitHub. Clique « Commit changes ».
   Important : glisse le *contenu* du dossier, pas le dossier lui-même.
5. « Settings » puis « Pages » (menu de gauche).
   Source : « Deploy from a branch », branche `main`, dossier `/ (root)`, « Save ».
6. Attends 1 à 2 minutes. Ton adresse : `https://TON-PSEUDO.github.io/projet-toji/`

## 2. L'installer sur ton téléphone

- **iPhone** : ouvre l'adresse dans **Safari**, bouton Partager, « Sur l'écran d'accueil ».
- **Android** : ouvre l'adresse dans **Chrome**, menu ⋮, « Installer l'application ».

Ouvre toujours l'app depuis l'icône, pas depuis le navigateur
(tes données sont liées à l'app installée).

## 3. Activer l'IA photo (gratuit)

1. Va sur https://aistudio.google.com/apikey et connecte-toi avec ton compte Google.
2. « Create API key », copie la clé.
3. Dans l'app : touche l'engrenage, colle la clé dans « Clé API Gemini », « Tester la clé », « Enregistrer ».

La clé reste sur ton téléphone, elle n'est pas dans le code.
L'offre gratuite a une limite de requêtes par minute et par jour : largement assez pour tes repas.

Le code-barres, lui, marche sans clé (base gratuite Open Food Facts).

## 4. Mettre à jour l'app (comme pour cette version 4)

Sur GitHub, dans ton repository : « Add file », « Upload files », glisse **tout le contenu**
du dossier `projet-toji` (comme la première fois). Les anciens fichiers sont remplacés,
les nouveaux (dossier `img`, `js/hero.js`) sont ajoutés. « Commit changes ».
Attends 1 à 2 minutes, puis sur le téléphone ferme et rouvre l'app deux fois.
Tes repas, pesées et séances sont gardés : l'app convertit toute seule tes anciennes séries.

## 5. Sauvegarde

Tes repas, pesées et séances sont stockés sur ton téléphone uniquement.
Réglages, « Exporter » : fais-le une fois par mois et garde le fichier (iCloud, Drive, mail).
Si tu supprimes l'app sans sauvegarde, tout est perdu.

## Nouveautés de la version 4

- Onglets en anglais : Home, Eat, Training, Box, Grow, Progress.
- Grow : ta taille (mesure mensuelle et courbe), ta taille cible d'après tes parents,
  une routine posture avec minuteurs, une séance de sprints chronométrée, des conseils sommeil et nutrition, avec les sources.
- Push : 7e exercice, Overhead cable extension.
- Bouton « Changer » sur les exercices : dips lestés, dips machine, tractions lestées, etc.
  Coche « Garder ce choix » pour que ça reste les semaines suivantes.
- Séance validée par erreur : bouton « Annuler la séance » en bas du jour (avec retour en arrière possible).
- Rest Day : Kuro mange ou chill les jours de repos.
- Accueil : « Tes années », un carré par jour, allumé quand tu t'es entraîné.

## Nouveautés de la version 3

- Kuro, ton guerrier : personnage original façon manga (physique sec et découpé, aura sombre).
  6 illustrations (repos, double biceps, victoire, garde, curl, power-up) animées :
  respiration, aura qui pulse, yeux qui brillent, étincelles. Touche-le sur l'accueil.
  Il est sur l'accueil, Training, Boxe et dans toutes les cinématiques.

## Nouveautés de la version 2

- Training : pour chaque série, tu notes le poids et les reps. La colonne « Dernière fois »
  te rappelle ta séance précédente, et les cases sont pré-remplies en gris :
  si tu as fait pareil, touche juste ✓. Si tu as fait plus, tape le chiffre puis ✓.
- Record battu : tampon « Record » + son + vibration.
- Haut des reps partout : l'app te propose +2,5 kg à la séance suivante.
- Onglet Progrès : Poids, Force (courbe par exercice), Calories (mangé contre dépensé).
- Calories dépensées : métabolisme de base + ta séance + tes activités en plus.
  Objectif « Auto » : dépense du jour + 400 kcal de surplus (réglable).
