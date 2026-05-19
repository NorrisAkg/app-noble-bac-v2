# Gaps backend — référentiel mobile

Ce document liste les **limites du backend Laravel** et les **endpoints
manquants** qui empêchent une conformité 100 % aux maquettes
`mobile/templates/*`. Il sert de référence pour :
- Le mobile : savoir où mettre des stubs / placeholders.
- L'équipe API : prioriser les endpoints à exposer.

> Convention : chaque entrée précise la **phase d'audit** où le gap a été
> identifié, l'**impact UX**, le **contournement actuel côté mobile** et
> l'**endpoint cible suggéré** pour l'équipe API.

---

## ✅ Phase 2 — Authentification

### 2.1 — Auto-login post `verify-otp` absent
- **Constat** : `POST /auth/verify-otp` retourne `AuthUserResponse`
  (juste le user, pas de tokens Sanctum). L'utilisateur n'est pas
  authentifié au sortir de l'OTP.
- **Impact** : après `signup → verify → congrats`, la navigation vers
  `/setup` ou `/(tabs)` se fait sans Bearer token. Les requêtes
  authentifiées (`/profile`, `/me/...`) échouent en 401 et le guard
  `_layout.tsx` renvoie vers `/landing`. L'utilisateur doit se
  reconnecter manuellement.
- **Contournement** : aucun pour l'instant. Setup tolère l'erreur
  /profile (pas de pré-sélection si fail).
- **Endpoint cible** : faire que `POST /auth/verify-otp` renvoie un
  `LoginResponse` (avec `access_token` + `refresh_token`), comme
  `POST /auth/login`. Aligner les types `AuthUserResponse` ↔
  `LoginResponse`.

### 2.2 — `country_id` immuable post-register
- **Constat** : `UpdateProfilePayload` n'accepte que `series_id`,
  pas `country_id`. La maquette `screens-setup.jsx` permet de
  rechoisir le pays librement.
- **Impact** : sur l'écran Setup post-congrats, l'utilisateur peut
  visuellement sélectionner un autre pays mais on doit afficher un
  message « contacte le support » et garder son pays d'inscription.
- **Contournement** : alerte « Tu es inscrit en {country}. Pour
  changer, contacte le support. ».
- **Endpoint cible** : décider produit — soit autoriser le changement
  via `PATCH /profile { country_id, series_id }` (avec validation
  série compatible), soit acter que le pays est immuable et
  communiquer clairement en UX.

---

## ✅ Phase 3 — Quiz

### 3.1 — `is_correct` non exposé pendant la session (anti-triche)
- **Constat** : `POST /quiz/sessions/{id}/answers` renvoie
  `AnswerProgress` (juste `questions_answered`,
  `questions_remaining`). La correction n'est révélée qu'à la fin
  via `QuizFinishedQuestion.is_correct`.
- **Impact** : impossible d'afficher le feedback inline vert/rouge +
  drawer d'explication prescrit par `templates/screens-quiz.jsx`
  (lignes 127-239).
- **Contournement** : hint discret « Tu verras les corrections
  détaillées à la fin du quiz » sous l'énoncé. Les corrections
  restent disponibles via `/quiz-review` après finish.
- **Endpoint cible** : décision produit — soit garder l'anti-triche
  (UX maquette à adapter), soit exposer `is_correct` + `explanation`
  en option ('practice' mode).

### 3.2 — Quiz par chapitre indisponible
- **Constat** : `POST /quiz/sessions` ne prend que `subject_id`. Pas
  de `chapter_id` ni de filtre par chapitre.
- **Impact** : l'écran « Chapitres » (`/quiz-chapters`) liste les
  chapitres mais tap sur n'importe lequel lance une session
  subject-wide. La maquette imagine 20 questions par chapitre.
- **Contournement** : on affiche tous les chapitres avec padlock vert
  (« Commencer le quiz ») ; tap → session matière-entière.
- **Endpoint cible** : `POST /quiz/sessions { subject_id, chapter_id? }`
  ou `POST /quiz/sessions/by-chapter/{chapter_id}`.

### 3.3 — Progression par chapitre pour quiz
- **Constat** : pas d'endpoint pour récupérer la progression d'un
  user sur un chapitre donné (combien de questions répondues
  correctement, statut Started/Done).
