// Pure URL helpers for the Faro code. No imports on purpose.

// An absolute URL, then its query or fragment. Trailing punctuation (":" or ",") stays in the text.
const URL_WITH_SUFFIX = /(https?:\/\/[^\s?#"'<>)]*)[?#](?:[^\s"'<>)]*[^\s"'<>):,;.])?/g;

const ID_SEGMENT = /^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const PLACEHOLDER_ORIGIN = 'http://localhost';

/** Removes the query and the fragment from every http(s) URL inside the text. */
export function stripUrlQueries(text: string): string {
  return text.replace(URL_WITH_SUFFIX, '$1');
}

/** Path only, with numeric and UUID segments replaced by {id}. Returns /unknown when the URL does not parse. */
export function toPathTemplate(url: string): string {
  try {
    const path = new URL(url, PLACEHOLDER_ORIGIN).pathname;
    return path
      .split('/')
      .map(segment => (ID_SEGMENT.test(segment) ? '{id}' : segment))
      .join('/');
  } catch {
    return '/unknown';
  }
}
