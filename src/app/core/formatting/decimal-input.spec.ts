import {
  cleanDecimalOnBlur,
  DecimalSeparators,
  formatDecimalForDisplay,
  groupThousands,
  isAllowedDecimalText,
  parseDecimal,
  stripThousands
} from './decimal-input';

describe('decimal input helpers', () => {
  const dot: DecimalSeparators = { decimalSeparator: '.', thousandsSeparator: ',' };
  const comma: DecimalSeparators = { decimalSeparator: ',', thousandsSeparator: '.' };

  describe('groupThousands', () => {
    it('groups the integer part', () => {
      expect(groupThousands('1234567.89', dot)).toBe('1,234,567.89');
      expect(groupThousands('-1234', dot)).toBe('-1,234');
      expect(groupThousands('', dot)).toBe('');
    });

    it('uses the given separators', () => {
      expect(groupThousands('1234567,89', comma)).toBe('1.234.567,89');
    });
  });

  describe('stripThousands', () => {
    it('removes thousands separators', () => {
      expect(stripThousands('1,234,567.89', dot)).toBe('1234567.89');
    });
  });

  describe('isAllowedDecimalText', () => {
    it('limits the number of decimals', () => {
      expect(isAllowedDecimalText('12.34', 2, dot)).toBeTrue();
      expect(isAllowedDecimalText('12.345', 2, dot)).toBeFalse();
    });

    it('allows only integers when maxDecimals is 0', () => {
      expect(isAllowedDecimalText('12', 0, dot)).toBeTrue();
      expect(isAllowedDecimalText('12.5', 0, dot)).toBeFalse();
    });

    it('allows intermediate typing states', () => {
      expect(isAllowedDecimalText('-', 2, dot)).toBeTrue();
      expect(isAllowedDecimalText('', 2, dot)).toBeTrue();
    });

    it('rejects letters', () => {
      expect(isAllowedDecimalText('abc', 2, dot)).toBeFalse();
    });
  });

  describe('parseDecimal', () => {
    it('parses text to a number', () => {
      expect(parseDecimal('1234.5', dot)).toBe(1234.5);
    });

    it('returns null for empty text', () => {
      expect(parseDecimal('', dot)).toBeNull();
    });

    it('uses the given separators', () => {
      expect(parseDecimal('1234,5', comma)).toBe(1234.5);
    });
  });

  describe('cleanDecimalOnBlur', () => {
    it('removes a trailing decimal separator', () => {
      expect(cleanDecimalOnBlur('12.', 2, dot)).toBe('12');
    });

    it('cuts extra decimals', () => {
      expect(cleanDecimalOnBlur('12.3456', 2, dot)).toBe('12.34');
    });

    it('keeps trailing zeros', () => {
      expect(cleanDecimalOnBlur('12.30', 2, dot)).toBe('12.30');
    });
  });

  describe('formatDecimalForDisplay', () => {
    it('shows a number with thousands separators', () => {
      expect(formatDecimalForDisplay(1234.5, dot)).toBe('1,234.5');
    });

    it('returns an empty string for null', () => {
      expect(formatDecimalForDisplay(null, dot)).toBe('');
    });
  });

  it('uses "." and "," when no separators are given', () => {
    expect(groupThousands('1234567.89')).toBe('1,234,567.89');
    expect(parseDecimal('1234.5')).toBe(1234.5);
  });
});
