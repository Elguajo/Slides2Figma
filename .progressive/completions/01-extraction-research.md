# Phase 01 Completion — Google Slides Extraction Research (Clipboard / Web-UI / MAIN-world)

Status: COMPLETED

## Outcome
Hypothesis A (native clipboard copy carries a rich/custom scene-graph representation sufficient to reconstruct part of the native scene graph) **holds** for every element category actually captured. A working Chrome MV3 Clipboard Inspector extension was built, and a real joint capture pass against a live Google Slides session confirmed 12 of the §5.1 fixture element categories decode into concrete geometry, styling, and (for images) fetchable original-asset URLs directly from the clipboard — no MAIN-world/API/PPTX fallback (Hypothesis B/C/D) was needed for anything captured.

## Delivered
- `apps/chrome-extension`: MV3 shell (manifest, service worker, content bridge), MAIN-world ↔ ISOLATED ↔ service-worker message bridge with versioned Zod-validated schema, Clipboard Inspector UI (selection detection, Capture Copy, live format checklist, raw dump download), MAIN-world read-only probe helpers tagged `ExtractedProperty<T>`.
- `docs/extraction-findings.md`: full per-category findings table (all 17 §5.1/§50 rows), two cross-cutting findings (fill-color reliability for picture-type objects; `document-slice-clip+wrapped` as a friendlier secondary format), and a stated Hypothesis A/B/C/D conclusion.
- Real captured evidence (via the user's live Google account, across two sessions) for: single-style text, mixed-style text, rectangle, line, image, cropped image, group, table, multi-select, and whole-slide (`Cmd+A`).

## Implementation notes
- `drawings-object+wrapped` is the sole source for shape geometry (transform matrix, `shapeTypeCode`) and image blob references; it also carries every selected object as an independent sibling entry in one flat `resolved` array — confirmed identical for groups, manual multi-select, and whole-slide `Cmd+A` captures, with no nested/grouping structure in the payload itself (grouping must be inferred from the copy boundary, not the data).
- `document-slice-clip+wrapped` uses human-readable named keys (e.g. `cell_bgc2.hclr_color`) and is the friendlier target for table/paragraph/run-level styling when both formats carry the same data.
- Property `15`/`19` (fill/stroke) is reliable real data for vector shapes and table cells, but must be **ignored** for picture-type objects (`shapeTypeCode 3` + a `49` blob reference) — those consistently carry a default-looking backing fill/stroke pair uncorrelated with the image's actual content; a real extractor must read image color from pixel data or the rendered DOM instead.
- The Clipboard Inspector's `Capture Copy` control reads whatever is *currently on the OS clipboard* rather than triggering a copy itself. The correct capture sequence is: select → real `Cmd+C` (native key event, focus still on the canvas) → then `Capture Copy`. Skipping the real `Cmd+C` silently captures a stale/unrelated clipboard entry with no error — this, not browser-automation instability, was the actual cause of a session's earlier failed multi-select/whole-slide attempts.

## Decisions made
- User-authorized substitution: research ran against a real pre-existing deck ("Your big idea", already in the user's Google account) instead of building the formal 12-slide `SLIDES2FIGMA TEST SUITE` (Technical Spec §50). This was faster but leaves several §50 categories genuinely untested.
- After closing the multi-select/whole-slide gap in a follow-up session, the user was asked how to close the remaining category gaps and explicitly chose to **accept the ad-hoc deck's coverage as final** for Phase 01 rather than build the formal deck or source another one — these gaps are deferred, not phase-blocking.

## Deviations / technical debt
- The formal `SLIDES2FIGMA TEST SUITE` (§50) was never built. Untested element categories, none present in the ad-hoc deck used: rounded rectangle (standalone — only seen as part of a group), ellipse/circle, triangle, a real arrow/star/cloud/chevron/callout/wave shape, true multi-stop gradients (the deck's apparent gradient turned out to be a segmented table), a native Slides chart, and WordArt (Slides has no direct equivalent, so this may resolve via Hypothesis D/PPTX regardless).
- Image crop properties (`79`/`80`/`84`/`85` in `drawings-object+wrapped`) are present and consistent across captures but their exact mapping to a crop rectangle/scale is not decoded — needs a fixture image with a known, deliberate crop.
- Tooling profile still not selected/bootstrapped (`TOOLING_STATUS.json` remains `not_selected`) — deferred, not blocking.
- An in-session attempt to build the formal test suite via a Google Apps Script (`SlidesApp` automation, run from the user's own script.google.com project) was abandoned mid-run at the user's explicit direction. It only touched the user's Google Drive (a possibly-incomplete "SLIDES2FIGMA TEST SUITE" Slides file and a "Slides2Figma chart data" Sheet may exist there) — no repo files were affected, and this was not cleaned up autonomously since it's outside the repo.

## Problems discovered
- The Clipboard Inspector's `Capture Copy` UX sharp edge described above (reads current clipboard, doesn't trigger a copy) — worth fixing (e.g. disable the button until a `copy` event has fired since the last selection change) before Phase 02 or future sessions rely on this tool routinely.

## Verification evidence
- `pnpm -w test` reconfirmed passing across sessions (no extraction-phase code changed in the final session — docs/findings only).
- Manual: unpacked extension loaded against the user's real Google Slides session (Claude-in-Chrome driving the user's actual Chrome), Clipboard Inspector's selection-detected indicator and Capture Copy verified live; raw dumps downloaded to the user's Downloads folder and read back for every category listed in "Delivered" above.

## Architectural impact
Phase 02 (Basic Google Slides Extraction) can now build `clipboard/parser.ts` (currently a stub) against real, confirmed clipboard payload shapes: `drawings-object+wrapped` for geometry/shape-type/image-blob and as the flat sibling-list source for any multi-object selection (group, multi-select, or whole-slide); `document-slice-clip+wrapped` preferred for table/paragraph/run styling where both formats carry the same data; the fill-color caveat for picture-type objects must be encoded into the parser from the start, not discovered later.

## Follow-up
- Not blocking Phase 02, but worth doing opportunistically: decode the image crop properties against a fixture with a known crop; fix the Clipboard Inspector's `Capture Copy` UX sharp edge; if a suitable deck with the untested shape types (gradients, ellipse, triangle, star/cloud/chevron/callout/wave, chart, WordArt) becomes available, re-run this phase's capture method against it and fold the results into `docs/extraction-findings.md`.
