import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CORRECT_TILE, GLYPH_HEIGHT, PRESENT_TILE, REFERENCE_SIZE } from '@harfhane/ui-tokens/brand-mark';
import BrandMark from './BrandMark';

function renderMark(decorative = false): SVGSVGElement {
  const { container } = render(<BrandMark decorative={decorative} />);
  const svg = container.querySelector('svg');
  if (!svg) throw new Error('BrandMark did not render an <svg>');
  return svg;
}

function tileGroup(svg: SVGSVGElement, fillClass: string): SVGGElement {
  const group = svg.querySelector(`.${fillClass}`)?.closest('g');
  if (!group) throw new Error(`no <g> found for .${fillClass}`);
  return group;
}

describe('BrandMark', () => {
  it('should label itself as an image named Harfhane by default', () => {
    const svg = renderMark();

    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Harfhane');
    expect(svg.hasAttribute('aria-hidden')).toBe(false);
  });

  it('should hide itself from assistive tech when decorative, with no competing label', () => {
    const svg = renderMark(true);

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.hasAttribute('role')).toBe(false);
    expect(svg.hasAttribute('aria-label')).toBe(false);
  });

  it('should size the viewBox from the shared REFERENCE_SIZE token, not a hand-picked number', () => {
    const svg = renderMark();

    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${REFERENCE_SIZE} ${REFERENCE_SIZE}`);
  });

  it.each([
    ['present', PRESENT_TILE, 'fill-present'],
    ['correct', CORRECT_TILE, 'fill-correct'],
  ] as const)('should draw the %s tile (face and depth) at the shared geometry, not a hand-picked one', (_name, tile, fillClass) => {
    const svg = renderMark();
    const group = tileGroup(svg, fillClass);
    const [depthRect, faceRect] = Array.from(group.querySelectorAll('rect'));

    const centerX = tile.left + tile.size / 2;
    const centerY = tile.top + tile.size / 2;
    expect(group.getAttribute('transform')).toBe(`rotate(${tile.rotationDeg} ${centerX} ${centerY})`);

    for (const rect of [depthRect, faceRect]) {
      expect(Number(rect?.getAttribute('x'))).toBe(tile.left);
      expect(Number(rect?.getAttribute('y'))).toBe(tile.top);
      expect(Number(rect?.getAttribute('width'))).toBe(tile.size);
      expect(Number(rect?.getAttribute('rx'))).toBe(tile.radius);
    }
    expect(Number(depthRect?.getAttribute('height'))).toBe(tile.size + tile.depth);
    expect(Number(faceRect?.getAttribute('height'))).toBe(tile.size);
  });

  it('should draw exactly one "H" glyph at the shared glyph size, not a hand-picked one', () => {
    const svg = renderMark();
    const textEls = svg.querySelectorAll('text');

    expect(textEls).toHaveLength(1);
    expect(textEls[0]?.textContent).toBe('H');
    expect(Number(textEls[0]?.getAttribute('font-size'))).toBe(GLYPH_HEIGHT);
  });
});
