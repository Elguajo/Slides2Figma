import { z } from 'zod';
import { sceneNodeBaseShape } from '../node-base';

export const ImageSceneNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('image'),

  assetId: z.string(),

  crop: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),

  fit: z.enum(['fill', 'fit', 'crop']).optional(),

  filters: z
    .object({
      exposure: z.number().optional(),
      contrast: z.number().optional(),
      saturation: z.number().optional(),
      temperature: z.number().optional(),
      tint: z.number().optional(),
    })
    .optional(),
});

export type ImageSceneNode = z.infer<typeof ImageSceneNodeSchema>;
