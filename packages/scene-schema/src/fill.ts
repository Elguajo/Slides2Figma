import { z } from 'zod';
import { RGBASchema } from './color';

const Point2DSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const SolidFillSchema = z.object({
  type: z.literal('solid'),
  color: RGBASchema,
});

export type SolidFill = z.infer<typeof SolidFillSchema>;

/** Gradient geometry is normalized relative to the object's bounding box (Technical Spec §13). */
export const GradientStopSchema = z.object({
  position: z.number().min(0).max(1),
  color: RGBASchema,
});

export type GradientStop = z.infer<typeof GradientStopSchema>;

export const LinearGradientFillSchema = z.object({
  type: z.literal('linear-gradient'),
  stops: z.array(GradientStopSchema).min(2),
  start: Point2DSchema,
  end: Point2DSchema,
  rotation: z.number().optional(),
});

export type LinearGradientFill = z.infer<typeof LinearGradientFillSchema>;

export const RadialGradientFillSchema = z.object({
  type: z.literal('radial-gradient'),
  stops: z.array(GradientStopSchema).min(2),
  center: Point2DSchema,
  radiusX: z.number().positive(),
  radiusY: z.number().positive(),
  rotation: z.number().optional(),
});

export type RadialGradientFill = z.infer<typeof RadialGradientFillSchema>;

/**
 * Scoped to solid/linear-gradient/radial-gradient for Phase 00 (angular gradients
 * and image fills are out of scope until Phase 03 — see phase file "Out of scope").
 */
export const FillSchema = z.discriminatedUnion('type', [
  SolidFillSchema,
  LinearGradientFillSchema,
  RadialGradientFillSchema,
]);

export type Fill = z.infer<typeof FillSchema>;
