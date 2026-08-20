/**
 * One-time, read-only scan of `window` globals matching Google/Docs-related
 * name patterns (Technical Spec §7's "исследовать объекты window"). Only
 * captures each matching global's `typeof` -- never its value -- and never
 * invokes/awaits anything (confirmed live, 2026-08-19: the only promising
 * globals found, e.g. `editorDeferred`, are Closure-style deferred/promise
 * objects; resolving them to get a real value would cross from passive
 * inspection into calling private internals as an API, which is explicitly
 * out of scope for this experimental adapter). Useful as a map for future,
 * more targeted manual investigation, not as extraction data itself.
 */
export const INTERESTING_GLOBAL_PATTERN = /docs|slide|punch|editor|selection|clip|scene/i;

export function buildGlobalsSnapshot(
  source: Record<string, unknown>,
  pattern: RegExp = INTERESTING_GLOBAL_PATTERN,
): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (const key of Object.keys(source)) {
    if (!pattern.test(key)) continue;
    snapshot[key] = typeof source[key];
  }
  return snapshot;
}
