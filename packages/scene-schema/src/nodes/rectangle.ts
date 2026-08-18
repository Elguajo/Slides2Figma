import { z } from 'zod';
import { sceneNodeBaseShape } from '../node-base';
import { FillSchema } from '../fill';
import { StrokeSchema } from '../stroke';

/** Level A native shape (Technical Spec §18) — rounded rectangle uses cornerRadius. */
export const RectangleNodeSchema = z.object({
  ...sceneNodeBaseShape,
  type: z.literal('rectangle'),

  cornerRadius: z.number().nonnegative().optional(),

  fill: z.array(FillSchema).optional(),
  strokes: z.array(StrokeSchema).optional(),
});

export type RectangleNode = z.infer<typeof RectangleNodeSchema>;
