import AsyncStorage from '@react-native-async-storage/async-storage';

import { clearAuthTrace, getAuthTrace, loadAuthTrace, traceAuth } from '../services/authTrace';

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('authTrace', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await clearAuthTrace();
  });

  it('enregistre les évènements dans l\'ordre, horodatés', () => {
    traceAuth('premier');
    traceAuth('second');

    const events = getAuthTrace();
    expect(events).toHaveLength(2);
    expect(events[0]).toMatch(/^\d{2}:\d{2}:\d{2} premier$/);
    expect(events[1]).toContain('second');
  });

  it('plafonne le journal pour ne pas grossir indéfiniment', () => {
    for (let i = 0; i < 60; i += 1) {
      traceAuth(`évènement ${i}`);
    }

    const events = getAuthTrace();
    expect(events).toHaveLength(40);
    // Ce sont les plus récents qui survivent : c'est le parcours qui vient
    // d'échouer qu'on vient lire, pas celui d'il y a une heure.
    expect(events[events.length - 1]).toContain('évènement 59');
  });

  /**
   * traceAuth est appelée depuis clearLocal, donc depuis le chemin de
   * déconnexion automatique. Un stockage en échec ne doit surtout pas y
   * remonter une exception.
   */
  it('ne rejette pas quand la persistance échoue', () => {
    mockedStorage.setItem.mockRejectedValueOnce(new Error('quota exceeded'));

    expect(() => traceAuth('avec un stockage cassé')).not.toThrow();
    expect(getAuthTrace()).toHaveLength(1);
  });

  it('survit à un journal persisté illisible', async () => {
    mockedStorage.getItem.mockResolvedValueOnce('{ pas du JSON');

    await expect(loadAuthTrace()).resolves.toBeUndefined();
  });
});
