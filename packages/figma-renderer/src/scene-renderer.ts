import type { Diagnostic, Scene, SceneNode } from '@slides2figma/scene-schema';
import { renderEllipse, renderRectangle } from './shape-renderer';

export interface RenderResult {
  frame: FrameNode;
  diagnostics: Diagnostic[];
}

/**
 * Validate -> create root Frame -> sort by zIndex -> per-node-type render ->
 * metadata -> select pipeline (Technical Spec §36-37). Dispatch below covers
 * rectangle/ellipse (Task 5); text/gradient/vector/image/group extend the
 * same switch in later Phase 00 tasks rather than replacing it -- anything
 * not yet handled falls through to an `info` Diagnostic instead of a node.
 */
export function renderScene(scene: Scene): RenderResult {
  const frame = figma.createFrame();
  frame.name = rootFrameName(scene);
  frame.resize(scene.canvas.width, scene.canvas.height);

  const sortedNodes = [...scene.nodes].sort((a, b) => a.zIndex - b.zIndex);
  const diagnostics: Diagnostic[] = [...scene.diagnostics];

  for (const node of sortedNodes) {
    diagnostics.push(...renderNode(frame, node));
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

function renderNode(frame: FrameNode, node: SceneNode): Diagnostic[] {
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
