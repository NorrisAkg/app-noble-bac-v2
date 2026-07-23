import { countryPreposition, withCountryPreposition } from '../utils/countryLocative';

describe('countryPreposition', () => {
  it('returns "en" for feminine countries (CI, GN, GW)', () => {
    expect(countryPreposition('CI')).toBe('en');
    expect(countryPreposition('GN')).toBe('en');
    expect(countryPreposition('GW')).toBe('en');
  });

  it('returns "au" for masculine countries', () => {
    expect(countryPreposition('SN')).toBe('au');
    expect(countryPreposition('BJ')).toBe('au');
    expect(countryPreposition('BF')).toBe('au');
    expect(countryPreposition('ML')).toBe('au');
    expect(countryPreposition('NE')).toBe('au');
    expect(countryPreposition('TG')).toBe('au');
  });

  it('is case-insensitive', () => {
    expect(countryPreposition('ci')).toBe('en');
    expect(countryPreposition('sn')).toBe('au');
  });
});

describe('withCountryPreposition', () => {
  it('builds "en <name>" for feminine countries', () => {
    expect(withCountryPreposition('CI', "Côte d'Ivoire")).toBe("en Côte d'Ivoire");
    expect(withCountryPreposition('GN', 'Guinée')).toBe('en Guinée');
  });

  it('builds "au <name>" for masculine countries', () => {
    expect(withCountryPreposition('BJ', 'Bénin')).toBe('au Bénin');
    expect(withCountryPreposition('SN', 'Sénégal')).toBe('au Sénégal');
  });
});
