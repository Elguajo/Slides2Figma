# Next Session

> Volatile hot context. Overwrite this file on each meaningful handoff. Durable completed-phase history belongs in `.progressive/completions/` (Runtime: `.progressive/completions/`) with only a compact bridge in the completed phase `Completion Record`.

Outcome: IN PROGRESS

## Current phase
Phase 00 — Monorepo, Scene Schema & Fixture-Driven Figma Renderer — `.progressive/phases/00-scene-schema-renderer.md` (in progress — Tasks 1–7 done)

## Completed this session
- Upgraded the Progressive Context Kit runtime 1.7.1 → 1.8.0 (framework files only; see git log) and renamed `docs/` → `spec/` to clear a reserved-namespace collision with `audit.py`.
- Completed Phase 00 Task 7: `packages/figma-renderer` — linear + radial gradient render.
  - Added `packages/figma-renderer/src/gradient-renderer.ts` (`buildGradientPaint`), wired into `paint.ts`'s `buildFillPaints`, which now dispatches `linear-gradient`/`radial-gradient` fills there instead of emitting the old `gradient-fill-not-implemented` warning. Both shape and text fills go through this automatically (no changes needed in `shape-renderer.ts`/`text-renderer.ts`).
  - Core of the implementation is `handlesToTransform`: a closed-form solution for Figma's `gradientTransform` (2×3 affine matrix) derived by solving `A · identityHandle = targetHandle` for Figma's three fixed identity handles `(0,0.5)`, `(1,0.5)`, `(0,1)`. Verified by hand and by test that it round-trips to the identity matrix `[[1,0,0],[0,1,0]]` when handles equal the identity points.
  - `linearHandles`: handle0/1 = `start`/`end` (rotated around their midpoint by `rotation` if present); handle2 (width control, doesn't affect `GRADIENT_LINEAR`'s visible output) = a perpendicular offset of half the axis length, matching Figma's own identity geometry.
  - `radialHandles`: handle0 = `center`; handle1/2 = `center + radiusX`/`radiusY` offsets, rotated around `center` by `rotation` if present.
  - Added `packages/figma-renderer/src/gradient-renderer.test.ts` (7 tests) covering the identity case, stop passthrough, a non-identity axis, rotation composition, and radial scaling/rotation — all pure-function, no Figma sandbox needed.

