import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(SCRIPT_DIR, "..", "assets");
const TOKENS_PATH = join(SCRIPT_DIR, "..", "..", "..", "packages", "ui-tokens", "tokens.json");

const CANVAS_SIZE = 1024;
const FAVICON_SIZE = 196;
const FULL_BLEED_GLYPH_BOX = 640;
const ADAPTIVE_SAFE_ZONE_GLYPH_BOX = 640;
const SPLASH_GLYPH_BOX = 480;

function readTokens() {
  const raw = readFileSync(TOKENS_PATH, "utf-8");
  return JSON.parse(raw);
}

function hGlyphPath(boxSize) {
  const center = CANVAS_SIZE / 2;
  const half = boxSize / 2;
  const strokeWidth = boxSize * 0.22;
  const cornerRadius = strokeWidth * 0.18;
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

function buildSvg({ backgroundFill, glyphFill, glyphBox, transparentBackground, includeGlyph = true }) {
  const background = transparentBackground
    ? ""
    : `<rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${backgroundFill}" />`;
  const glyph = includeGlyph ? `<g fill="${glyphFill}">${hGlyphPath(glyphBox)}</g>` : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
      ${background}
      ${glyph}
    </svg>
  `;
}

async function renderPng(svg, outputPath, { width = CANVAS_SIZE, height = CANVAS_SIZE, opaque = false } = {}) {
  let pipeline = sharp(Buffer.from(svg)).resize(width, height);
  if (opaque) {
    pipeline = pipeline.flatten({ background: "#ffffff" }).removeAlpha();
  }
  await pipeline.png().toFile(outputPath);
}

async function main() {
  const tokens = readTokens();
  const light = tokens.themes.light;
  const dark = tokens.themes.dark;

  const brandColor = `rgb(${light["brand-rgb"]})`;
  const brandColorDark = `rgb(${dark["brand-rgb"]})`;
  const lightBg = light.bg;
  const darkBg = dark.bg;
  const cream = light.bg;

  const iconSvg = buildSvg({
    backgroundFill: brandColor,
    glyphFill: lightBg,
    glyphBox: FULL_BLEED_GLYPH_BOX,
    transparentBackground: false,
  });
  await renderPng(iconSvg, join(ASSETS_DIR, "icon.png"), { opaque: true });
  await renderPng(iconSvg, join(ASSETS_DIR, "favicon.png"), {
    width: FAVICON_SIZE,
    height: FAVICON_SIZE,
    opaque: true,
  });

  const adaptiveForegroundSvg = buildSvg({
    glyphFill: brandColor,
    glyphBox: ADAPTIVE_SAFE_ZONE_GLYPH_BOX,
    transparentBackground: true,
  });
  await renderPng(adaptiveForegroundSvg, join(ASSETS_DIR, "android-icon-foreground.png"));

  const adaptiveBackgroundSvg = buildSvg({
    backgroundFill: lightBg,
    transparentBackground: false,
    includeGlyph: false,
  });
  await renderPng(adaptiveBackgroundSvg, join(ASSETS_DIR, "android-icon-background.png"), {
    opaque: true,
  });

  const adaptiveMonochromeSvg = buildSvg({
    glyphFill: "#ffffff",
    glyphBox: ADAPTIVE_SAFE_ZONE_GLYPH_BOX,
    transparentBackground: true,
  });
  await renderPng(adaptiveMonochromeSvg, join(ASSETS_DIR, "android-icon-monochrome.png"));

  const splashLightSvg = buildSvg({
    glyphFill: brandColor,
    glyphBox: SPLASH_GLYPH_BOX,
    transparentBackground: true,
  });
  await renderPng(splashLightSvg, join(ASSETS_DIR, "splash-icon.png"));

  const splashDarkSvg = buildSvg({
    glyphFill: brandColorDark,
    glyphBox: SPLASH_GLYPH_BOX,
    transparentBackground: true,
  });
  await renderPng(splashDarkSvg, join(ASSETS_DIR, "splash-icon-dark.png"));

  process.stdout.write(
    `Generated brand assets using brand=${brandColor} lightBg=${lightBg} darkBg=${darkBg} cream=${cream}\n`,
  );
}

main();
