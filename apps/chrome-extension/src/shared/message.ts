import { z } from 'zod';

/**
 * Envelope for every MAIN world -> ISOLATED content script -> service worker
 * message (Technical Spec §28). `channel`/`version` let the bridge ignore
 * unrelated page traffic and any future breaking envelope change; `type` is
 * left as a general string rather than a literal union because this phase
 * doesn't yet define the concrete message catalog (Task 5's MAIN-world
 * probe and Phase 02's extractor will add types as they're needed).
 */
export const MainWorldMessageSchema = z.object({
  channel: z.literal('slides2figma'),
  version: z.literal(1),
  type: z.string(),
  // `.optional()` matters here beyond typing: zod requires an object's keys
  // to be present by default even when their value type accepts `undefined`
  // -- without it, a message with no `payload` key at all (not just an
  // `undefined` value) would fail validation.
  payload: z.unknown().optional(),
});

export type MainWorldMessage = z.infer<typeof MainWorldMessageSchema>;

/**
 * Never accept arbitrary `window.postMessage` commands (Technical Spec §28,
 * §56.12) -- `unknown` in, a validated envelope or `null` out. Callers must
 * treat `null` as "not our message" (e.g. unrelated page script traffic),
 * not as an error.
 */
export function parseMainWorldMessage(data: unknown): MainWorldMessage | null {
  const result = MainWorldMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
