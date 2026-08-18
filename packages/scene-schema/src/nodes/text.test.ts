import { describe, expect, it } from 'vitest';
import { TextRunSchema, ParagraphStyleSchema, TextSceneNodeSchema } from './text';
import { baseNodeFields } from '../test-fixtures';

describe('TextRunSchema', () => {
  it('accepts a run with only the required start/end', () => {
    expect(TextRunSchema.safeParse({ start: 0, end: 5 }).success).toBe(true);
  });

  it('accepts a fully styled run', () => {
    const result = TextRunSchema.safeParse({
      start: 0,
      end: 5,
      fontFamily: 'Inter',
      fontWeight: 700,
      bold: true,
      fill: { type: 'solid', color: { r: 0, g: 0, b: 0, a: 1 } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects end before start', () => {
    expect(TextRunSchema.safeParse({ start: 5, end: 0 }).success).toBe(false);
  });
});

describe('ParagraphStyleSchema', () => {
  it('accepts a minimal paragraph range', () => {
    expect(ParagraphStyleSchema.safeParse({ start: 0, end: 10 }).success).toBe(true);
  });

  it('rejects end before start', () => {
    expect(ParagraphStyleSchema.safeParse({ start: 10, end: 0 }).success).toBe(false);
  });

  it('rejects an invalid align value', () => {
    const result = ParagraphStyleSchema.safeParse({ start: 0, end: 10, align: 'top' });
    expect(result.success).toBe(false);
  });
});

describe('TextSceneNodeSchema', () => {
  it('accepts a mixed-styling text node', () => {
    const result = TextSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'text',
      text: 'Hello world',
      box: { width: 200, height: 40 },
      runs: [
        { start: 0, end: 5, bold: true },
        { start: 5, end: 11, italic: true },
      ],
      paragraphs: [{ start: 0, end: 11, align: 'center' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects a node with the wrong type literal', () => {
    const result = TextSceneNodeSchema.safeParse({
      ...baseNodeFields(),
      type: 'rectangle',
      text: 'Hello',
      box: { width: 10, height: 10 },
      runs: [],
      paragraphs: [],
    });
    expect(result.success).toBe(false);
  });
});
