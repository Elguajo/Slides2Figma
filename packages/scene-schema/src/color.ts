import { z } from 'zod';

/** Channel values are normalized to the 0..1 range (Technical Spec §12). */
export const RGBASchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1),
});

export type RGBA = z.infer<typeof RGBASchema>;
