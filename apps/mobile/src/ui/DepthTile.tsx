import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, LINE_HEIGHT, RADIUS, TILE_LETTER_MAX_FONT_SCALE } from './layout';

const LINE_HEIGHT_BY_FONT_SIZE: ReadonlyMap<number, number> = new Map(
  (Object.keys(FONT_SIZE) as (keyof typeof FONT_SIZE)[]).map((role) => [FONT_SIZE[role], LINE_HEIGHT[role]]),
);

/** T5: look up the table's lineHeight for the size instead of a 1:1 ratio, which clips "İ"/"Ş"/"Ğ". */
function lineHeightForFontSize(fontSize: number): number {
  return LINE_HEIGHT_BY_FONT_SIZE.get(fontSize) ?? fontSize;
}

export interface DepthTileProps {
  /** A single letter, drawn in `foreground` (C1: each letter carries its own fill's `*Fg`). */
  readonly letter?: string;
  /** A sized, coloured Lucide icon element, for a non-letter tile. */
  readonly icon?: ReactNode;
  readonly fill: string;
  /** Must be the `*Fg`/`*Depth` that match `fill` (C1); never a fixed colour across fills. */
  readonly foreground: string;
  readonly depthColor: string;
  /** Tile face width/height in dp. */
  readonly size: number;
  /** Bottom depth-edge height in dp. */
  readonly depth: number;
  readonly radius?: number;
  readonly letterFontSize?: number;
  readonly testID?: string;
}

/**
 * The playful 3D tile (section 5): a static back layer in `depthColor` sits
 * behind a face in `fill`. Decorative — hidden from accessibility, since
 * every usage already has its own accessibility label elsewhere (AX4, CA3).
 */
export function DepthTile({ letter, icon, fill, foreground, depthColor, size, depth, radius = RADIUS.md, letterFontSize = FONT_SIZE.title, testID }: DepthTileProps) {
  return (
    <View testID={testID} style={{ width: size, height: size + depth }} importantForAccessibility="no-hide-descendants">
      <View style={[styles.back, { backgroundColor: depthColor, borderRadius: radius }]} />
      <View style={[styles.face, { width: size, height: size, backgroundColor: fill, borderRadius: radius }]}>
        {icon}
        {letter ? (
          <Text
            style={[styles.letter, { color: foreground, fontSize: letterFontSize, lineHeight: lineHeightForFontSize(letterFontSize) }]}
            maxFontSizeMultiplier={TILE_LETTER_MAX_FONT_SCALE}
          >
            {letter}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  face: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: FONT_FAMILY_DISPLAY },
});
