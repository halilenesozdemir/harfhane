import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = resolve(process.cwd(), 'index.html');

describe('index.html branding', () => {
  it('should never mention Wordle in titles, descriptions or structured data', () => {
    expect(readFileSync(INDEX_HTML, 'utf8')).not.toMatch(/wordle/i);
  });
});
