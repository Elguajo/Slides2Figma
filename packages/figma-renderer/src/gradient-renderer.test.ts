import { describe, expect, it } from 'vitest';
import { buildGradientPaint } from './gradient-renderer';

const stops = [
  { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
  { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
];

describe('buildGradientPaint (linear)', () => {
  it('produces an identity gradientTransform for the canonical horizontal axis (0,0.5)->(1,0.5)', () => {
    const paint = buildGradientPaint({
      type: 'linear-gradient',
      stops,
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
    });
    expect(paint.type).toBe('GRADIENT_LINEAR');
    expect(paint.gradientTransform).toEqual([
      [1, 0, 0],
      [0, 1, 0],
    ]);
  });

  it('carries stop positions and colors through unchanged', () => {
    const paint = buildGradientPaint({
      type: 'linear-gradient',
      stops,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    });
    expect(paint.gradientStops).toEqual([
      { position: 0, color: { r: 1, g: 0, b: 0, a: 1 } },
      { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
    ]);
  });

  it('maps a vertical axis (0,0)->(0,1) to a 90-degree-rotated transform', () => {
    const paint = buildGradientPaint({
      type: 'linear-gradient',
      stops,
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    });
    // start->end (0,0)->(0,1) is a valid non-degenerate axis distinct from the
    // identity's (0,0.5)->(1,0.5): a=end.x-start.x=0, b=end.y-start.y=1.
    expect(paint.gradientTransform[0][0]).toBeCloseTo(0);
    expect(paint.gradientTransform[1][0]).toBeCloseTo(1);
  });

  it('applies rotation on top of the start/end axis around the segment midpoint', () => {
    const withRotation = buildGradientPaint({
      type: 'linear-gradient',
      stops,
      start: { x: 0, y: 0.5 },
      end: { x: 1, y: 0.5 },
      rotation: 90,
    });
    const withoutRotation = buildGradientPaint({
      type: 'linear-gradient',
      stops,
      start: { x: 0.5, y: 0 },
      end: { x: 0.5, y: 1 },
    });
    expect(withRotation.gradientTransform[0][0]).toBeCloseTo(withoutRotation.gradientTransform[0][0]);
    expect(withRotation.gradientTransform[1][0]).toBeCloseTo(withoutRotation.gradientTransform[1][0]);
  });
});

describe('buildGradientPaint (radial)', () => {
  it('maps a centered unit-radius circle relative to Figma\'s identity handles', () => {
    // Figma's identity handles are center=(0,0.5), x-radius-point=(1,0.5),
    // y-radius-point=(0,1) -- a centered (0.5,0.5) circle of radius 0.5 is a
    // different (non-identity) ellipse, not the identity transform itself.
    const paint = buildGradientPaint({
      type: 'radial-gradient',
      stops,
      center: { x: 0.5, y: 0.5 },
      radiusX: 0.5,
      radiusY: 0.5,
    });
    expect(paint.type).toBe('GRADIENT_RADIAL');
    expect(paint.gradientTransform).toEqual([
      [0.5, 0, 0.5],
      [0, 1, 0],
    ]);
  });

  it('scales the transform for an ellipse with unequal radii', () => {
    const paint = buildGradientPaint({
      type: 'radial-gradient',
      stops,
      center: { x: 0.5, y: 0.5 },
      radiusX: 0.25,
      radiusY: 0.1,
    });
    // a (col 0, x-axis) reads radiusX directly; d (col 1, y-axis) is 2x
    // radiusY because the y-radius handle is the third ("width") handle,
    // whose offset from center carries the same factor-of-2 as handlesToTransform's c/d terms.
    expect(paint.gradientTransform[0][0]).toBeCloseTo(0.25);
    expect(paint.gradientTransform[1][1]).toBeCloseTo(0.2);
  });

  it('rotates the radius axes around the center', () => {
    const paint = buildGradientPaint({
      type: 'radial-gradient',
      stops,
      center: { x: 0.5, y: 0.5 },
      radiusX: 0.5,
      radiusY: 0.2,
      rotation: 90,
    });
    // A 90-degree rotation swaps the effective x/y axes: the x-radius handle
    // now points in +y, so column 0 (x-axis mapping) should read from radiusY's row.
    expect(paint.gradientTransform[0][0]).toBeCloseTo(0);
    expect(paint.gradientTransform[1][0]).toBeCloseTo(0.5);
  });
});
