# PLAN D'IMPLÉMENTATION — Le Noble BAC UEMOA Mobile

> Dernière mise à jour : 2026-05-17
> Stack : Expo SDK 54 / React Native 0.81 / TypeScript 5.9 / Expo Router 6 / NativeWind 4 / Zustand 5 / TanStack Query 5
> Backend de référence : Laravel API `v1.4-P6-complete` (357 tests, 2026-05-17)

---

## 0. État courant

| Indicateur | Valeur |
|---|---|
| Branche active | `feature/mobile-fix-urgents-p4-p5` (commit `ae6c081`, non poussée) |
| Branches précédentes | `feature/mobile-api-alignment-phase-1-3` (P1→P3 partiels), `main` (initial commit) |
| Bypass auth dev | **Actif** (`EXPO_PUBLIC_BYPASS_AUTH=true` dans `.env.local`) |
| Couverture API backend | ~15 endpoints sur ~30+ exposés |
| Suite de tests Jest | 4 cas (services quiz) — coverage < 1% |
| Parité fonctionnelle avec backend P6 | ~25-30% |

Voir [MAPPING_API.md](MAPPING_API.md) pour le détail endpoint par endpoint.

---

## 1. Phases mobile

### Phase M-P0 — Fix urgents P4/P5 ✅ TERMINÉE — 2026-05-17

**Objectif** : Réaligner le mobile sur les contrats backend après refonte P4 (Quiz single-answer, suppression `QuizChapter`) et renommage P5 (`/signed-url` → `/download`). Corriger le bug de parsing du payload login.

| Indicateur | Valeur |
|---|---|
| Branche | `feature/mobile-fix-urgents-p4-p5` |
| Commit | `ae6c081` |
| Fichiers | 8 (`login`, `pdf-viewer`, `quiz-session`, `quiz-review`, `catalogService`, `quizService`, `useQuizStore`, test) |
| Tests | 4/4 verts (`__tests__/quizService.test.ts`) |
| LOC | +363 / -369 |

#### Décisions clés

- **D-P0.1** — Pas de feedback "correct/faux" pendant la session quiz : le backend ne renvoie volontairement pas `is_correct` (`QuizSessionResource.php:36` anti-triche). La correction est exposée à la fin via `QuizSessionFinishedResource`.
- **D-P0.2** — Méthode `downloadBook` retournant le shape complet `{url, expires_at, expires_in_seconds, file_name}` au lieu de `getBookSignedUrl(): string`. Cohérent avec la convention backend et utile pour un futur cache offline.
- **D-P0.3** — `useQuizStore` simplifié : un seul champ `lastFinishedSession: QuizSessionFinished` reflétant la réponse serveur (suppression du shape mock-héritage).

---

### Phase M-P1 — Auth complète 🟡 PARTIELLE

**Objectif** : Sortir du bypass dev en livrant le flux d'authentification complet, conforme au backend Auth (`/auth/*`).

#### État actuel

- ✅ Register (`/auth/register`) — branché, OK
- ✅ Logout (`/auth/logout`) — branché, OK
- ✅ Countries / Series picker (`/countries`, `/countries/{id}/series`) — branchés en signup
- ✅ Login (`/auth/login`) — branché (depuis M-P0)
- ✅ **Auto-refresh sur 401** (`/auth/refresh`) — interceptor avec single-flight queue, fallback `clearLocal` (depuis M-P1.4, 2026-05-18)
- 🟡 OTP (`/auth/verify-otp`) — UI seule, pas de Firebase, pas d'appel API
- ✅ Forgot password — `app/(auth)/forgot.tsx` créé, POST `/auth/password/request-reset` branché (depuis M-P1.3)
- 🟡 Reset password — `app/(auth)/reset.tsx` créé, POST `/auth/password/reset` branché côté HTTP, **bloqué tant que Firebase n'est pas intégré** (stub `firebaseAuthService` affiche un message UX clair)
- ❌ Sortie du bypass `EXPO_PUBLIC_BYPASS_AUTH`

