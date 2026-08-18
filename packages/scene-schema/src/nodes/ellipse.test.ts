import { describe, expect, it } from 'vitest';
import { EllipseNodeSchema } from './ellipse';
import { baseNodeFields } from '../test-fixtures';

describe('EllipseNodeSchema', () => {
  it('accepts an ellipse with a solid fill', () => {
    const result = EllipseNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'ellipse',
      fill: [{ type: 'solid', color: { r: 0, g: 1, b: 0, a: 1 } }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a mismatched type literal', () => {
    const result = EllipseNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'rectangle',
    });
    expect(result.success).toBe(false);
  });
});
