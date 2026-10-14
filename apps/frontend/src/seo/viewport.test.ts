import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const INDEX_HTML = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

function viewportContent(html: string): string {
  const match = /<meta name="viewport" content="([^"]*)"/.exec(html);
  if (!match?.[1]) throw new Error('index.html has no viewport meta');
  return match[1];
}

describe('index.html viewport', () => {
  it('should allow pinch zoom when the viewport meta is read (012-AE8)', () => {
    const content = viewportContent(INDEX_HTML);
    expect(content).not.toMatch(/user-scalable\s*=\s*(no|0)/);
    expect(content).not.toMatch(/maximum-scale\s*=\s*1(\.0)?\b/);
  });
});
