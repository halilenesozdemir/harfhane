import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CSS_PATH, TS_PATH, readTokenSource } from './build.ts';
import { parseTokenSource, toCss, toTs } from './generate.ts';

const createSource = () => ({
  base: { 'radius-tile': '14px' },
  themes: {
    light: { bg: '#fff4dc', 'correct-rgb': '31 138 91' },
    dark: { bg: '#1c1611' },
    'high-contrast': { 'correct-rgb': '245 121 58' },
    'dark-high-contrast': { 'correct-text': '#f5793a' },
  },
});

describe('parseTokenSource', () => {
  it('should accept a source with every theme', () => {
    expect(parseTokenSource(createSource()).themes.dark.bg).toBe('#1c1611');
  });

  it('should throw when a theme is missing', () => {
    const { dark: _dark, ...themes } = createSource().themes;
    expect(() => parseTokenSource({ ...createSource(), themes })).toThrow('dark');
  });

  it('should throw when a token value is not a string', () => {
    expect(() => parseTokenSource({ ...createSource(), base: { 'radius-tile': 14 } })).toThrow('base');
  });
});

describe('toCss', () => {
  it('should emit prefixed variables under each theme selector', () => {
    const css = toCss(parseTokenSource(createSource()));
    expect(css).toContain(':root,\n.light {\n  --hh-bg: #fff4dc;');
    expect(css).toContain('.dark.high-contrast {\n  --hh-correct-text: #f5793a;');
    expect(css).toContain(':root {\n  --hh-radius-tile: 14px;');
  });
});

describe('toTs', () => {
  it('should camelCase names and turn rgb channels into rgb colors', () => {
    const ts = toTs(parseTokenSource(createSource()));
    expect(ts).toContain('"correct": "rgb(31, 138, 91)"');
    expect(ts).toContain('"radiusTile": "14px"');
  });

  it('should throw when an rgb token does not have three channels', () => {
    const source = createSource();
    const themes = { ...source.themes, dark: { 'brand-rgb': '194 65' } };
    expect(() => toTs(parseTokenSource({ ...source, themes }))).toThrow('brand-rgb');
  });
});

describe('generated files', () => {
  it('should match tokens.json when the build has been run', () => {
    const source = readTokenSource();
    expect(readFileSync(CSS_PATH, 'utf8')).toBe(toCss(source));
    expect(readFileSync(TS_PATH, 'utf8')).toBe(toTs(source));
  });
});
