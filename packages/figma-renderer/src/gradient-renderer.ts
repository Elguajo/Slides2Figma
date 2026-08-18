import type { LinearGradientFill, RadialGradientFill } from '@slides2figma/scene-schema';

interface Point {
  x: number;
  y: number;
}

/**
 * Figma's gradientTransform maps three fixed "identity" handle positions in
 * normalized object space -- start (0, 0.5), end (1, 0.5), width (0, 1) --
 * onto the actual handle positions we want. Given target handles [p0, p1, p2]
 * and identity handles [(0,0.5), (1,0.5), (0,1)], solving `A * identity = p`
 * for the 2x3 affine matrix A = [[a,c,e],[b,d,f]] yields this closed form
 * (verified against the identity case, which must round-trip to [[1,0,0],[0,1,0]]).
 */
function handlesToTransform([p0, p1, p2]: [Point, Point, Point]): [
  [number, number, number],
  [number, number, number],
] {
  const a = p1.x - p0.x;
  const b = p1.y - p0.y;
  const c = 2 * (p2.x - p0.x);
  const d = 2 * (p2.y - p0.y);
  const e = 2 * p0.x - p2.x;
  const f = 2 * p0.y - p2.y;
  return [
    [a, c, e],
    [b, d, f],
  ];
}

function rotateAround(point: Point, pivot: Point, degrees: number): Point {
  if (!degrees) return point;
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

/**
 * `rotation` (when present) is treated as an additional rotation of the
 * start->end axis around the segment's own midpoint, layered on top of
 * whatever direction start/end already encode -- the Technical Spec (§13)
 * declares the field but doesn't specify how it composes with start/end, so
 * this is an assumption (same "flag it, don't block" treatment as Task 6's
 * unit assumptions), not a confirmed reading. The third ("width") handle
 * doesn't affect GRADIENT_LINEAR's visual output; it's set to a perpendicular
 * offset of half the axis length to match Figma's own identity handles.
 */
function linearHandles(fill: LinearGradientFill): [Point, Point, Point] {
  let start = fill.start;
  let end = fill.end;
  if (fill.rotation) {
    const pivot = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    start = rotateAround(start, pivot, fill.rotation);
    end = rotateAround(end, pivot, fill.rotation);
  }
  const axis = { x: end.x - start.x, y: end.y - start.y };
  const widthHandle = { x: start.x - axis.y * 0.5, y: start.y + axis.x * 0.5 };
  return [start, end, widthHandle];
}

/**
 * `rotation` rotates the radiusX/radiusY axes around `center`, mirroring how
 * object rotation applies elsewhere in the renderer.
 */
function radialHandles(fill: RadialGradientFill): [Point, Point, Point] {
  const rotation = fill.rotation ?? 0;
  const xHandle = rotateAround(
    { x: fill.center.x + fill.radiusX, y: fill.center.y },
    fill.center,
    rotation,
  );
  const yHandle = rotateAround(
    { x: fill.center.x, y: fill.center.y + fill.radiusY },
    fill.center,
    rotation,
  );
  return [fill.center, xHandle, yHandle];
}

export function buildGradientPaint(fill: LinearGradientFill | RadialGradientFill): GradientPaint {
  const handles = fill.type === 'linear-gradient' ? linearHandles(fill) : radialHandles(fill);
  return {
    type: fill.type === 'linear-gradient' ? 'GRADIENT_LINEAR' : 'GRADIENT_RADIAL',
    gradientTransform: handlesToTransform(handles),
    gradientStops: fill.stops.map((stop) => ({
      position: stop.position,
      color: { r: stop.color.r, g: stop.color.g, b: stop.color.b, a: stop.color.a },
    })),
  };
}
