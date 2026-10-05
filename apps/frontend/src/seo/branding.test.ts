import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = resolve(process.cwd(), 'index.html');
const PUBLIC_DIR = resolve(process.cwd(), 'public');
const SRC_DIR = resolve(process.cwd(), 'src');
const BRANDING_TEST_FILE = resolve(process.cwd(), 'src/seo/branding.test.ts');
const TEXT_FILE_EXTENSIONS = ['.html', '.json', '.svg', '.txt', '.xml', '.js', '.webmanifest'];
const SOURCE_FILE_EXTENSIONS = ['.ts', '.tsx'];

function listFilesRecursively(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const entryPath = join(dir, entry);
    return statSync(entryPath).isDirectory() ? listFilesRecursively(entryPath) : [entryPath];
  });
}

function isTextFile(filePath: string): boolean {
  return TEXT_FILE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
}

function isSourceFile(filePath: string): boolean {
  return SOURCE_FILE_EXTENSIONS.some((extension) => filePath.endsWith(extension));
}

describe('index.html branding', () => {
  it('should never mention Wordle in titles, descriptions or structured data', () => {
    expect(readFileSync(INDEX_HTML, 'utf8')).not.toMatch(/wordle/i);
  });

  it('should never mention the legacy name in index.html', () => {
    expect(readFileSync(INDEX_HTML, 'utf8')).not.toMatch(/nurd/i);
  });
});

describe('public assets branding', () => {
  it('should never mention the legacy name in any public text file', () => {
    const offendingFiles = listFilesRecursively(PUBLIC_DIR)
      .filter(isTextFile)
      .filter((filePath) => /nurd/i.test(readFileSync(filePath, 'utf8')));

    expect(offendingFiles).toEqual([]);
  });
});

describe('source code branding', () => {
  it('should never mention Wordle or the legacy name in any source file', () => {
    const offendingFiles = listFilesRecursively(SRC_DIR)
      .filter(isSourceFile)
      .filter((filePath) => filePath !== BRANDING_TEST_FILE)
      .filter((filePath) => /\b(wordle|nurd)\b/i.test(readFileSync(filePath, 'utf8')));

    expect(offendingFiles).toEqual([]);
  });
});
