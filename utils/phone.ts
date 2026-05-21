/**
 * Assemble un numéro local + un indicatif pays en E.164.
 *
 * IMPORTANT : ne JAMAIS strip les zéros initiaux du local automatiquement —
 * dans les pays UEMOA (Côte d'Ivoire, Sénégal, Bénin…), le `0` initial fait
 * partie du numéro E.164 (ex: CI = `+22507XXXXXXXX`). Stripper le 0 produit
 * un numéro invalide qui ne matchera aucune entrée backend.
 *
 * Le helper gère les saisies fréquentes :
 *  - "07000001"           → "+22507000001" (cas normal)
 *  - "+22507000001"       → "+22507000001" (déjà en E.164, on ne fait rien)
 *  - "0022507000001"      → "+22507000001" (notation 00<indicatif>)
 *  - "22507000001"        → "+22507000001" (indicatif sans le +)
 *  - " 07 00 00 01 "      → "+22507000001" (espaces et tirets ignorés)
 *
 * @param dial  Indicatif pays avec le `+` (ex: "+225")
 * @param local Numéro tel que tapé par l'utilisateur
 */
export function buildE164Phone(dial: string, local: string): string {
  const cleaned = local.replace(/[\s\-().]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }

  const dialDigits = dial.replace(/^\+/, '');
  if (cleaned.startsWith(dialDigits)) {
    return '+' + cleaned;
  }

  return dial + cleaned;
}
