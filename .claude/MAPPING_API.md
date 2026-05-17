# MAPPING API — Mobile ↔ Backend

> Dernière mise à jour : 2026-05-17
> Backend : Laravel `v1.4-P6-complete` ([api/routes/api.php](../../api/routes/api.php))
> Mobile : branche `feature/mobile-fix-urgents-p4-p5`

## Légende

- **🟢 INTEGRÉ** : service mobile écrit + consommé par au moins un écran
- **🟡 DORMANT** : service mobile écrit mais **jamais appelé** par un écran
- **🔴 ABSENT** : aucun code mobile

---

## Auth — `/api/v1/auth/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| POST | `/auth/register` | `authService.register` | `(auth)/signup.tsx` | 🟢 |
| POST | `/auth/verify-otp` | `authService.verifyOtp` | `(auth)/verify.tsx` (UI seule, **pas d'appel**) | 🟡 |
| POST | `/auth/login` | `authService.login` | `(auth)/login.tsx` | 🟢 (corrigé en M-P0) |
| POST | `/auth/password/request-reset` | — | — | 🔴 |
| POST | `/auth/password/reset` | — | — | 🔴 |
| POST | `/auth/refresh` | `authService.refreshToken` | aucun (à brancher dans interceptor 401) | 🟡 |
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
| GET | `/courses/subjects/{subject}/chapters` | `courseService.getChapters` | — (l'écran courses utilise `COURSE_SECTIONS` mock) | 🟡 |
| GET | `/courses/chapters/{chapter}` | — | — | 🔴 |
| GET | `/courses/chapters/{chapter}/lessons` | `courseService.getLessons` | — | 🟡 |
| GET | `/courses/lessons/{lesson}` | `courseService.getLesson` | — (`course-reader.tsx` utilise `MOCK_LESSON`) | 🟡 |
| GET | `/courses/revision-sheets/{revisionSheet}` | — | — | 🔴 |
| GET | `/courses/chapter-videos/{chapterVideo}` | — | — | 🔴 |
| GET | `/courses/books` | `catalogService.getBooks` | `books.tsx` | 🟢 |
| GET | `/courses/books/{book}` | — | — | 🔴 |
| GET | `/courses/books/{book}/download` | `catalogService.downloadBook` | `pdf-viewer.tsx` | 🟢 (corrigé en M-P0) |

---

## Abonnements — `/api/v1/subscriptions/*`

| Méthode | Endpoint backend | Service mobile | Écran(s) | Statut |
|---|---|---|---|---|
| GET | `/subscriptions/plans` | — | — | 🔴 |
| GET | `/subscriptions/active` | — | — | 🔴 |
| GET | `/subscriptions/transactions` | — | — | 🔴 |

**Note** : la modale "Premium bientôt" sur `(tabs)/index.tsx` ouvre juste un `Alert` natif. Aucun écran paywall.

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
| GET | `/me/downloads/` | — | — | 🔴 |
| GET | `/me/downloads/quota` | — | — | 🔴 |
| POST | `/me/downloads/` | — | — | 🔴 |
| GET | `/me/downloads/{userDownload}` | — | — | 🔴 |
| DELETE | `/me/downloads/{userDownload}` | — | — | 🔴 |

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
| Auth | 7 | 3 | 2 | 2 |
| Référentiel public | 3 | 1 + 1 indirect | 0 | 1 |
| Profile | 2 | 0 | 0 | 2 |
| Catalog | 5 | 0 | 1 | 4 |
| Courses | 11 | 3 | 4 | 4 |
| Subscriptions | 3 | 0 | 0 | 3 |
| Payments | 2 (+ webhook) | 0 | 0 | 2 |
| Offline / Me downloads | 5 | 0 | 0 | 5 |
| Quiz | 5 | 3 | 2 | 0 |
| **Total** | **43** | **10 (23%)** | **9 (21%)** | **23 (53%)** + 1 webhook |

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
