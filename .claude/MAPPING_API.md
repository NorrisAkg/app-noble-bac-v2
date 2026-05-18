# MAPPING API — Mobile ↔ Backend

> Dernière mise à jour : 2026-05-18
> Backend : Laravel `v1.4.1-hardened` ([api/routes/api.php](../../api/routes/api.php))
> Mobile : branche `feature/mobile-m-p2-screens-wiring`

## Légende

- **🟢 INTEGRÉ** : service mobile écrit + consommé par au moins un écran
- **🟡 DORMANT** : service mobile écrit mais **jamais appelé** par un écran
- **🔴 ABSENT** : aucun code mobile

---

## Health — `/api/v1/health` 🆕 (v1.4.1-hardened)

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/health` | — | — (utile pour splash screen / smoke test) | 🔴 |

**Note** : endpoint public (sans auth, hors throttle), renvoie 200 si DB+Redis OK sinon 503. Pratique pour un check de disponibilité au démarrage de l'app avant le login.

---

## Auth — `/api/v1/auth/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| POST | `/auth/register` | `authService.register` | `(auth)/signup.tsx` | 🟢 |
| POST | `/auth/verify-otp` | `authService.verifyOtp` | `(auth)/verify.tsx` (UI seule, **pas d'appel**) | 🟡 |
| POST | `/auth/login` | `authService.login` | `(auth)/login.tsx` | 🟢 (corrigé en M-P0) |
| POST | `/auth/password/request-reset` | `authService.requestPasswordReset` | `(auth)/forgot.tsx` | 🟢 (depuis M-P1.3) |
| POST | `/auth/password/reset` | `authService.resetPassword` | `(auth)/reset.tsx` | 🟡 (HTTP prêt, attend Firebase M-P1.1) |
| POST | `/auth/refresh` | `apiClient` interceptor (via `performRefresh`) | auto sur 401, single-flight queue | 🟢 (depuis M-P1.4) |
| POST | `/auth/logout` | `authService.logout` | via `useAuthStore.logout()` | 🟢 |

---

## Référentiel public — `/api/v1/{countries,series}/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/countries` | `referentialService.getCountries` | `(auth)/signup.tsx` | 🟢 |
| GET | `/countries/{country}/series` | — (countries renvoie déjà séries imbriquées) | `(auth)/signup.tsx` (lit `country.series`) | 🟢 (indirect) |
| GET | `/series/{series}/subjects` | — | — | 🔴 |

---

## Profil — `/api/v1/profile`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/profile` | — | — (`profile.tsx` utilise des données hardcodées "Awa Diallo") | 🔴 |
| PATCH | `/profile` | — | — (`settings/edit-profile.tsx` simule setTimeout) | 🔴 |

---

## Catalogue (annales) — `/api/v1/catalog/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/catalog` | `catalogService.getExams` | — | 🟡 |
| GET | `/catalog/{exam}` | — | — | 🔴 |
| POST | `/catalog/{exam}/signed-url` | — | — (sujet BAC PDF) | 🔴 |
| POST | `/catalog/{exam}/corrige/signed-url` | — | — (corrigé) | 🔴 |
| GET | `/catalog/{exam}/videos` | — | — | 🔴 |

**Note** : `(tabs)/library.tsx` affiche des données mock (PDF W3.org, années hardcodées 2015-2024). Aucun call API.

---

## Cours — `/api/v1/courses/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/courses/subjects` | `courseService.getSubjects` | `(tabs)/courses.tsx`, `(tabs)/quiz.tsx`, `books.tsx` | 🟢 |
| GET | `/courses/subjects/{subject}` | — | — | 🔴 |
| GET | `/courses/subjects/{subject}/chapters` | `courseService.getChapters` | `(tabs)/courses.tsx` | 🟢 (depuis M-P2 Courses) |
| GET | `/courses/chapters/{chapter}` | — | — | 🔴 |
| GET | `/courses/chapters/{chapter}/lessons` | `courseService.getLessons` | `(tabs)/courses.tsx` | 🟢 (depuis M-P2 Courses) |
| GET | `/courses/chapters/{chapter}/revision-sheets` 🆕 | `courseService.getRevisionSheetsByChapter` | `(tabs)/courses.tsx` | 🟢 (livré conjointement backend + mobile en M-P2 Courses) |
| GET | `/courses/chapters/{chapter}/chapter-videos` 🆕 | `courseService.getChapterVideosByChapter` | `(tabs)/courses.tsx` | 🟢 (livré conjointement backend + mobile en M-P2 Courses) |
| GET | `/courses/lessons/{lesson}` | `courseService.getLesson` | `course-reader.tsx` | 🟢 (depuis M-P2 Courses) |
| GET | `/courses/revision-sheets/{revisionSheet}` | `courseService.getRevisionSheet` | `pdf-viewer.tsx` (param `revisionSheetId`) | 🟢 (depuis M-P2 Courses) |
| GET | `/courses/chapter-videos/{chapterVideo}` | `courseService.getChapterVideo` | `chapter-video.tsx` | 🟢 (depuis M-P2 Courses) |
| GET | `/courses/books` | `catalogService.getBooks` | `books.tsx` | 🟢 |
| GET | `/courses/books/{book}` | — | — | 🔴 |
| GET | `/courses/books/{book}/download` | `catalogService.downloadBook` | `pdf-viewer.tsx` | 🟢 (corrigé en M-P0) |

---

## Abonnements — `/api/v1/subscriptions/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/subscriptions/plans` | `subscriptionService.getSubscriptionPlans` | `app/subscription-plans.tsx` | 🟢 (M-P3) |
| GET | `/subscriptions/active` | `subscriptionService.getActiveSubscription` | `app/my-subscription.tsx`, `app/subscription-plans.tsx` (bannière) | 🟢 (M-P3) |
| GET | `/subscriptions/transactions` | `subscriptionService.getTransactions` | `app/my-subscription.tsx` (historique) | 🟢 (M-P3) |

**Note** : le bouton "Premium" de la barre Home + le badge Premium du Profile mènent désormais vers `/subscription-plans` (paywall réel). Le paiement effectif (CinetPay) sera branché en M-P4.

---

## Paiements — `/api/v1/payments/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| POST | `/payments/initiate` | — | — | 🔴 |
| GET | `/payments/{transaction}/status` | — | — | 🔴 |
| POST | `/payments/webhook` | **public, IPs filtrées** | — | N/A (côté serveur CinetPay) |

---

## Module Offline — `/api/v1/me/downloads/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/me/downloads/` | `myDownloadsService.listDownloads` | `app/my-downloads.tsx`, hook `useDownloadedSet` (badges sur listings) | 🟢 (M-P5) |
| GET | `/me/downloads/quota` | `myDownloadsService.getQuota` | — (meta.quota déjà inclus dans GET /me/downloads) | 🟡 |
| POST | `/me/downloads/` | `myDownloadsService.declareDownload` | `app/pdf-viewer.tsx` bouton "Télécharger hors-ligne" | 🟢 (M-P5) |
| GET | `/me/downloads/{userDownload}` | `myDownloadsService.getDownload` | — (utile pour rafraîchir signed_url, futur) | 🟡 |
| DELETE | `/me/downloads/{userDownload}` | `myDownloadsService.revokeDownload` | `app/my-downloads.tsx` bouton corbeille | 🟢 (M-P5) |

**Contrat P6 backend (livré 2026-05-17)** :
- Body de `POST /me/downloads/` : `{ downloadable_type, downloadable_id }`
- Types acceptés : `correction`, `revision_sheet`, `book`
- Quota : `512_000 Ko` glissant sur `90 jours`
- Revoke automatique à l'expiration d'abonnement (`SubscriptionObserver::updated()`)

---

## Quiz — `/api/v1/quiz/*` (throttle dédié)

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| POST | `/quiz/sessions` | `quizService.startSession` | `quiz-session.tsx` | 🟢 (corrigé en M-P0) |
| GET | `/quiz/sessions/history` | `quizService.getHistory` | — | 🟡 |
| GET | `/quiz/sessions/{quizSession}` | `quizService.getSession` | — | 🟡 |
| POST | `/quiz/sessions/{quizSession}/answers` | `quizService.submitAnswer` | `quiz-session.tsx` | 🟢 (corrigé en M-P0) |
| POST | `/quiz/sessions/{quizSession}/finish` | `quizService.finishSession` | `quiz-session.tsx` | 🟢 (corrigé en M-P0) |

---

## Synthèse couverture

| Domaine | Endpoints backend | Intégrés | Dormants | Absents |
|---|---|---|---|---|
| Auth | 7 | 5 | 2 | 0 |
| Référentiel public | 3 | 1 + 1 indirect | 0 | 1 |
| Profile | 2 | 0 | 0 | 2 |
| Catalog | 5 | 0 | 1 | 4 |
| Courses | 13 🆕 | 10 | 0 | 3 |
| Subscriptions | 3 | 0 | 0 | 3 |
| Payments | 2 (+ webhook) | 0 | 0 | 2 |
| Offline / Me downloads | 5 | 0 | 0 | 5 |
| Quiz | 5 | 3 | 2 | 0 |
| **Total** | **45** | **20 (44%)** | **5 (11%)** | **20 (44%)** + 1 webhook |

---

## Conventions de mapping

### Enveloppe de réponse

Toutes les réponses backend (sauf 204 et webhooks) ont l'enveloppe suivante :

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { current_page?, per_page?, total?, last_page? };
}
```

→ Côté service mobile, extraire systématiquement via `response.data.data` (jamais `response.data` directement).

### Authentification

- Bearer Token (`Authorization: Bearer <access_token>`) automatique via `apiClient` interceptor.
- Endpoints sans auth : `/countries*`, `/series*`, `/auth/{register, verify-otp, login, refresh, password/*}`.
- Endpoints avec `auth:sanctum + phone.verified` : tout le reste (sauf `/auth/logout` qui n'exige que `auth:sanctum`).

### Pagination

- Paramètres : `page` (1-indexé), `per_page` (default 20, max selon endpoint).
- Réponse : `meta.current_page`, `meta.per_page`, `meta.total`, `meta.last_page`.

### Throttle

- `throttle:api` — tous les endpoints `v1`
- `throttle:auth` — `register, verify-otp, login, password/*`
- `throttle:quiz` — toutes les routes `/quiz/sessions/*`
- `throttle:60,1` — webhook CinetPay

### Erreurs

```typescript
interface ApiError {
  success: false;
  message: string;
  errors: Record<string, string[]> | null;
}
```

→ Extraire avec `utils/apiError.ts > getApiErrorMessage(error)`.

---

## Endpoints non documentés (futurs)

Le backend pourrait à terme exposer :

- Recherche globale (catalog + courses + books fusionné)
- Notifications push (FCM subscribe / unsubscribe)
- Progression utilisateur (chapitres complétés, leçons lues, badges)
- Préférences utilisateur (langue, notifications)

À coordonner avec l'équipe backend avant intégration mobile.