#### Sous-tâches restantes

| # | Tâche | Effort estimé |
|---|---|---|
| M-P1.1 | Brancher Firebase Phone Auth côté mobile (`@react-native-firebase/auth` ou Firebase JS Web SDK Expo-compatible) | ~1j |
| M-P1.2 | `verify.tsx` : envoyer Firebase ID Token vers `POST /auth/verify-otp`, puis `setAuth()` avec le token retourné | ~3h |
| ~~M-P1.3~~ ✅ UI livrée | ~~Créer `app/(auth)/forgot.tsx` (saisie téléphone → `request-reset`) + `app/(auth)/reset.tsx` (OTP + nouveau mot de passe → `reset`)~~ — livré 2026-05-18 (branche `feature/mobile-auth-forgot-reset`). **Dépendance M-P1.1** : le bouton final est bloqué tant que `firebaseAuthService` reste un stub (message UX clair affiché). | ~4h |
| ~~M-P1.4~~ ✅ | ~~Étendre `apiClient` interceptor : sur 401, tenter `/auth/refresh` avec `refresh_token` du SecureStore, retry une fois, sinon logout propre~~ — **livré 2026-05-18** (branche `feature/mobile-auth-refresh-401`, 7 tests Jest) | ~3h |
| M-P1.5 | Retirer `EXPO_PUBLIC_BYPASS_AUTH` du `.env.local` (ou le forcer à `false` par défaut + documenter) | ~30min |
| M-P1.6 | Tests Jest : services auth (login parse, refresh, error 401) | ~2h |

#### Pré-requis

- Compte Firebase configuré côté backend (`config/firebase.php`) — à confirmer avec Norris.
- Numéros de test Firebase pour CI / dev local.

---

### Phase M-P2 — Câblage des écrans existants 🟡 EN COURS

**Objectif** : Remplacer les mocks par les vrais appels API. Beaucoup de services sont déjà écrits mais dormants — gains visuels rapides sans nouveau code service.

#### Sous-lot livré : Courses (M-P2.3 + M-P2.4 + M-P2.5 + M-P2.6) ✅ 2026-05-18

**Plan B retenu** (cf §11.) : extension backend + intégration mobile en un seul lot.

- **Backend** : commit `32f30b7` (branche `feature/courses-listings-revsheets-videos`)
  - 2 nouveaux endpoints : `GET /courses/chapters/{id}/revision-sheets`, `GET /courses/chapters/{id}/chapter-videos`
  - 2 nouvelles Resources LIST + extension repos (`listByChapter` sur RevisionSheet & ChapterVideo)
  - 8 tests Pest (publication filter, scoping, 401). Suite globale : 357 → 365 tests
- **Mobile** : branche `feature/mobile-courses-real-data`
  - `courseService` étendu (7 méthodes au lieu de 4 ; fix `getChapters(subjectId: number)` au lieu de slug)
  - `(tabs)/courses.tsx` refondu : 3 onglets (Cours/Fiches/Vidéos) avec accordéon par chapitre, contenu chargé à l'expansion via React Query
  - `course-reader.tsx` : `lessonId` param + `lesson.content` réel (états loading/forbidden/error)
  - `pdf-viewer.tsx` étendu : nouveau param `revisionSheetId` (en plus de `bookId`/`url`)
  - `chapter-video.tsx` : nouvelle route, YouTube embed via WebView
  - 7 nouveaux tests Jest (suite 4 → 11)
  - Types `RevisionSheet`, `RevisionSheetListItem`, `ChapterVideo`, `ChapterVideoListItem` dans `types/api.ts`

#### État actuel

- ✅ Books (liste + filtre matière + download) — branché
- ✅ Quiz subjects (`/courses/subjects`) — branché
- ✅ Quiz session complète — branchée depuis M-P0
- ✅ **Courses (M-P2.3-6)** — chapitres + leçons + fiches + vidéos branchés (depuis sous-lot Courses)
- ❌ Home — 100% mock (countdown BAC, resume card, carrousel HOME_BOOKS, progression 64% hardcodée)
- ❌ Library (sujets BAC) — 100% mock (PDF W3.org de test, années 2015-2024 hardcodées)
- ❌ Profile — Awa Diallo / Sénégal / S2 / 42 quiz / 85% **tous en dur**
- ❌ Settings (edit-profile = fake setTimeout, notifications = state local)

