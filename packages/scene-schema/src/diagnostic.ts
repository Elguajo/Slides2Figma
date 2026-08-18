import { z } from 'zod';

export const DiagnosticSchema = z.object({
  severity: z.enum(['info', 'warning', 'error']),

  nodeId: z.string().optional(),
  sourceId: z.string().optional(),

  code: z.string(),
  message: z.string(),

  details: z.unknown().optional(),
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
