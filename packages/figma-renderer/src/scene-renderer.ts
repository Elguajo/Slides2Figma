import type {
  Asset,
  Diagnostic,
  Scene,
  SceneNode,
  UnsupportedNode,
} from '@slides2figma/scene-schema';
import { renderEllipse, renderRectangle } from './shape-renderer';
import { renderText, type FontResolver } from './text-renderer';
import { renderVector } from './vector-renderer';
import { renderImage } from './image-renderer';
import { renderGroup } from './group-renderer';

export interface RenderResult {
  frame: FrameNode;
  diagnostics: Diagnostic[];
}

/**
 * Validate -> create root Frame -> sort by zIndex -> per-node-type render ->
 * metadata -> select pipeline (Technical Spec §36-37). Dispatch below covers
 * rectangle/ellipse (Task 5), text (Task 6, gradients fall out of the fill
 * pipeline for free), vector (Task 8), image (Task 9), group (last Phase 00
 * task -- recurses back into `renderNode` for children, including nested
 * groups), and unsupported (a known, explicitly-typed placeholder, distinct
 * from `default`'s "not implemented yet" for node types outside this
 * phase's schema). Async because text rendering must `loadFontAsync` before
 * it can touch `characters`/range styling (Technical Spec §16-17).
 */
export async function renderScene(scene: Scene, fontResolver: FontResolver): Promise<RenderResult> {
  const frame = figma.createFrame();
  frame.name = rootFrameName(scene);
  frame.resize(scene.canvas.width, scene.canvas.height);
  const position = nextFramePosition();
  frame.x = position.x;
  frame.y = position.y;

  const sortedNodes = [...scene.nodes].sort((a, b) => a.zIndex - b.zIndex);
  const diagnostics: Diagnostic[] = [...scene.diagnostics];

  for (const node of sortedNodes) {
    diagnostics.push(...(await renderNode(frame, node, fontResolver, scene.assets)));
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

/**
 * Wrapped in try/catch so one child's unexpected renderer exception (Figma
 * API failure, font load rejection, etc.) becomes an `error` Diagnostic
 * instead of aborting every sibling -- and, since `group` recurses back into
 * this same function for its children (both directly and via `renderGroup`'s
 * injected `renderChild`), isolation applies at every nesting depth, not
 * just the top level (Technical Spec §36, §58).
 */
async function renderNode(
  frame: FrameNode,
  node: SceneNode,
  fontResolver: FontResolver,
  assets: Asset[],
): Promise<Diagnostic[]> {
  try {
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
      case 'vector': {
        const { figmaNode, diagnostics } = renderVector(node);
        if (figmaNode) frame.appendChild(figmaNode);
        return diagnostics;
      }
      case 'image': {
        const { figmaNode, diagnostics } = renderImage(node, assets);
        if (figmaNode) frame.appendChild(figmaNode);
        return diagnostics;
      }
      case 'group': {
        const { figmaNode, diagnostics } = await renderGroup(node, fontResolver, assets, renderNode);
        frame.appendChild(figmaNode);
        return diagnostics;
      }
      case 'unsupported':
        return [unsupportedNodeDiagnostic(node)];
      default:
        return [unimplementedDiagnostic(node)];
    }
  } catch (error) {
    return [renderErrorDiagnostic(node, error)];
  }
}

/**
 * Places each newly rendered root Frame to the right of every existing
 * top-level Frame on the page, so repeated renders (e.g. loading fixture
 * after fixture during manual verification) land side by side instead of
 * stacking on top of each other at Figma's default (0, 0) origin -- a real
 * "Import Slide" workflow (Phase 04+) wants the same non-destructive default,
 * not just the fixture-loading dev harness.
 */
function nextFramePosition(): { x: number; y: number } {
  const existingFrames = figma.currentPage.children.filter(
    (node): node is FrameNode => node.type === 'FRAME',
  );
  if (existingFrames.length === 0) return { x: 0, y: 0 };

  const margin = 200;
  const maxRight = Math.max(...existingFrames.map((frame) => frame.x + frame.width));
  return { x: maxRight + margin, y: 0 };
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

/** A known, explicitly-typed placeholder (Technical Spec §24) -- never rasterizes the rest of the slide, no node created. */
function unsupportedNodeDiagnostic(node: UnsupportedNode): Diagnostic {
  return {
    severity: 'warning',
    nodeId: node.id,
    sourceId: node.sourceId,
    code: 'unsupported-node-type',
    message: `"${node.sourceType}" (${node.name ?? node.id}) is not supported yet -- ${node.reason}`,
  };
}

function renderErrorDiagnostic(node: SceneNode, error: unknown): Diagnostic {
  return {
    severity: 'error',
    nodeId: node.id,
    sourceId: node.sourceId,
    code: 'render-error',
    message: `Rendering "${node.name ?? node.id}" (${node.type}) threw an unexpected error -- no node created: ${
      error instanceof Error ? error.message : String(error)
    }.`,
  };
}
