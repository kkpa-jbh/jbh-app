export interface DecimalSeparators {
  decimalSeparator: string;
  thousandsSeparator: string;
}

export const DEFAULT_DECIMAL_SEPARATORS: DecimalSeparators = {
  decimalSeparator: '.',
  thousandsSeparator: ','
};

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Adds thousands separators to the integer part: '1234567.89' becomes '1,234,567.89'. */
export function groupThousands(
  text: string,
  sep: DecimalSeparators = DEFAULT_DECIMAL_SEPARATORS
): string {
  if (!text) return text;

  const [integerPart, decimalPart] = text.split(sep.decimalSeparator);
  const isNegative = integerPart.startsWith('-');
  const digits = isNegative ? integerPart.slice(1) : integerPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep.thousandsSeparator);
  const signed = isNegative ? `-${grouped}` : grouped;

  return decimalPart !== undefined ? `${signed}${sep.decimalSeparator}${decimalPart}` : signed;
}

/** Removes every thousands separator: '1,234,567.89' becomes '1234567.89'. */
export function stripThousands(
  text: string,
  sep: DecimalSeparators = DEFAULT_DECIMAL_SEPARATORS
): string {
  if (!text) return text;
  return text.split(sep.thousandsSeparator).join('');
}

/**
 * True when `text` is a valid state while typing: empty, a lone '-', or an optional '-',
 * digits, an optional decimal separator and at most `maxDecimals` decimals.
 * With `maxDecimals` 0 only integers are allowed.
 */
export function isAllowedDecimalText(
  text: string,
  maxDecimals: number,
  sep: DecimalSeparators = DEFAULT_DECIMAL_SEPARATORS
): boolean {
  if (text === '') return true;

  const pattern =
    maxDecimals === 0
      ? /^-?\d*$/
      : new RegExp(`^-?\\d*${escapeRegex(sep.decimalSeparator)}?\\d{0,${maxDecimals}}$`);

  return pattern.test(text);
}

/** Converts input text to a number. Returns null for empty or non-numeric text. */
export function parseDecimal(
  text: string,
  sep: DecimalSeparators = DEFAULT_DECIMAL_SEPARATORS
): number | null {
  if (!text) return null;

  const normalized = stripThousands(text, sep).replace(sep.decimalSeparator, '.');
  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}

/** Cleans text on blur: drops a trailing decimal separator and extra decimals. */
export function cleanDecimalOnBlur(
  text: string,
  maxDecimals: number,
  sep: DecimalSeparators = DEFAULT_DECIMAL_SEPARATORS
): string {
  let value = text;
  if (!value) return value;

  if (value.endsWith(sep.decimalSeparator)) {
    value = value.slice(0, -1);
  }

  if (maxDecimals > 0 && value.includes(sep.decimalSeparator)) {
    const [integerPart, decimalPart] = value.split(sep.decimalSeparator);
    if (decimalPart && decimalPart.length > maxDecimals) {
      value = `${integerPart}${sep.decimalSeparator}${decimalPart.substring(0, maxDecimals)}`;
    }
  }

  return value;
}

/** Shows a stored number as grouped text: 1234.5 becomes '1,234.5'. Null gives ''. */
export function formatDecimalForDisplay(
  value: number | null | undefined,
  sep: DecimalSeparators = DEFAULT_DECIMAL_SEPARATORS
): string {
  if (value === null || value === undefined) return '';
  return groupThousands(String(value).replace('.', sep.decimalSeparator), sep);
}
