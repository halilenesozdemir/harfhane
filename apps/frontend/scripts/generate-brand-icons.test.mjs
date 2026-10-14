import { describe, it, expect, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { generateBrandIcons } from "./generate-brand-icons.mjs";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// og-image.png renders text through the SVG rasterizer's font stack (see
// generate-brand-icons.mjs's ogImageSvg comment), so it is not byte-reproducible across
// machines with different fonts installed; it gets its own, font-independent assertions below.
const DETERMINISTIC_ASSET_FILES = [
  "harfhane-icon.svg",
  "harfhane-icon-192.png",
  "harfhane-icon-512.png",
  "harfhane-icon-512-maskable.png",
  "apple-touch-icon.png",
  "harfhane-mask-icon.svg",
];

let tmpDir;

afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

describe("generateBrandIcons", () => {
  it("should match the committed icons byte for byte when regenerated from tokens.json", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "web-brand-icons-"));
    await generateBrandIcons(tmpDir);

    for (const file of DETERMINISTIC_ASSET_FILES) {
      const committed = await readFile(join(PUBLIC_DIR, file));
      const regenerated = await readFile(join(tmpDir, file));
      expect(regenerated.equals(committed), `${file} is out of date; run the generator and commit it`).toBe(true);
    }
  });

  it("should draw the correct tile in the correct-rgb token colour, not a hand-picked hex", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "web-brand-icons-"));
    await generateBrandIcons(tmpDir);

    const { data, info } = await sharp(join(tmpDir, "harfhane-icon-512.png"))
      .raw()
      .toBuffer({ resolveWithObject: true });
    // A corner of the correct tile's face, away from the "H" glyph and the rotated edges:
    // reference coords (40+20, 70+100) scaled onto the 512 px canvas (reference size 240).
    const x = Math.round((40 + 20) * (512 / 240));
    const y = Math.round((70 + 100) * (512 / 240));
    const idx = (y * info.width + x) * info.channels;
    const pixel = Array.from(data.slice(idx, idx + 3));

    expect(pixel).toEqual([31, 138, 91]); // light theme correct-rgb
  });

  it("should render og-image.png at the standard Open Graph / Twitter card size", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "web-brand-icons-"));
    await generateBrandIcons(tmpDir);

    const { info } = await sharp(join(tmpDir, "og-image.png")).raw().toBuffer({ resolveWithObject: true });

    expect(info.width).toBe(1200);
    expect(info.height).toBe(630);
  });

  it("should draw og-image.png on the light bg token, not a hand-picked colour", async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "web-brand-icons-"));
    await generateBrandIcons(tmpDir);

    const { data, info } = await sharp(join(tmpDir, "og-image.png"))
      .raw()
      .toBuffer({ resolveWithObject: true });
    // A corner far from the mark and the text, where only the background shows.
    const x = 20;
    const y = 20;
    const idx = (y * info.width + x) * info.channels;
    const pixel = Array.from(data.slice(idx, idx + 3));

    expect(pixel).toEqual([255, 244, 220]); // light theme bg (#fff4dc)
  });
});
