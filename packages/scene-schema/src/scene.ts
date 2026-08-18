import { z } from 'zod';
import { SceneNodeSchema } from './scene-node';
import { AssetSchema } from './asset';
import { DiagnosticSchema } from './diagnostic';

export const SceneSchema = z.object({
  schemaVersion: z.string(),

  source: z.object({
    app: z.literal('google-slides'),
    presentationId: z.string().optional(),
    slideId: z.string().optional(),
    title: z.string().optional(),
  }),

  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    unit: z.literal('source'),
  }),

  nodes: z.array(SceneNodeSchema),
  assets: z.array(AssetSchema),
  diagnostics: z.array(DiagnosticSchema),
});

export type Scene = z.infer<typeof SceneSchema>;
