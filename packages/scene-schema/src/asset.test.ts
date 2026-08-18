import { describe, expect, it } from 'vitest';
import { AssetSchema } from './asset';

describe('AssetSchema', () => {
  it('accepts an asset referenced by url', () => {
    const result = AssetSchema.safeParse({
      id: 'asset-1',
      mimeType: 'image/png',
      url: 'https://example.com/a.png',
      width: 200,
      height: 100,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an asset with base64 bytes only', () => {
    const result = AssetSchema.safeParse({
      id: 'asset-2',
      mimeType: 'image/png',
      bytes: 'AAAA',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an asset missing mimeType', () => {
    const result = AssetSchema.safeParse({ id: 'asset-3', bytes: 'AAAA' });
    expect(result.success).toBe(false);
  });
});
