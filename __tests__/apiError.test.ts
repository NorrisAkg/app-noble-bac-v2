import { AxiosError, AxiosHeaders } from 'axios';
import { getApiErrorMessage, getValidationErrors } from '../utils/apiError';

function buildAxiosError(opts: {
  status?: number;
  data?: unknown;
  noResponse?: boolean;
}): AxiosError {
  const error = new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    { headers: new AxiosHeaders() } as never,
    null,
    opts.noResponse
      ? undefined
      : ({
          status: opts.status ?? 500,
          statusText: 'X',
          headers: {},
          config: { headers: new AxiosHeaders() } as never,
          data: opts.data,
        } as never)
  );
  return error;
}

describe('getApiErrorMessage', () => {
  it('renvoie le message serveur quand present dans response.data.message', () => {
    const error = buildAxiosError({ status: 400, data: { message: 'Champ requis' } });
    expect(getApiErrorMessage(error)).toBe('Champ requis');
  });

  it('renvoie le message reseau quand pas de response (offline)', () => {
    const error = buildAxiosError({ noResponse: true });
    expect(getApiErrorMessage(error)).toBe(
      'Impossible de contacter le serveur. Vérifiez votre connexion.'
    );
  });

  it('remonte le message d\'une Error JS classique (préféré au fallback)', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('utilise le fallback custom uniquement si aucun message exploitable', () => {
    // Une string brute n'a pas de `message` → fallback custom utilisé.
    expect(getApiErrorMessage('non-error-thrown', 'Échec téléchargement')).toBe(
      'Échec téléchargement'
    );
  });

  it('renvoie "Erreur serveur (HTTP X)" si response existe mais sans message serveur', () => {
    const error = buildAxiosError({ status: 500, data: { code: 'X' } });
    expect(getApiErrorMessage(error)).toBe('Erreur serveur (HTTP 500).');
  });

  it('renvoie le fallback générique si erreur non-Error et non-axios', () => {
    expect(getApiErrorMessage(undefined)).toBe('Une erreur est survenue.');
  });
});

describe('getValidationErrors', () => {
  it('extrait le premier message par champ pour un 422', () => {
    const error = buildAxiosError({
      status: 422,
      data: {
        message: 'Validation failed',
        errors: {
          first_name: ['First name is required', 'min:2'],
          email: ['Invalid email'],
        },
      },
    });

    expect(getValidationErrors(error)).toEqual({
      first_name: 'First name is required',
      email: 'Invalid email',
    });
  });

  it('renvoie un objet vide si status != 422', () => {
    const error = buildAxiosError({ status: 500, data: { errors: { x: ['y'] } } });
    expect(getValidationErrors(error)).toEqual({});
  });

  it('renvoie un objet vide si pas de champ errors', () => {
    const error = buildAxiosError({ status: 422, data: { message: 'X' } });
    expect(getValidationErrors(error)).toEqual({});
  });

  it('renvoie un objet vide si erreur non-axios', () => {
    expect(getValidationErrors(new Error('boom'))).toEqual({});
  });
});
