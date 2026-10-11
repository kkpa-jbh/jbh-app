import { parseTranslationKey } from './translation-key';

describe('parseTranslationKey', () => {
  const json = '{"en":"Salary","es":"Salario"}';

  it('returns the Spanish text for es', () => {
    expect(parseTranslationKey(json, 'es')).toBe('Salario');
  });

  it('returns the English text for en and for other languages', () => {
    expect(parseTranslationKey(json, 'en')).toBe('Salary');
    expect(parseTranslationKey(json, 'fr')).toBe('Salary');
  });

  it('returns the input when it is not valid JSON', () => {
    expect(parseTranslationKey('Salary', 'es')).toBe('Salary');
  });

  it('returns an empty string for empty input', () => {
    expect(parseTranslationKey(null, 'es')).toBe('');
  });
});
