import { describe, expect, it } from 'vitest';
import { extractedProperty } from './extracted-property';

describe('extractedProperty', () => {
  it('wraps a value with its source and confidence', () => {
    expect(extractedProperty('#F46524', 'web-ui', 0.8)).toEqual({
      value: '#F46524',
      source: 'web-ui',
      confidence: 0.8,
    });
  });
});
