import { extractedProperty, type ExtractedProperty } from '../shared/extracted-property';

/**
 * Google renders each shape as an SVG `<g id="editor-<objectId>">`
 * containing a `<rect|path|ellipse|image>` whose computed `fill`/`stroke`
 * are the shape's real rendered colors, not obfuscated -- confirmed live
 * against a real presentation (2026-08-19), where this recovered `#F46524`
 * for a visibly orange shape. This resolves the ambiguity the clipboard's
 * `drawings-object+wrapped` format left open (whether its color-looking
 * properties are the shape's actual fill or unrelated defaults): DOM/SVG
 * inspection is a reliable, independent fallback for fill/stroke recovery.
 * Runs in the ISOLATED content script world -- the SVG canvas lives in the
 * shared top-frame DOM, no MAIN-world access needed.
 */
export interface ProbedShapeStyle {
  fill: string | null;
  stroke: string | null;
}

export interface ShapeStyleLookup {
  lookup(objectId: string): ProbedShapeStyle | null;
}

export function createDomShapeStyleLookup(doc: Document): ShapeStyleLookup {
  return {
    lookup(objectId) {
      const el = doc.getElementById(`editor-${objectId}`);
      if (!el) return null;

      const shapeChild = el.querySelector('rect, path, ellipse, image');
      if (!shapeChild) return null;

      const style = doc.defaultView?.getComputedStyle(shapeChild);
      if (!style) return null;

      return {
        fill: style.fill && style.fill !== 'none' ? style.fill : null,
        stroke: style.stroke && style.stroke !== 'none' ? style.stroke : null,
      };
    },
  };
}

export function probeShapeFill(objectId: string, lookup: ShapeStyleLookup): ExtractedProperty<string> | null {
  const style = lookup.lookup(objectId);
  if (!style?.fill) return null;
  return extractedProperty(style.fill, 'web-ui', 0.8);
}

export function probeShapeStroke(objectId: string, lookup: ShapeStyleLookup): ExtractedProperty<string> | null {
  const style = lookup.lookup(objectId);
  if (!style?.stroke) return null;
  return extractedProperty(style.stroke, 'web-ui', 0.8);
}
