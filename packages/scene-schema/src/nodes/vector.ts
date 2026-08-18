import { z } from 'zod';
import { sceneNodeBaseShape } from '../node-base';
import { FillSchema } from '../fill';
import { StrokeSchema } from '../stroke';

/** Level B exact vector (Technical Spec §19) — pathData/svg priority over approximation. */
export const VectorSceneNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('vector'),

  pathData: z.string().optional(),
  svg: z.string().optional(),

  fill: z.array(FillSchema).optional(),
  strokes: z.array(StrokeSchema).optional(),
});

export type VectorSceneNode = z.infer<typeof VectorSceneNodeSchema>;
