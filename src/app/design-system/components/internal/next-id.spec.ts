import { nextId } from './next-id';

describe('nextId', () => {
  it('returns different ids for two calls', () => {
    expect(nextId('jbh-field')).not.toBe(nextId('jbh-field'));
  });

  it('starts with the prefix', () => {
    expect(nextId('jbh-date-picker')).toMatch(/^jbh-date-picker-\d+$/);
  });
});
