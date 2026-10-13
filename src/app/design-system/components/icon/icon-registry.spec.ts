import { isKnownIcon, JBH_ICONS } from './icon-registry';

describe('icon registry', () => {
  it('resolves every registered name to an SVG string', () => {
    const entries = Object.entries(JBH_ICONS);

    expect(entries.length).toBeGreaterThan(0);
    entries.forEach(([name, svg]) => {
      expect(typeof svg).withContext(name).toBe('string');
      expect(svg).withContext(name).toContain('<svg');
    });
  });

  it('contains the names that domain helpers and the toast close button return', () => {
    [
      'close',
      'wallet-outline',
      'cube-outline',
      'trending-up-outline',
      'trending-down-outline',
      'remove-outline',
      'arrow-up-circle',
      'arrow-down-circle',
      'information-circle',
      'checkmark-circle-outline',
      'time-outline',
      'close-circle-outline',
      'help-circle-outline',
      'refresh-outline'
    ].forEach(name => expect(isKnownIcon(name)).withContext(name).toBeTrue());
  });

  it('knows only its own names', () => {
    expect(isKnownIcon('trash-outline')).toBeTrue();
    expect(isKnownIcon('not-an-icon')).toBeFalse();
    expect(isKnownIcon('constructor')).toBeFalse();
  });
});
