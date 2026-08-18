import { describe, expect, it } from 'vitest';
import { StrokeSchema } from './stroke';

describe('StrokeSchema', () => {
  it('accepts a stroke with only the required width', () => {
    expect(StrokeSchema.safeParse({ width: 2 }).success).toBe(true);
  });

  it('accepts a fully specified stroke', () => {
    const result = StrokeSchema.safeParse({
      color: { r: 0, g: 0, b: 0, a: 1 },
      width: 1.5,
      dash: [4, 2],
      cap: 'round',
      join: 'miter',
      opacity: 0.8,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative width', () => {
    expect(StrokeSchema.safeParse({ width: -1 }).success).toBe(false);
  });

  it('rejects an invalid cap value', () => {
    expect(StrokeSchema.safeParse({ width: 1, cap: 'bevel' }).success).toBe(false);
  });
});
