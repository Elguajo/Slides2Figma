/**
 * Technical Spec §7's `ExtractedProperty<T>` -- wraps any value pulled from
 * a non-clipboard, non-Slides-API, non-PPTX source (DOM/web-ui inspection,
 * MAIN-world internals) so downstream code always sees how much to trust
 * it, rather than treating a fragile/experimental read the same as a
 * documented one.
 */
export type ExtractedPropertySource = 'clipboard' | 'web-ui' | 'internal' | 'slides-api' | 'pptx';

export interface ExtractedProperty<T> {
  value: T;
  source: ExtractedPropertySource;
  confidence: number;
}

export function extractedProperty<T>(
  value: T,
  source: ExtractedPropertySource,
  confidence: number,
): ExtractedProperty<T> {
  return { value, source, confidence };
}
