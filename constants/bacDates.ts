/**
 * Date approximative des epreuves du Bac par pays UEMOA. Utilisee pour le
 * countdown sur l'ecran d'accueil tant que le backend n'expose pas d'endpoint
 * dedie (a coordonner en v2 — voir mobile/.claude/PLAN.md M-P2.7 TBD).
 *
 * Les valeurs sont des moyennes communicables — ne pas les utiliser pour
 * une logique metier (validation, paiement). Format MM-DD (sans annee).
 */
const BAC_DATES_BY_COUNTRY_CODE: Record<string, { month: number; day: number }> = {
  CI: { month: 6, day: 17 }, // Côte d'Ivoire — 17 juin (moyenne)
  SN: { month: 6, day: 23 }, // Sénégal — 23 juin
  BF: { month: 6, day: 10 }, // Burkina Faso — 10 juin
  ML: { month: 6, day: 15 }, // Mali — 15 juin
  BJ: { month: 6, day: 20 }, // Bénin — 20 juin
  TG: { month: 6, day: 25 }, // Togo — 25 juin
  NE: { month: 7, day: 1 }, // Niger — 1er juillet
};

const DEFAULT_BAC = { month: 6, day: 15 };

/**
 * Renvoie la prochaine date d'examen du Bac pour un pays donne.
 * Si la date de cette annee est passee, renvoie celle de l'annee suivante.
 */
export function getNextBacDate(countryCode: string | null | undefined): Date {
  const config = countryCode != null && countryCode.length > 0
    ? BAC_DATES_BY_COUNTRY_CODE[countryCode] ?? DEFAULT_BAC
    : DEFAULT_BAC;
  const now = new Date();
  // Comparaison au jour pres : la date du Bac couvre tout le jour, on ne
  // bascule a l'annee suivante qu'a partir de J+1.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidate = new Date(now.getFullYear(), config.month - 1, config.day);
  if (candidate.getTime() < startOfToday.getTime()) {
    return new Date(now.getFullYear() + 1, config.month - 1, config.day);
  }
  return candidate;
}

/**
 * Nombre de jours restants avant le prochain Bac pour ce pays. Toujours >= 0.
 */
export function daysUntilBac(countryCode: string | null | undefined): number {
  const target = getNextBacDate(countryCode);
  const now = new Date();
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
}
