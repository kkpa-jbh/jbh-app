#!/usr/bin/env node

// Fails when app SCSS styles Ionic directly.
// Once a page uses jbh-* components, a rule like `ion-icon { ... }` stops matching
// without any error, so this check makes that visible.
// Only src/app/design-system/ and the root shell may style Ionic.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src/app';
const EXEMPT_DIRS = ['src/app/design-system'];
const EXEMPT_FILES = ['src/app/app.component.scss'];

const PATTERNS = [/(^|[^\w-])ion-[a-z]/, /::part\(/, /var\(--ion-/];

function listScssFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXEMPT_DIRS.includes(path)) {
        files.push(...listScssFiles(path));
      }
    } else if (entry.name.endsWith('.scss') && !EXEMPT_FILES.includes(path)) {
      files.push(path);
    }
  }
  return files;
}

// Keeps the line breaks, so the reported line numbers stay right.
function removeComments(source) {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ''));
  // `[^:]` keeps `//` inside URLs such as `url(https://...)`.
  return withoutBlocks.replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const violations = [];
for (const file of listScssFiles(ROOT)) {
  const lines = removeComments(readFileSync(file, 'utf8')).split('\n');
  lines.forEach((line, index) => {
    if (PATTERNS.some((pattern) => pattern.test(line))) {
      violations.push(`${relative('.', file)}:${index + 1}  ${line.trim()}`);
    }
  });
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  console.error(
    `\nSCSS boundary: ${violations.length} violation(s). Style Ionic only inside src/app/design-system/.`,
  );
  process.exit(1);
}

console.log('SCSS boundary: no violations.');
