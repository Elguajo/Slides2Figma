import { describe, expect, it } from 'vitest';
import { Transform2DSchema } from './transform';
import { validTransform } from './test-fixtures';

describe('Transform2DSchema', () => {
  it('accepts a transform without matrix', () => {
    expect(Transform2DSchema.safeParse(validTransform).success).toBe(true);
  });

  it('accepts a transform with a 6-element matrix', () => {
    const result = Transform2DSchema.safeParse({
      ...validTransform,
      matrix: [1, 0, 0, 1, 0, 0],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a matrix with the wrong element count', () => {
    const result = Transform2DSchema.safeParse({
      ...validTransform,
      matrix: [1, 0, 0, 1, 0],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing required field', () => {
    const { width: _width, ...withoutWidth } = validTransform;
    expect(Transform2DSchema.safeParse(withoutWidth).success).toBe(false);
  });
});
