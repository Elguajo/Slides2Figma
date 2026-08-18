import type { Diagnostic, Fill, Stroke } from '@slides2figma/scene-schema';

/**
 * Solid fills only for now -- linear/radial gradient conversion is Task 7
 * (gradient-renderer). Non-solid fills are surfaced as a `warning`
 * Diagnostic and skipped rather than approximated, so the gap is visible
 * instead of silently faked.
 */
export function buildFillPaints(
  fills: Fill[] | undefined,
  nodeId: string,
  sourceId: string | undefined,
): { paints: Paint[]; diagnostics: Diagnostic[] } {
  const paints: Paint[] = [];
  const diagnostics: Diagnostic[] = [];

  for (const fill of fills ?? []) {
    if (fill.type === 'solid') {
      paints.push({
        type: 'SOLID',
        color: { r: fill.color.r, g: fill.color.g, b: fill.color.b },
        opacity: fill.color.a,
      });
    } else {
      diagnostics.push({
        severity: 'warning',
        nodeId,
        sourceId,
        code: 'gradient-fill-not-implemented',
        message: `"${fill.type}" fill is not implemented yet (rectangle/ellipse render only supports solid fills) -- skipped on node "${nodeId}".`,
      });
    }
  }

  return { paints, diagnostics };
}

const strokeCapMap: Record<NonNullable<Stroke['cap']>, StrokeCap> = {
  none: 'NONE',
  round: 'ROUND',
  square: 'SQUARE',
  arrow: 'ARROW_LINES',
};

const strokeJoinMap: Record<NonNullable<Stroke['join']>, StrokeJoin> = {
  miter: 'MITER',
  round: 'ROUND',
  bevel: 'BEVEL',
};

/** Strokes without a `color` don't produce a paint -- there is nothing to render. */
export function buildStrokePaints(strokes: Stroke[] | undefined): Paint[] {
  return (strokes ?? [])
    .filter((stroke) => stroke.color !== undefined)
    .map((stroke) => ({
      type: 'SOLID' as const,
      color: { r: stroke.color!.r, g: stroke.color!.g, b: stroke.color!.b },
      opacity: stroke.opacity ?? stroke.color!.a,
    }));
}

export { strokeCapMap, strokeJoinMap };
