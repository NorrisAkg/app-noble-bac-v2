import React from 'react';
import { View, Image, ImageSourcePropType, ViewStyle } from 'react-native';
import { C } from '@/constants/theme';

export type SubjectKind =
  | 'maths' | 'phys' | 'svt' | 'chem' | 'fr' | 'eng' | 'hg' | 'geo'
  | 'philo' | 'econ' | 'bio' | 'geol' | 'socio' | 'compta' | 'droit'
  | 'ling' | 'grec' | 'latin' | 'arabe' | 'adab' | 'port' | 'ital'
  | 'all' | 'russe' | 'chinois' | 'cg' | 'science' | 'bonus';

/**
 * Mapping `icon_slug` (backend SubjectSeeder) → `SubjectKind` (illustration locale).
 * Slugs non listés tombent en fallback (lettre initiale).
 */
const BACKEND_SLUG_TO_KIND: Record<string, SubjectKind> = {
  math: 'maths',
  physics: 'phys',
  biology: 'svt',
  chemistry: 'chem',
  philosophy: 'philo',
  french: 'fr',
  history: 'hg',
  geography: 'geo',
  english: 'eng',
  economics: 'econ',
  star: 'bonus',
};

/**
 * Convertit un `icon_slug` venant du backend en `SubjectKind` exploité par
 * `<SubjectIcon kind={...} />`. Si le slug n'est pas mappé, renvoie undefined
 * (le composant affichera alors la tile lettre).
 */
export function backendSlugToSubjectKind(slug: string | null | undefined): SubjectKind | undefined {
  if (!slug) return undefined;
  return BACKEND_SLUG_TO_KIND[slug];
}

const SUBJECT_SOURCES: Record<SubjectKind, ImageSourcePropType> = {
  maths:   require('@/assets/images/illustrations/maths.png'),
  phys:    require('@/assets/images/illustrations/physique.png'),
  svt:     require('@/assets/images/illustrations/svt.png'),
  chem:    require('@/assets/images/illustrations/chimie.png'),
  fr:      require('@/assets/images/illustrations/francais.png'),
  eng:     require('@/assets/images/illustrations/anglais.png'),
  hg:      require('@/assets/images/illustrations/histoire.png'),
  geo:     require('@/assets/images/illustrations/geographie.png'),
  philo:   require('@/assets/images/illustrations/philosophy.png'),
  econ:    require('@/assets/images/illustrations/economi.png'),
  bio:     require('@/assets/images/illustrations/biologie.png'),
  geol:    require('@/assets/images/illustrations/geologie.png'),
  socio:   require('@/assets/images/illustrations/sociologie.png'),
  compta:  require('@/assets/images/illustrations/comptabilite.png'),
  droit:   require('@/assets/images/illustrations/droit.png'),
  ling:    require('@/assets/images/illustrations/linguistique.png'),
  grec:    require('@/assets/images/illustrations/grec.png'),
  latin:   require('@/assets/images/illustrations/latin.png'),
  arabe:   require('@/assets/images/illustrations/arabe.png'),
  adab:    require('@/assets/images/illustrations/adab.png'),
  port:    require('@/assets/images/illustrations/portugais.png'),
  ital:    require('@/assets/images/illustrations/italien.png'),
  all:     require('@/assets/images/illustrations/allemand.png'),
  russe:   require('@/assets/images/illustrations/russe.png'),
  chinois: require('@/assets/images/illustrations/chinois.png'),
  cg:      require('@/assets/images/illustrations/culture-generale.png'),
  science: require('@/assets/images/illustrations/science.png'),
  bonus:   require('@/assets/images/illustrations/bonus.png'),
};

const SUBJECT_TILE_BG: Partial<Record<SubjectKind, string>> = {
  maths: C.greenSoft,  phys: C.salmonSoft, svt: C.greenSoft,
  chem: C.salmonSoft,  fr: C.greenSoft,    eng: C.salmonSoft,
  hg: C.greenSoft,     geo: C.greenSoft,   philo: C.salmonSoft,
  econ: C.greenSoft,   bio: C.greenSoft,   geol: C.salmonSoft,
  socio: C.salmonSoft, compta: C.greenSoft, droit: C.salmonSoft,
  ling: C.greenSoft,   grec: C.salmonSoft, latin: C.salmonSoft,
  arabe: C.salmonSoft, adab: C.salmonSoft, port: C.greenSoft,
  ital: C.salmonSoft,  all: C.greenSoft,   russe: C.salmonSoft,
  chinois: C.salmonSoft, cg: C.greenSoft,  science: C.salmonSoft,
  bonus: C.salmonSoft,
};

interface SubjectIconProps {
  kind?: string;
  size?: number;
  plain?: boolean;
  style?: ViewStyle;
}

export const SubjectIcon: React.FC<SubjectIconProps> = ({ kind, size = 36, plain = false, style }) => {
  const typedKind = kind as SubjectKind | undefined;
  const resolvedKind: SubjectKind = (typedKind && SUBJECT_SOURCES[typedKind]) ? typedKind : 'bonus';
  const source = SUBJECT_SOURCES[resolvedKind];
  const bg = plain ? 'transparent' : SUBJECT_TILE_BG[resolvedKind] ?? C.greenSoft;
  const radius = plain ? 0 : Math.round(size * 0.28);

  return (
    <View
      style={[
        {
          width: size, height: size, borderRadius: radius, backgroundColor: bg,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={source}
        resizeMode="contain"
        accessibilityLabel={kind ?? 'bonus'}
        style={{ width: '74%', height: '74%' }}
      />
    </View>
  );
};
