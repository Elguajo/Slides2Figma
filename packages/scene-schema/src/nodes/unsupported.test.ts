import { describe, expect, it } from 'vitest';
import { UnsupportedNodeSchema } from './unsupported';
import { baseNodeFields } from '../test-fixtures';

describe('UnsupportedNodeSchema', () => {
  it('accepts an unsupported node with a reason and no fallback', () => {
    const result = UnsupportedNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'unsupported',
      sourceType: 'wordart',
      reason: 'WordArt is not yet supported',
    });
    expect(result.success).toBe(true);
  });

  it('accepts an unsupported node with an svg fallback', () => {
    const result = UnsupportedNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'unsupported',
      sourceType: 'smartart',
      reason: 'SmartArt approximated as SVG',
      fallback: { type: 'svg', svg: '<svg></svg>' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects a missing reason', () => {
    const result = UnsupportedNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'unsupported',
      sourceType: 'wordart',
    });
    expect(result.success).toBe(false);
  });
});
