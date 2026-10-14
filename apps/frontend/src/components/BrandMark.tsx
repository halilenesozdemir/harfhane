import { CORRECT_TILE, GLYPH_HEIGHT, PRESENT_TILE, REFERENCE_SIZE } from '@harfhane/ui-tokens/brand-mark';

interface BrandMarkProps {
  className?: string;
  /** True when a labelled ancestor (e.g. a button with aria-label) or a visible adjacent
   * heading already names "Harfhane", so this mark would otherwise be announced twice. */
  decorative?: boolean;
}

// Geometry comes from packages/ui-tokens/src/brand-mark.mjs — the same reference geometry
// (docs/design/mobile-redesign-spec.md section A, the owner's 2026-10-09 "Konsept D" decision)
// apps/mobile/scripts/generate-brand-assets.mjs and apps/frontend/scripts/generate-brand-icons.mjs
// draw the launcher/favicon mark from, so this live component can't drift from the generated
// icons. Unlike those build-time generators, this component draws live so its colours track the
// active theme instantly; it uses the Tailwind tokens those colours are exposed as (fill-present,
// fill-correct, ...), never a hex literal.
function BrandMark({ className, decorative = false }: BrandMarkProps): React.JSX.Element {
  const presentCenterX = PRESENT_TILE.left + PRESENT_TILE.size / 2;
  const presentCenterY = PRESENT_TILE.top + PRESENT_TILE.size / 2;
  const correctCenterX = CORRECT_TILE.left + CORRECT_TILE.size / 2;
  const correctCenterY = CORRECT_TILE.top + CORRECT_TILE.size / 2;
  const labelProps = decorative
    ? { 'aria-hidden': true as const }
    : { role: 'img' as const, 'aria-label': 'Harfhane' };

  return (
    <svg viewBox={`0 0 ${REFERENCE_SIZE} ${REFERENCE_SIZE}`} className={className} {...labelProps}>
      <g transform={`rotate(${PRESENT_TILE.rotationDeg} ${presentCenterX} ${presentCenterY})`}>
        <rect
          x={PRESENT_TILE.left}
          y={PRESENT_TILE.top}
          width={PRESENT_TILE.size}
          height={PRESENT_TILE.size + PRESENT_TILE.depth}
          rx={PRESENT_TILE.radius}
          className="fill-present-depth"
        />
        <rect
          x={PRESENT_TILE.left}
          y={PRESENT_TILE.top}
          width={PRESENT_TILE.size}
          height={PRESENT_TILE.size}
          rx={PRESENT_TILE.radius}
          className="fill-present"
        />
      </g>
      <g transform={`rotate(${CORRECT_TILE.rotationDeg} ${correctCenterX} ${correctCenterY})`}>
        <rect
          x={CORRECT_TILE.left}
          y={CORRECT_TILE.top}
          width={CORRECT_TILE.size}
          height={CORRECT_TILE.size + CORRECT_TILE.depth}
          rx={CORRECT_TILE.radius}
          className="fill-correct-depth"
        />
        <rect
          x={CORRECT_TILE.left}
          y={CORRECT_TILE.top}
          width={CORRECT_TILE.size}
          height={CORRECT_TILE.size}
          rx={CORRECT_TILE.radius}
          className="fill-correct"
        />
      </g>
      <text
        x={correctCenterX}
        y={correctCenterY}
        transform={`rotate(${CORRECT_TILE.rotationDeg} ${correctCenterX} ${correctCenterY})`}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={GLYPH_HEIGHT}
        className="fill-correct-fg font-display font-extrabold"
      >
        H
      </text>
    </svg>
  );
}

export default BrandMark;
