import { describe, expect, it } from 'vitest';
import { FillSchema } from './fill';

const color = { r: 1, g: 0, b: 0, a: 1 };

describe('FillSchema', () => {
  it('accepts a solid fill', () => {
    expect(FillSchema.safeParse({ type: 'solid', color }).success).toBe(true);
  });

  it('accepts a linear gradient with stops, start, and end', () => {
    const result = FillSchema.safeParse({
      type: 'linear-gradient',
      stops: [
        { position: 0, color },
        { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } },
      ],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a radial gradient with center and radii', () => {
    const result = FillSchema.safeParse({
      type: 'radial-gradient',
      stops: [
        { position: 0, color },
        { position: 1, color },
      ],
      center: { x: 0.5, y: 0.5 },
      radiusX: 0.5,
      radiusY: 0.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a gradient with fewer than 2 stops', () => {
    const result = FillSchema.safeParse({
      type: 'linear-gradient',
      stops: [{ position: 0, color }],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown fill type', () => {
    expect(FillSchema.safeParse({ type: 'image', assetId: 'a1' }).success).toBe(false);
  });
});
