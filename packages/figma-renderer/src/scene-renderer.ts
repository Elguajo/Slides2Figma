import type { Diagnostic, Scene, SceneNode } from '@slides2figma/scene-schema';
import { renderEllipse, renderRectangle } from './shape-renderer';
import { renderText, type FontResolver } from './text-renderer';

export interface RenderResult {
  frame: FrameNode;
  diagnostics: Diagnostic[];
}

/**
 * Validate -> create root Frame -> sort by zIndex -> per-node-type render ->
 * metadata -> select pipeline (Technical Spec §36-37). Dispatch below covers
 * rectangle/ellipse (Task 5) and text (Task 6); gradient/vector/image/group
 * extend the same switch in later Phase 00 tasks rather than replacing it --
 * anything not yet handled falls through to an `info` Diagnostic instead of
 * a node. Async because text rendering must `loadFontAsync` before it can
 * touch `characters`/range styling (Technical Spec §16-17).
 */
export async function renderScene(scene: Scene, fontResolver: FontResolver): Promise<RenderResult> {
  const frame = figma.createFrame();
  frame.name = rootFrameName(scene);
  frame.resize(scene.canvas.width, scene.canvas.height);

  const sortedNodes = [...scene.nodes].sort((a, b) => a.zIndex - b.zIndex);
  const diagnostics: Diagnostic[] = [...scene.diagnostics];

  for (const node of sortedNodes) {
    diagnostics.push(...(await renderNode(frame, node, fontResolver)));
  }

  frame.setPluginData(
    'slides2figma',
    JSON.stringify({
      schemaVersion: scene.schemaVersion,
      presentationId: scene.source.presentationId ?? '',
      slideId: scene.source.slideId ?? '',
      importedAt: new Date().toISOString(),
      source: scene.source.app,
    }),
  );

  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);

  return { frame, diagnostics };
}

async function renderNode(frame: FrameNode, node: SceneNode, fontResolver: FontResolver): Promise<Diagnostic[]> {
  switch (node.type) {
    case 'rectangle': {
      const { figmaNode, diagnostics } = renderRectangle(node);
      frame.appendChild(figmaNode);
      return diagnostics;
    }
    case 'ellipse': {
      const { figmaNode, diagnostics } = renderEllipse(node);
      frame.appendChild(figmaNode);
      return diagnostics;
    }
    case 'text': {
      const { figmaNode, diagnostics } = await renderText(node, fontResolver);
      frame.appendChild(figmaNode);
      return diagnostics;
    }
    default:
      return [unimplementedDiagnostic(node)];
  }
}

function rootFrameName(scene: Scene): string {
  const label = scene.source.slideId ?? scene.source.title ?? scene.source.presentationId ?? 'Untitled';
  return `Google Slides / ${label}`;
}

function unimplementedDiagnostic(node: SceneNode): Diagnostic {
  return {
    severity: 'info',
    nodeId: node.id,
    sourceId: node.sourceId,
    code: 'renderer-not-implemented',
    message: `"${node.type}" rendering is not implemented yet (Phase 00 shell) -- no node created for "${node.name ?? node.id}".`,
  };
}
