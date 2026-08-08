export type VerificationChannel = 'email' | 'phone';

export type VerificationTarget =
  | { kind: 'email'; email: string }
  | { kind: 'phone'; phone: string }
  | { kind: 'unavailable'; reason: string };

/**
 * Détermine vers quel écran de vérification envoyer un utilisateur dont la
 * connexion a été refusée faute de compte vérifié.
 *
 * On ne se sert que de l'identifiant qu'il vient de saisir : le backend ne
 * renvoie délibérément pas l'adresse ou le numéro rattachés au compte, ce qui
 * révélerait l'email associé à quiconque connaît le mot de passe.
 *
 * Reste donc le cas où le canal ne correspond pas à ce qui a été tapé — un
 * compte possédant les deux, dont on a saisi le numéro alors que la
 * vérification attend l'email. Il est rare, et on préfère l'expliquer plutôt
 * que de deviner.
 */
export function resolveVerificationTarget(
  channel: VerificationChannel,
  identifier: string,
): VerificationTarget {
  const trimmed = identifier.trim();
  const looksLikeEmail = trimmed.includes('@');

  if (channel === 'email') {
    return looksLikeEmail
      ? { kind: 'email', email: trimmed.toLowerCase() }
      : {
          kind: 'unavailable',
          reason:
            'Ton compte doit être validé par email. Reconnecte-toi avec ton adresse email pour recevoir le code.',
        };
  }

  return !looksLikeEmail
    ? { kind: 'phone', phone: trimmed }
    : {
        kind: 'unavailable',
        reason:
          'Ton compte doit être validé par téléphone. Reconnecte-toi avec ton numéro pour recevoir le code.',
      };
}
