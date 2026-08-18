import { z } from 'zod';

/** Base64 (`bytes`) is only for small/debug payloads; production uses asset upload/relay (Technical Spec §20). */
export const AssetSchema = z.object({
  id: z.string(),

  mimeType: z.string(),

  bytes: z.string().optional(),
  url: z.string().optional(),

  width: z.number().optional(),
  height: z.number().optional(),

  sha256: z.string().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;
