/** Builds the `aria-describedby` value from the hint and error ids that are on screen. */
export function describedBy(controlId: string, hasHint: boolean, hasError: boolean): string | null {
  const ids: string[] = [];
  if (hasHint) ids.push(`${controlId}-hint`);
  if (hasError) ids.push(`${controlId}-error`);
  return ids.length ? ids.join(' ') : null;
}
