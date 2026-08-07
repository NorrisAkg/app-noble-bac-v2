import { ADMIN_MANAGED_QUERY_PREFIXES, queryKeys } from '../lib/queryKeys';

describe('queryKeys', () => {
  /**
   * Le bug d'origine : une même donnée sous plusieurs clés. Les matières de
   * cours vivaient sous `['subjects']` (Bibliothèque, Recherche) et
   * `['courses','subjects']` (onglet Cours, prefetch) — deux entrées de cache,
   * deux `staleTime` contradictoires, et un prefetch qui rafraîchissait la
   * copie que personne ne lisait.
   */
  it('expose une seule clé par donnée', () => {
    expect(queryKeys.courses.subjects()).toEqual(['courses', 'subjects']);
    expect(queryKeys.referential.countries()).toEqual(['referential', 'countries']);
    expect(queryKeys.subscription.active()).toEqual(['subscription', 'active']);
  });

  /**
   * GET /quiz/subjects et GET /courses/subjects sont deux endpoints distincts
   * avec des filtrages différents : ces clés doivent rester séparées.
   */
  it('garde les matières quiz distinctes des matières cours', () => {
    expect(queryKeys.quiz.subjects()).not.toEqual(queryKeys.courses.subjects());
  });

  it('imbrique chaque clé sous le préfixe de son groupe', () => {
    const groups = [
      [queryKeys.referential.all(), queryKeys.referential.countries()],
      [queryKeys.courses.all(), queryKeys.courses.chapters(1)],
      [queryKeys.courses.all(), queryKeys.courses.lesson(2)],
      [queryKeys.catalog.all(), queryKeys.catalog.videos(3)],
      [queryKeys.quiz.all(), queryKeys.quiz.historyForSubject(4)],
      [queryKeys.subscription.all(), queryKeys.subscription.transactions()],
    ] as const;

    for (const [prefix, key] of groups) {
      expect(key.slice(0, prefix.length)).toEqual([...prefix]);
    }
  });

  it('accepte un id absent sans perdre le préfixe invalidable', () => {
    expect(queryKeys.catalog.videos(undefined).slice(0, 2)).toEqual(['catalog', 'videos']);
    expect(queryKeys.referential.operators(null).slice(0, 2)).toEqual([
      'referential',
      'operators',
    ]);
  });

  it('exams accepte un filtre optionnel sans casser le préfixe catalog', () => {
    expect(queryKeys.catalog.exams()).toEqual(['catalog', 'exams']);
    expect(queryKeys.catalog.exams({ subjectId: 1 })).toEqual([
      'catalog',
      'exams',
      { subjectId: 1 },
    ]);
  });

  /**
   * Ces préfixes pilotent l'invalidation au retour du réseau et au passage au
   * premier plan : s'il en manque un, le contenu correspondant reste sur la
   * copie cachée avant la coupure.
   */
  it('couvre tout le contenu piloté par l\'admin dans les préfixes à invalider', () => {
    expect(ADMIN_MANAGED_QUERY_PREFIXES).toEqual(
      expect.arrayContaining([
        queryKeys.referential.all(),
        queryKeys.courses.all(),
        queryKeys.catalog.all(),
        queryKeys.quiz.all(),
      ]),
    );
  });

  it('n\'inclut pas les données utilisateur dans les préfixes à invalider', () => {
    const flattened = ADMIN_MANAGED_QUERY_PREFIXES.map((prefix) => prefix.join(':'));

    expect(flattened).not.toContain('profile');
    expect(flattened).not.toContain('subscription');
    expect(flattened).not.toContain('my-downloads');
  });
});
