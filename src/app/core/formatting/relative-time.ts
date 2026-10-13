const MS_PER_MINUTE = 60000;

/**
 * Formats a past moment as 'Just now', '5m ago', '3h ago', or the local date after a day.
 * The current time is a parameter, so the function does not read the clock.
 */
export function formatRelativeTime(
  value: Date | string | null | undefined,
  now: Date
): string {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / MS_PER_MINUTE);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return date.toLocaleDateString();
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'Just now';
}