#### Sous-tâches restantes

| # | Tâche | Services consommés | Effort |
|---|---|---|---|
| M-P2.1 | Profile : remplacer données hardcodées par `useAuthStore.user` + `GET /profile` (à créer dans `authService` ou `profileService`) | `/profile` | ~3h |
| M-P2.2 | Edit-profile : `PATCH /profile` avec validation côté Form | `/profile` | ~3h |
| M-P2.3 | Courses : utiliser `courseService.getChapters(subjectSlug)` + `getLessons(chapterId)` + `getLesson(lessonId)` (déjà écrits) → remplacer `COURSE_SECTIONS` mock | `/courses/subjects/{slug}/chapters`, `/chapters/{id}/lessons`, `/lessons/{id}` | ~6h |
| M-P2.4 | Course-reader : remplacer `MOCK_LESSON` hardcodé par le contenu de `lesson.content` reçu de l'API | `/courses/lessons/{id}` | ~2h |
| M-P2.5 | Revision sheets : créer flux d'accès via `GET /courses/revision-sheets/{id}` + ouverture WebView signed-url | `/courses/revision-sheets/{id}` | ~3h |
| M-P2.6 | Chapter videos : exposer dans courses via `GET /courses/chapter-videos/{id}` | `/courses/chapter-videos/{id}` | ~2h |
| M-P2.7 | Home : countdown BAC dynamique (date par pays/série depuis backend ou config) + progression réelle (à coordonner endpoint backend) | TBD | ~4h |
| M-P2.8 | Library (sujets BAC) : utiliser `catalogService.getExams` (déjà écrit) + ouvrir le PDF via `POST /catalog/{exam}/signed-url`, le corrigé via `POST /catalog/{exam}/corrige/signed-url`, et lister les vidéos via `GET /catalog/{exam}/videos` | `/catalog`, `/catalog/{exam}/*` | ~6h |

---

### Phase M-P3 — Module Paywall / Subscriptions ⛔ NON COMMENCÉE

**Objectif** : Livrer les écrans Premium et la consultation de l'abonnement courant.

#### Sous-tâches

