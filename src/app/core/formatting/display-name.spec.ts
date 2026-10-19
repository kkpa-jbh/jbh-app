import { pickDisplayName } from './display-name';

describe('pickDisplayName', () => {
  it('returns the text for the language', () => {
    expect(pickDisplayName({ en: 'Salary', es: 'Salario' }, 'es')).toBe('Salario');
  });

  it('falls back to English', () => {
    expect(pickDisplayName({ en: 'Salary' }, 'es')).toBe('Salary');
  });

  it('returns the fallback for null', () => {
    expect(pickDisplayName(null, 'en', 'fallback')).toBe('fallback');
  });

  it('returns the fallback when neither the language nor English exists', () => {
    expect(pickDisplayName({ fr: 'Salaire' }, 'es', 'alias')).toBe('alias');
  });
});
