import type { Asset, Diagnostic, GroupNode as SceneGroupNode, SceneNode } from '@slides2figma/scene-schema';
import { applyTransform } from './shape-renderer';
import type { FontResolver } from './text-renderer';

export interface GroupRenderResult {
  figmaNode: FrameNode;
  diagnostics: Diagnostic[];
}

/**
 * Renders one `SceneNode` into an already-created parent, appending the
 * resulting Figma node (if any) and returning its diagnostics. Injected
 * rather than imported directly so `group-renderer.ts` can recurse into
 * `scene-renderer.ts`'s per-type dispatch (which also handles `group` itself
 * for nested groups) without a circular module dependency.
 */
export type RenderChild = (
  parent: FrameNode,
  child: SceneNode,
  fontResolver: FontResolver,
  assets: Asset[],
) => Promise<Diagnostic[]>;

/**
 * A `SceneNode` group becomes a Figma Frame, not `figma.group()`: children
 * carry *relative* transforms against the group's own origin (Technical
 * Spec §22), which is exactly how Figma already interprets a child's x/y
 * relative to its immediate parent -- appending children straight into this
 * frame and reusing the same `applyTransform` every other renderer uses
 * needs no manual coordinate composition, even for nested/rotated groups.
 * `clipsContent = false` and a transparent fill match Google Slides' Group
 * (which never clips), where a plain Frame defaults to clipping.
 */
export async function renderGroup(
  node: SceneGroupNode,
  fontResolver: FontResolver,
  assets: Asset[],
  renderChild: RenderChild,
): Promise<GroupRenderResult> {
  const figmaNode = figma.createFrame();
  figmaNode.name = node.name ?? node.id;
  figmaNode.fills = [];
  figmaNode.strokes = [];
  figmaNode.clipsContent = false;
  applyTransform(figmaNode, node.transform);
  figmaNode.opacity = node.opacity;

  const sortedChildren = [...node.children].sort((a, b) => a.zIndex - b.zIndex);
  const diagnostics: Diagnostic[] = [];
  for (const child of sortedChildren) {
    diagnostics.push(...(await renderChild(figmaNode, child, fontResolver, assets)));
  }

  return { figmaNode, diagnostics };
}
