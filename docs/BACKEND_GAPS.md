# Gaps backend — référentiel mobile

Ce document liste les **limites du backend Laravel** et les **endpoints
manquants** qui empêchent une conformité 100 % aux maquettes
`mobile/templates/*`. Il sert de référence pour :
- Le mobile : savoir où mettre des stubs / placeholders.
- L'équipe API : prioriser les endpoints à exposer.

> Convention : chaque entrée précise la **phase d'audit** où le gap a été
> identifié, l'**impact UX**, le **contournement actuel côté mobile** et
> l'**endpoint cible suggéré** pour l'équipe API.

> **Source de vérité périmètre** : le Cahier des Charges v1.4
> (`api/docs/noble-bac-uemoa-cahier-des-charges-v1_4.md`, mai 2026) fixe
> le périmètre MVP. Les exclusions HPS-01 à HPS-26 de sa section 9 sont
> définitives pour le MVP (IA, push, iOS, stats admin, watermarking,
> flashcards, Guinée-Bissau MoMo, AdMob…). Toute incohérence entre ce
> document et le CDC v1.4 doit être résolue en faveur du CDC.

> **État backend de référence** : tag `v1.4.1-hardened`
> (post-`v1.4-MVP-ready` commit `ed96de9`) sur la branche `main`. **365
> tests verts** (Pest 4), **46 endpoints** publiés sur `/api/v1/`, **41
> migrations** appliquées. Source officielle : `api/docs/PROJECT_STATUS.md`
> et `api/docs/API_ROUTES_V1.4.md`.

> **Périmètre MVP (mission avril-mai 2026)** : le **tuteur IA "Nobi"**
> (gaps 5.1 et 5.4) est **exclu du MVP** et reporté en V2. Les tables
> `ai_conversations / ai_messages / ai_usage_quotas` existent côté
> backend mais ne sont pas câblées dans le MVP. L'écran
> `screens-tutor.jsx` est affiché en placeholder "Bientôt disponible"
> ou masqué de la navigation.

> **Audit maquettes — mai 2026** : la lecture détaillée des templates
> `mobile/templates/*.jsx` a révélé **10 gaps additionnels** dans la
> **Phase 9** ci-dessous. Après confrontation au backend v1.4 réel
> (2026-05-19), une partie est **déjà couverte** par les endpoints
> v1.4 ou **exclue du MVP** par le CDC v1.4 (notifications push V2).

