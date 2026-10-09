import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(SCRIPT_DIR, "..", "assets");
const TOKENS_PATH = join(SCRIPT_DIR, "..", "..", "..", "packages", "ui-tokens", "tokens.json");

const CANVAS_SIZE = 1024;
const FAVICON_SIZE = 196;

// Reference geometry from the owner's 2026-10-09 "Konsept D" decision, specified on a 240 px
// icon (docs/design/mobile-redesign-spec.md section A). REFERENCE_SIZE lets the constants below
// read exactly like that decision; CANVAS_SCALE maps them onto the working 1024 px canvas.
const REFERENCE_SIZE = 240;
const CANVAS_SCALE = CANVAS_SIZE / REFERENCE_SIZE;

const PRESENT_TILE = { left: 96, top: 44, size: 110, radius: 24, depth: 12, rotationDeg: 12 };
const CORRECT_TILE = { left: 40, top: 70, size: 128, radius: 28, depth: 14, rotationDeg: -6 };
const GLYPH_HEIGHT = 92;

// Shrink factors applied around the canvas centre so the same mark also fits an adaptive icon's
// safe zone and the splash's circular mask, which the owner's reference geometry (sized for the
// full-bleed launcher icon) does not by itself. Not specified by the owner; a generator-level
// design choice, documented here and in the PR.
//
// Android's adaptive-icon safe zone keeps every opaque pixel within a 66 dp radius of a 108 dp
// icon, i.e. 1024 / 108 * 33 ≈ 312.9 px on this canvas. The mark's farthest opaque pixel from
// its own bounding-box centre is ≈511 px before any shrink (see the geometry test in
// generate-brand-assets.test.mjs), so 0.58 keeps it at ≈297 px — inside the safe radius with
// margin, not just under it.
const ADAPTIVE_SAFE_ZONE_SCALE = 0.58;
const SPLASH_MASK_SCALE = 0.55;

// "H" glyph outline extracted once from Baloo2_800ExtraBold.ttf
// (@expo-google-fonts/baloo-2@0.4.2, node_modules/.pnpm/@expo-google-fonts+baloo-2@0.4.2/
// node_modules/@expo-google-fonts/baloo-2/800ExtraBold/Baloo2_800ExtraBold.ttf) with opentype.js,
// via `path.toPathData()` at fontSize = unitsPerEm (1000) so coordinates are in font units with
// y already flipped to SVG's downward convention. Baked in here because the generator only draws
// with sharp/SVG and has no font-rendering dependency; this keeps the real glyph outlines without
// adding one. Re-extract by loading the same .ttf with opentype.js and re-running `path.toPathData()`
// on `font.charToGlyph('H').getPath(0, 0, font.unitsPerEm)` if this ever needs to change.
const H_GLYPH_PATH =
  "M65-75L65-442L240-442L240-1Q229 2 206 5Q183 8 159 8Q107 8 86-10.500Q65-29 65-75" +
  "M240-534L240-211L65-211L65-608Q77-610 100.500-613.500Q124-617 146-617Q196-617 218-600Q240-583 240-534" +
  "M432-75L432-442L607-442L607-1Q596 2 573 5Q550 8 526 8Q474 8 453-10.500Q432-29 432-75" +
  "M607-532L607-211L432-211L432-608Q444-610 467.500-613.500Q491-617 513-617Q563-617 585-599Q607-581 607-532" +
  "M533-372L533-234L140-234L140-372";
const H_GLYPH_BBOX = { x1: 65, y1: -617, x2: 607, y2: 8 };
const H_GLYPH_CENTER_X = (H_GLYPH_BBOX.x1 + H_GLYPH_BBOX.x2) / 2;
const H_GLYPH_CENTER_Y = (H_GLYPH_BBOX.y1 + H_GLYPH_BBOX.y2) / 2;
const H_GLYPH_UNIT_HEIGHT = H_GLYPH_BBOX.y2 - H_GLYPH_BBOX.y1;

/** The 4 corners of a `tileSvg` rect (face + depth edge), rotated the same way it is drawn. */
function rotatedTileCorners({ left, top, size, depth, rotationDeg }, scale) {
  const x = left * scale;
  const y = top * scale;
  const w = size * scale;
  const d = depth * scale;
  const centerX = x + w / 2;
  const centerY = y + w / 2;
  const rad = (rotationDeg * Math.PI) / 180;
  const corners = [
    [x, y],
    [x + w, y],
    [x + w, y + w + d],
    [x, y + w + d],
  ];
  return corners.map(([px, py]) => {
    const dx = px - centerX;
    const dy = py - centerY;
    return [centerX + dx * Math.cos(rad) - dy * Math.sin(rad), centerY + dx * Math.sin(rad) + dy * Math.cos(rad)];
  });
}

