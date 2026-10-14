import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";
import {
  centeredMarkSvg,
  ICON_SAFE_ZONE_SCALE,
  markSvg,
  monochromeMarkSvg,
  readThemeColors,
  renderPng as renderPngWithSharp,
  SPLASH_MASK_SCALE,
  wrapSvg,
} from "../../../packages/ui-tokens/src/brand-mark.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(SCRIPT_DIR, "..", "assets");
const TOKENS_PATH = join(SCRIPT_DIR, "..", "..", "..", "packages", "ui-tokens", "tokens.json");

const FAVICON_SIZE = 196;

function readTokens() {
  const raw = readFileSync(TOKENS_PATH, "utf-8");
  return JSON.parse(raw);
}

function renderPng(svg, outputPath, options) {
  return renderPngWithSharp(sharp, svg, outputPath, options);
}

export async function generateBrandAssets(outputDir = ASSETS_DIR) {
  const tokens = readTokens();
  const lightColors = readThemeColors(tokens.themes.light, "light");
  const darkColors = readThemeColors(tokens.themes.dark, "dark");

  // 1. Launcher / store icon ("A"): full-bleed mark on the light `bg`, per the owner's exact
  // reference geometry.
  const iconSvg = wrapSvg(markSvg(lightColors), { backgroundFill: lightColors.bg });
  await renderPng(iconSvg, join(outputDir, "icon.png"), { opaque: true, flattenColor: lightColors.bg });
  await renderPng(iconSvg, join(outputDir, "favicon.png"), {
    width: FAVICON_SIZE,
    height: FAVICON_SIZE,
    opaque: true,
    flattenColor: lightColors.bg,
  });

  // 2. Adaptive icon: foreground is the mark shrunk into Android's safe zone, background is
  // cream, monochrome is the same silhouette in one colour.
  const adaptiveForegroundSvg = wrapSvg(centeredMarkSvg(lightColors, ICON_SAFE_ZONE_SCALE));
  await renderPng(adaptiveForegroundSvg, join(outputDir, "android-icon-foreground.png"));

  const adaptiveBackgroundSvg = wrapSvg("", { backgroundFill: lightColors.bg });
  await renderPng(adaptiveBackgroundSvg, join(outputDir, "android-icon-background.png"), {
    opaque: true,
    flattenColor: lightColors.bg,
  });

  const adaptiveMonochromeSvg = wrapSvg(monochromeMarkSvg(ICON_SAFE_ZONE_SCALE, "#ffffff"));
  await renderPng(adaptiveMonochromeSvg, join(outputDir, "android-icon-monochrome.png"));

  // 3. Native splash: both the light and dark slots use the dark bg/tile per the owner's
  // decision 2026-10-09 (section A.2), so the window never flashes before the home screen's own
  // cross-fade. Two files are still produced to keep the expo-splash-screen schema symmetric.
  const splashSvg = wrapSvg(centeredMarkSvg(darkColors, SPLASH_MASK_SCALE));
  await renderPng(splashSvg, join(outputDir, "splash-icon.png"));
  await renderPng(splashSvg, join(outputDir, "splash-icon-dark.png"));

  process.stdout.write(
    `Generated brand assets using present=${lightColors.presentFill} correct=${lightColors.correctFill} ` +
      `lightBg=${lightColors.bg} darkBg=${darkColors.bg}\n`,
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await generateBrandAssets();
}
