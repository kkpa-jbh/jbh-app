// Pure URL helpers for the Faro code. No imports on purpose.

// An absolute URL, then its query or fragment. Trailing punctuation (":" or ",") stays in the text.
const URL_WITH_SUFFIX = /(https?:\/\/[^\s?#"'<>)]*)[?#](?:[^\s"'<>)]*[^\s"'<>):,;.])?/g;

const ID_SEGMENT = /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

// A path segment with text on both sides of "@" (or "%40") is an email, e.g. /members/a%40b.com.
// "@angular" in a stack trace has nothing before "@", so it stays.
const EMAIL_SEGMENT = /^[^@]+(@|%40).+$/i;
// In text, the match stops before ":", ",", ";" or a final ".", so the text around it stays.
const EMAIL_SEGMENT_IN_TEXT = /\/[^/\s?#"'<>)@]+(?:@|%40)[^/\s?#"'<>)@:,;]*[^/\s?#"'<>)@:,;.]/gi;

const PLACEHOLDER_ORIGIN = 'http://localhost';

/** Removes the query and the fragment from every http(s) URL inside the text. */
export function stripUrlQueries(text: string): string {
  return text.replace(URL_WITH_SUFFIX, '$1');
}

/** Replaces every path segment that holds an email with {id}, anywhere in the text. */
export function redactEmailSegments(text: string): string {
  return text.replace(EMAIL_SEGMENT_IN_TEXT, '/{id}');
}

/** Path only, with numeric, UUID and email segments replaced by {id}. Returns /unknown when the URL does not parse. */
export function toPathTemplate(url: string): string {
  try {
    const path = new URL(url, PLACEHOLDER_ORIGIN).pathname;
    return path
      .split('/')
      .map(segment => (ID_SEGMENT.test(segment) || EMAIL_SEGMENT.test(segment) ? '{id}' : segment))
      .join('/');
  } catch {
    return '/unknown';
  }
}