## Verification evidence
- `pnpm --filter @slides2figma/figma-renderer build` (tsc) → no errors.
- `pnpm --filter @slides2figma/figma-plugin typecheck` (both tsconfigs) → no errors.
- `pnpm -w test` → 16 test files, 66 tests passed (was 59; +7 new gradient tests), no regressions.
- `node apps/figma-plugin/scripts/build.mjs` → `dist/plugin/main.js` (605.1KB) and `dist/ui/index.html` rebuilt with no errors.
- `python3 .progressive/tools/audit.py --root .` → FAIL, 5 errors, all pre-existing/accepted (Roadmap phase files 01–05 intentionally not yet authored per `ROADMAP.md`'s own note — not a regression).
- **Not done, deferred by user decision**: manual load-and-inspect of `fixtures/text/mixed-text.json` (Task 6) and `fixtures/gradients/linear.json` (Task 7) in the real Figma desktop app. I have no way to drive Figma desktop directly, so this can only be done by the user. Both acceptance-criteria checkboxes stay unchecked in the phase file to reflect this; the Task-list checkboxes are checked since both implementations are complete and pass all evidence obtainable without the live sandbox.

## Blockers / uncertainty
- **Not a blocker, just deferred**: manual Figma-desktop verification for Task 6 (text) and Task 7 (gradients) — user explicitly decided not to gate further implementation on this. Do it in one batched pass later, ideally once more fixtures exist (vector, image) so it's a single Figma-desktop session instead of one per task.
  - Steps: import `apps/figma-plugin/manifest.json` into a scratch Figma file, "Use developer VM" OFF (see below), load each fixture, render, check: text — one `TextNode`, per-run font/size/weight/color/italic/letter-spacing match, editable by hand; gradients — native `GRADIENT_LINEAR` paint, correct stops/direction/opacity, editable in the fill panel for both rectangles in `fixtures/gradients/linear.json` (including the rotated 4-stop one — see Important decisions below on the rotation assumption).
- Figma desktop's "Use developer VM" setting (`Plugins → Development → Use developer VM`) must stay OFF for this plugin during local development (`BigInt is not a function` otherwise). Local dev-environment setting, not a code bug.
- Tooling profile still not selected/bootstrapped (`TOOLING_STATUS.json` is still `not_selected`) — deferred, not required to keep making Phase 00 progress.

## Important decisions
- **Gradient `rotation` field semantics are an assumption, not a confirmed spec reading.** Technical Spec §13 declares `rotation?: number` on both `LinearGradientFill` and `RadialGradientFill` but doesn't say how it composes with `start`/`end` (linear) or is otherwise disambiguated. Implemented as: rotate the `start`→`end` axis around its own midpoint by `rotation` degrees (linear), and rotate the `radiusX`/`radiusY` axes around `center` by `rotation` degrees (radial) — i.e. `rotation` always layers on top of the base geometry rather than replacing it. `fixtures/gradients/linear.json`'s second rectangle (`start:(0,0)`, `end:(1,1)`, `rotation:45`) will render as a **vertical** gradient under this reading (45° diagonal + 45° rotation = 90° from horizontal), not a diagonal one — this is exactly the kind of thing the deferred manual Figma check should confirm looks intentional, since a real extractor's actual angle-composition convention (Phase 02+) may turn out to differ.
- `gradientTransform`'s third ("width") handle is mathematically irrelevant to `GRADIENT_LINEAR`'s rendered output (verified against Figma's own identity-handle geometry, not just assumed) — implemented as a well-defined non-degenerate perpendicular offset rather than an arbitrary/degenerate one, so it stays valid if Figma's gradient editor is later used to hand-adjust the same paint.
- No changes were needed in `shape-renderer.ts`/`text-renderer.ts`: both already call `buildFillPaints`, which now transparently returns real `GRADIENT_LINEAR`/`GRADIENT_RADIAL` paints instead of the old warning-and-skip branch — gradient support "fell out" of the existing fill pipeline for free.

## Next action
Continue to Phase 00 Task 8: `packages/figma-renderer` — basic vector render. No `fixtures/vector/*.json` fixture exists yet — author one (a simple multi-point path, per Technical Spec vector-model sections) alongside the renderer, matching the pattern already used for rectangle/text/gradient fixtures. Scope per phase file "Out of scope": complex multi-path vector geometry is deferred to Phase 03 — keep this to a single closed/open path with straight and/or basic curve segments. Keep `pnpm -w test` green.

## NEXT SESSION PROMPT
```text
Continue Phase 00 Task 8: packages/figma-renderer -- basic vector render.
No fixtures/vector/*.json fixture exists yet -- author one (a simple
multi-point path; see the Technical Spec's vector/VectorSceneNode model
sections) alongside a new vector-renderer.ts, matching the module pattern
of shape-renderer.ts/text-renderer.ts/gradient-renderer.ts. Complex
multi-path vector geometry is out of scope until Phase 03 -- keep this to
a single closed/open path with straight and/or basic curve segments.
Keep pnpm -w test green; run the same typecheck/build verification as
prior tasks.

Manual Figma-desktop verification for Task 6 (text) and Task 7 (gradients)
is still deferred (not blocking) -- see NEXT_SESSION.md Blockers. Consider
batching it with Task 8/9's manual checks into one Figma-desktop session
once vector + image fixtures both exist.

Per .progressive/phases/00-scene-schema-renderer.md acceptance criteria.

Read the active instruction layers, recover project state from the Default Read Set,
verify the Roadmap marker, and continue the next action autonomously. Do not reread
full completed phases, completion reports, or chat history unless evidence requires it.
```