/** The 4 corners of the "H" glyph's bounding box, transformed the same way `hGlyphSvg` draws it. */
function rotatedGlyphCorners(tile, glyphHeight, scale) {
  const centerX = (tile.left + tile.size / 2) * scale;
  const centerY = (tile.top + tile.size / 2) * scale;
  const rad = (tile.rotationDeg * Math.PI) / 180;
  const glyphScale = (glyphHeight * scale) / H_GLYPH_UNIT_HEIGHT;
  const corners = [
    [H_GLYPH_BBOX.x1, H_GLYPH_BBOX.y1],
    [H_GLYPH_BBOX.x2, H_GLYPH_BBOX.y1],
    [H_GLYPH_BBOX.x2, H_GLYPH_BBOX.y2],
    [H_GLYPH_BBOX.x1, H_GLYPH_BBOX.y2],
  ];
  return corners.map(([gx, gy]) => {
    const lx = (gx - H_GLYPH_CENTER_X) * glyphScale;
    const ly = (gy - H_GLYPH_CENTER_Y) * glyphScale;
    return [centerX + lx * Math.cos(rad) - ly * Math.sin(rad), centerY + lx * Math.sin(rad) + ly * Math.cos(rad)];
  });
}

/** The mark's own bounding-box centre at `CANVAS_SCALE` (both tiles plus the "H" glyph), used to
 * re-centre it on the canvas before `centeredMarkSvg`/`monochromeMarkSvg` scale it down â€” the
 * reference geometry's bbox centre is not the canvas centre, so scaling about the canvas centre
 * alone does not centre the shrunk mark. */
