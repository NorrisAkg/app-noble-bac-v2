import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Rect,
  Line,
  Path,
  G,
  SvgProps,
} from 'react-native-svg';

/**
 * Illustrations SVG dédiées aux états vides (listes / sections sans données).
 * Même style graphique que `Illustrations.tsx` (onboarding) : viewBox 280x220,
 * cercle de fond dégradé, palette de marque (#3DBE45 / #E8A090 / #1A2027 / #9AA3AC).
 * Consommées par le composant `EmptyState` via sa prop `illustration`.
 */

type EmptyIllustrationProps = SvgProps & { size?: number };

const dims = (size?: number) => ({
  width: size ?? '100%',
  height: size ?? '100%',
});

/** Fond commun : cercle dégradé doux centré. */
const Backdrop: React.FC<{ id: string; from?: string; to?: string }> = ({
  id,
  from = '#3DBE45',
  to = '#3DBE45',
}) => (
  <>
    <Defs>
      <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={from} stopOpacity={0.12} />
        <Stop offset="1" stopColor={to} stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <Circle cx={140} cy={114} r={92} fill={`url(#${id})`} />
  </>
);

/** Loupe sur une page vide — recherche sans résultat. */
export const IllustrationEmptySearch: React.FC<EmptyIllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Backdrop id="empty_search" from="#3DBE45" to="#3DBE45" />
    <Rect x={86} y={56} width={92} height={116} rx={10} fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
    <Line x1={100} y1={78} x2={150} y2={78} stroke="#E6E8EB" strokeWidth={4} strokeLinecap="round" />
    <Line x1={100} y1={94} x2={140} y2={94} stroke="#EEF1F4" strokeWidth={4} strokeLinecap="round" />
    <Circle cx={170} cy={134} r={30} fill="#EAF7EB" stroke="#3DBE45" strokeWidth={4} />
    <Line x1={192} y1={156} x2={210} y2={174} stroke="#3DBE45" strokeWidth={6} strokeLinecap="round" />
    <Circle cx={170} cy={134} r={12} fill="#fff" />
  </Svg>
);

/** Carton ouvert + flèche descendante — aucun téléchargement. */
export const IllustrationEmptyDownloads: React.FC<EmptyIllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Backdrop id="empty_dl" from="#E8A090" to="#E8A090" />
    <Path d="M150 52 v44" stroke="#9AA3AC" strokeWidth={6} strokeLinecap="round" />
    <Path d="M132 80 l18 18 l18 -18" stroke="#9AA3AC" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M88 112 h124 l-12 56 a6 6 0 0 1 -6 5 H106 a6 6 0 0 1 -6 -5 z" fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
    <Rect x={82} y={104} width={136} height={16} rx={4} fill="#E8A090" />
    <Line x1={150} y1={120} x2={150} y2={172} stroke="#FBEDE8" strokeWidth={3} />
  </Svg>
);

/** Étagère vide — bibliothèque / carrousel de livres sans contenu. */
export const IllustrationEmptyBooks: React.FC<EmptyIllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Backdrop id="empty_books" from="#3DBE45" to="#3DBE45" />
    <Rect x={96} y={70} width={26} height={78} rx={3} fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
    <Rect x={126} y={84} width={26} height={64} rx={3} fill="#EAF7EB" stroke="#3DBE45" strokeWidth={2} />
    <Rect x={156} y={62} width={26} height={86} rx={3} fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
    <Line x1={134} y1={96} x2={134} y2={140} stroke="#3DBE45" strokeWidth={3} strokeLinecap="round" />
    <Rect x={84} y={150} width={112} height={10} rx={3} fill="#1A2027" />
    <Circle cx={204} cy={84} r={4} fill="#E8A090" />
    <Circle cx={80} cy={120} r={3} fill="#3DBE45" />
  </Svg>
);

/** Feuille / document vide — annales & vidéos d'épreuves indisponibles. */
export const IllustrationEmptyDocs: React.FC<EmptyIllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Backdrop id="empty_docs" from="#3D7BBE" to="#3D7BBE" />
    <G transform="translate(96 50)">
      <Path d="M0 8 a8 8 0 0 1 8 -8 h54 l26 26 v80 a8 8 0 0 1 -8 8 H8 a8 8 0 0 1 -8 -8 z" fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
      <Path d="M62 0 v26 h26" fill="#EEF1F4" stroke="#E6E8EB" strokeWidth={2} />
      <Line x1={16} y1={44} x2={72} y2={44} stroke="#E6E8EB" strokeWidth={4} strokeLinecap="round" />
      <Line x1={16} y1={60} x2={72} y2={60} stroke="#EEF1F4" strokeWidth={4} strokeLinecap="round" />
      <Line x1={16} y1={76} x2={52} y2={76} stroke="#EEF1F4" strokeWidth={4} strokeLinecap="round" />
    </G>
    <Circle cx={186} cy={150} r={4} fill="#E8A090" />
    <Circle cx={92} cy={150} r={3} fill="#3DBE45" />
  </Svg>
);

/** Cloche — boîte de notifications vide. */
export const IllustrationEmptyNotifications: React.FC<EmptyIllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Backdrop id="empty_notif" from="#3DBE45" to="#3DBE45" />
    {/* Corps de la cloche */}
    <Path d="M140 60 C140 60 108 72 108 112 v20 h64 v-20 C172 72 140 60 140 60 z" fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
    {/* Battant */}
    <Rect x={133} y={132} width={14} height={16} rx={7} fill="#3DBE45" />
    {/* Tige */}
    <Rect x={137} y={52} width={6} height={12} rx={3} fill="#9AA3AC" />
    {/* Lignes ondes */}
    <Path d="M96 88 C88 96 88 110 96 118" stroke="#EAF7EB" strokeWidth={4} fill="none" strokeLinecap="round" />
    <Path d="M184 88 C192 96 192 110 184 118" stroke="#EAF7EB" strokeWidth={4} fill="none" strokeLinecap="round" />
    <Circle cx={200} cy={80} r={4} fill="#E8A090" />
    <Circle cx={86} cy={148} r={3} fill="#3DBE45" />
  </Svg>
);

/** Livre ouvert vide — chapitres / leçons / quiz non publiés. */
export const IllustrationEmptyCourses: React.FC<EmptyIllustrationProps> = ({ size, ...rest }) => (
  <Svg viewBox="0 0 280 220" {...dims(size)} {...rest}>
    <Backdrop id="empty_courses" from="#3DBE45" to="#E8A090" />
    <Path d="M140 78 C120 64 96 64 80 72 V150 C96 142 120 142 140 156 Z" fill="#fff" stroke="#E6E8EB" strokeWidth={2} />
    <Path d="M140 78 C160 64 184 64 200 72 V150 C184 142 160 142 140 156 Z" fill="#EAF7EB" stroke="#3DBE45" strokeWidth={2} />
    <Line x1={140} y1={78} x2={140} y2={156} stroke="#3DBE45" strokeWidth={3} />
    <Line x1={96} y1={92} x2={126} y2={92} stroke="#E6E8EB" strokeWidth={4} strokeLinecap="round" />
    <Line x1={96} y1={108} x2={126} y2={108} stroke="#EEF1F4" strokeWidth={4} strokeLinecap="round" />
    <Line x1={154} y1={92} x2={184} y2={92} stroke="#CFEBD2" strokeWidth={4} strokeLinecap="round" />
    <Line x1={154} y1={108} x2={184} y2={108} stroke="#E2F4E4" strokeWidth={4} strokeLinecap="round" />
    <Circle cx={210} cy={86} r={4} fill="#E8A090" />
  </Svg>
);
