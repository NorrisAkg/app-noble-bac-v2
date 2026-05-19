# Récapitulatif — Mission de conformité aux maquettes

> Période : avril–mai 2026
> Périmètre : application mobile React Native / Expo (`mobile/`)
> Objectif : aligner l'implémentation TypeScript sur les maquettes
> de référence (`mobile/templates/*.jsx` + `*.html`)

---

## 1. Démarche

### 1.1 — Audit initial (état des lieux)
Audit comparatif des 22 maquettes JSX (`screens-*.jsx`) et des 30+
écrans TSX livrés. Identification de 3 catégories de non-conformités :

1. **Écrans entiers manquants** (6 écrans : Setup, Tuteur IA, Plan d'étude,
   Recherche globale, Coming-soon overlay, Delete account).
2. **Design System divergent** : palette incomplète, illustrations PNG
   non copiées, fichier `constants/theme.ts` resté en defaults Expo,
   icônes Lucide à la place des SVG custom.
3. **Composants partagés altérés** : `Button` figé en pill, `Input`
   avec `uppercase` parasite, `CustomTabBar` avec icônes inadaptées.

### 1.2 — Stratégie de livraison
- **9 phases** linéaires (chaque branche depuis la précédente).
- À **chaque phase** : backend health-check + `tsc --noEmit` +
  `jest` (86 tests) + `expo lint` doivent rester verts avant
  commit. Aucun bypass.
- **Gaps backend** documentés au fil de l'eau dans
  [`docs/BACKEND_GAPS.md`](BACKEND_GAPS.md) pour le suivi
  équipe API.

### 1.3 — Convention de branches
```
main
└─ feat/phase-0-fondations-ds
   └─ feat/phase-1-composants-brand
      └─ feat/phase-2-auth-flow
         └─ feat/phase-3-refonte-quiz
            └─ feat/phase-4-tabs-principaux
               └─ feat/phase-5-tuteur-ia
                  └─ feat/phase-6-premium
                     └─ feat/phase-7-offline-rgpd
                        └─ feat/phase-8-polish   ← HEAD
```
Push : aucun push automatique. Branches locales prêtes à être
remontées sur la remote via PR.

---

## 2. Phases livrées

### Phase 0 — Fondations Design System
> Commit `8a333cd` · 54 files, +52 / −361

**Pourquoi** : sans tokens cohérents ni assets, rien d'autre ne
peut s'aligner sur les maquettes.

**Livrables** :
- 29 illustrations PNG + 8 drapeaux UEMOA JPG + logo brand copiés
  depuis `templates/assets/` vers `assets/images/`.
- `tailwind.config.js` enrichi : `brand.danger`, `brand.warning`,
  `brand.info`, `brand.premium`, `brand.tomato`, `brand.handle`,
  `brand.muted`.
- `constants/theme.ts` réécrit : suppression des defaults Expo
  (`#0a7ea4`, `#11181C`), export d'un objet `C` aligné sur la
  charte (`shared.jsx`).
- `Input.tsx` : retrait du `uppercase` parasite sur les labels.
- `Button.tsx` : nouvelle prop `shape: 'pill' | 'rounded'`.
- `AppBar.tsx` : hauteur passée de 60 à 64px.
- Suppression de 10 fichiers Expo template orphelins (`themed-*`,
  `parallax-scroll-view`, `collapsible`, hooks `use-color-scheme`,
  `external-link`, `hello-wave`, `haptic-tab`).
- `_layout.tsx` : suppression `useColorScheme` + `DarkTheme`,
  force `DefaultTheme` (mono-thème clair).

### Phase 1 — Composants brand
> Commit `ed5acfa` · 12 files, +708 / −4

**Pourquoi** : centraliser la création des composants brand
réutilisables avant de toucher aux écrans.

**Livrables** : 11 composants ajoutés dans `components/ui/` —
- `Logo` / `LogoMini`
- `SubjectIcon` (mapping 29 PNG par matière + tile colorée)
- `CountryFlag` (SVG 3 bandes)
- `CountryMap` (PNG réel des 8 pays)
- `PremiumLock` (cadenas salmon)
- `Card`, `Badge`, `Heading` (primitives)
- `IllustrationStack` / `IllustrationQuiz` / `IllustrationAI`
- `CountryPickerSheet`
- Type `Country` exporté depuis `constants/countries.ts`
- Barrel export `components/ui/index.ts`

### Phase 2 — Flow d'authentification
> Commit `45f779e` · 8 files, +430 / −37

