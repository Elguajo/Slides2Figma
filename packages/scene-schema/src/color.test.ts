import { describe, expect, it } from 'vitest';
import { RGBASchema } from './color';

describe('RGBASchema', () => {
  it('accepts channel values within 0..1', () => {
    expect(RGBASchema.safeParse({ r: 0, g: 0.5, b: 1, a: 1 }).success).toBe(true);
  });

  it('rejects channel values outside 0..1', () => {
    expect(RGBASchema.safeParse({ r: 1.5, g: 0, b: 0, a: 1 }).success).toBe(false);
    expect(RGBASchema.safeParse({ r: -0.1, g: 0, b: 0, a: 1 }).success).toBe(false);
  });

  it('rejects missing channels', () => {
    expect(RGBASchema.safeParse({ r: 0, g: 0, b: 0 }).success).toBe(false);
  });
});
