import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT_FAMILY_DISPLAY, FONT_SIZE, RADIUS } from './layout';

export interface DepthTileProps {
  /** A single letter, drawn in `foreground` (C1: each letter carries its own fill's `*Fg`). */
  readonly letter?: string;
  /** A sized, coloured Lucide icon element, for a non-letter tile (e.g. a mode card's icon tile). */
  readonly icon?: ReactNode;
  readonly fill: string;
  /** Must be the `*Fg` that matches `fill` (C1); never a fixed colour across fills. */
  readonly foreground: string;
  /** Must be the `*Depth` that matches `fill`. */
  readonly depthColor: string;
  /** Tile face width/height in dp. */
  readonly size: number;
  /** Bottom depth-edge height in dp (e.g. `DEPTH.lg` for the hero, `DEPTH.sm` for a card icon tile). */
  readonly depth: number;
  readonly radius?: number;
  readonly letterFontSize?: number;
  readonly testID?: string;
}

/**
 * The playful 3D tile (mobile-ui-standard.md section 5): a static back layer
 * in `depthColor` sits behind a face in `fill`, offset so the depth shows as
 * a fixed bottom strip. Purely decorative — hidden from accessibility, since
 * every usage (hero letters, a mode card's icon tile) already has its own
 * accessibility label on a surrounding element (AX4, CA3).
 */
export function DepthTile({ letter, icon, fill, foreground, depthColor, size, depth, radius = RADIUS.md, letterFontSize = FONT_SIZE.title, testID }: DepthTileProps) {
  return (
    <View testID={testID} style={{ width: size, height: size + depth }} importantForAccessibility="no-hide-descendants">
      <View style={[styles.back, { backgroundColor: depthColor, borderRadius: radius }]} />
      <View style={[styles.face, { width: size, height: size, backgroundColor: fill, borderRadius: radius }]}>
        {icon}
        {letter ? <Text style={[styles.letter, { color: foreground, fontSize: letterFontSize }]}>{letter}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  face: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontFamily: FONT_FAMILY_DISPLAY },
});
