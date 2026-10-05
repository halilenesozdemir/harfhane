import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const TOKENS_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'packages', 'ui-tokens', 'tokens.json');

const CANVAS_SIZE = 1024;
const FULL_BLEED_GLYPH_BOX = 640;
const MASKABLE_SAFE_ZONE_GLYPH_BOX = 480;
const GLYPH_STROKE_RATIO = 0.22;
const GLYPH_CORNER_RATIO = 0.18;
const APPLE_TOUCH_ICON_SIZE = 180;
const MANIFEST_ICON_SIZE = 192;
const MANIFEST_ICON_SIZE_LARGE = 512;

function readColorToken(theme, key, themeName) {
  const value = theme[key];
  if (!value) {
    throw new Error(`packages/ui-tokens/tokens.json is missing themes.${themeName}.${key}`);
  }
  return value;
}

function readTokens() {
  return JSON.parse(readFileSync(TOKENS_PATH, 'utf-8'));
}

function hGlyphPath(boxSize) {
  const center = CANVAS_SIZE / 2;
  const half = boxSize / 2;
  const strokeWidth = boxSize * GLYPH_STROKE_RATIO;
  const cornerRadius = strokeWidth * GLYPH_CORNER_RATIO;
  const left = center - half;
  const right = center + half;
  const top = center - half;
  const crossbarTop = center - strokeWidth / 2;

  return `
    <rect x="${left}" y="${top}" width="${strokeWidth}" height="${boxSize}" rx="${cornerRadius}" />
    <rect x="${right - strokeWidth}" y="${top}" width="${strokeWidth}" height="${boxSize}" rx="${cornerRadius}" />
    <rect x="${left}" y="${crossbarTop}" width="${boxSize}" height="${strokeWidth}" rx="${cornerRadius}" />
  `;
}

function buildSvg({ backgroundFill, glyphFill, glyphBox }) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
      <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${backgroundFill}" />
      <g fill="${glyphFill}">${hGlyphPath(glyphBox)}</g>
    </svg>
  `;
}

async function renderPng(svg, outputPath, { width = CANVAS_SIZE, height = CANVAS_SIZE } = {}) {
  await sharp(Buffer.from(svg))
    .resize(width, height)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .png()
    .toFile(outputPath);
}

async function main() {
  const tokens = readTokens();
  const light = tokens.themes.light;

  const brandColor = `rgb(${readColorToken(light, 'brand-rgb', 'light')})`;
  const lightBg = readColorToken(light, 'bg', 'light');

  const faviconSvg = buildSvg({ backgroundFill: brandColor, glyphFill: lightBg, glyphBox: FULL_BLEED_GLYPH_BOX });
  writeFileSync(path.join(PUBLIC_DIR, 'harfhane-icon.svg'), `${faviconSvg.trim()}\n`);

  await renderPng(faviconSvg, path.join(PUBLIC_DIR, 'harfhane-icon-192.png'), {
    width: MANIFEST_ICON_SIZE,
    height: MANIFEST_ICON_SIZE,
  });
  await renderPng(faviconSvg, path.join(PUBLIC_DIR, 'harfhane-icon-512.png'), {
    width: MANIFEST_ICON_SIZE_LARGE,
    height: MANIFEST_ICON_SIZE_LARGE,
  });
  await renderPng(faviconSvg, path.join(PUBLIC_DIR, 'apple-touch-icon.png'), {
    width: APPLE_TOUCH_ICON_SIZE,
    height: APPLE_TOUCH_ICON_SIZE,
  });

  const maskableSvg = buildSvg({ backgroundFill: brandColor, glyphFill: lightBg, glyphBox: MASKABLE_SAFE_ZONE_GLYPH_BOX });
  await renderPng(maskableSvg, path.join(PUBLIC_DIR, 'harfhane-icon-512-maskable.png'), {
    width: MANIFEST_ICON_SIZE_LARGE,
    height: MANIFEST_ICON_SIZE_LARGE,
  });

  process.stdout.write(`Generated web brand icons using brand=${brandColor} bg=${lightBg}\n`);
}

main();
