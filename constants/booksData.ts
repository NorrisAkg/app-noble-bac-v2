export interface Book {
  id: string;
  title: string;
  author: string;
  subject: string;
  isPremium: boolean;
  coverImage?: string; // We use a fallback if not provided
  colorPrefix?: string; // Used for the gradient fallback
}

export const LIBRARY_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Annales BAC - Mathématiques',
    author: 'CIAM',
    subject: 'Mathématiques',
    isPremium: false,
    colorPrefix: 'maths',
  },
  {
    id: 'b2',
    title: 'Physique Chimie - Terminale S',
    author: 'Eurêka',
    subject: 'Physique-Chimie',
    isPremium: true,
    colorPrefix: 'phys',
  },
  {
    id: 'b3',
    title: 'Biologie Géologie - SVT',
    author: 'Nathon',
    subject: 'SVT',
    isPremium: true,
    colorPrefix: 'svt',
  },
  {
    id: 'b4',
    title: 'Littérature Africaine - L1/L2',
    author: 'Ousmane Sembène',
    subject: 'Français',
    isPremium: false,
    colorPrefix: 'fr',
  },
  {
    id: 'b5',
    title: 'Histoire Géographie - Les Décolonisations',
    author: 'Hatier',
    subject: 'Histoire-Géo',
    isPremium: false,
    colorPrefix: 'hg',
  },
  {
    id: 'b6',
    title: 'Philosophie - Leçons et Textes',
    author: 'Aristote',
    subject: 'Philosophie',
    isPremium: true,
    colorPrefix: 'philo',
  },
  {
    id: 'b7',
    title: 'Anglais - Speak Up Terminale',
    author: 'Oxford',
    subject: 'Anglais',
    isPremium: false,
    colorPrefix: 'angl',
  },
  {
    id: 'b8',
    title: 'Annales Corrigées - Physique',
    author: 'Eurêka',
    subject: 'Physique-Chimie',
    isPremium: true,
    colorPrefix: 'phys',
  },
];
