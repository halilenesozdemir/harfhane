import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { generateBrandAssets } from "./generate-brand-assets.mjs";

const ASSETS_DIR = new URL("../assets", import.meta.url).pathname;
const ASSET_FILES = [
  "icon.png",
  "favicon.png",
  "android-icon-foreground.png",
  "android-icon-background.png",
  "android-icon-monochrome.png",
  "splash-icon.png",
  "splash-icon-dark.png",
];

let tmpDir;

afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

describe("generateBrandAssets", () => {
  it("should match the committed PNGs byte for byte when regenerated from tokens.json", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "brand-assets-"));
    await generateBrandAssets(tmpDir);

    for (const file of ASSET_FILES) {
      const committed = await readFile(join(ASSETS_DIR, file));
      const regenerated = await readFile(join(tmpDir, file));
      expect(regenerated.equals(committed), `${file} is out of date; run the generator and commit it`).toBe(true);
    }
  });

  it("should draw the correct tile in the correct-rgb token colour, not a hand-picked hex", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "brand-assets-"));
    await generateBrandAssets(tmpDir);

    const { data, info } = await sharp(join(tmpDir, "icon.png"))
      .raw()
      .toBuffer({ resolveWithObject: true });
    // A corner of the correct tile's face, away from the "H" glyph and the rotated edges:
    // reference coords (40+20, 70+100) scaled onto the 1024 px canvas.
    const x = Math.round((40 + 20) * (1024 / 240));
    const y = Math.round((70 + 100) * (1024 / 240));
    const idx = (y * info.width + x) * info.channels;
    const pixel = Array.from(data.slice(idx, idx + 3));

    expect(pixel).toEqual([31, 138, 91]); // light theme correct-rgb
  });

  // Android's adaptive-icon safe zone keeps every opaque pixel within a 66 dp radius of a
  // 108 dp icon: 1024 / 108 * 33 ≈ 312.9 px on this 1024 px canvas.
  const ADAPTIVE_SAFE_RADIUS_PX = (1024 / 108) * 33;
  const MAX_CENTER_OFFSET_PX = 6;

  async function opaquePixelGeometry(path) {
    const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height, channels } = info;
    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * channels + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const bboxCenterX = (minX + maxX) / 2;
    const bboxCenterY = (minY + maxY) / 2;
    const canvasCenterX = width / 2;
    const canvasCenterY = height / 2;

    let farthestFromCenter = 0;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (data[(y * width + x) * channels + 3] > 10) {
          const distance = Math.hypot(x - canvasCenterX, y - canvasCenterY);
          if (distance > farthestFromCenter) farthestFromCenter = distance;
        }
      }
    }

    return {
      farthestFromCenter,
      centerOffset: Math.hypot(bboxCenterX - canvasCenterX, bboxCenterY - canvasCenterY),
    };
  }

  it.each(["android-icon-foreground.png", "android-icon-monochrome.png"])(
    "should keep every opaque pixel of %s inside the adaptive icon's safe zone and centred",
    async (file) => {
      tmpDir = await mkdtemp(join(tmpdir(), "brand-assets-"));
      await generateBrandAssets(tmpDir);

      const { farthestFromCenter, centerOffset } = await opaquePixelGeometry(join(tmpDir, file));

      expect(farthestFromCenter).toBeLessThanOrEqual(ADAPTIVE_SAFE_RADIUS_PX);
      expect(centerOffset).toBeLessThanOrEqual(MAX_CENTER_OFFSET_PX);
    },
  );

  it("should use the dark bg token for both splash backgroundColor slots in app.json", async () => {
    const appJson = JSON.parse(
      await readFile(new URL("../app.json", import.meta.url).pathname, "utf-8"),
    );
    const splashPlugin = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
    );

    expect(splashPlugin[1].backgroundColor).toBe("#1c1611");
    expect(splashPlugin[1].dark.backgroundColor).toBe("#1c1611");
  });
});
