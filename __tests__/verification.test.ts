import { AxiosError, AxiosHeaders } from 'axios';

import { getVerificationChannel } from '@/utils/apiError';
import { resolveVerificationTarget } from '@/utils/verification';

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('getVerificationChannel', () => {
  it('lit le canal email d\'un 403', () => {
    const error = axiosErrorWith(403, {
      success: false,
      message: 'Compte non vérifié.',
      errors: { verification_channel: ['email'] },
    });

    expect(getVerificationChannel(error)).toBe('email');
  });

  it('lit le canal téléphone d\'un 403', () => {
    const error = axiosErrorWith(403, {
      success: false,
      message: 'Compte non vérifié.',
      errors: { verification_channel: ['phone'] },
    });

    expect(getVerificationChannel(error)).toBe('phone');
  });

  it('ignore un 403 sans canal', () => {
    // Un compte désactivé renvoie aussi 403 : le confondre enverrait
    // l'utilisateur sur un écran de vérification qui ne le débloquerait pas.
    const error = axiosErrorWith(403, {
      success: false,
      message: 'Ce compte est désactivé.',
      errors: null,
    });

    expect(getVerificationChannel(error)).toBeNull();
  });

  it('ignore un canal inconnu', () => {
    const error = axiosErrorWith(403, {
      success: false,
      message: '',
      errors: { verification_channel: ['carrier-pigeon'] },
    });

    expect(getVerificationChannel(error)).toBeNull();
  });

  it('ignore les autres codes de statut', () => {
    const error = axiosErrorWith(422, {
      success: false,
      message: '',
      errors: { verification_channel: ['email'] },
    });

    expect(getVerificationChannel(error)).toBeNull();
  });

  it('ignore une erreur qui n\'est pas une erreur Axios', () => {
    expect(getVerificationChannel(new Error('boom'))).toBeNull();
  });
});

describe('resolveVerificationTarget', () => {
  it('cible l\'écran email quand un email a été saisi', () => {
    expect(resolveVerificationTarget('email', 'awa@noble-bac.com')).toEqual({
      kind: 'email',
      email: 'awa@noble-bac.com',
    });
  });

  it('normalise l\'email en minuscules', () => {
    expect(resolveVerificationTarget('email', '  Awa@Noble-Bac.COM  ')).toEqual({
      kind: 'email',
      email: 'awa@noble-bac.com',
    });
  });

  it('cible l\'écran OTP quand un numéro a été saisi', () => {
    expect(resolveVerificationTarget('phone', '+22790123456')).toEqual({
      kind: 'phone',
      phone: '+22790123456',
    });
  });

  it('explique la situation quand le canal attendu est l\'email mais qu\'un numéro a été saisi', () => {
    // Le backend ne renvoie pas l'adresse rattachée au compte : la révéler
    // livrerait l'email de quelqu'un à qui connaît son mot de passe. On ne
    // peut donc pas préremplir, et on le dit plutôt que de deviner.
    const target = resolveVerificationTarget('email', '+22790123456');

    expect(target.kind).toBe('unavailable');
    expect(target).toHaveProperty('reason', expect.stringContaining('email'));
  });

  it('explique la situation quand le canal attendu est le téléphone mais qu\'un email a été saisi', () => {
    const target = resolveVerificationTarget('phone', 'awa@noble-bac.com');

    expect(target.kind).toBe('unavailable');
    expect(target).toHaveProperty('reason', expect.stringContaining('numéro'));
  });
});