- **Impact** : impossible d'afficher le badge `12/20` rouge ou le
  checkmark vert prescrits par `ChapterStatus`
  (`screens-quiz-config.jsx:65-122`).
- **Contournement** : padlock uniforme pour tous les chapitres.
- **Endpoint cible** : `GET /me/quiz-progress?subject_id=X` →
  `[{ chapter_id, status: 'not_started'|'in_progress'|'completed',
  correct: N, total: 20 }]`.

### 3.4 — Percentile/comparaison absent
- **Constat** : aucun endpoint pour récupérer la comparaison user
  vs cohorte (« Tu fais mieux que X% des élèves de ta série »).
- **Impact** : carte de comparaison dans Quiz Results doit utiliser
  une formulation neutre.
- **Contournement** : copy « Continue à pratiquer pour grimper dans
  le classement de ta série. ».
- **Endpoint cible** : `GET /quiz/sessions/{id}/percentile` →
  `{ percentile: number, cohort_size: number }`.

---

## ✅ Phase 4 — Tabs principaux

### 4.1 — Stats utilisateur (`/me/stats`)
- **Constat** : pas d'endpoint pour les stats personnelles.
- **Impact** : section stats Profile (`Quiz`, `Score`, `Sujets`)
  affiche `—` au lieu des chiffres prescrits par la maquette
  (`124 Quiz / 86% Score / 14 Sujets`).
- **Contournement** : valeurs `—` partout.
- **Endpoint cible** : `GET /me/stats` →
  `{ quiz_count: N, average_score_pct: N, exams_consulted: N,
  study_time_minutes: N }`.

### 4.2 — Reprise de lecture (`/me/last-read`)
- **Constat** : pas d'historique de lecture user (dernière leçon,
  dernière fiche, dernier sujet ouvert).
- **Impact** : section « Reprendre » du Home prescrite par
  `screens-home.jsx:382-410` (avec titre, page, % progression) ne
  peut pas être branchée à des données réelles.
- **Contournement** : carte placeholder « Commence ta première
  leçon » qui route vers `/(tabs)/courses`.
- **Endpoint cible** : `GET /me/last-read` →
  `{ lesson?: {...}, chapter?: {...}, page?: N, progress_pct?: N }`.