**Pourquoi** : restaurer le flow prescrit
`signup → verify → congrats → setup → home`, brancher les pickers
de pays et améliorer le Landing.

**Livrables** :
- `app/setup.tsx` (CountrySeriesScreen) — flow 2 étapes pays
  (grille 2 colonnes + CountryMap 84px) → série (cards salmon).
- Redirection `congrats → /setup` (était `/(tabs)` direct).
- `CountryPickerSheet` branché sur Login + Forgot (au lieu du
  `DEFAULT_DIAL='+227'` hardcodé).
- `CountryFlag` (3 bandes) + `CountryMap` (PNG) intégrés dans
  les pickers de Login, Signup, Forgot.
- `components/ui/GraduationCap.tsx` : SVG complet (gradient
  violet, tassel salmon) remplace l'emoji 🎓 dans Congrats.
  Animation `FadeIn 600ms spring damping 12`.
- Landing : 3 `LinearGradient` (vertical 4 stops + tinte verte
  + vignette) au lieu de 2 couleurs plates.
- Persistence `hasSeenOnboarding` au montage du Landing.

**Bonus** : commit `dc70322` (chore lint) — **0 erreurs / 0
warnings** sur tout le codebase après cleanup des 12 erreurs +
22 warnings préexistants.

### Phase 3 — Refonte UX du parcours quiz
> Commit `8d3f45f` · 6 files, +639 / −129

**Livrables** :
- `app/quiz-chapters.tsx` (nouveau) : liste chapitres par
  matière, header vert, padlock badge, helper `{n} chapitres ·
  20 questions par quiz`.
- Tab Quiz : `(tabs)/quiz.tsx` route vers `quiz-chapters` au
  lieu de `quiz-session` direct. `SubjectIcon` PNG remplace les
  initiales texte (`MAT`, `PHY`…).
- Mapping `backendSlugToSubjectKind` (`math/physics/biology/...`
  → kinds locaux SubjectIcon).
- Quiz Results refondu (`app/quiz-results.tsx`) :
  - cercle SVG `strokeDasharray` animé,
  - 4 tiers (`Excellent !` ≥80%, `Bien joué` ≥60%, `Continue`
    ≥40%, `Reprends calmement` <40%) avec emoji 🏆/⭐/💪/📚,
  - stats 3-colonnes (`Justes` / `Erreurs` / `Temps`),
  - carte comparaison neutre,
  - footer `Nouveau quiz` (primary) + `Voir les corrections`
    (ghost, route `/quiz-review`).

### Phase 4 — Tabs principaux + bottom navigation
> Commit `47e056d` · 8 files, +479 / −318

**Livrables** :
- `components/ui/TabBarIcon.tsx` : 5 icônes SVG inline custom
  (Home maison, Cours pages dos-à-dos, Sujets double-livre, Quiz
  rect checkmark, Profil tête+buste). Remplace les Lucide qui
  ne reflétaient pas le symbolisme (notamment `Layers` → Sujets).
- `components/ui/DiamondIcon.tsx` : SVG gradient `#FFB876 →
  #E8624C`. Utilisé dans Courses TabChips + Library Épreuve/
  Corrigé/Vidéo tabs.
- Library : `SubjectIcon` PNG sur sélecteur + bottom sheet,
  bouton primaire `Ouvrir → Télécharger`.
- Home : section « Reprendre » restaurée (CTA placeholder route
  vers Courses), `Annales` route vers Library.
- Profile refonte structurelle complète :
  - avatar 64×64 gradient à gauche (au lieu de hero centré 90×90),
  - stats card unique avec séparateurs (au lieu de 3 cards),
  - section « Mes Badges » supprimée (hors maquette),
  - 9 items menu alignés (`Modifier`, `Pays et série`,
    `Notifications`, `Hors-ligne`, `Mes paiements`, `Chaîne
    WhatsApp`, `Support`, `Politique de confidentialité`,
    `Supprimer mon compte`),
  - `ProfileIcon` colorés (greenSoft / salmonSoft / dangerSoft),
  - chip Premium inline `salmonSoft / salmonDark`,
  - bouton logout pleine largeur, border `#F5D9D1`.

### Phase 5 — Tuteur IA + Plan + Recherche
> Commit `e899bd7` · 5 files, +1233 / −3

**Pourquoi** : 3 écrans différenciateurs absents de l'app livrée.

**Livrables** :
- `app/tutor.tsx` — Chat Nobi avec avatar gradient, bulles
  asymétriques user/AI, état typing (3 dots), suggested chips,
  input bar. Stub local en attendant `POST /tutor/chat`.
