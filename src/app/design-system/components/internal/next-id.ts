let counter = 0;

/** Returns a document-unique id such as `jbh-field-3`. Used for `for`, `aria-*` and picker links. */
export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}
