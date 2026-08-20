import { describe, expect, it } from 'vitest';
import { currentSlideId, parseSlideIdFromHash } from './slide-context';

describe('parseSlideIdFromHash', () => {
  it('extracts the slide id from a well-formed hash', () => {
    expect(parseSlideIdFromHash('#slide=id.g3f3e9b265d8_6_0')).toBe('g3f3e9b265d8_6_0');
  });

  it('returns null for an unrelated or empty hash', () => {
    expect(parseSlideIdFromHash('')).toBeNull();
    expect(parseSlideIdFromHash('#something-else')).toBeNull();
  });
});

describe('currentSlideId', () => {
  it('wraps a found slide id as a web-ui ExtractedProperty', () => {
    expect(currentSlideId({ hash: '#slide=id.gcb9a0b074_1_0' })).toEqual({
      value: 'gcb9a0b074_1_0',
      source: 'web-ui',
      confidence: 0.9,
    });
  });

  it('returns null when the hash has no slide id', () => {
    expect(currentSlideId({ hash: '' })).toBeNull();
  });
});