### 4.3 — Pourcentage de préparation BAC
- **Constat** : pas de calcul backend du niveau de préparation
  global (mix quiz + leçons + temps d'étude).
- **Impact** : barre « Prêt à 64% » du hero card de la maquette
  `screens-home.jsx:362-368` ne peut pas être branchée.
- **Contournement** : on n'affiche que `country.name · series.label`
  dans le hero.
- **Endpoint cible** : `GET /me/preparation` → `{ percentage: N }`
  (ou inclure dans `/me/stats`).

---

## 🔜 Phase 5 — Tuteur IA + Plan d'étude + Recherche

### 5.1 — Tuteur IA « Nobi » (`/tutor/chat`)
- **Constat** : aucun endpoint LLM côté backend.
- **Impact** : écran `screens-tutor.jsx` (chat avec avatar Nobi,
  bulles user/AI asymétriques, typing indicator, suggested chips)
  ne peut pas fonctionner avec des réponses réelles.
- **Contournement initial** : UI complète + réponses canned (stub
  local) pour valider visuellement le flow.
- **Endpoint cible** :
  - `POST /tutor/chat { messages: [{role, content}], context?: {
    pdf_extract?, subject_id?, chapter_id?} }` → `{ message:
    { role: 'assistant', content }, usage: {...} }`
  - `GET /tutor/conversations` → historique
  - `POST /tutor/conversations/{id}/messages` → continuer un thread
  - Garde-fous : quota par jour (free vs premium), filtre safety,
    citation des sources si possible.

### 5.2 — Plan d'étude (`/me/study-plan`)
- **Constat** : pas de générateur de plan d'étude personnalisé.
- **Impact** : écran `screens-plan-search.jsx` (countdown BAC,
  tâches matin/aprem/soir, plan 6 semaines) ne peut pas être
  branché.
- **Contournement initial** : plan statique computé côté mobile à
  partir de `bacDates.ts` + matières de l'utilisateur.
- **Endpoint cible** :
  - `GET /me/study-plan` →
    `{ today: [{ slot: 'morning'|'afternoon'|'evening', subject,
    chapter, duration_min, status }], week_plan: [...] }`
  - `POST /me/study-plan/tasks/{id}/complete`

### 5.3 — Recherche globale (`/search`)
- **Constat** : pas d'endpoint de recherche cross-domain
  (sujets + quiz + vidéos + leçons).
- **Impact** : icône `<Search>` du Home n'a actuellement aucune
  destination ; la maquette prévoit un écran avec récents + en vogue
  + résultats typés.
- **Contournement initial** : écran avec filtrage local sur le
  catalogue déjà chargé (subjects + books). Pas de récents/en vogue.
- **Endpoint cible** :
  - `GET /search?q=` → `{ results: [{ type: 'sujet'|'quiz'|'video'
    |'lesson'|'book', id, title, preview, ...}], facets: {...} }`
  - `GET /search/trending` → recherches populaires
  - `GET /me/search-history` → récents
  - `DELETE /me/search-history/{id}`

### 5.4 — Toolbar « Demander à Nobi » sur PDF
- **Constat** : nécessite un mécanisme de sélection texte fiable
  dans le WebView Android (Google Docs Viewer ne le supporte pas
  toujours) + l'endpoint Tuteur (cf. 5.1).
- **Impact** : différenciateur produit majeur, totalement absent.
- **Contournement initial** : non implémenté en Phase 5. Peut être
  partiellement simulé via un bouton « Poser une question sur ce
  PDF » qui envoie le titre/contexte au tuteur sans sélection.
- **Endpoint cible** : `POST /tutor/ask { question, pdf_id, page?,
  selection? }` (variante de `/tutor/chat` avec contexte structuré).

---

## 🔜 Phase 6 — Premium / Paiement

### 6.1 — Picker Mobile Money inline (vs WebView CinetPay)
- **Constat** : le backend redirige vers une URL CinetPay hébergée
  qui gère le picker opérateur. La maquette prévoit un picker natif
  (Orange Money / Wave / MoMo / Moov Money) avant redirection.
- **Impact** : impossible de reproduire le wizard inline 3-étapes
  (`step: plan | pay | success`) de `screens-premium.jsx`.
- **Contournement** : route vers `/payment-checkout` (WebView
  CinetPay) après sélection du plan. Pas de step `pay` natif ni de
  success sheet à l'étape `pay`.
- **Endpoint cible** : ajouter `POST /subscriptions/initiate {
  plan_id, operator: 'orange_money'|'wave'|...
  payment_phone }` → `{ transaction_id, deep_link?, polling_url }`.
  Si l'opérateur supporte un deep link Mobile Money direct, on
  pourrait court-circuiter le WebView.

### 6.2 — Success sheet « Tu es Premium ! »
- **Constat** : actuellement, la confirmation de paiement passe par
  un polling de statut + alerte native. La maquette prévoit un
  bottom sheet avec checkmark animé.
- **Endpoint cible** : aucun nouveau besoin backend. Question
  d'implémentation UI côté mobile (à faire en Phase 6).

---

## 🔜 Phase 7 — Offline & RGPD

### 7.1 — Queue de téléchargement (`/downloads/queue`)
- **Constat** : `POST /me/downloads` enregistre un download immédiat.
  Pas de notion de file d'attente avec statuts `queued / progress /
  done` ni de reprise.
- **Impact** : section « En cours » de `screens-offline.jsx`
  (lignes 88-99) non implémentable.
- **Contournement** : on n'a qu'un seul état (téléchargé).
- **Endpoint cible** :
  - `GET /me/downloads/queue` → items en cours
  - `POST /me/downloads/queue { items: [...] }` (batch)
  - `DELETE /me/downloads/queue/{id}` (annuler)

### 7.2 — Préférences offline utilisateur
- **Constat** : pas d'endpoint pour stocker les préférences
  `download_wifi_only`, `auto_download_enabled`.
- **Impact** : toggles `screens-offline.jsx:71-86` doivent être
  stockés localement ou pas implémentés.
- **Contournement** : stocker dans `AsyncStorage` côté mobile.
- **Endpoint cible** : `GET /me/preferences` + `PATCH /me/preferences
  { download_wifi_only?, auto_download_enabled?, ... }`.

### 7.3 — Suppression de compte (`DELETE /me/account`)
- **Constat** : pas d'endpoint RGPD pour supprimer un compte.
- **Impact** : flow `DeleteAccountScreen` (raison + confirmation
  typant `SUPPRIMER`) prescrit par `screens-mvp-additions.jsx:316-457`
  ne peut pas fonctionner.
- **Endpoint cible** :
  - `DELETE /me/account { reason: 'no_longer_needed'|...,
    confirmation: 'SUPPRIMER' }` → effacement sous 30j (sauf logs
    de paiement, cf. politique de confidentialité).
  - `POST /me/account/cancel-deletion` (fenêtre de récupération).

---

## 🔜 Phase 8 — Polish

### 8.1 — Aperçu PDF distinct de Téléchargement
- **Constat** : `POST /catalog/{exam}/signed-url` retourne une URL
  TTL 15min utilisable au choix pour aperçu OU téléchargement. Pas
  de distinction côté backend.
- **Impact** : bouton secondaire `Aperçu` dans `DocCard` fait
  exactement la même chose que `Télécharger`.
- **Endpoint cible** : à minima ajouter un flag `?inline=1` pour le
  preview vs `?attachment=1` pour forcer le download. Sinon, garder
  le même endpoint et différencier l'UX côté mobile (lecteur PDF
  inline vs declare-download dans `/me/downloads`).

### 8.2 — Métadonnées exam (durée, coefficient, taille fichier)
- **Constat** : `ExamListItem` n'expose ni la durée de l'épreuve, ni
  le coefficient, ni la taille du fichier PDF.
- **Impact** : meta `DocCard` doit afficher `Annale officielle` /
  `Session X` au lieu de `Durée 4h · Coef. 6` / `12 pages · 2.4 Mo`
  prescrit par `screens-library.jsx:135-138`.
- **Endpoint cible** : enrichir `ExamDetail` avec `duration_minutes`,
  `coefficient`, `exam_pdf_size_kb`, `corrige_pdf_size_kb`,
  `page_count`.

### 8.3 — Sources brand asset
- **Constat** : `assets/logo.png` du template est l'unique source
  brand. Pas de variantes (`logo-mark`, `logo-wordmark`, `logo-light`,
  `logo-dark`).
- **Impact** : usage limité (uniquement logo carré sur fond clair).
- **Endpoint cible** : pas un endpoint, mais demander à l'équipe
  design des variantes pour : header dark, splash, social share, etc.

---

## 🔁 Récapitulatif priorité

| Priorité | Endpoint manquant | Phase | Bloc UX |
|---|---|---|---|
| 🔴 P0 | `POST /auth/verify-otp` renvoie tokens | 2 | Flow auth cassé |
| 🔴 P0 | `POST /tutor/chat` | 5 | Différenciateur produit pivot |
| 🟠 P1 | `GET /me/stats` | 4 | Profile stats vides |
| 🟠 P1 | `GET /me/last-read` | 4 | Section Reprendre statique |
| 🟠 P1 | `POST /quiz/sessions { chapter_id }` | 3 | Quiz par chapitre |
| 🟠 P1 | `GET /search` | 5 | Recherche globale absente |
| 🟡 P2 | `GET /me/study-plan` | 5 | Plan d'étude statique |
| 🟡 P2 | `GET /me/quiz-progress` | 3 | Badge progression chapitre |
| 🟡 P2 | `DELETE /me/account` | 7 | RGPD non couvert |
| 🟢 P3 | `GET /quiz/sessions/{id}/percentile` | 3 | Cosmétique comparaison |
| 🟢 P3 | `GET /me/downloads/queue` | 7 | UX télchargement multi-items |
| 🟢 P3 | `GET /me/preparation` | 4 | Hero card progression |

---

**Maintenu par** : équipe mobile pendant la mission de mise en
conformité aux maquettes (avril/mai 2026). Mettre à jour à chaque
phase qui clôt un gap ou en découvre un nouveau.
