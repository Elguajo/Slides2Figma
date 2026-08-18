import { z } from 'zod';
import type { Transform2D } from './transform';
import { sceneNodeBaseShape } from './node-base';
import { TextSceneNodeSchema, type TextSceneNode } from './nodes/text';
import { RectangleNodeSchema, type RectangleNode } from './nodes/rectangle';
import { EllipseNodeSchema, type EllipseNode } from './nodes/ellipse';
import { VectorSceneNodeSchema, type VectorSceneNode } from './nodes/vector';
import { ImageSceneNodeSchema, type ImageSceneNode } from './nodes/image';
import { UnsupportedNodeSchema, type UnsupportedNode } from './nodes/unsupported';

/**
 * Mirrors `sceneNodeBaseShape`. Hand-written (rather than `z.infer`) because
 * GroupNode and SceneNode are mutually recursive, which Zod can't infer.
 */
export interface SceneNodeBase {
  id: string;
  sourceId?: string;
  name?: string;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
  transform: Transform2D;
  opacity: number;
  blendMode?: string;
  metadata?: Record<string, unknown>;
}

/** Group/Frame is never flattened; children order is the z-order source of truth (Technical Spec §22–23). */
export interface GroupNode extends SceneNodeBase {
  type: 'group';
  children: SceneNode[];
}

export type SceneNode =
  | TextSceneNode
  | RectangleNode
  | EllipseNode
  | VectorSceneNode
  | ImageSceneNode
  | GroupNode
  | UnsupportedNode;

const childrenSchema: z.ZodType<SceneNode[]> = z.lazy(() => z.array(SceneNodeSchema));

export const GroupNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('group'),
  children: childrenSchema,
});

export const SceneNodeSchema: z.ZodType<SceneNode> = z.discriminatedUnion('type', [
  TextSceneNodeSchema,
  RectangleNodeSchema,
  EllipseNodeSchema,
  VectorSceneNodeSchema,
  ImageSceneNodeSchema,
  GroupNodeSchema,
  UnsupportedNodeSchema,
]);