> **Convention de statut (révision 2026-05-19)** : chaque gap porte
> désormais un statut explicite : ✅ **couvert** (endpoint v1.4 existe),
> ❌ **à livrer** (vrai manque backend), ❄️ **V2** (reporté CDC), 📱
> **dette mobile** (le backend est conforme CDC, le mobile doit
> s'adapter), ⚠️ **bloqué décision** (Q4 CDC ouverte).

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

### 2.2 — `country_id` immuable post-register — **⚠️ Bloqué décision Q4 CDC**
- **Constat backend (vérifié 2026-05-19)** : `UpdateProfileRequest`
  (`api/app/Domain/Profile/Requests/UpdateProfileRequest.php:22-34`)
  accepte `first_name`, `last_name`, `gender`, `birth_date`,
  `series_id` uniquement — `country_id` est absent des règles.
- **Divergence CDC ↔ maquette** : la maquette
  `screens-setup.jsx:86` et la FAQ
  `screens-profile-extras.jsx:192` indiquent **mutable**. Le CDC
  v1.4 §10 **Q4** pose explicitement la question comme ouverte
  (« L'utilisateur peut-il changer son scope gratuit (pays +
  série) après l'onboarding ? Si oui, quelle politique ? »).
- **Impact business (RM-SUB-04)** : tout abonnement actif est lié au
  scope `(country_id, series_id)` ; changer de pays = perte
  d'accès Premium sur l'ancien scope.
- **Contournement temporaire** : alerte « Tu es inscrit en {country}.
  Pour changer, contacte le support. ».
- **Endpoint cible (sous réserve Q4)** : autoriser `country_id` dans
  `PATCH /v1/profile` + validation FK + couple `(country_id,
  series_id)` cohérent + warning subscription si scope change.
- **Recommandation par défaut** : autoriser + retourner
  `{warnings: ['active_subscription_scope_changed']}` (option A
  validée maquette, conforme à RM-SUB-04 qui fige le scope de
  l'abonnement déjà payé).

---

## ✅ Phase 3 — Quiz (refondu CDC v1.4)

> Le module Quiz a été **refondu en v1.4** côté backend pour
> implémenter le **mode examen blanc** strict : 10 questions fixes
> tirées aléatoirement par matière, navigation linéaire stricte,
> aucun feedback pendant la session, récapitulatif final exposé via
> `POST /v1/quiz/sessions/{id}/finish` (CDC RM-QUIZ-01 à RM-QUIZ-06,
> US-QUIZ-01/03/05/06/11/12). **Trois dettes mobiles identifiées
> ont été résolues le 2026-05-20** ; le flow Quiz du mobile est
> désormais aligné CDC v1.4.

### 3.1 — `is_correct` non exposé pendant la session — **✅ RÉSOLU 2026-05-20**

- **Statut backend** : **conforme CDC v1.4 RM-QUIZ-04**
  (« Aucun feedback pendant la session. Mode examen blanc. »).
  `POST /v1/quiz/sessions/{id}/answers` retourne
  `{ questions_answered, questions_remaining }` ; `is_correct` +
  `explanation` sont exposés **uniquement** à `POST /finish` dans
  `QuizSessionFinishedResource`.
- **Statut mobile** : conforme. [app/quiz-session.tsx](../app/quiz-session.tsx)
  n'expose aucun feedback rouge/vert pendant la session. Le hint
  « Tu verras les corrections détaillées à la fin du quiz. »
  remplace les animations inline. La correction rouge/vert n'apparaît
  que dans [app/quiz-review.tsx](../app/quiz-review.tsx) après
  `finish`.

### 3.2 — Quiz par chapitre indisponible — **✅ RÉSOLU 2026-05-20**

- **Statut backend** : **conforme CDC v1.4 US-QUIZ-01**
  (« sélectionner une **matière** pour démarrer une session »).
  Le niveau intermédiaire chapitre a été **explicitement supprimé**
  en v1.4 (cf. changelog). `POST /v1/quiz/sessions { subject_id }`
  est la seule entrée.
- **Statut mobile** : conforme. L'écran intermédiaire
  `app/quiz-chapters.tsx` a été **supprimé** ; depuis
  [app/(tabs)/quiz.tsx](../app/(tabs)/quiz.tsx), un tap sur une
  matière route directement vers `/quiz-session`. Idem depuis les
  résultats de recherche ([app/search.tsx](../app/search.tsx)).

### 3.3 — Progression par chapitre pour quiz — **✅ RÉSOLU 2026-05-20**

- **Statut backend** : non applicable (le niveau chapitre n'existe
  plus dans le flow Quiz, cf. 3.2). L'historique des sessions est
  exposé via `GET /v1/quiz/sessions/history` (paginé, 20/page).
- **Statut mobile** : conforme. Le compteur « X chapitres » par
  matière dans [app/(tabs)/quiz.tsx](../app/(tabs)/quiz.tsx) est
  remplacé par un agrégat de l'historique :
  « N sessions · X% moyen » (ou « Commencer » si aucune session).
  Calcul client-side à partir de `quizService.getHistory(1, 50)`.
  Le sous-titre est aussi corrigé : « 10 questions par session ·
  mode examen blanc » (au lieu de l'ancien « 20 questions par
  chapitre · explications incluses »).

### 3.4 — Percentile/comparaison absent — **❄️ GELÉ MVP**
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

### 5.1 — Tuteur IA « Nobi » (`/tutor/chat`) — **❄️ POST-MVP / V2**
- **Statut MVP** : **EXCLU** du périmètre avril-mai 2026 (décision
  produit 2026-05-19). Coût LLM, complexité modération et garde-fous
  légaux UEMOA pour mineurs ne doivent pas retarder le socle BAC.
- **Constat** : aucun endpoint LLM côté backend.
- **Impact** : écran `screens-tutor.jsx` (chat avec avatar Nobi,
  bulles user/AI asymétriques, typing indicator, suggested chips)
  ne peut pas fonctionner avec des réponses réelles.
- **Contournement MVP** : afficher placeholder "Bientôt disponible"
  sur l'écran Nobi, ou masquer l'onglet de la navigation. Pas de
  stub canned (évite de créer une fausse promesse produit).
- **Endpoint cible (V2)** :
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

### 5.4 — Toolbar « Demander à Nobi » sur PDF — **❄️ POST-MVP / V2**
- **Statut MVP** : **EXCLU** (dépend de 5.1).
- **Constat** : nécessite un mécanisme de sélection texte fiable
  dans le WebView Android (Google Docs Viewer ne le supporte pas
  toujours) + l'endpoint Tuteur (cf. 5.1).
- **Impact** : différenciateur produit majeur, totalement absent.
- **Contournement MVP** : ne pas afficher la bulle « Demander à Nobi »
  sur la sélection texte du PDF. Sélection texte standard du WebView
  conservée (copier/partager natif uniquement).
- **Endpoint cible (V2)** : `POST /tutor/ask { question, pdf_id, page?,
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

## 🆕 Phase 9 — Découvertes audit maquettes (mai 2026)

Cette section regroupe les gaps identifiés lors de la lecture
détaillée des templates `mobile/templates/*.jsx`, **absents** du
document original.

### 9.1 — Centre de notifications in-app — **❄️ V2 (HPS-16)**
- **Statut MVP** : **EXCLU**. CDC v1.4 HPS-16 : *« Notifications
  push reportées v2. Rappels d'expiration visibles dans l'app
  uniquement au MVP. »*
- **Statut backend (préparation v2)** : table `notifications` ✅
  migrée (`database/migrations/2026_05_13_154832_create_notifications_table.php`),
  table `firebase_tokens` ✅ migrée. Pipeline push **non
  implémenté délibérément**.
- **Constat maquette** : l'écran Notifications
  `screens-forgot-notif.jsx:148-212` + badge cloche Home
  `screens-home.jsx:335-339` ont été conçus avant la décision V2.
- **Action mobile MVP** : **masquer l'icône cloche** du Home et
  retirer l'écran Notifications du flow. Réintroduire en V2.
- **Endpoint cible (V2)** : `GET/POST /me/notifications/*` à
  spécifier en V2 selon nouveau cadrage produit.

### 9.2 — Préférences de notification granulaires — **❄️ V2 (HPS-16)**
- **Statut MVP** : **EXCLU** (dépend de 9.1, même justification).
- **Action mobile MVP** : retirer le panneau « Notifications » de
  `screens-profile-extras.jsx:107-144`.
- **Endpoint cible (V2)** : `GET/PATCH /me/notification-prefs`.

### 9.3 — Device tokens (push FCM/APNs) — **❄️ V2 (HPS-16)**
- **Statut MVP** : **EXCLU** (dépend de 9.1).
- **Statut backend (préparation v2)** : table `firebase_tokens` ✅
  migrée, modèle préparé.
- **Action mobile MVP** : ne pas demander la permission push
  Android. Ne pas enregistrer de device token.
- **Endpoint cible (V2)** : `POST /me/device-tokens` à spécifier
  en V2.

### 9.4 — Liste des transactions / mes paiements — **✅ COUVERT v1.4**
- **Statut backend (vérifié 2026-05-19)** : endpoint **déjà
  publié** : `GET /v1/subscriptions/transactions`
  (`routes/api.php:73`,
  `SubscriptionController::transactions`). Documenté côté CDC
  via US-PAY-06 + US-ADMIN-08.
- **Action mobile MVP** : brancher
  `screens-mvp-additions.jsx:174-313` sur
  `GET /v1/subscriptions/transactions`. Vérifier le format de
  réponse (paginé ?) et la présence d'un endpoint détail
  `/transactions/{id}` — sinon utiliser le payload de la liste
  pour le détail (cf. doc API).
- **Sous-gap résiduel** : `POST /subscriptions/extend-scope`
  (extension à un autre pays/série moyennant complément) — pas
  livré, à confirmer si MVP ou V2 (CDC US-PAY-07 « souscrire un
  abonnement supplémentaire » — couvert par souscription
  classique, pas par extension de l'existant).

### 9.5 — Contenu cours structuré JSON (CourseReader) — **✅ COUVERT v1.4**
- **Statut backend (vérifié 2026-05-19)** : endpoint **déjà
  publié** : `GET /v1/courses/lessons/{lesson}` retourne le
  contenu Builder JSON 8 types de blocs (CDC RM-COURS-02 :
  heading, paragraph, list, code, blockquote, image, table,
  divider). Documenté `api/docs/API_ROUTES_V1.4.md:18-19`.
- **Action mobile MVP** : brancher `screens-course-reader.jsx`
  sur `GET /v1/courses/lessons/{lesson}` et implémenter le
  renderer des 8 types de blocs. Gérer la règle `is_free` (403
  si lesson Premium pour user Free).
- **Aucun endpoint à livrer.**

### 9.6 — Bootstrap Home agrégé
- **Constat** : la Home (`screens-home.jsx`) consomme **5-6
  sources** différentes au cold start (profile, stats, last-read,
  preparation, notifications unread-count, books recommandés).
  Multiplier les appels = écran tabulaire vide pendant 1-2s.
- **Impact** : performance perçue du cold start dégradée
  (Sénégal/CI : réseaux 3G fréquents).
- **Contournement** : appels séquentiels côté mobile (UX dégradée
  visible).
- **Endpoint cible** :
  - `GET /me/bootstrap` → agrégat avec ETag, cache Redis 60s côté
    serveur. Format :
    `{ profile, stats, preparation_pct?, last_read?,
      unread_notifications, recommended_books[], days_to_bac }`.

### 9.7 — Streak / série de jours
- **Constat** : notification « Bravo, série de 5 jours ! » dans
  `screens-forgot-notif.jsx:150`. Aucun endpoint, aucune table.
- **Impact** : levier gamification absent (à calibrer : streak
  hebdo plutôt que quotidien pour éviter incitation volume vide).
- **Contournement** : ne pas afficher la mention dans
  notifications.
- **Endpoint cible** : `GET /me/streak` →
  `{ current_days, longest_days, last_activity_date }`.

### 9.8 — Channel WhatsApp officiel
- **Constat** : `screens-profile-extras.jsx:396-478` propose un
  écran « Notre channel WhatsApp officiel » avec lien dynamique
  et CTA d'abonnement. URL probablement hardcodée actuellement.
- **Impact** : lien WhatsApp non personnalisable par
  pays/série/promo. Pas de tracking d'engagement.
- **Contournement** : URL hardcodée côté mobile (à mettre à jour
  manuellement à chaque release).
- **Endpoint cible** : `GET /content/whatsapp-channel?country_id=X`
  → `{ url, label }` (potentiellement différent CI/Sénégal/Mali).

### 9.9 — Support / FAQ in-app
- **Constat** : écran Support entièrement construit dans
  `screens-profile-extras.jsx:187-271` avec FAQ + formulaire de
  ticket. Aucun endpoint.
- **Impact** : utilisateurs renvoyés vers email/WhatsApp externe
  (perte de contexte, traçabilité nulle).
- **Contournement** : `mailto:` direct ou lien WhatsApp.
- **Endpoint cible** :
  - `GET /content/faq?category=` → liste questions/réponses
  - `POST /support/tickets { subject, category, body, attachments? }`
  - `GET /me/support-tickets` → mes tickets

### 9.10 — Vidéos pédagogiques — **✅ COUVERT v1.4 (YouTube embed)**
- **Statut backend (vérifié 2026-05-19)** : deux types de vidéos
  livrés en v1.4 — toutes en **YouTube embed** (pas d'hébergement
  R2, CDC RM-COURS-04) :
  - `GET /v1/catalog/{exam}/videos` (vidéos commentées d'une
    épreuve) → `ExamVideoResource` (youtube_video_id, duration,
    thumbnail).
  - `GET /v1/courses/chapters/{chapter}/chapter-videos` +
    `GET /v1/courses/chapter-videos/{chapterVideo}` (vidéos
    pédagogiques d'un chapitre).
- **Statut MVP — mode offline vidéos** : **EXCLU** (CDC HPS-20 :
  *« Mode offline pour vidéos — Vidéos = YouTube embed, cache géré
  nativement par le SDK YouTube. »*).
- **Action mobile MVP** : NE PAS masquer le tab Vidéo de Library.
  Brancher sur `/v1/catalog/{exam}/videos` (player YouTube
  embed). Pas de download offline.
- **Aucun endpoint à livrer.**

---

## 🔁 Récapitulatif priorité — Périmètre MVP

### ❌ Backend à livrer — Sprint 1 (vrais manques)

Liste des endpoints réellement absents du backend v1.4.1-hardened au
2026-05-19, à livrer côté API pour la mise en conformité maquettes.

| Endpoint à livrer | Gap | Effort | Détail |
|---|---|---|---|
| `POST /v1/auth/verify-otp` retourne tokens Sanctum | 2.1 | S | Réutiliser `SessionService` + `createToken()` de `LoginAction` ; renvoyer `LoginResource` au lieu de `AuthUserResource` |
| `PATCH /v1/profile` accepte `country_id` | 2.2 ⚠️ | S | **Bloqué Q4 CDC** — décision client requise (recommandation : autoriser + warning subscription) |
| `GET /v1/me/stats` | 4.1 | M | Agrégat `quiz_sessions`, `user_downloads`. **Retirer `study_time_minutes`** (pas tracké au CDC, US-PROG-01 simplifié) |
| `GET /v1/me/last-read` + `PATCH` | 4.2 | L | Nouvelle table `user_reading_progress` polymorphe (lesson / chapter / exam) |
| `DELETE /v1/me/account` + `POST cancel-deletion` + job purge | 7.3 | L | Mandat CDC CL-DATA-06 ; `users.deleted_at` ✅ déjà indexé, ajouter `deletion_reason` + job 30j |
| `GET /v1/me/bootstrap` agrégé | 9.6 | M | Profile + stats + last_read + recommended_books + days_to_bac, ETag + cache Redis 60s |
| Param `?inline=1` sur `POST /v1/catalog/{exam}/signed-url` | 8.1 | XS | `ResponseContentDisposition` propagé dans `R2StorageService` |
| Enrichir `ExamDetailResource` + ALTER `exams` | 8.2 | M | Ajouter `duration_minutes`, `coefficient` (file_size_kb + page_count déjà migrés) |

**Total Sprint 1** : 8 chantiers — estimation ~8 jours-homme (avec
parallélisation 2 devs).

### 📱 Dettes côté MOBILE — pas de backend à livrer

Le backend v1.4 est déjà conforme CDC. Le mobile doit adapter ses
maquettes/écrans qui ont été conçus avant la refonte v1.4.

| Action mobile | Gap | Endpoint backend déjà disponible |
|---|---|---|
| Retirer drawer rouge/vert pendant session quiz | 3.1 | (n/a — mode examen blanc CDC) |
| Retirer écran "Chapitres" du flow Quiz (matière → session directe) | 3.2 | `POST /v1/quiz/sessions { subject_id }` |
| Retirer `ChapterStatus` ; afficher historique sessions à la place | 3.3 | `GET /v1/quiz/sessions/history` |
| Brancher écran "Mes paiements" | 9.4 | `GET /v1/subscriptions/transactions` |
| Brancher CourseReader sur JSON Builder 8 blocs | 9.5 | `GET /v1/courses/lessons/{lesson}` |
| Brancher tab Vidéo Library (YouTube embed) | 9.10 | `GET /v1/catalog/{exam}/videos` + `/courses/chapter-videos/*` |
| Brancher écran offline (3 types polymorphes, quota 500Mo) | 7.1 / 7.2 | 5 endpoints `/v1/me/downloads/*` |

### ❄️ Hors MVP — Reporté V2

| Périmètre | Gap | Source CDC v1.4 |
|---|---|---|
| Tuteur IA "Nobi" `POST /tutor/chat` + domaine | 5.1 | §9.2 HPS-10 — Module Assistant IA complet |
| Toolbar PDF "Demander à Nobi" | 5.4 | §9.2 HPS-10 (dépend 5.1) |
| Notifications push (FCM) + centre in-app + prefs | 9.1 / 9.2 / 9.3 | §9.2 HPS-16 — Notifications push |
| Plan d'étude personnalisé (générateur IA) | 5.2 | §9.2 HPS-14 — Plan de révision IA |
| Recherche globale cross-domain | 5.3 | Pas explicite ; couvert partiellement par `/v1/courses/books?search=` (livres uniquement) |
| Streak / gamification | 9.7 | Pas dans périmètre MVP |
| Support / FAQ in-app | 9.9 | Pas dans périmètre MVP |
| Channel WhatsApp dynamique | 9.8 | Pas dans périmètre MVP |
| Percentile cohorte quiz | 3.4 | Pas dans périmètre MVP |
| Préparation BAC % | 4.3 | Pas dans périmètre MVP |
| Download queue multi-items | 7.1 (avancé) | Couvert partiellement par 5 endpoints `/me/downloads/*` (single declare, pas de queue) |

---

## 📅 Plan de release — Sprint 1 backend (8-10 jours ouvrés, 2 devs)

| Jalon | Gaps | Dev | Estimation |
|---|---|---|---|
| **J1-J2** | 2.1 verify-otp tokens (S) + 8.1 inline + 8.2 metadata (XS + M) | A + B | 1j + 1.5j |
| **J2** | 2.2 country_id mutable (S, **après réponse Q4**) | A | 0.5j |
| **J3-J5** | 4.1 stats (M) + 4.2 last-read + table polymorphe (L) | A + B | 2j + 3j |
| **J6-J7** | 7.3 DELETE compte + cancel + job purge (L) | A | 2j |
| **J8-J9** | 9.6 bootstrap agrégé (M, dépend 4.1 + 4.2) | B | 1.5j |
| **J10** | Pint, `php artisan test --parallel`, doc `API_ROUTES_V1.4.md` mise à jour, tag git | A+B | 1j |

**Décisions client à arbitrer avant code** :

1. **Q4 CDC v1.4** : pays mutable post-inscription ?
   - Recommandation : autoriser + warning subscription scope.
2. **Réponse `/me/stats` simplifiée** : confirmer retrait
   `study_time_minutes` et `exams_consulted` du contrat (pas tracké
   au CDC US-PROG-01).
3. **Date du BAC pour `days_to_bac`** : `config/bac.php` côté
   backend (recommandé) vs calcul côté mobile.

---

## 📱 Plan de release — Sprint 1 mobile (en parallèle)

Pendant que le backend livre Sprint 1, le mobile rattrape les dettes
sur les endpoints déjà disponibles :

- Quiz : refonte écrans pour mode examen blanc + sélection par
  matière + récap final (gaps 3.1, 3.2, 3.3)
- Premium : brancher liste transactions (gap 9.4)
- Cours : implémenter renderer JSON Builder 8 blocs (gap 9.5)
- Vidéos : activer tab Library + player YouTube embed (gap 9.10)
- Tuteur Nobi : afficher placeholder "Bientôt disponible" (V2)
- Notifications : masquer cloche Home + écran prefs notif (V2)
- Success sheet Premium : implémenter UI plein écran (gap 6.2,
  pas d'endpoint requis)

---

**Maintenu par** : équipe mobile pendant la mission de mise en
conformité aux maquettes (avril/mai 2026). Mettre à jour à chaque
phase qui clôt un gap ou en découvre un nouveau.

**Dernière révision** : 2026-05-19 — confrontation à l'état réel
backend (tag `v1.4.1-hardened`, 365 tests verts). Gaps 3.1, 3.2,
3.3 reclassés en **dettes mobile** (backend conforme CDC v1.4
Quiz examen blanc). Gaps 9.1/9.2/9.3 (notifications) reclassés en
**V2** (CDC HPS-16). Gaps 9.4 (transactions), 9.5 (lessons JSON)
et 9.10 (vidéos catalogue) reclassés **couverts par v1.4**. 8
vrais gaps Sprint 1 conservés. Q4 CDC (country_id mutable) marquée
comme bloqueur décisionnel.
