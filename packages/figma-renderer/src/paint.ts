import type { Diagnostic, Fill, Stroke } from '@slides2figma/scene-schema';
import { buildGradientPaint } from './gradient-renderer';

/**
 * Solid, linear-gradient, and radial-gradient fills are supported (Fill's
 * schema scope for Phase 00 -- see fill.ts). Angular/diamond gradients and
 * image fills aren't representable by the current schema, so there's no
 * fallback branch for them here.
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
      paints.push(buildGradientPaint(fill));
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
