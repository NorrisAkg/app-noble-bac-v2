# Checklist de smoke test — Mission de conformité maquettes

> À exécuter sur **Android device réel** avec dev client connecté à
> Metro local (`npm start`).
>
> Backend Laravel attendu sur `http://192.168.1.56:8000/api/v1`
> (configurable dans `.env.local`).

---

## ⚙️ Préparation

- [ ] Backend Laravel up : `curl http://localhost:8000/api/v1/health` → 200
- [ ] `.env.local` : `EXPO_PUBLIC_API_URL` pointe vers l'IP LAN du laptop (pas localhost)
- [ ] Device Android sur le même Wi-Fi que le laptop
- [ ] Dev client Noble BAC installé sur le device (sinon : `eas build --profile development --platform android`)
- [ ] `npm start` lancé sur le laptop, QR scanné par le dev client
- [ ] App s'ouvre sans erreur Metro rouge

---

## Phase 0 — Fondations Design System

- [ ] Splash : logo **brand** (pas l'Expo template), gradient vert, 3 dots animés
- [ ] Couleurs ressenties : vert primaire `#3DBE45` partout, pas de bleu `#0a7ea4` résiduel
- [ ] Police Poppins chargée (pas de fallback système)

## Phase 1 — Composants brand

- [ ] Logo brand visible sur Landing
- [ ] `SubjectIcon` PNG illustration affichées (pas des lettres) sur Quiz tab / Library
- [ ] Drapeaux PNG des pays UEMOA dans le picker pays (pas des emojis)
- [ ] Cadenas Premium salmon sur les livres premium dans Books

## Phase 2 — Auth flow

- [ ] Landing : 3 dégradés overlays sur la vidéo (haut sombre, tinte verte, vignette)
- [ ] Login : bouton picker pays cliquable → ouvre sheet avec 8 pays + drapeaux
- [ ] Login : sélectionner Sénégal → dial passe à `+221` + drapeau 🇸🇳 affiché
- [ ] Signup : drapeaux PNG dans le picker pays (pas d'emoji 🇧🇯)
- [ ] Forgot : picker pays fonctionne idem Login
- [ ] Verify OTP : anneau actif visible (cercle vert clair 54px autour du cercle de 46px)
- [ ] Bouton VÉRIFIER : rectangle arrondi (`borderRadius:12`) — pas pill
- [ ] Congrats : illustration **SVG** toque graduation (gradient violet, tassel orange) — pas l'emoji 🎓
- [ ] Animation : la toque apparaît avec un zoom (FadeIn + spring)
- [ ] Bouton « Commencer maintenant » → redirection vers `/setup` (pas `/(tabs)`)
- [ ] Setup screen : grille 2 colonnes avec CountryMap 84px par pays
- [ ] Tap sur un pays → liste des séries
- [ ] Modifier le pays → retour à la grille

## Phase 3 — Quiz

- [ ] Tab Quiz : illustrations PNG par matière (pas `MAT`, `PHY`…)
- [ ] Tap sur une matière → `/quiz-chapters` (pas direct quiz-session)
- [ ] Quiz-chapters : header vert plein, X close, helper `N chapitres · 20 questions par quiz`
- [ ] Chaque chapitre : tile SubjectIcon 56px + label + padlock vert à droite
- [ ] Tap sur un chapitre → quiz-session démarre
- [ ] Quiz-session : hint `Tu verras les corrections détaillées à la fin du quiz` visible
- [ ] Fin de quiz → Quiz-results
- [ ] Cercle SVG animé : le strokeDasharray progresse de 0 au score
- [ ] Tier label affiché (Excellent / Bien joué / Continue / Reprends calmement)
- [ ] Emoji correspondant (🏆 / ⭐ / 💪 / 📚)
- [ ] 3 stats colonnes : Justes / Erreurs / Temps
- [ ] CTA `Nouveau quiz` + `Voir les corrections`
- [ ] `Voir les corrections` → route `/quiz-review` avec détails par question

## Phase 4 — Tabs + bottom nav

- [ ] Bottom nav : icônes **SVG custom** (Cours = pages dos-à-dos, Sujets = double livre)
  pas Lucide `BookOpen` / `Layers`
- [ ] Courses : tabs avec **diamant SVG gradient orange** à droite du label (pas un carré rotaté)
- [ ] Library : tabs Épreuve / Corrigé / Vidéo avec diamant SVG aussi
- [ ] Library : sélecteur matière avec `SubjectIcon` PNG (pas lettre)
- [ ] Library : sheet matières avec `SubjectIcon` PNG (pas lettre)
- [ ] Library : bouton primaire `Télécharger` (pas `Ouvrir`)
- [ ] Home : section « Reprendre » visible (card placeholder « Commence ta première leçon »)
- [ ] Home : `Annales` → route vers Library (pas Alert)
- [ ] Profile : avatar 64×64 gradient vert à **gauche** du nom (pas hero centré 90×90)
- [ ] Profile : 3 stats dans une **seule card** avec séparateurs verticaux
- [ ] Profile : pas de section « Mes Badges »
- [ ] Profile : 9 items menu (Modifier / Pays et série / Notifications / Hors-ligne /
  Mes paiements / Chaîne WhatsApp / Support / Confidentialité / Supprimer)
- [ ] Items menu : icônes en tile **colorée** (greenSoft, salmonSoft) — pas grises uniformes
- [ ] Chip Premium ou « Devenir Premium » en pill salmonSoft (pas badge jaune)
- [ ] Bouton logout : pleine largeur avec border `#F5D9D1`

## Phase 5 — Tuteur IA + Plan + Search

- [ ] Home : icône `<Search>` du header → `/search` (pas Alert « Bientôt »)
- [ ] Search : header vert avec input autoFocus
- [ ] Search vide : sections Récents (chips) + En vogue (3 cards)
- [ ] Search avec query : résultats filtrés (subjects + books)
- [ ] **Tuteur IA Nobi** : si accessible (route `/tutor`)
  - [ ] Header blanc avec avatar Nobi gradient + dot status vert
  - [ ] Bulle AI welcome `Bonjour ! Je suis Nobi…` avec coin haut-gauche arrondi
  - [ ] Suggested chips visibles tant que peu de messages
  - [ ] Envoyer un message → bulle user verte à droite avec coin haut-droit arrondi
  - [ ] Typing dots gris pendant 1.1s puis bulle AI réponse stub
- [ ] **Plan d'étude** : si accessible (route `/plan`)
  - [ ] Hero card gradient avec countdown réel `BAC dans X jours`
  - [ ] 3 tâches du jour avec statuts (done / current / pending)
  - [ ] 6 semaines avec badge S1-S6 + barre de progression

## Phase 6 — Premium

- [ ] Profile → `Devenir Premium` (chip) → `/subscription-plans`
- [ ] Hero gradient vert avec emoji 🏆 + titre `Passe Premium`
- [ ] 5 PERKS avec tile vert clair 36px + emoji (Tuteur IA, Sujets, Quiz adaptatifs, Vidéos, Hors-ligne)
- [ ] Plans en **radio cards** (pas une card complète par plan)
- [ ] Badge `POPULAIRE` salmon sur le plan recommandé (90 jours)
- [ ] CTA fixe en bas `Continuer · X FCFA`
- [ ] (Si paiement test possible) → success sheet plein écran avec checkmark animé ZoomIn

## Phase 7 — Offline + RGPD + sheets

- [ ] Couper le Wi-Fi → après ~30s, **bandeau noir** apparaît en haut
  `Tu es hors-ligne / Tes contenus téléchargés restent disponibles.`
- [ ] Tap `Voir` → route `/my-downloads`
- [ ] Tap X sur le bandeau → disparaît, ne réapparaît qu'à la prochaine perte de connexion
- [ ] Reconnecter Wi-Fi → bandeau disparaît automatiquement
- [ ] My Downloads : carte préférences en haut avec 2 toggles (Wi-Fi only, auto-download)
- [ ] Toggle préférence persiste après kill/relaunch (AsyncStorage)
- [ ] Items téléchargés : badge typé coloré (`PDF` rouge / `FICHE` vert / `CORRIGÉ` bleu)
- [ ] Profile → `Chaîne WhatsApp` → bottom sheet `#25D366`
- [ ] Bottom sheet : tap `Ouvrir dans WhatsApp` → essaie d'ouvrir WhatsApp natif
- [ ] Profile → `Supprimer mon compte` → `/settings/delete-account`
- [ ] Delete account step 1 : warning rouge + 5 motifs radio
- [ ] Tap motif puis `Continuer` → step 2
- [ ] Step 2 : input centré, taper `SUPPRIMER` → bouton danger s'active
- [ ] Tap `Supprimer définitivement` → Alert « Demande enregistrée » → route vers support

## Phase 8 — Polish

- [ ] Course Reader : pas de FAB noir flottant 🎯
- [ ] À la fin d'une leçon : **carte CTA** `Tester vos acquis` avec bouton vert `Commencer`
- [ ] Pas de boutons Bookmark/Share dans le header
- [ ] Edit Profile : avatar gradient `green→greenDark` (pas plein vert)
- [ ] Books : couvertures avec couleurs **variées** selon la matière (pas toutes maths ou phys)

---

## 🐛 Bugs déjà identifiés à signaler

- **Auto-login post verify-otp manquant** : signup → verify → congrats → setup peut nécessiter une reconnexion manuelle (P0 backend, cf. `BACKEND_GAPS.md` 2.1).
  Le bypass `EXPO_PUBLIC_BYPASS_AUTH=true` skip ce flow et envoie direct sur les tabs.
- **`Tutor` et `Plan` ne sont pas dans le menu Profile** : pour les tester, naviguer via deep link `/tutor` ou `/plan` (à câbler en UX produit).

---

## 📋 Reporting

Pour chaque check qui ne passe pas, noter :
1. **Phase** + numéro de check
2. **Comportement attendu** vs **observé**
3. **Screenshot** si possible
4. **Steps to reproduce** précis

Bonne chasse 🎯
