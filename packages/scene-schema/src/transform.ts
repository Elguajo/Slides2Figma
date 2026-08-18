import { z } from 'zod';

/**
 * Affine transform. `matrix`, when present, is the source of truth over
 * x/y/width/height/rotation (Technical Spec §10.3).
 */
export const Transform2DSchema = z.object({
  x: z.number(),
  y: z.number(),

  width: z.number(),
  height: z.number(),

  rotation: z.number(),

  matrix: z.tuple([
    z.number(), z.number(), z.number(),
    z.number(), z.number(), z.number(),
  ]).optional(),
});

export type Transform2D = z.infer<typeof Transform2DSchema>;
