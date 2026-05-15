export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  expl: string;
}

export const QUIZ_SUBJECTS = [
  { k: 'maths', label: 'Mathématiques', count: 142 },
  { k: 'phys', label: 'Physique-Chimie', count: 96 },
  { k: 'svt', label: 'SVT', count: 78 },
  { k: 'fr', label: 'Français', count: 110 },
  { k: 'angl', label: 'Anglais', count: 88 },
  { k: 'hg', label: 'Histoire-Géo', count: 72 },
  { k: 'philo', label: 'Philosophie', count: 54 },
];

export const MOCK_QUESTIONS: QuizQuestion[] = [
  {
    q: 'Où se déroule la fécondation humaine ?',
    options: ['Trompes de Fallope', 'Utérus', 'Ovaire', 'Ampoule utérine'],
    correct: 0,
    expl: 'La fécondation a lieu dans le tiers externe des trompes de Fallope, où l\'ovule rencontre les spermatozoïdes.',
  },
  {
    q: 'Quel est le nom du processus par lequel le spermatozoïde pénètre dans l\'ovule ?',
    options: ['Implantation', 'Fécondation', 'Ovulation', 'Menstruation'],
    correct: 1,
    expl: 'La fécondation désigne précisément la fusion entre le spermatozoïde et l\'ovule, formant le zygote.',
  },
  {
    q: 'Combien de chromosomes possède un gamète humain ?',
    options: ['46', '23', '22', '24'],
    correct: 1,
    expl: 'Les gamètes (spermatozoïdes et ovules) sont haploïdes : ils portent 23 chromosomes.',
  },
  {
    q: 'Quelle est la fonction principale de l\'ADN ?',
    options: ['Stocker l\'énergie', 'Synthétiser les lipides', 'Stocker l\'information génétique', 'Détruire les virus'],
    correct: 2,
    expl: 'L\'Acide Désoxyribonucléique (ADN) contient l\'ensemble des informations génétiques nécessaires au développement et au fonctionnement d\'un organisme.',
  }
];
