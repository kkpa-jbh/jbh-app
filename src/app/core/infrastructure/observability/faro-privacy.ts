import { TransportItem } from '@grafana/faro-web-sdk';
import { redactEmailSegments, stripUrlQueries } from './faro-url';

// Values of these keys are removed.
const DROP_KEYS: ReadonlySet<string> = new Set(['url.query', 'http.query']);
// Values of these keys are cut at the first "?" or "#".
const CUT_KEYS: ReadonlySet<string> = new Set(['url', 'url.full', 'http.url', 'http.target', 'name']);
// Property names that hold the value of an OTLP attribute: { key, value: { stringValue } }.
const OTLP_VALUE_KEY = /^(value|values|\w+Value)$/;

type PlainObject = Record<string, unknown>;

/** beforeSend hook. Returns a cleaned copy of the item, or null (drop) when the cleaning fails. */
export function scrubTransportItem(item: TransportItem): TransportItem | null {
  try {
    return {
      ...item,
      meta: scrubValue(item.meta) as TransportItem['meta'],
      payload: scrubValue(item.payload) as TransportItem['payload']
    };
  } catch {
    return null;
  }
}

function scrubValue(value: unknown, key?: string): unknown {
  if (typeof value === 'string') {
    return scrubString(value, key);
  }
  if (Array.isArray(value)) {
    return value.map(entry => scrubValue(entry, key));
  }
  if (value !== null && typeof value === 'object') {
    return scrubObject(value as PlainObject, key);
  }
  return value;
}

function scrubString(value: string, key?: string): string {
  if (key !== undefined && DROP_KEYS.has(key)) {
    return '';
  }
  const text = key !== undefined && CUT_KEYS.has(key) ? value.split(/[?#]/, 1)[0] : value;
  return redactEmailSegments(stripUrlQueries(text));
}

function scrubObject(obj: PlainObject, contextKey?: string): PlainObject {
  const attributeKey = typeof obj['key'] === 'string' && 'value' in obj ? (obj['key'] as string) : contextKey;
  const result: PlainObject = {};
  for (const [name, child] of Object.entries(obj)) {
    const childKey = attributeKey !== undefined && OTLP_VALUE_KEY.test(name) ? attributeKey : name;
    result[name] = scrubValue(child, childKey);
  }
  return result;
}
