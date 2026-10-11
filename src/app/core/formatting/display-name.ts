/** Picks the text for `lang`, else the English text, else `fallback`. */
export function pickDisplayName(
  displayName: Record<string, string> | null | undefined,
  lang: string,
  fallback = ''
): string {
  if (!displayName) return fallback;
  return displayName[lang] ?? displayName['en'] ?? fallback;
}
