export const THEME_NAMES = ['light', 'dark', 'high-contrast', 'dark-high-contrast'] as const;

export type ThemeName = (typeof THEME_NAMES)[number];
export type TokenGroup = Readonly<Record<string, string>>;

export interface TokenSource {
  readonly base: TokenGroup;
  readonly themes: Readonly<Record<ThemeName, TokenGroup>>;
}

const THEME_SELECTORS: Record<ThemeName, string> = {
  light: ':root,\n.light',
  dark: '.dark',
  'high-contrast': '.high-contrast',
  'dark-high-contrast': '.dark.high-contrast',
};

const BASE_SELECTOR = ':root';
const CSS_PREFIX = '--hh-';
const RGB_SUFFIX = '-rgb';
const RGB_CHANNEL_COUNT = 3;
const GENERATED_NOTICE = 'Generated from packages/ui-tokens/tokens.json by `pnpm --filter @harfhane/ui-tokens run build`. Do not edit.';

function isTokenGroup(value: unknown): value is TokenGroup {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every((entry) => typeof entry === 'string');
}

export function parseTokenSource(raw: unknown): TokenSource {
  if (typeof raw !== 'object' || raw === null) throw new Error('Token source must be an object');
  const { base, themes } = raw as { base?: unknown; themes?: unknown };
  if (!isTokenGroup(base)) throw new Error('Token source "base" must map names to strings');
  if (typeof themes !== 'object' || themes === null) throw new Error('Token source "themes" must be an object');
  const themeMap = themes as Record<string, unknown>;
  const missing = THEME_NAMES.filter((name) => !isTokenGroup(themeMap[name]));
  if (missing.length > 0) throw new Error(`Invalid or missing themes: ${missing.join(', ')}`);
  return { base, themes: themeMap as Record<ThemeName, TokenGroup> };
}

function cssBlock(selector: string, group: TokenGroup): string {
  const declarations = Object.entries(group).map(([name, value]) => `  ${CSS_PREFIX}${name}: ${value};`);
  return `${selector} {\n${declarations.join('\n')}\n}`;
}

export function toCss(source: TokenSource): string {
  const themeBlocks = THEME_NAMES.map((name) => cssBlock(THEME_SELECTORS[name], source.themes[name]));
  const blocks = [...themeBlocks, cssBlock(BASE_SELECTOR, source.base)];
  return `/* ${GENERATED_NOTICE} */\n\n${blocks.join('\n\n')}\n`;
}

function toCamelCase(name: string): string {
  return name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function rgbChannels(name: string, value: string): string[] {
  const channels = value.trim().split(/\s+/);
  const isValid = channels.length === RGB_CHANNEL_COUNT && channels.every((channel) => /^\d{1,3}$/.test(channel));
  if (!isValid) throw new Error(`Token "${name}" must be ${RGB_CHANNEL_COUNT} space-separated integers, got "${value}"`);
  return channels;
}

function toNativeEntry([name, value]: [string, string]): [string, string] {
  if (!name.endsWith(RGB_SUFFIX)) return [toCamelCase(name), value];
  const channels = rgbChannels(name, value).join(', ');
  return [toCamelCase(name.slice(0, -RGB_SUFFIX.length)), `rgb(${channels})`];
}

function toNativeGroup(group: TokenGroup): TokenGroup {
  return Object.fromEntries(Object.entries(group).map(toNativeEntry));
}

export function toTs(source: TokenSource): string {
  const themes = Object.fromEntries(THEME_NAMES.map((name) => [name, toNativeGroup(source.themes[name])]));
  const base = toNativeGroup(source.base);
  return [
    `// ${GENERATED_NOTICE}`,
    '',
    `export const base = ${JSON.stringify(base, null, 2)} as const;`,
    '',
    `export const themes = ${JSON.stringify(themes, null, 2)} as const;`,
    '',
  ].join('\n');
}
