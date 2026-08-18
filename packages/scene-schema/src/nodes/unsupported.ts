import { z } from 'zod';
import { sceneNodeBaseShape } from '../node-base';

/** One unsupported child must never force rasterizing the whole slide (Technical Spec §24). */
export const UnsupportedNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('unsupported'),

  sourceType: z.string(),

  fallback: z
    .object({
      type: z.enum(['svg', 'image']),
      assetId: z.string().optional(),
      svg: z.string().optional(),
    })
    .optional(),

  reason: z.string(),
});

export type UnsupportedNode = z.infer<typeof UnsupportedNodeSchema>;
