export const COURSE_SUBJECTS = [
  { k: 'maths', label: 'Maths' },
  { k: 'phys',  label: 'Physique' },
  { k: 'svt',   label: 'SVT' },
  { k: 'chem',  label: 'Chimie' },
  { k: 'fr',    label: 'Français' },
  { k: 'eng',   label: 'Anglais' },
  { k: 'hg',    label: 'Histoire-Géo' },
  { k: 'philo', label: 'Philo' },
];

export const COURSE_SECTIONS: Record<string, { id: string; title: string; items: { t: string; done: boolean }[] }[]> = {
  fr: [
    { id: 'method', title: 'Méthodologie', items: [
      { t: 'La dissertation littéraire', done: false },
      { t: 'Le commentaire littéraire',  done: false },
      { t: 'Le résumé suivi de discussion', done: false },
      { t: 'Le texte suivi de questions', done: false },
    ]},
    { id: 'analyse', title: "Outils d'analyse littéraire", items: [
      { t: 'Figures de style',     done: false },
      { t: 'Registres / Tonalités', done: false },
      { t: 'Les connecteurs',      done: false },
    ]},
    { id: 'genres', title: 'Étude des genres', items: [
      { t: 'Le roman',     done: false },
      { t: 'Le théâtre',   done: false },
      { t: 'La poésie',    done: false },
    ]},
  ],
  maths: [
    { id: 'analyse', title: 'Analyse', items: [
      { t: 'Suites numériques',       done: true  },
      { t: 'Limites et continuité',   done: false },
      { t: 'Dérivation',              done: false },
      { t: 'Fonctions logarithmes',   done: false },
      { t: 'Fonctions exponentielles', done: false },
    ]},
    { id: 'algebre', title: 'Algèbre & Probabilités', items: [
      { t: 'Nombres complexes',          done: false },
      { t: 'Probabilités conditionnelles', done: false },
      { t: 'Statistiques',              done: false },
    ]},
    { id: 'geo', title: 'Géométrie', items: [
      { t: "Géométrie dans l'espace", done: false },
      { t: 'Vecteurs et coordonnées', done: false },
    ]},
  ],
  phys: [
    { id: 'meca', title: 'Mécanique', items: [
      { t: 'Mécanique du point', done: false },
      { t: 'Champs et forces',   done: false },
      { t: 'Énergie',            done: false },
    ]},
    { id: 'ondes', title: 'Ondes & Optique', items: [
      { t: 'Ondes mécaniques',     done: false },
      { t: 'Optique géométrique',  done: false },
    ]},
  ],
  svt:   [{ id: 'bio', title: 'Biologie', items: [{ t: 'Génétique', done: false }, { t: 'Évolution', done: false }] }],
  chem:  [{ id: 'orga', title: 'Chimie organique', items: [{ t: 'Hydrocarbures', done: false }, { t: 'Fonctions organiques', done: false }] },
          { id: 'reac', title: 'Réactions', items: [{ t: 'Acido-basiques', done: false }, { t: 'Oxydo-réduction', done: false }] }],
  eng:   [{ id: 'gram', title: 'Grammar', items: [{ t: 'Tenses review', done: false }, { t: 'Conditionals', done: false }] }],
  hg:    [{ id: 'hist', title: 'Histoire', items: [{ t: 'Décolonisation', done: false }, { t: 'Mondialisation', done: false }] },
          { id: 'geo',  title: 'Géographie', items: [{ t: 'Espaces et territoires', done: false }] }],
  philo: [{ id: 'notions', title: 'Notions', items: [{ t: 'La conscience', done: false }, { t: 'La liberté', done: false }, { t: 'Le travail', done: false }] }],
};
