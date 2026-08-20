import type { Diagnostic, VectorSceneNode as SceneVectorNode } from '@slides2figma/scene-schema';
import { applyShapeCommon } from './shape-renderer';

export interface VectorRenderResult {
  figmaNode?: VectorNode;
  diagnostics: Diagnostic[];
}

/**
 * Level B "exact vector" (Technical Spec §19): `pathData` is priority 1 of
 * the spec's fallback order (exact path -> exact SVG -> approximation ->
 * raster). SVG-string rendering (priority 2) and a generic no-geometry
 * placeholder are deferred -- Task 8's fixture only exercises `pathData`,
 * and the still-unchecked "diagnostics reporter + per-child error isolation"
 * task is the right place to add a shared placeholder for every node kind,
 * not a one-off here.
 */
export function renderVector(node: SceneVectorNode): VectorRenderResult {
  if (!node.pathData) {
    return { diagnostics: [missingPathDataDiagnostic(node)] };
  }

  const figmaNode = figma.createVector();
  const hasFill = (node.fill?.length ?? 0) > 0;
  figmaNode.vectorPaths = [{ windingRule: hasFill ? 'NONZERO' : 'NONE', data: node.pathData }];

  const diagnostics = applyShapeCommon(figmaNode, node);
  return { figmaNode, diagnostics };
}

function missingPathDataDiagnostic(node: SceneVectorNode): Diagnostic {
  return {
    severity: 'warning',
    nodeId: node.id,
    sourceId: node.sourceId,
    code: 'vector-pathdata-missing',
    message: `Vector "${node.name ?? node.id}" has no pathData -- svg-only/approximation rendering is not implemented yet (Phase 00 scope), no node created.`,
  };
}
