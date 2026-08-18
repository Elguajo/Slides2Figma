import { z } from 'zod';
import { RGBASchema } from './color';

export const StrokeSchema = z.object({
  color: RGBASchema.optional(),
  width: z.number().nonnegative(),

  dash: z.array(z.number()).optional(),

  cap: z.enum(['none', 'round', 'square', 'arrow']).optional(),
  join: z.enum(['miter', 'round', 'bevel']).optional(),

  opacity: z.number().min(0).max(1).optional(),
});

export type Stroke = z.infer<typeof StrokeSchema>;
