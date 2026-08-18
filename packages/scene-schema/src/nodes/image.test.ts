import { describe, expect, it } from 'vitest';
import { ImageSceneNodeSchema } from './image';
import { baseNodeFields } from '../test-fixtures';

describe('ImageSceneNodeSchema', () => {
  it('accepts an image referencing an asset with crop and filters', () => {
    const result = ImageSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'image',
      assetId: 'asset-1',
      crop: { x: 0, y: 0, width: 0.5, height: 0.5 },
      fit: 'crop',
      filters: { exposure: 0.1, contrast: -0.2 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an image missing assetId', () => {
    const result = ImageSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'image',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid fit value', () => {
    const result = ImageSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'image',
      assetId: 'asset-1',
      fit: 'stretch',
    });
    expect(result.success).toBe(false);
  });
});