- `app/plan.tsx` — Countdown réel via `daysUntilBac()` + carte
  hero gradient + 3 tâches stub + 6 semaines stub.
- `app/search.tsx` — Header vert avec input autoFocus, sections
  Récents / En vogue (stub), résultats filtrés localement sur
  subjects + books.
- Icône `<Search>` du Home branchée sur `/search`.
- Doc `docs/BACKEND_GAPS.md` créée — commit `fbfcc82` —
  recensant les gaps backend Phase 0-8 avec priorisation P0-P3.

### Phase 6 — Refonte du tunnel Premium
> Commit `ca763a2` · 6 files, +763 / −210

**Livrables** :
- Subscription Plans : hero `LinearGradient(160deg)` + emoji 🏆
  + 5 PERKS (Tuteur IA illimité / Tous les sujets / Quiz
  adaptatifs / Vidéos / Hors-ligne), plans en radio cards (au
  lieu d'une card par plan) avec badge `POPULAIRE` salmon
  automatique sur le plan 90 jours, CTA fixe en footer.
- `PremiumLockSheet` (`components/ui/`) : modal slide-up,
  cadenas gradient, badge `Réservé Premium`, CTA `Passer
  Premium` + `Plus tard`. Réutilisable pour remplacer les
  `Alert.alert` sur 403.
- `PremiumSuccessSheet` : modal plein écran gradient vert,
  checkmark animé Reanimated `ZoomIn 600ms`, CTA `Commencer`.
- `payment-checkout.tsx` : success sheet affiché au lieu de
  l'`Alert.alert` natif.
- My Subscription : carte active passée d'un `View bg-green`
  plat à un `LinearGradient(135deg)` avec shadow verte, badge
  `✓ ACTIF`, deux boutons `Renouveler` (primary) + `Étendre
  scope` (secondary), header de section avec `Historique · X
  FCFA dépensés` (calculé client-side).

### Phase 7 — Offline + RGPD + sheets
> Commit `c2ae95c` · 10 files, +1258 / −19

**Livrables** :
- `components/ui/OfflineBanner.tsx` : bandeau noir transient
  animé Reanimated. Détection via `hooks/useOnlineStatus.ts`
  (polling `/health` 30s, pas de `@react-native-community/netinfo`
  pour éviter une dep native mid-mission).
- `components/ui/ComingSoonOverlay.tsx` : modal réutilisable
  avec badge pulsant salmon, icône gradient vert, capture
  email/phone, état success.
- `app/settings/delete-account.tsx` : flow RGPD 2 étapes —
  raison (5 motifs) + warning définitif + saisie obligatoire
  du mot `SUPPRIMER` + texte légal UEMOA. À la validation,
  alerte expliquant la voie support (pas d'endpoint
  `DELETE /me/account` côté backend pour l'instant).
- `components/ui/WhatsAppSheet.tsx` : bottom sheet brand
  `#25D366` avec icône logo, `Share.share()` natif RN (pas
  d'`expo-clipboard`), CTA `Ouvrir dans WhatsApp`.
- `hooks/useOfflinePreferences.ts` : stockage AsyncStorage des
  préférences `wifiOnly` / `autoDownload`. Migration vers
  `/me/preferences` backend prévue.
- My Downloads polish :
  - carte préférences avec 2 toggles `Switch` natifs,
  - badges typés colorés sur chaque téléchargement (`PDF` rouge,
    `FICHE` vert, `CORRIGÉ` bleu).

### Phase 8 — Polish UI final
> Commit `e820e0d` · 5 files, +153 / −72

**Livrables** :
- Course Reader : carte CTA `Tester vos acquis` intégrée
  (remplace l'ancien FAB noir flottant 🎯), suppression des
  boutons header `Bookmark` + `Share2` non fonctionnels.
- Splash : `assets/images/logo.png` (brand officiel) au lieu
  de `icon.png` (Expo template).
- Verify OTP : anneau actif 54×54 vert clair (effet `boxShadow:
  0 0 0 4px greenSoft` reproduit en RN), bouton VÉRIFIER
  `shape='rounded'` (12px) au lieu de pill, `pb-8 → pb-3` sur
  keypad.
- Edit Profile : avatar `LinearGradient(135deg green→greenDark)`
  au lieu de plein vert.
- Books : `pickCoverPalette()` indexée sur le nom de matière
  (corrige le bug où `BOOK_GRADIENTS[book.subject?.id ? 'maths'
  : 'phys']` donnait 2 couleurs aléatoires sans rapport avec
  la matière réelle).

---

## 3. Composants livrés

22 composants UI / hooks dans `components/ui/` + `hooks/` :

| Composant | Phase | Rôle |
|---|---|---|
| `Logo` / `LogoMini` | 1 | Logo brand avec ombre douce |
| `SubjectIcon` | 1 | PNG par matière + tile colorée + fallback lettre |
| `CountryFlag` | 1 | Drapeau vectoriel 3 bandes (pickers téléphone) |
| `CountryMap` | 1 | Drapeau PNG réel UEMOA |
| `PremiumLock` | 1 | Cadenas SVG salmon |
| `Card`, `Badge`, `Heading` | 1 | Primitives typographiques + visuelles |
| `IllustrationStack/Quiz/AI` | 1 | Illustrations onboarding |
| `CountryPickerSheet` | 1 | Sélecteur pays réutilisable |
| `GraduationCap` | 2 | Toque diplôme animée (Congrats) |
| `TabBarIcon` | 4 | 5 icônes SVG bottom nav |
| `DiamondIcon` | 4 | Diamant gradient orangé (chips) |
| `PremiumLockSheet` | 6 | Bottom sheet conversion sur 403 |
| `PremiumSuccessSheet` | 6 | Sheet success post-paiement animé |
| `OfflineBanner` | 7 | Bandeau hors-ligne global |
| `ComingSoonOverlay` | 7 | Overlay réutilisable feature non livrée |
| `WhatsAppSheet` | 7 | Sheet rejoindre chaîne WhatsApp |
| `useOnlineStatus` | 7 | Hook ping `/health` 30s |
| `useOfflinePreferences` | 7 | Hook AsyncStorage préférences offline |

---

## 4. Écrans ajoutés / refondus

| Écran | Statut | Phase |
|---|---|---|
| `app/setup.tsx` | 🆕 Nouveau | 2 |
| `app/quiz-chapters.tsx` | 🆕 Nouveau | 3 |
| `app/tutor.tsx` | 🆕 Nouveau | 5 |
| `app/plan.tsx` | 🆕 Nouveau | 5 |
| `app/search.tsx` | 🆕 Nouveau | 5 |
| `app/settings/delete-account.tsx` | 🆕 Nouveau | 7 |
| `app/landing.tsx` | ♻️ Refondu | 2 |
| `app/(auth)/login.tsx` | ♻️ Refondu | 2 |
| `app/(auth)/signup.tsx` | ♻️ Refondu | 2 |
| `app/(auth)/forgot.tsx` | ♻️ Refondu | 2 |
| `app/(auth)/verify.tsx` | ♻️ Polish | 2 + 8 |
| `app/(auth)/congrats.tsx` | ♻️ Refondu | 2 |
| `app/(tabs)/index.tsx` (Home) | ♻️ Polish | 4 + 5 |
| `app/(tabs)/quiz.tsx` | ♻️ Refondu | 3 + 4 |
| `app/(tabs)/courses.tsx` | ♻️ Polish | 4 |
| `app/(tabs)/library.tsx` | ♻️ Polish | 4 |
| `app/(tabs)/profile.tsx` | ♻️ Refondu | 4 + 7 |
| `app/quiz-session.tsx` | ♻️ Polish | 3 |
| `app/quiz-results.tsx` | ♻️ Refondu | 3 |
| `app/subscription-plans.tsx` | ♻️ Refondu | 6 |
| `app/payment-checkout.tsx` | ♻️ Polish | 6 |
| `app/my-subscription.tsx` | ♻️ Refondu | 6 |
| `app/my-downloads.tsx` | ♻️ Polish | 7 |
| `app/course-reader.tsx` | ♻️ Polish | 8 |
| `app/books.tsx` | ♻️ Polish | 8 |
| `app/settings/edit-profile.tsx` | ♻️ Polish | 8 |
| `app/index.tsx` (Splash) | ♻️ Polish | 8 |
| `app/_layout.tsx` | ♻️ Polish | 0 + 7 |

---

## 5. Limites backend identifiées

Documentées dans
[`docs/BACKEND_GAPS.md`](BACKEND_GAPS.md) avec contournements mobile
et endpoints suggérés pour l'équipe API.

| Priorité | Endpoint manquant | Phase | Blocage UX |
|---|---|---|---|
| 🔴 P0 | `POST /auth/verify-otp` doit renvoyer tokens | 2 | Flow auth nécessite re-login manuel après OTP |
| 🔴 P0 | `POST /tutor/chat` | 5 | Tuteur IA Nobi en mode stub |
| 🟠 P1 | `GET /me/stats` | 4 | Stats Profile affichent `—` |
| 🟠 P1 | `GET /me/last-read` | 4 | Section Home « Reprendre » placeholder |
| 🟠 P1 | `POST /quiz/sessions { chapter_id }` | 3 | Quiz toujours subject-wide |
| 🟠 P1 | `GET /search` | 5 | Recherche filtre local seulement |
| 🟡 P2 | `GET /me/study-plan` | 5 | Plan d'étude stub |
| 🟡 P2 | `GET /me/quiz-progress` | 3 | Badge chapitre toujours padlock |
| 🟡 P2 | `DELETE /me/account` | 7 | RGPD passe par support |
| 🟢 P3 | `GET /quiz/sessions/{id}/percentile` | 3 | Comparaison neutre |
| 🟢 P3 | `GET /me/downloads/queue` | 7 | Pas de section « En cours » |
| 🟢 P3 | `GET /me/preparation` | 4 | Pas de barre `Prêt à X%` |

---

## 6. Métriques

| Indicateur | Valeur |
|---|---|
| Branches créées | 9 (une par phase) |
| Commits totaux | 12 (9 phases + gitignore + lint cleanup + doc) |
| Fichiers ajoutés | 37 |
| Fichiers modifiés | 27 |
| Fichiers supprimés | 10 (Expo template orphelins) |
| Lignes ajoutées | ~5 700 |
| Lignes supprimées | ~1 350 |
| Tests | **86/86** verts à chaque fin de phase |
| TypeScript | **EXIT 0** à chaque fin de phase |
| Lint | **0 erreurs / 0 warnings** sur l'ensemble du codebase |
| Composants UI livrés | 18 |
| Hooks livrés | 2 |
| Écrans nouveaux | 6 |
| Écrans refondus | 22 |

---

## 7. Choix techniques notables

### 7.1 — Pragmatisme face aux contraintes backend
Plusieurs maquettes prescrivent une UX **incompatible avec le
backend actuel** (feedback inline anti-triche bypass, quiz par
chapitre, percentile…). Approche adoptée :
- **Stubs locaux fidèles à la maquette** pour les écrans 100%
  produit (Tuteur IA, Plan, Search).
- **Adaptation honnête** quand le backend interdit (hint
  « Tu verras les corrections à la fin » dans Quiz Session).
- **Documentation systématique** des gaps dans
  `BACKEND_GAPS.md` pour priorisation côté API.

### 7.2 — Pas de nouvelles deps natives
Pour éviter de bloquer la mission sur un rebuild du dev client
EAS :
- `@react-native-community/netinfo` → polling `/health` léger.
- `expo-clipboard` → `Share.share()` natif.

Ces décisions sont marquées comme à reconsidérer au prochain
dev client build.

### 7.3 — Mono-thème assumé
Suppression de toute l'infra `Colors.dark` / `ThemedText` /
`useColorScheme` héritée du template Expo. L'app est mono-thème
clair conforme à la maquette. Plus de dette ambiguë.

### 7.4 — Composants brand centralisés
22 composants regroupés dans `components/ui/` avec un barrel
export. Permet aux écrans d'importer en une ligne :
`import { Logo, Heading, Badge, SubjectIcon } from '@/components/ui'`.

---

## 8. Prochaines étapes recommandées

### Côté API
1. Prioriser les 4 endpoints P0/P1 qui débloquent les écrans
   stubs (`/tutor/chat`, `/me/stats`, `/me/last-read`, `/search`).
2. Évaluer la position produit sur `POST /auth/verify-otp` →
   renvoyer un `LoginResponse` plutôt qu'`AuthUserResponse` pour
   permettre l'auto-login.

### Côté mobile
1. Smoke test E2E sur device une fois ces phases mergées vers
   `main` (notamment Reanimated + react-native-svg sur Android).
2. Builder un dev client EAS pour intégrer NetInfo (native) et
   améliorer la détection offline.
3. Brancher les stubs sur les vrais endpoints à mesure que l'API
   les livre. Suivre `BACKEND_GAPS.md`.
4. Évaluer un **rebuild d'icône brand** : la maquette utilise
   `logo.png` carré qui n'a pas de variante dark / wordmark.

### Côté workflow
1. Merger les branches phase par phase vers `main` (revue
   indépendante possible) ou en un seul squash si l'historique
   linéaire convient.
2. Les commits ont chacun un body détaillé pour comprendre les
   choix et limites — utile en code review.

---

**Maintenu par** : équipe mobile pendant la mission de mise en
conformité. Toute nouvelle phase ou cycle d'audit doit mettre à
jour ce récap.
