import { z } from 'zod';
import { Transform2DSchema } from './transform';

/**
 * Fields shared by every SceneNode (Technical Spec §10.2). `type` and
 * `children` are added per concrete node type rather than here: only
 * GroupNode carries children in this phase's node set (FrameNode is
 * out of scope — see phase file "In scope").
 */
export const sceneNodeBaseShape = {
  id: z.string(),
  sourceId: z.string().optional(),
  name: z.string().optional(),
  visible: z.boolean(),
  locked: z.boolean().optional(),
  zIndex: z.number(),
  transform: Transform2DSchema,
  opacity: z.number().min(0).max(1),
  blendMode: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
};
