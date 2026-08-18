/**
 * Construction des URLs de lecteur vidéo embarqué et garde-fou de navigation
 * pour la WebView du viewer de chapitre.
 *
 * YouTube expose deux surfaces : `youtube.com/watch?v=ID` (le site complet) et
 * `youtube.com/embed/ID` (le lecteur seul). Seule la seconde doit être chargée,
 * sinon c'est tout le site — header, recherche, suggestions — qui s'ouvre dans
 * l'application.
 */

/**
 * Paramètres du lecteur YouTube embarqué :
 * - `playsinline`      : lecture dans le cadre (indispensable sur iOS, sinon
 *                        bascule en plein écran natif dès le play)
 * - `rel=0`            : restreint les suggestions de fin à la même chaîne
 * - `modestbranding=1` : atténue le branding dans la barre de contrôles
 * - `iv_load_policy=3` : supprime les annotations
 *
 * Note : `youtube-nocookie.com` (mode privacy renforcé) est inaccessible depuis
 * plusieurs pays de l'UEMOA (erreur 153). On utilise `youtube.com` à la place.
 */
const YOUTUBE_PLAYER_PARAMS =
  'autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3';

export function buildEmbedUri(provider: string, videoId: string): string {
  const id = encodeURIComponent(videoId);
  if (provider === 'vimeo') {
    return `https://player.vimeo.com/video/${id}?autoplay=1&playsinline=1`;
  }
  return `https://www.youtube.com/embed/${id}?${YOUTUBE_PLAYER_PARAMS}`;
}

/**
 * URLs qui ramènent au site public plutôt qu'au lecteur : logo YouTube, titre
 * en overlay, « Regarder sur YouTube », vidéos suggérées de fin.
 *
 * On raisonne par exclusion (bloquer ce qui sort du lecteur) plutôt que par
 * liste blanche : le handler `onShouldStartLoadWithRequest` est aussi appelé
 * pour les sous-frames sur Android, et une liste blanche stricte casserait le
 * lecteur lui-même.
 */
const PLAYER_EXIT_PATTERNS = [
  /^https?:\/\/(?:[\w-]+\.)*youtube(?:-nocookie)?\.com\/(?!embed\/)/i,
  /^https?:\/\/youtu\.be\//i,
  /^https?:\/\/(?:www\.)?vimeo\.com\//i,
];

export function isPlayerExitUrl(url: string): boolean {
  return PLAYER_EXIT_PATTERNS.some((pattern) => pattern.test(url));
}