function markBboxCenter() {
  const points = [
    ...rotatedTileCorners(PRESENT_TILE, CANVAS_SCALE),
    ...rotatedTileCorners(CORRECT_TILE, CANVAS_SCALE),
    ...rotatedGlyphCorners(CORRECT_TILE, GLYPH_HEIGHT, CANVAS_SCALE),
  ];
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

const MARK_CENTER = markBboxCenter();
const MARK_OFFSET_X = CANVAS_SIZE / 2 - MARK_CENTER.x;
const MARK_OFFSET_Y = CANVAS_SIZE / 2 - MARK_CENTER.y;

function readColorToken(theme, key, themeName) {
  const value = theme[key];
  if (!value) {
    throw new Error(`packages/ui-tokens/tokens.json is missing themes.${themeName}.${key}`);
  }
  return value;
}

function readTokens() {
  const raw = readFileSync(TOKENS_PATH, "utf-8");
  return JSON.parse(raw);
}

function hexFromRgbToken(rgbToken) {
  const [r, g, b] = rgbToken.split(" ").map(Number);
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** A single 3D tile: a depth-edge rect peeking out below a rounded face rect, rotated as one unit. */
function tileSvg({ left, top, size, radius, depth, rotationDeg, fill, depthFill }, scale) {
  const x = left * scale;
  const y = top * scale;
  const w = size * scale;
  const r = radius * scale;
  const d = depth * scale;
  const centerX = x + w / 2;
  const centerY = y + w / 2;

  return `
    <g transform="rotate(${rotationDeg} ${centerX} ${centerY})">
      <rect x="${x}" y="${y}" width="${w}" height="${w + d}" rx="${r}" fill="${depthFill}" />
      <rect x="${x}" y="${y}" width="${w}" height="${w}" rx="${r}" fill="${fill}" />
    </g>
  `;
}

/** The "H" glyph centred on a tile, scaled to `glyphHeight`, honouring that tile's own rotation. */
function hGlyphSvg({ left, top, size, rotationDeg }, glyphHeight, scale, fill) {
  const centerX = (left + size / 2) * scale;
  const centerY = (top + size / 2) * scale;
  const glyphScale = (glyphHeight * scale) / H_GLYPH_UNIT_HEIGHT;

  return `
    <g fill="${fill}" transform="
      translate(${centerX} ${centerY})
      rotate(${rotationDeg})
      scale(${glyphScale})
      translate(${-H_GLYPH_CENTER_X} ${-H_GLYPH_CENTER_Y})
    ">
      <path d="${H_GLYPH_PATH}" />
    </g>
  `;
}

/** The two-tile launcher/splash mark: a present tile behind a larger correct tile with the "H". */
function markSvg({ presentFill, presentDepth, correctFill, correctDepth, correctFg }, scale = 1) {
  const canvasScale = CANVAS_SCALE * scale;
  return `
    ${tileSvg({ ...PRESENT_TILE, fill: presentFill, depthFill: presentDepth }, canvasScale)}
    ${tileSvg({ ...CORRECT_TILE, fill: correctFill, depthFill: correctDepth }, canvasScale)}
    ${hGlyphSvg(CORRECT_TILE, GLYPH_HEIGHT, canvasScale, correctFg)}
  `;
}

function wrapSvg(content, { backgroundFill } = {}) {
  const background = backgroundFill
    ? `<rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${backgroundFill}" />`
    : "";
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
      ${background}
      ${content}
    </svg>
  `;
}

/** `markSvg` draws the mark around its own canvas-relative position, whose bounding box is not
 * centred on the canvas; re-centre it (via `MARK_OFFSET_X`/`MARK_OFFSET_Y`) and then scale it
 * about the canvas centre, so a shrunk mark (adaptive safe zone, splash mask) stays centred
 * instead of drifting with its own off-centre reference geometry. */
function centeredMarkSvg(theme, scale) {
  const center = CANVAS_SIZE / 2;
  return `
    <g transform="translate(${center} ${center}) scale(${scale}) translate(${-center} ${-center})">
      <g transform="translate(${MARK_OFFSET_X} ${MARK_OFFSET_Y})">
        ${markSvg(theme, 1)}
      </g>
    </g>
  `;
}

/** A single-colour silhouette for the Android monochrome icon: the "H" is cut out of the tiles
 * (even-odd fill) so it stays visible once the system applies its own tint. Uses the same
 * single-scale, re-centred transform as `centeredMarkSvg` (the earlier version applied the
 * safe-zone scale twice and left the mark off-centre). */
function monochromeMarkSvg(scale, fill) {
  const center = CANVAS_SIZE / 2;
  const glyph = hGlyphSvg(CORRECT_TILE, GLYPH_HEIGHT, CANVAS_SCALE, "black");
  return `
    <g transform="translate(${center} ${center}) scale(${scale}) translate(${-center} ${-center})">
      <g transform="translate(${MARK_OFFSET_X} ${MARK_OFFSET_Y})">
        <mask id="h-cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
          <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="white" />
          ${glyph}
        </mask>
        <g mask="url(#h-cutout)">
          ${tileSvg({ ...PRESENT_TILE, fill, depthFill: fill }, CANVAS_SCALE)}
          ${tileSvg({ ...CORRECT_TILE, fill, depthFill: fill }, CANVAS_SCALE)}
        </g>
      </g>
    </g>
  `;
}

async function renderPng(svg, outputPath, { width = CANVAS_SIZE, height = CANVAS_SIZE, opaque, flattenColor } = {}) {
  let pipeline = sharp(Buffer.from(svg)).resize(width, height);
  if (opaque) {
    pipeline = pipeline.flatten({ background: flattenColor }).removeAlpha();
  }
  await pipeline.png().toFile(outputPath);
}

function readThemeColors(theme, themeName) {
  return {
    bg: readColorToken(theme, "bg", themeName),
    presentFill: hexFromRgbToken(readColorToken(theme, "present-rgb", themeName)),
    presentDepth: readColorToken(theme, "present-depth", themeName),
    correctFill: hexFromRgbToken(readColorToken(theme, "correct-rgb", themeName)),
    correctDepth: readColorToken(theme, "correct-depth", themeName),
    correctFg: readColorToken(theme, "correct-fg", themeName),
  };
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
  const adaptiveForegroundSvg = wrapSvg(centeredMarkSvg(lightColors, ADAPTIVE_SAFE_ZONE_SCALE));
  await renderPng(adaptiveForegroundSvg, join(outputDir, "android-icon-foreground.png"));

  const adaptiveBackgroundSvg = wrapSvg("", { backgroundFill: lightColors.bg });
  await renderPng(adaptiveBackgroundSvg, join(outputDir, "android-icon-background.png"), {
    opaque: true,
    flattenColor: lightColors.bg,
  });

  const adaptiveMonochromeSvg = wrapSvg(monochromeMarkSvg(ADAPTIVE_SAFE_ZONE_SCALE, "#ffffff"));
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
