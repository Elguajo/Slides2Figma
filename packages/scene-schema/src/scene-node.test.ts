import { describe, expect, it } from 'vitest';
import { SceneNodeSchema, GroupNodeSchema } from './scene-node';
import { baseNodeFields } from './test-fixtures';

describe('SceneNodeSchema', () => {
  it('accepts a leaf node for each in-scope type', () => {
    const rectangle = SceneNodeSchema.safeParse({ ...baseNodeFields(), type: 'rectangle' });
    const ellipse = SceneNodeSchema.safeParse({ ...baseNodeFields(), type: 'ellipse' });
    const vector = SceneNodeSchema.safeParse({ ...baseNodeFields(), type: 'vector' });
    const unsupported = SceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'unsupported',
      sourceType: 'wordart',
      reason: 'not supported',
    });

    expect(rectangle.success).toBe(true);
    expect(ellipse.success).toBe(true);
    expect(vector.success).toBe(true);
    expect(unsupported.success).toBe(true);
  });

  it('rejects a node with an unknown type discriminant', () => {
    const result = SceneNodeSchema.safeParse({ ...baseNodeFields(), type: 'frame' });
    expect(result.success).toBe(false);
  });

  it('rejects a group missing its unsupported sibling reason (per-child error isolation is a rejection, not a crash)', () => {
    const result = SceneNodeSchema.safeParse({
      ...baseNodeFields({ id: 'group-1' }),
      type: 'group',
      children: [
        { ...baseNodeFields({ id: 'child-1' }), type: 'rectangle' },
        { ...baseNodeFields({ id: 'child-2' }), type: 'unsupported', sourceType: 'wordart' },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('GroupNodeSchema recursion', () => {
  it('accepts nested groups of mixed child types', () => {
    const result = GroupNodeSchema.safeParse({
      ...baseNodeFields({ id: 'outer-group' }),
      type: 'group',
      children: [
        { ...baseNodeFields({ id: 'shape-1' }), type: 'rectangle' },
        {
          ...baseNodeFields({ id: 'inner-group' }),
          type: 'group',
          children: [{ ...baseNodeFields({ id: 'text-1' }), type: 'text', text: 'Hi', box: { width: 10, height: 10 }, runs: [], paragraphs: [] }],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty group', () => {
    const result = GroupNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'group',
      children: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a group containing an invalid grandchild', () => {
    const result = GroupNodeSchema.safeParse({
      ...baseNodeFields({ id: 'outer-group' }),
      type: 'group',
      children: [
        {
          ...baseNodeFields({ id: 'inner-group' }),
          type: 'group',
          children: [{ ...baseNodeFields({ id: 'bad' }), type: 'not-a-real-type' }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
