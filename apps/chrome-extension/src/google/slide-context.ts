import { extractedProperty, type ExtractedProperty } from '../shared/extracted-property';

/**
 * Google Slides keeps the URL hash in sync with the editor's current page
 * (`#slide=id.<pageObjectId>`) -- confirmed live against a real
 * presentation (2026-08-19). This is DOM/URL-derived, not internal JS
 * state, hence `source: "web-ui"` rather than `"internal"`.
 */
const SLIDE_HASH_PATTERN = /^#slide=id\.(.+)$/;

export function parseSlideIdFromHash(hash: string): string | null {
  const match = SLIDE_HASH_PATTERN.exec(hash);
  return match?.[1] ?? null;
}

export function currentSlideId(location: Pick<Location, 'hash'>): ExtractedProperty<string> | null {
  const id = parseSlideIdFromHash(location.hash);
  if (!id) return null;
  return extractedProperty(id, 'web-ui', 0.9);
}
