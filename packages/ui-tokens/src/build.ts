import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseTokenSource, toCss, toTs } from './generate.ts';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));

export const SOURCE_PATH = `${PACKAGE_ROOT}tokens.json`;
export const CSS_PATH = `${PACKAGE_ROOT}generated/tokens.css`;
export const TS_PATH = `${PACKAGE_ROOT}generated/tokens.ts`;

export function readTokenSource() {
  return parseTokenSource(JSON.parse(readFileSync(SOURCE_PATH, 'utf8')));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const source = readTokenSource();
  writeFileSync(CSS_PATH, toCss(source));
  writeFileSync(TS_PATH, toTs(source));
}
