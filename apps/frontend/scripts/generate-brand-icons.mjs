import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import {
  centeredMarkSvg,
  CANVAS_SIZE,
  hexFromRgbToken,
  ICON_SAFE_ZONE_SCALE,
  markSvg,
  monochromeMarkSvg,
  readColorToken,
  readThemeColors,
  renderPng as renderPngWithSharp,
  wrapSvg,
} from "../../../packages/ui-tokens/src/brand-mark.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(SCRIPT_DIR, "..", "public");
const TOKENS_PATH = path.resolve(SCRIPT_DIR, "..", "..", "..", "packages", "ui-tokens", "tokens.json");

const APPLE_TOUCH_ICON_SIZE = 180;
const MANIFEST_ICON_SIZE = 192;
const MANIFEST_ICON_SIZE_LARGE = 512;

// og:image is the standard Open Graph / Twitter card size.
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_MARK_BOX = 240;
const OG_MARK_TOP = 96;
const OG_WORDMARK_FONT_SIZE = 96;
const OG_WORDMARK_Y = 430;
const OG_SUBTITLE_FONT_SIZE = 32;
const OG_SUBTITLE_Y = 492;
const OG_WORDMARK = { brand: "harf", rest: "hane" };
const OG_SUBTITLE = "Her gün yeni bir kelime";

function readTokens() {
  return JSON.parse(readFileSync(TOKENS_PATH, "utf-8"));
}

function renderPng(svg, outputPath, options) {
  return renderPngWithSharp(sharp, svg, outputPath, options);
}

/** `centeredMarkSvg` is defined on the shared 1024x1024 canvas; embed it at an arbitrary size and
 * position by scaling and translating that canvas as one unit. */
function embeddedMarkSvg(colors, { x, y, boxSize }) {
  const embedScale = boxSize / CANVAS_SIZE;
  return `
    <g transform="translate(${x} ${y}) scale(${embedScale})">
      ${centeredMarkSvg(colors, 1)}
    </g>
  `;
}

/** og-image.png's wordmark and subtitle are drawn with SVG `<text>`, not baked vector outlines
 * like the app icon's "H" (see brand-mark.mjs): unlike the icon PNGs, og-image mixes multiple
 * words and a sentence, so baking every glyph by hand was not worth it for a marketing asset that
 * isn't pixel-diffed. The SVG rasterizer resolves "Baloo 2" through the system's font stack, so
 * the exact glyphs depend on fonts installed on the machine that runs this script (documented as
 * a known gap in the PR; the generator still fails loudly if sharp can't render at all).
 */
function ogImageSvg(colors) {
  const centerX = OG_WIDTH / 2;
  const mark = embeddedMarkSvg(colors, {
    x: centerX - OG_MARK_BOX / 2,
    y: OG_MARK_TOP,
    boxSize: OG_MARK_BOX,
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${colors.bg}" />
      ${mark}
      <text
        x="${centerX}"
        y="${OG_WORDMARK_Y}"
        text-anchor="middle"
        font-family="'Baloo 2', sans-serif"
        font-weight="800"
        font-size="${OG_WORDMARK_FONT_SIZE}"
      ><tspan fill="${colors.brand}">${OG_WORDMARK.brand}</tspan><tspan fill="${colors.text}">${OG_WORDMARK.rest}</tspan></text>
      <text
        x="${centerX}"
        y="${OG_SUBTITLE_Y}"
        text-anchor="middle"
        font-family="'Nunito', sans-serif"
        font-weight="600"
        font-size="${OG_SUBTITLE_FONT_SIZE}"
        fill="${colors.textMuted}"
      >${OG_SUBTITLE}</text>
    </svg>
  `;
}

export async function generateBrandIcons(outputDir = PUBLIC_DIR) {
  const tokens = readTokens();
  const light = tokens.themes.light;
  const lightColors = readThemeColors(light, "light");

  // 1. Favicon: the two-tile mark, full-bleed on the light `bg`, as a scalable SVG (preferred by
  // browsers that support `type="image/svg+xml"`) plus PNG fallbacks for the rest.
  const iconSvg = wrapSvg(markSvg(lightColors), { backgroundFill: lightColors.bg });
  writeFileSync(path.join(outputDir, "harfhane-icon.svg"), `${iconSvg.trim()}\n`);

  await renderPng(iconSvg, path.join(outputDir, "harfhane-icon-192.png"), {
    width: MANIFEST_ICON_SIZE,
    height: MANIFEST_ICON_SIZE,
    opaque: true,
    flattenColor: lightColors.bg,
  });
  await renderPng(iconSvg, path.join(outputDir, "harfhane-icon-512.png"), {
    width: MANIFEST_ICON_SIZE_LARGE,
    height: MANIFEST_ICON_SIZE_LARGE,
    opaque: true,
    flattenColor: lightColors.bg,
  });
  await renderPng(iconSvg, path.join(outputDir, "apple-touch-icon.png"), {
    width: APPLE_TOUCH_ICON_SIZE,
    height: APPLE_TOUCH_ICON_SIZE,
    opaque: true,
    flattenColor: lightColors.bg,
  });

  // 2. Maskable icon: the mark shrunk into a safe zone so Android/Chrome can crop it to any mask
  // shape without clipping a tile or the "H". Reuses the same scale as the mobile app's adaptive
  // icon (see brand-mark.mjs ICON_SAFE_ZONE_SCALE), which is tighter than the W3C maskable safe
  // zone and so clears it too.
  const maskableSvg = wrapSvg(centeredMarkSvg(lightColors, ICON_SAFE_ZONE_SCALE), { backgroundFill: lightColors.bg });
  await renderPng(maskableSvg, path.join(outputDir, "harfhane-icon-512-maskable.png"), {
    width: MANIFEST_ICON_SIZE_LARGE,
    height: MANIFEST_ICON_SIZE_LARGE,
    opaque: true,
    flattenColor: lightColors.bg,
  });

  // 3. Safari pinned-tab / mask-icon: a single-colour silhouette, the browser applies its own
  // tint via the `<link rel="mask-icon" color="...">` attribute.
  const maskIconSvg = wrapSvg(monochromeMarkSvg(1, "#000000"));
  writeFileSync(path.join(outputDir, "harfhane-mask-icon.svg"), `${maskIconSvg.trim()}\n`);

  // 4. og:image / Twitter card: the mark plus the "harfhane" wordmark ("harf" in the brand
  // colour, "hane" in the text colour) and the tagline, on the light `bg`.
  const ogColors = {
    ...lightColors,
    brand: `rgb(${readColorToken(light, "brand-rgb", "light")})`,
    text: readColorToken(light, "text", "light"),
    textMuted: readColorToken(light, "text-muted", "light"),
  };
  await renderPng(ogImageSvg(ogColors), path.join(outputDir, "og-image.png"), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
  });

  process.stdout.write(
    `Generated web brand icons using present=${lightColors.presentFill} correct=${lightColors.correctFill} ` +
      `bg=${lightColors.bg}\n`,
  );
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  await generateBrandIcons();
}
