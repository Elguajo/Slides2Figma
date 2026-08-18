import type {
  Diagnostic,
  EllipseNode as SceneEllipseNode,
  RectangleNode as SceneRectangleNode,
  Transform2D,
} from '@slides2figma/scene-schema';
import { buildFillPaints, buildStrokePaints, strokeCapMap, strokeJoinMap } from './paint';

export interface ShapeRenderResult<T> {
  figmaNode: T;
  diagnostics: Diagnostic[];
}

export function renderRectangle(node: SceneRectangleNode): ShapeRenderResult<RectangleNode> {
  const figmaNode = figma.createRectangle();
  figmaNode.cornerRadius = node.cornerRadius ?? 0;

  const diagnostics = applyShapeCommon(figmaNode, node);
  return { figmaNode, diagnostics };
}

export function renderEllipse(node: SceneEllipseNode): ShapeRenderResult<EllipseNode> {
  const figmaNode = figma.createEllipse();

  const diagnostics = applyShapeCommon(figmaNode, node);
  return { figmaNode, diagnostics };
}

/**
 * Shared transform/opacity/fill/stroke application for the "default shape"
 * node kinds (rectangle, ellipse). Later shape-like renderers (vector) can
 * reuse this once they land in Task 8.
 */
function applyShapeCommon(
  figmaNode: RectangleNode | EllipseNode,
  node: SceneRectangleNode | SceneEllipseNode,
): Diagnostic[] {
  figmaNode.name = node.name ?? node.id;
  applyTransform(figmaNode, node.transform);
  figmaNode.opacity = node.opacity;

  const { paints, diagnostics } = buildFillPaints(node.fill, node.id, node.sourceId);
  figmaNode.fills = paints;

  applyStrokes(figmaNode, node.strokes);

  return diagnostics;
}

/**
 * `x`/`y` set the node's un-rotated top-left corner and stay invariant when
 * `rotation` is set (Figma's plugin docs: rotation is "with respect to the
 * top-left of the object", independent of position) -- this maps 1:1 onto
 * Transform2D's x/y/width/height/rotation fields with no matrix math needed.
 * Figma's own Design panel displays the *rotated bounding box*'s top-left
 * for a rotated node instead of the raw x/y, which reads as a mismatch at a
 * glance; verified against the rotated rectangle in
 * `fixtures/basic/rectangle.json` in Figma desktop that the displayed value
 * is exactly the expected AABB of a `transform.width`x`transform.height` box
 * rotated by `transform.rotation` about (x, y), confirming the underlying
 * node position is correct.
 */
function applyTransform(figmaNode: RectangleNode | EllipseNode, transform: Transform2D): void {
  figmaNode.resize(transform.width, transform.height);
  figmaNode.x = transform.x;
  figmaNode.y = transform.y;
  figmaNode.rotation = transform.rotation;
}

function applyStrokes(figmaNode: RectangleNode | EllipseNode, strokes: SceneRectangleNode['strokes']): void {
  figmaNode.strokes = buildStrokePaints(strokes);

  const [primary] = strokes ?? [];
  if (!primary) return;

  figmaNode.strokeWeight = primary.width;
  if (primary.dash) figmaNode.dashPattern = primary.dash;
  if (primary.cap) figmaNode.strokeCap = strokeCapMap[primary.cap];
  if (primary.join) figmaNode.strokeJoin = strokeJoinMap[primary.join];
}
