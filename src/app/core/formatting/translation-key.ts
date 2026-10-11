/**
 * Reads a backend text like '{"en":"Salary","es":"Salario"}' for `lang`.
 * 'es' gives the Spanish text; any other language gives the English text.
 * Returns the input when it is not valid JSON, and '' for empty input.
 */
export function parseTranslationKey(json: string | null | undefined, lang: string): string {
  if (!json) return '';

  try {
    const parsed = JSON.parse(json) as { en?: string; es?: string } | null;
    const text = lang === 'es' ? parsed?.es : parsed?.en;
    return text ?? '';
  } catch {
    return json;
  }
}
