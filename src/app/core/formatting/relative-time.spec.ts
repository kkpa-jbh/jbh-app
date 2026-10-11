import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  const now = new Date('2025-06-01T12:00:00Z');

  it('returns "Just now" under one minute', () => {
    expect(formatRelativeTime('2025-06-01T11:59:30Z', now)).toBe('Just now');
  });

  it('returns minutes under one hour', () => {
    expect(formatRelativeTime('2025-06-01T11:55:00Z', now)).toBe('5m ago');
  });

  it('returns hours under one day', () => {
    expect(formatRelativeTime('2025-06-01T09:00:00Z', now)).toBe('3h ago');
  });

  it('returns the local date from one day on', () => {
    const value = '2025-05-30T12:00:00Z';
    expect(formatRelativeTime(value, now)).toBe(new Date(value).toLocaleDateString());
  });

  it('accepts a Date object', () => {
    expect(formatRelativeTime(new Date('2025-06-01T11:55:00Z'), now)).toBe('5m ago');
  });

  it('returns an empty string for empty input', () => {
    expect(formatRelativeTime(null, now)).toBe('');
    expect(formatRelativeTime(undefined, now)).toBe('');
    expect(formatRelativeTime('', now)).toBe('');
  });
});
