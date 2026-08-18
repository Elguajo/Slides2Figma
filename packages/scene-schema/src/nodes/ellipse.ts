import { z } from 'zod';
import { sceneNodeBaseShape } from '../node-base';
import { FillSchema } from '../fill';
import { StrokeSchema } from '../stroke';

/** Level A native shape (Technical Spec §18). */
export const EllipseNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('ellipse'),

  fill: z.array(FillSchema).optional(),
  strokes: z.array(StrokeSchema).optional(),
});

export type EllipseNode = z.infer<typeof EllipseNodeSchema>;
