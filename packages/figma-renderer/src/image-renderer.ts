import type { Asset, Diagnostic, ImageSceneNode as SceneImageNode } from '@slides2figma/scene-schema';
import { applyTransform } from './shape-renderer';

export interface ImageRenderResult {
  figmaNode?: RectangleNode;
  diagnostics: Diagnostic[];
}

/**
 * Full-bleed image fill only (Task 9 scope note: crop math is deferred to
 * Phase 03) -- `node.crop`/`node.fit` are ignored, a single `IMAGE` paint
 * with `scaleMode: 'FILL'` covers the whole transform box. Only inline
 * base64 `Asset.bytes` are supported; `Asset.url` (Technical Spec §20's
 * asset-upload/relay path) isn't fetched here and produces a diagnostic
 * instead, matching this task's fixture-driven scope (no network access
 * from the renderer).
 */
export function renderImage(node: SceneImageNode, assets: Asset[]): ImageRenderResult {
  const asset = assets.find((candidate) => candidate.id === node.assetId);
  if (!asset) {
    return { diagnostics: [assetDiagnostic(node, `no asset with id "${node.assetId}" in scene.assets`)] };
  }
  if (!asset.bytes) {
    return {
      diagnostics: [
        assetDiagnostic(node, `asset "${asset.id}" has no inline bytes -- url-based assets are not implemented yet`),
      ],
    };
  }

  const image = figma.createImage(base64ToUint8Array(asset.bytes));
  const figmaNode = figma.createRectangle();
  figmaNode.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
  figmaNode.name = node.name ?? node.id;
  applyTransform(figmaNode, node.transform);
  figmaNode.opacity = node.opacity;

  return { figmaNode, diagnostics: [] };
}

function assetDiagnostic(node: SceneImageNode, message: string): Diagnostic {
  return {
    severity: 'warning',
    nodeId: node.id,
    sourceId: node.sourceId,
    code: 'image-asset-missing',
    message: `Image "${node.name ?? node.id}" ${message} -- no node created.`,
  };
}

/**
 * Figma's plugin sandbox provides `atob` at runtime but `@figma/plugin-typings`
 * doesn't declare it (the package has no `dom` lib, matching the sandbox's
 * restricted globals) -- ambient-declared here rather than pulling in `dom`
 * lib wholesale, which would also expose non-sandbox globals like `window`.
 */
declare function atob(data: string): string;

/** Asset payloads are base64 (Technical Spec §20); there's no Node `Buffer` in the plugin sandbox. */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
