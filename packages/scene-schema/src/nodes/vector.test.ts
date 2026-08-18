import { describe, expect, it } from 'vitest';
import { VectorSceneNodeSchema } from './vector';
import { baseNodeFields } from '../test-fixtures';

describe('VectorSceneNodeSchema', () => {
  it('accepts a vector with pathData', () => {
    const result = VectorSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'vector',
      pathData: 'M0 0 L10 10 Z',
      fill: [{ type: 'solid', color: { r: 0, g: 0, b: 1, a: 1 } }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a vector with svg only', () => {
    const result = VectorSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'vector',
      svg: '<svg></svg>',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a vector with neither pathData nor svg (both optional)', () => {
    const result = VectorSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'vector',
    });
    expect(result.success).toBe(true);
  });
});
