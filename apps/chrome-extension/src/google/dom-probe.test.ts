import { describe, expect, it } from 'vitest';
import { probeShapeFill, probeShapeStroke, type ShapeStyleLookup } from './dom-probe';

function lookupOf(styles: Record<string, { fill: string | null; stroke: string | null }>): ShapeStyleLookup {
  return { lookup: (objectId) => styles[objectId] ?? null };
}

describe('probeShapeFill', () => {
  it('wraps a found fill color as a web-ui ExtractedProperty', () => {
    const lookup = lookupOf({ shape1: { fill: 'rgb(244, 101, 36)', stroke: null } });
    expect(probeShapeFill('shape1', lookup)).toEqual({
      value: 'rgb(244, 101, 36)',
      source: 'web-ui',
      confidence: 0.8,
    });
  });

  it('returns null when the shape has no fill or is not found', () => {
    const lookup = lookupOf({ shape1: { fill: null, stroke: 'black' } });
    expect(probeShapeFill('shape1', lookup)).toBeNull();
    expect(probeShapeFill('missing', lookup)).toBeNull();
  });
});

describe('probeShapeStroke', () => {
  it('wraps a found stroke color as a web-ui ExtractedProperty', () => {
    const lookup = lookupOf({ shape1: { fill: null, stroke: 'rgb(255, 255, 255)' } });
    expect(probeShapeStroke('shape1', lookup)).toEqual({
      value: 'rgb(255, 255, 255)',
      source: 'web-ui',
      confidence: 0.8,
    });
  });

  it('returns null when the shape has no stroke', () => {
    const lookup = lookupOf({ shape1: { fill: 'red', stroke: null } });
    expect(probeShapeStroke('shape1', lookup)).toBeNull();
  });
});
