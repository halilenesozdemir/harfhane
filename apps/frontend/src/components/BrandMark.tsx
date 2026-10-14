interface BrandMarkProps {
  className?: string;
}

// Reference geometry from docs/design/mobile-redesign-spec.md section A (the owner's
// 2026-10-09 "Konsept D" decision, on a 240 px icon): the same numbers
// apps/mobile/scripts/generate-brand-assets.mjs and apps/frontend/scripts/generate-brand-icons.mjs
// draw from packages/ui-tokens/tokens.json. Unlike those build-time generators, this component
// draws live so its colours track the active theme instantly; it uses the Tailwind tokens those
// colours are exposed as (fill-present, fill-correct, ...), never a hex literal.
const VIEWBOX = 240;
const PRESENT_TILE = { x: 96, y: 44, size: 110, radius: 24, depth: 12, rotationDeg: 12 };
const CORRECT_TILE = { x: 40, y: 70, size: 128, radius: 28, depth: 14, rotationDeg: -6 };
const GLYPH_HEIGHT = 92;

function BrandMark({ className }: BrandMarkProps): React.JSX.Element {
  const presentCenterX = PRESENT_TILE.x + PRESENT_TILE.size / 2;
  const presentCenterY = PRESENT_TILE.y + PRESENT_TILE.size / 2;
  const correctCenterX = CORRECT_TILE.x + CORRECT_TILE.size / 2;
  const correctCenterY = CORRECT_TILE.y + CORRECT_TILE.size / 2;

  return (
    <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className={className} role="img" aria-label="Harfhane">
      <g transform={`rotate(${PRESENT_TILE.rotationDeg} ${presentCenterX} ${presentCenterY})`}>
        <rect
          x={PRESENT_TILE.x}
          y={PRESENT_TILE.y}
          width={PRESENT_TILE.size}
          height={PRESENT_TILE.size + PRESENT_TILE.depth}
          rx={PRESENT_TILE.radius}
          className="fill-present-depth"
        />
        <rect
          x={PRESENT_TILE.x}
          y={PRESENT_TILE.y}
          width={PRESENT_TILE.size}
          height={PRESENT_TILE.size}
          rx={PRESENT_TILE.radius}
          className="fill-present"
        />
      </g>
      <g transform={`rotate(${CORRECT_TILE.rotationDeg} ${correctCenterX} ${correctCenterY})`}>
        <rect
          x={CORRECT_TILE.x}
          y={CORRECT_TILE.y}
          width={CORRECT_TILE.size}
          height={CORRECT_TILE.size + CORRECT_TILE.depth}
          rx={CORRECT_TILE.radius}
          className="fill-correct-depth"
        />
        <rect
          x={CORRECT_TILE.x}
          y={CORRECT_TILE.y}
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