| # | Tâche | Endpoint |
|---|---|---|
| M-P3.1 | `subscriptionService` (plans / active / transactions) | `GET /subscriptions/plans`, `GET /subscriptions/active`, `GET /subscriptions/transactions` |
| M-P3.2 | Écran "Plans Premium" (carrousel des plans, prix par pays via `cinetpay_supported`) | — |
| M-P3.3 | Écran "Mon abonnement" (statut, date d'expiration, renouvellement) | — |
| M-P3.4 | Historique transactions | — |
| M-P3.5 | Remplacer le `Alert("Bientôt")` de la modale Premium accueil par une vraie navigation | — |

**Pré-requis** : finaliser M-P1 (auth complète) car les endpoints subscription exigent `auth:sanctum + phone.verified`.

---

### Phase M-P4 — Paiements (CinetPay) ⛔ NON COMMENCÉE

**Objectif** : Initier un paiement et suivre son statut.

#### Sous-tâches

| # | Tâche | Endpoint |
|---|---|---|
| M-P4.1 | `paymentService` (initiate / status) | `POST /payments/initiate`, `GET /payments/{transaction}/status` |
| M-P4.2 | WebView CinetPay (redirection vers URL renvoyée par `initiate`) | — |
| M-P4.3 | Polling du statut (paiement asynchrone via webhook backend) | — |
| M-P4.4 | Feedback succès / échec (renvoi vers l'écran abonnement actif) | — |

**Note** : l'activation de l'abonnement se fait côté backend via webhook CinetPay uniquement (jamais réponse synchrone — cf `api/.claude/CLAUDE.md`).

---

### Phase M-P5 — Module Offline (downloads + quota) ⛔ NON COMMENCÉE

**Objectif** : Consommer le module offline backend P6 (déjà livré, 357 tests verts).

#### Sous-tâches

| # | Tâche | Endpoint |
|---|---|---|
| M-P5.1 | `myDownloadsService` (index / quota / store / show / destroy) | `GET /me/downloads`, `GET /me/downloads/quota`, `POST /me/downloads`, `GET /me/downloads/{id}`, `DELETE /me/downloads/{id}` |
| M-P5.2 | Écran "Mes téléchargements" : liste avec quota restant (`512 Mo / 90j` glissant côté backend) | — |
| M-P5.3 | Bouton "Télécharger pour hors-ligne" dans pdf-viewer (correction, fiche, livre) → `POST /me/downloads` + `expo-file-system` pour cache local | — |
| M-P5.4 | Suggestion "libérer de l'espace" quand quota dépassé | — |
| M-P5.5 | Indicateur visuel "déjà téléchargé" sur les écrans courses/library/books | — |

**Contrat backend P6** :
- Types polymorphes acceptés : `correction`, `revision_sheet`, `book`
- Quota : 512 000 Ko sur fenêtre glissante 90 jours (cumul `is_active=true`)
- Réactivation auto : si l'utilisateur perd puis re-obtient un abonnement Premium, le `SubscriptionObserver` re-active les downloads soft-deleted
- URLs signées : Correction TTL 15min, Book/RevisionSheet TTL 2h
- Watermarking : **abandonné MVP** (colonne `r2_key_watermarked` dormante)

---

### Phase M-P6 — Polish et fondations 🟡 ONGOING

**Objectif** : Robustesse, tests, i18n, nettoyage.

| # | Tâche | Priorité |
|---|---|---|
| M-P6.1 | Supprimer `app/onboarding.tsx` (doublon cassé) + `app/splash-screen.tsx` (doublon) + `app/modal.tsx` (boilerplate) | Moyenne |
| M-P6.2 | Exclure `mobile/templates/` de `tsconfig` et `jest.config.js > collectCoverageFrom` | Moyenne |
| M-P6.3 | Mettre à jour `mobile/README.md` (actuellement boilerplate `create-expo-app`) | Basse |
| M-P6.4 | i18n (`expo-localization` + `i18next`) — la Guinée-Bissau est lusophone | Moyenne |
| M-P6.5 | `accessibilityLabel` sur les TouchableOpacity critiques | Basse |
| M-P6.6 | Coverage Jest viser 30% sur `services/` + `store/` + `utils/` avant d'empiler de nouveaux écrans | Haute |
| M-P6.7 | Composants UI manquants : Toast / EmptyState / global Loader | Moyenne |
| M-P6.8 | Décider entre `expo-av` (legacy) et `expo-video` (recommandé) — éliminer la coexistence | Moyenne |
| M-P6.9 | Linter strict + pre-commit hook (husky + lint-staged) | Basse |

---

## 2. Décisions techniques clés (mobile)

| Décision | Valeur |
|---|---|
| Routing | Expo Router (file-based, typedRoutes activé) |
| État global | Zustand 5 (auth + quiz) — pas de Redux |
| Server state | TanStack React Query 5 (staleTime 5min, retry 2) |
| Styling | NativeWind 4 (Tailwind) — coexistence avec StyleSheet RN tolérée pour les écrans denses (quiz) |
| HTTP | axios 1.16, instance unique avec interceptors Bearer + 401 cleanup |
| Stockage sécurisé | `expo-secure-store` pour les tokens, `AsyncStorage` pour les flags d'UX |
| Alias imports | `@/*` → racine projet |
| Polices | Poppins (6 graisses) chargées au boot |
| Animations | `react-native-reanimated` 4 + worklets |
| Tests | Jest + jest-expo (pas de `@testing-library/react-native` actuellement) |
| Convention API | toutes les réponses backend ont l'enveloppe `{success, message, data, meta?}` — extraire via `response.data.data` (typé `ApiResponse<T>`) |
| Convention services | un fichier par domaine (`authService`, `catalogService`, `courseService`, `quizService`, …), exporté comme objet de méthodes async |
| Gestion erreurs | `utils/apiError.ts > getApiErrorMessage()` extrait le message de l'enveloppe `ApiError` |

---

## 3. Conventions de code

- **TypeScript strict** activé — pas de `any` sauf si justifié
- **Pas d'i18n hardcodé** en français pour les nouveaux écrans à partir de M-P6.4
- **Pas de magic strings** : pour les routes API, utiliser les constantes du service ; pour les couleurs/spacing, utiliser les tokens Tailwind
- **Pas de commentaires WHAT** (le code se documente lui-même via noms explicites). Les commentaires de domaine WHY sont permis (ex: "is_correct hidden by backend during session — anti-cheat")
- **Pas de fichiers `.md` créés sauf explicitement demandés**
- **Pas de push automatique** — commits locaux uniquement, push sur demande

---

## 4. TODOs reportés / dette technique

| Item | Détail | Phase de résolution |
|---|---|---|
| `app/onboarding.tsx` cassé (imports `Animated`/`expo-av` mauvais) | À supprimer ou réécrire — actuellement non navigable | M-P6.1 |
| Coverage Jest < 1% | 1 seul fichier de test (services quiz) | M-P6.6 |
| `mobile/docs/` vide + `README.md` boilerplate | À enrichir | M-P6.3 |
| Coexistence `expo-av` / `expo-video` | Le `landing.tsx` utilise `expo-video`, `onboarding.tsx` utilise `expo-av` | M-P6.8 |
| `mobile/templates/` (~200 fichiers HTML/JSX prototype Gamma) | Bruit dans tsconfig/jest, à exclure ou sortir du repo | M-P6.2 |
| Mock `COURSE_SECTIONS`, `HOME_BOOKS`, `LIBRARY_BOOKS`, `QUIZ_SUBJECTS`, `MOCK_QUESTIONS` | À supprimer une fois M-P2 livré | M-P2 |
| Hardcoded "Awa Diallo / Sénégal / S2" dans `profile.tsx` | À remplacer par `useAuthStore.user` | M-P2.1 |
| Settings (edit-profile, notifications) en simulation locale | Pas d'appel API | M-P2.2 |
| Route `/(auth)/forgot` référencée sans implémentation | Crash silencieux à la navigation | M-P1.3 |
| Pas de gestion offline du store React Query (`MMKV` ou `AsyncStorage` persister) | Décision UX à prendre | M-P6 (futur) |

---

## 5. Règles d'exécution Claude Code (mobile)

1. **Lire `mobile/.claude/PLAN.md`** au démarrage pour l'état exact des phases
2. **Lire `mobile/.claude/MAPPING_API.md`** avant toute intégration backend pour vérifier le shape exact
3. **Confronter aux contrats backend** : ne jamais inventer un endpoint — toujours vérifier `api/routes/api.php` + `api/.claude/API_ROUTES.md`
4. **Tests avant commit** : `node node_modules/.bin/jest --coverage=false` + `node node_modules/.bin/tsc --noEmit` (filtré sur fichiers modifiés)
5. **Pas de push automatique** — commits locaux uniquement
6. **Rapport de fin d'exécution** obligatoire après chaque lot livré
7. **Skill Context7** disponible pour la doc à jour Expo/Expo Router/RN si besoin

---

## 6. Liens utiles

- Backend PLAN : `../../api/.claude/PLAN.md`
- Backend API routes : `../../api/routes/api.php` + `../../api/.claude/API_ROUTES.md`
- Backend business rules : `../../api/.claude/BUSINESS_RULES.md`
- Backend data model : `../../api/.claude/noble-bac-uemoa-modele-donnees-v1.4.md`
- Mapping API mobile↔backend : [MAPPING_API.md](MAPPING_API.md)
