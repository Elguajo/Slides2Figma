/**
 * Best-effort selection-detection heuristic for the Google Slides Web
 * editor (Technical Spec §29's "Selection detected" indicator).
 *
 * Google's editing canvas is inline SVG (`#workspace`) with no stable,
 * semantic selection markup -- resize handles are pre-existing SVG nodes
 * toggled via inline styles, not inserted/removed, so watching for a
 * "selection" element by class name is unreliable. Empirically (live check
 * against a real presentation, 2026-08-19) the contextual format toolbar
 * that Google renders in `#docs-toolbar` when *any* object is selected --
 * `formatOptionsButton` / `cropImageButton` / `lineColorMenuButton` --
 * appears/disappears reliably and is exposed as a plain DOM `id`. This is
 * a heuristic against undocumented internal markup, not a stable API: its
 * reliability per fixture-element category (text/shape/image/line/group)
 * still needs confirming during the Task 6 manual research pass. If it
 * ever stops matching, the indicator just stays inert -- Capture Copy does
 * not depend on it, since it reads the clipboard after the user's own
 * copy action, not off this heuristic.
 */
const SELECTION_MARKER_IDS = ['formatOptionsButton', 'cropImageButton', 'lineColorMenuButton'] as const;

export interface SelectionMarkerLookup {
  isVisible(id: string): boolean;
}

export function isSelectionActive(lookup: SelectionMarkerLookup): boolean {
  return SELECTION_MARKER_IDS.some((id) => lookup.isVisible(id));
}

export function createDomSelectionLookup(doc: Document): SelectionMarkerLookup {
  return {
    isVisible(id) {
      const el = doc.getElementById(id);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    },
  };
}

/**
 * Polls rather than relying solely on MutationObserver: Google toggles the
 * marker buttons via inline `style`/`class` changes on nodes that are
 * sometimes replaced wholesale during toolbar re-render, which would
 * silently stop a subtree observer. A cheap interval is robust to that at
 * negligible cost for a dev-only research tool.
 */
export function observeSelection(
  onChange: (active: boolean) => void,
  doc: Document,
  intervalMs = 300,
): () => void {
  const lookup = createDomSelectionLookup(doc);
  let last: boolean | null = null;

  const tick = () => {
    const active = isSelectionActive(lookup);
    if (active !== last) {
      last = active;
      onChange(active);
    }
  };

  tick();
  const timer = doc.defaultView?.setInterval(tick, intervalMs);
  return () => {
    if (timer !== undefined) doc.defaultView?.clearInterval(timer);
  };
}
