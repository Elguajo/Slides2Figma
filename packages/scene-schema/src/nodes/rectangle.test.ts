import { describe, expect, it } from 'vitest';
import { RectangleNodeSchema } from './rectangle';
import { baseNodeFields } from '../test-fixtures';

describe('RectangleNodeSchema', () => {
  it('accepts a plain rectangle', () => {
    const result = RectangleNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'rectangle',
      fill: [{ type: 'solid', color: { r: 1, g: 1, b: 1, a: 1 } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a rounded rectangle with cornerRadius', () => {
    const result = RectangleNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'rectangle',
      cornerRadius: 8,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a negative cornerRadius', () => {
    const result = RectangleNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'rectangle',
      cornerRadius: -2,
    });
    expect(result.success).toBe(false);
  });
});
