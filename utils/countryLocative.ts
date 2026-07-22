// Préposition française ("au"/"en") selon le genre du pays, pour construire
// des phrases du type "au Bénin", "en Guinée", "en Côte d'Ivoire".
// Pays féminins (terminaison en -e, sauf exceptions) → "en" ; le reste → "au".
const FEMININE_COUNTRY_CODES = new Set(['CI', 'GN', 'GW']);

export function countryPreposition(code: string): 'au' | 'en' {
  return FEMININE_COUNTRY_CODES.has(code.toUpperCase()) ? 'en' : 'au';
}

export function withCountryPreposition(code: string, name: string): string {
  return `${countryPreposition(code)} ${name}`;
}
