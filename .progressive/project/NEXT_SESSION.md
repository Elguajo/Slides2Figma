# Next Session

> Volatile hot context. Overwrite this file on each meaningful handoff. Durable completed-phase history belongs in `.progressive/completions/` (Runtime: `.progressive/completions/`) with only a compact bridge in the completed phase `Completion Record`.

Outcome: PHASE 01 COMPLETE

## Current phase
Phase 01 — Google Slides Extraction Research — `.progressive/phases/01-extraction-research.md` (now `[x]` COMPLETE). Next phase: Phase 02 — Basic Google Slides Extraction — `.progressive/phases/02-basic-extraction.md` (not yet created; still `[ ]` PLANNED in `ROADMAP.md`).

## Completed this session
- Closed Phase 01's last open blocker: retried multi-select and whole-slide (`Cmd+A`) capture via direct manual interaction (click/shift-click + real `Cmd+C` + the extension's `Capture Copy`) against the same "Your big idea" deck, driven live in the user's real Chrome via Claude-in-Chrome.
- Both captured cleanly: multi-select (title text + book-cover image, shift-clicked) and whole-slide (`Cmd+A`, 3 objects) both decode into `drawings-object+wrapped`'s `resolved` array as independent sibling entries — same mechanism already established for groups. Confirms Hypothesis A holds for these categories too.
- **Root-caused last session's "browser-automation instability"**: it wasn't automation flakiness. The Clipboard Inspector's `Capture Copy` reads whatever is *currently on the OS clipboard* rather than triggering a copy itself. Selecting elements then clicking `Capture Copy` without an intervening real `Cmd+C` silently captures a stale/unrelated clipboard entry (repro'd: it grabbed a leftover `text/link-preview` page-URL payload) with no error shown. Correct sequence: select → real `Cmd+C` (focus still on canvas) → then `Capture Copy`. Flagged as a UX fix worth making in the Inspector before Phase 02 relies on it routinely.
- Asked the user how to close the remaining §5.1/§50 category gaps (rounded rectangle standalone, ellipse, triangle, real arrow/star/cloud/chevron/callout/wave, true gradients, chart, WordArt — none present in the ad-hoc deck). User chose to **accept the ad-hoc deck's coverage as final** rather than build the formal `SLIDES2FIGMA TEST SUITE` or source another deck.
- Updated `docs/extraction-findings.md` (rows 16–17 flipped to Captured/Holds, new detailed write-up, revised Hypothesis A verdict and recommended next steps), `.progressive/phases/01-extraction-research.md` (Task 6 → `[x]`, Completion Record populated), and `ROADMAP.md` (Phase 01 → `[x]`).
- An earlier attempt this session to build the formal test suite via a Google Apps Script (`SlidesApp` automation) was abandoned mid-run at the user's explicit direction in favor of working directly with the existing "Your big idea" deck. No repo files were affected by that abandoned attempt; it only touched the user's Google Drive (a new "SLIDES2FIGMA TEST SUITE" Slides file and a "Slides2Figma chart data" Sheet may exist in their Drive in an incomplete state — not cleaned up, not blocking, flagged here for awareness).

## Blockers / uncertainty
- None blocking Phase 02. The deferred category gaps (rounded rectangle standalone, ellipse, triangle, real arrow/star/cloud/chevron/callout/wave, true gradients, chart, WordArt) are documented as open questions in `docs/extraction-findings.md` and Phase 01's Completion Record — revisit if/when Phase 02/03 work actually needs one of them, not before.
- Image crop properties (`79`/`80`/`84`/`85` in `drawings-object+wrapped`) are present and consistent but their exact mapping to a crop rectangle is still undecoded — noted as a Phase 02/03 follow-up, not a Phase 01 blocker.
- Tooling profile still not selected/bootstrapped (`TOOLING_STATUS.json` still `not_selected`) — deferred, not blocking.
- Leftover Google Drive artifacts from the abandoned Apps Script attempt (see above) — harmless, but the user may want to delete them; not touched autonomously since they're outside the repo.

## Important decisions
- User explicitly declined to build the formal `SLIDES2FIGMA TEST SUITE` (§50) and accepted the ad-hoc "Your big idea" deck's coverage (12 of 17 §5.1 categories, with real evidence) as sufficient to close Phase 01. Reopen this only if the user raises it again or Phase 02/03 hits a concrete need for one of the untested shape types.
- Property `15`/`19` (fill/stroke) in `drawings-object+wrapped` should be trusted for vector shapes and table cells but **ignored** for picture-type objects in Phase 02's parser — see `docs/extraction-findings.md`'s cross-cutting finding.
- Phase 02's parser should prefer `document-slice-clip+wrapped`'s named-key encoding over `drawings-object+wrapped`'s numeric opcodes wherever both exist, falling back to `drawings-object+wrapped` only for geometry/shape-type/image-blob references it alone carries.

## Next action
1. Route to Phase 02 (Basic Google Slides Extraction — text/shapes/images/position/z-order → real `Scene`, per §65–§68). Per Phase 01's findings, start with **text and tables** (cleanest, most reliable captures) before images/crops (fill-color caveat, undecoded crop math).
2. Create `.progressive/phases/02-basic-extraction.md` when Phase 02 becomes `[>]` IN PROGRESS in `ROADMAP.md` (not created yet — phases only get a detailed file once active, per this repo's routing convention).
3. Build the real `clipboard/parser.ts` (currently a stub) using this phase's findings: `drawings-object+wrapped` for geometry/shape-type/image-blob, `document-slice-clip+wrapped` preferred for table/paragraph/run styling where both exist.

## NEXT SESSION PROMPT
```text
Start Phase 02 -- Basic Google Slides Extraction
(text/shapes/images/position/z-order -> real Scene), per ROADMAP.md and
Technical Spec Sec65-Sec68. Phase 01 (extraction research) is now [x]
COMPLETE -- read its Completion Record in
.progressive/phases/01-extraction-research.md and docs/extraction-findings.md
before writing any parser code; do not reread the full findings doc's raw
evidence tables unless a specific decision needs them.

Phase 02 doesn't have a phase file yet -- create
.progressive/phases/02-basic-extraction.md when this phase becomes [>] in
ROADMAP.md, following the pattern of Phase 00/01's phase files (Goal,
Context, Context hints, In/Out of scope, Tasks, Acceptance criteria,
Negative/security cases, Verification, Completion Record).

Key findings from Phase 01 to build on:
- drawings-object+wrapped: shape geometry (transform matrix, shapeTypeCode),
  image blob references, and every selected object as a flat sibling list
  (groups/multi-select/whole-slide all use the same structure).
- document-slice-clip+wrapped: friendlier named-key encoding, prefer it for
  table/paragraph/run-level styling when both formats carry the same data.
- Property 15/19 (fill/stroke) is real for vector shapes/tables but must be
  ignored for picture-type objects (shapeTypeCode 3 + a 49 blob reference).
- clipboard/parser.ts is currently a stub -- this is the phase to make it real.

Read the active instruction layers, recover project state from the Default
Read Set, verify the Roadmap marker, and continue the next action
autonomously. Do not reread full completed phases, completion reports, or
chat history unless evidence requires it.
```
