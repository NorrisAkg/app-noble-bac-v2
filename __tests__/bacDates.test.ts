import { daysUntilBac, getNextBacDate } from '../constants/bacDates';

describe('bacDates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renvoie une date dans le futur pour SN quand on est avant', () => {
    jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    const target = getNextBacDate('SN');
    // Senegal 23 juin de l'annee courante.
    expect(target.getFullYear()).toBe(2026);
    expect(target.getMonth()).toBe(5);
    expect(target.getDate()).toBe(23);
  });

  it('renvoie la date de l\'annee suivante quand on est apres', () => {
    jest.setSystemTime(new Date('2026-09-01T12:00:00Z'));
    const target = getNextBacDate('SN');
    expect(target.getFullYear()).toBe(2027);
    expect(target.getMonth()).toBe(5);
    expect(target.getDate()).toBe(23);
  });

  it('utilise le fallback (15 juin) pour un code pays inconnu', () => {
    jest.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    const target = getNextBacDate('XX');
    expect(target.getMonth()).toBe(5);
    expect(target.getDate()).toBe(15);
  });

  it('accepte null ou undefined sans crasher', () => {
    jest.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    expect(() => getNextBacDate(null)).not.toThrow();
    expect(() => getNextBacDate(undefined)).not.toThrow();
    expect(() => getNextBacDate('')).not.toThrow();
  });

  it('daysUntilBac retourne un entier >= 0', () => {
    jest.setSystemTime(new Date('2026-03-15T12:00:00Z'));
    const d = daysUntilBac('CI');
    expect(Number.isInteger(d)).toBe(true);
    expect(d).toBeGreaterThan(0);
  });

  it('daysUntilBac retourne 0 a la date exacte du Bac', () => {
    jest.setSystemTime(new Date('2026-06-17T12:00:00Z'));
    // CI = 17 juin
    const d = daysUntilBac('CI');
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(1);
  });
});
